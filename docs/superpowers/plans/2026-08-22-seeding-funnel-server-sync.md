# 시딩 퍼널 서버 동기화 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 시딩 퍼널의 서버 미동기화 구멍 4개(배송지·FGI·전송 유실·릴리스 치트)를 막고, 그 전제로 프로덕션 greyd-ops 소스를 로컬 git과 동기화한다.

**Architecture:** 두 저장소에 걸친 작업. 서버(greyd-ops, Next.js 15 + Prisma/Neon)는 기존 `/api/mobile/*` 패턴(파서는 `lib/mobile/inbound.ts`, 인증은 `resolveMobileIdentity`, 라우트는 얇게)을 따른다. 앱(app-master, RN 0.76)은 전송 실패를 `opsOutbox` 큐(Preference 저장, 지수 백오프)로 흡수하고 기존 `safePost` 호출부를 큐 경유로 바꾼다.

**Tech Stack:** Next.js 15(App Router)·Prisma 6·vitest / React Native 0.76·Jest·react-native-default-preference

## Global Constraints

- 서버 스키마 변경은 **추가 전용** — `prisma migrate diff` 미리보기에서 DROP/ALTER 파괴 구문이 나오면 배포 금지 (스펙 §0).
- 프로덕션 greyd-ops 배포는 **소스 동기화(Task 1-2) 완료 후에만** 허용. 그 전의 `vercel --prod`는 데이터 손실 위험 (메모리 ops-invite-code-issuance 참조).
- Vercel 토큰·프로덕션 DB 접근이 필요한 명령은 자동 실행이 차단됨 → **사용자에게 `!` 명령(bash 문법)으로 요청**한다.
- 앱의 Preference 접근은 반드시 `api/prefSafe.js`의 `prefGetSafe/prefSetSafe` 사용 (iOS 무응답 사례).
- 앱 커밋은 `integration/ios-funnels` 브랜치, 서버 커밋은 greyd-ops `main`.
- 커밋 메시지는 저장소 관례(한국어 본문 + Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>).
- 서버 전송 실패는 사용자 흐름을 절대 막지 않는다 — 로컬 저장 먼저, 전송은 큐.

---

### Task 1: 배포 소스 내려받기 스크립트 (greyd-ops)

**Files:**
- Create: `C:\Users\ruese\Downloads\greyd-ops\scripts\pull-deployed-source.mjs`

**Interfaces:**
- Produces: 실행 시 `deployed-src/` 디렉터리에 현재 프로덕션 배포의 소스 파일 전체(단, `node_modules`·`.next` 제외)를 저장. 사용자가 `VERCEL_TOKEN=... node scripts/pull-deployed-source.mjs`로 실행.

- [ ] **Step 1: 스크립트 작성**

```js
// scripts/pull-deployed-source.mjs
// 현재 프로덕션 배포(greyd-ops.vercel.app)의 업로드 소스를 Vercel API로 내려받는다.
// 실행(사용자): VERCEL_TOKEN 은 https://vercel.com/account/tokens 에서 발급하거나
//   ~/AppData/Local/com.vercel.cli/auth.json 의 token 값 사용.
//   VERCEL_TOKEN=xxxx node scripts/pull-deployed-source.mjs
import fs from 'fs'
import path from 'path'

const TOKEN = process.env.VERCEL_TOKEN
if (!TOKEN) { console.error('VERCEL_TOKEN 환경변수가 필요합니다.'); process.exit(1) }
const TEAM = 'rueseo92-2776s-projects'
const H = { Authorization: `Bearer ${TOKEN}` }
const api = async (p) => {
  const res = await fetch(`https://api.vercel.com${p}`, { headers: H })
  if (!res.ok) throw new Error(`${p} -> ${res.status}`)
  return res
}

// 1) 프로덕션 alias가 가리키는 배포 찾기
const alias = await (await api(`/v4/aliases/greyd-ops.vercel.app?teamId=${TEAM}`)).json()
const depId = alias.deploymentId
console.log('deployment:', depId)

// 2) 파일 트리
const tree = await (await api(`/v6/deployments/${depId}/files?teamId=${TEAM}`)).json()
const SKIP = /^(node_modules|\.next|\.git|pgdata|backups)(\/|$)/
const files = []
;(function walk(nodes, prefix) {
  for (const n of nodes) {
    const p = prefix ? `${prefix}/${n.name}` : n.name
    if (SKIP.test(p)) continue
    if (n.type === 'directory') walk(n.children ?? [], p)
    else if (n.type === 'file') files.push({ path: p, uid: n.uid })
  }
})(tree, '')
console.log(`files to download: ${files.length}`)

// 3) 다운로드 (순차 — 레이트리밋 회피)
const OUT = path.resolve('deployed-src')
for (const f of files) {
  const res = await api(`/v7/deployments/${depId}/files/${f.uid}?teamId=${TEAM}`)
  const body = await res.json().catch(() => null)
  // v7은 {data: base64} 형태, 아니면 원문 스트림
  const buf = body && body.data ? Buffer.from(body.data, 'base64') : Buffer.from(await res.arrayBuffer())
  const dest = path.join(OUT, f.path)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, buf)
}
console.log(`done -> ${OUT}`)
```

- [ ] **Step 2: 사용자 실행 요청**

사용자에게 아래를 안내하고 실행 결과를 기다린다 (토큰 접근은 자동 실행 차단):

```
! cd "/c/Users/ruese/Downloads/greyd-ops" && VERCEL_TOKEN="$(python -c "import json;print(json.load(open(r'C:/Users/ruese/AppData/Local/com.vercel.cli/auth.json'))['token'])")" node scripts/pull-deployed-source.mjs
```

Expected: `done -> .../deployed-src` 와 파일 수 출력. API 응답 형식이 예상과 다르면(파일 0개 등) 스크립트의 트리 파싱을 실제 응답에 맞춰 수정 후 재실행 요청.

- [ ] **Step 3: 커밋 (스크립트만)**

```bash
cd /c/Users/ruese/Downloads/greyd-ops
git add scripts/pull-deployed-source.mjs && git commit -m "chore: 프로덕션 배포 소스 회수 스크립트"
```

---

### Task 2: 배포 소스 ↔ 로컬 병합 (greyd-ops)

**Files:**
- Modify: greyd-ops 저장소 전반 (diff 결과에 따름), `prisma/schema.prisma`

**Interfaces:**
- Consumes: Task 1의 `deployed-src/`
- Produces: `main`이 프로덕션과 동등 + 로컬 모바일 라우트 유지. `prisma migrate diff` 파괴 구문 0. 이후 Task 3~7의 기준 코드.

- [ ] **Step 1: 스냅샷 브랜치 커밋**

```bash
cd /c/Users/ruese/Downloads/greyd-ops
git checkout -b deployed-snapshot
# deployed-src 내용을 저장소 루트로 복사(덮어쓰기), deployed-src 자체는 제외
rsync -a --exclude deployed-src deployed-src/ ./ 2>/dev/null || cp -r deployed-src/* ./
rm -rf deployed-src
git add -A && git commit -m "chore: 프로덕션 배포 스냅샷 (Vercel 소스 회수)"
```

- [ ] **Step 2: diff 확인 후 main에 병합**

```bash
git checkout main
git diff main deployed-snapshot --stat   # 규모 파악
git merge deployed-snapshot              # 충돌 시: 배포본 우선, 단 app/api/mobile/** 는 로컬(최신 라우트) 유지
```

충돌 해소 원칙: 콘솔·lib·prisma는 배포본(`theirs`) 우선, `app/api/mobile/**`와 `lib/mobile/**`는 양쪽을 대조해 **누락 라우트가 없게** 병합.

- [ ] **Step 3: 스키마 파괴 여부 드라이런 (사용자 실행)**

```
! cd "/c/Users/ruese/Downloads/greyd-ops" && npx prisma migrate diff --from-url "$(grep -m1 '^DATABASE_URL=' .env.prod.pull | cut -d= -f2- | tr -d '\"')" --to-schema-datamodel prisma/schema.prisma --script | head -40
```

Expected: DROP TABLE/DROP COLUMN/ALTER ... DROP 구문 없음 (CREATE/ADD만). 파괴 구문이 있으면 병합에서 스키마를 배포본 기준으로 재조정.

- [ ] **Step 4: 테스트 + 커밋 + push**

```bash
npm test 2>/dev/null || npx vitest run
git push origin main
```

---

### Task 3: 서버 스키마 추가 — Shipment.shippingAddress + FgiResponse (greyd-ops)

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `Shipment.shippingAddress Json?`, 모델 `FgiResponse` — Task 5 라우트가 사용.

설계 노트: 스펙은 배송지를 Match에 두기로 했으나, 배송 데이터(운송장·수령)는 이미 `Shipment` 소관이고 received 라우트가 matchId로 upsert하는 패턴이 있어 **Shipment에 둔다** (스펙 §1의 구현 위치만 조정, 동작 동일).

- [ ] **Step 1: 스키마 수정**

`model Shipment`에 한 줄 추가:

```prisma
  shippingAddress Json?                            // 앱 입력 배송지 {name, phone, addr1, addr2?, zip} (모바일 /address)
```

파일 끝(AppSession 모델 근처)에 추가:

```prisma
model FgiResponse {                               // 앱 FGI 설문 응답 — 캠페인×인플루언서당 1건(재제출은 갱신)
  id              Int        @id @default(autoincrement())
  campaignId      Int
  campaign        Campaign   @relation(fields: [campaignId], references: [id])
  influencerId    Int
  influencer      Influencer @relation(fields: [influencerId], references: [id])
  quant           Json                             // {purchaseIntent, priceFairness, competitiveness, recommend} 1~5
  fairPriceUsd    Int?
  priceCapUsd     Int?
  competitor      String?
  pros            String
  cons            String
  extraAnswers    Json?                            // 캠페인 커스텀 문항 답변
  firstImpression Json?                            // 수령 직후 첫인상 설문 동봉분
  profileSnapshot Json                             // {country, gBand, skinType, ageBand, followerBand}
  usageDays       Int?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  @@unique([campaignId, influencerId])
}
```

`Campaign`·`Influencer` 모델에 역방향 관계 필드 추가: `fgiResponses FgiResponse[]`

- [ ] **Step 2: 검증 — 스키마 유효성 + 추가 전용 확인**

```bash
cd /c/Users/ruese/Downloads/greyd-ops && npx prisma validate
```

이후 Task 2 Step 3과 동일한 migrate diff 사용자 명령으로 CREATE/ADD만 나오는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add prisma/schema.prisma && git commit -m "feat(schema): Shipment.shippingAddress + FgiResponse (추가 전용)"
```

---

### Task 4: 서버 파서 3종 + 단위 테스트 (greyd-ops)

**Files:**
- Modify: `lib/mobile/inbound.ts`
- Test: `tests/unit/mobileFunnelInbound.test.ts`

**Interfaces:**
- Consumes: 기존 `campaignIdFromMobile(v): number|null` (lib/mobile/inbound.ts)
- Produces: `parseAddressBody(body)`, `parseFgiBody(body)`, `parseCancelBody(body)` — 각각 `{...입력} | {error: string}` 반환. Task 5 라우트가 사용.

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// tests/unit/mobileFunnelInbound.test.ts
import { describe, it, expect } from 'vitest'
import { parseAddressBody, parseFgiBody, parseCancelBody } from '@/lib/mobile/inbound'

describe('parseAddressBody', () => {
  const ok = { campaignId: 'cmp-3', greydAppId: 'app-1-x', name: '홍길동', phone: '010-1234-5678', addr1: '서울시 …', addr2: '101호', zip: '04524' }
  it('정상 입력 수용 + 트림', () => {
    const r = parseAddressBody({ ...ok, name: ' 홍길동 ' })
    expect(r).toMatchObject({ campaignId: 3, name: '홍길동', zip: '04524' })
  })
  it('필수 누락 거부', () => {
    expect(parseAddressBody({ ...ok, name: '' })).toHaveProperty('error')
    expect(parseAddressBody({ ...ok, addr1: undefined })).toHaveProperty('error')
    expect(parseAddressBody({ ...ok, campaignId: 'x' })).toHaveProperty('error')
  })
  it('과길이 거부(각 200자 초과)', () => {
    expect(parseAddressBody({ ...ok, addr1: 'a'.repeat(201) })).toHaveProperty('error')
  })
})

describe('parseFgiBody', () => {
  const ok = {
    campaignId: 'cmp-3', greydAppId: 'app-1-x',
    quant: { purchaseIntent: 4, priceFairness: 3, competitiveness: 5, recommend: 4 },
    fairPriceUsd: 20, priceCapUsd: 30, competitor: 'X brand',
    pros: '스무 자가 넘는 장점 서술입니다 아주 좋아요', cons: '스무 자가 넘는 단점 서술입니다 아쉬워요요',
    extraAnswers: { q1: 'a' }, firstImpression: { unboxing: 4 },
    profileSnapshot: { country: 'KR' }, usageDays: 14,
  }
  it('정상 입력 수용', () => {
    expect(parseFgiBody(ok)).toMatchObject({ campaignId: 3, usageDays: 14 })
  })
  it('정량 4문항 1~5 범위 강제', () => {
    expect(parseFgiBody({ ...ok, quant: { ...ok.quant, recommend: 6 } })).toHaveProperty('error')
    expect(parseFgiBody({ ...ok, quant: { purchaseIntent: 4 } })).toHaveProperty('error')
  })
  it('pros/cons 필수', () => {
    expect(parseFgiBody({ ...ok, pros: '' })).toHaveProperty('error')
  })
})

describe('parseCancelBody', () => {
  it('campaignId만 필수', () => {
    expect(parseCancelBody({ campaignId: 'cmp-7', greydAppId: 'app-1-x' })).toMatchObject({ campaignId: 7 })
    expect(parseCancelBody({ campaignId: 'bad' })).toHaveProperty('error')
  })
})
```

- [ ] **Step 2: 실패 확인**

```bash
cd /c/Users/ruese/Downloads/greyd-ops && npx vitest run tests/unit/mobileFunnelInbound.test.ts
```
Expected: FAIL — export 없음.

- [ ] **Step 3: 구현 (lib/mobile/inbound.ts에 추가)**

```ts
const str = (v: unknown, max = 200) =>
  typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max ? v.trim() : null
const optStr = (v: unknown, max = 200) =>
  v == null || v === '' ? null : str(v, max)

export function parseAddressBody(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>
  const campaignId = campaignIdFromMobile(b.campaignId)
  const greydAppId = str(b.greydAppId, 80)
  const name = str(b.name, 80)
  const phone = str(b.phone, 40)
  const addr1 = str(b.addr1, 200)
  const addr2 = optStr(b.addr2, 200)
  const zip = str(b.zip, 20)
  if (!campaignId || !greydAppId || !name || !phone || !addr1 || !zip) return { error: 'bad_input' as const }
  return { campaignId, greydAppId, name, phone, addr1, addr2, zip }
}

const QUANT_KEYS = ['purchaseIntent', 'priceFairness', 'competitiveness', 'recommend'] as const
export function parseFgiBody(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>
  const campaignId = campaignIdFromMobile(b.campaignId)
  const greydAppId = str(b.greydAppId, 80)
  const q = (b.quant ?? {}) as Record<string, unknown>
  const quant: Record<string, number> = {}
  for (const k of QUANT_KEYS) {
    const v = q[k]
    if (typeof v !== 'number' || v < 1 || v > 5) return { error: 'bad_quant' as const }
    quant[k] = v
  }
  const pros = str(b.pros, 2000)
  const cons = str(b.cons, 2000)
  if (!campaignId || !greydAppId || !pros || !cons) return { error: 'bad_input' as const }
  const int = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null)
  return {
    campaignId, greydAppId, quant, pros, cons,
    fairPriceUsd: int(b.fairPriceUsd), priceCapUsd: int(b.priceCapUsd),
    competitor: optStr(b.competitor, 200),
    extraAnswers: b.extraAnswers && typeof b.extraAnswers === 'object' ? b.extraAnswers : null,
    firstImpression: b.firstImpression && typeof b.firstImpression === 'object' ? b.firstImpression : null,
    profileSnapshot: b.profileSnapshot && typeof b.profileSnapshot === 'object' ? b.profileSnapshot : {},
    usageDays: int(b.usageDays),
  }
}

export function parseCancelBody(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>
  const campaignId = campaignIdFromMobile(b.campaignId)
  const greydAppId = str(b.greydAppId, 80)
  if (!campaignId || !greydAppId) return { error: 'bad_input' as const }
  return { campaignId, greydAppId }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run tests/unit/mobileFunnelInbound.test.ts
```
Expected: PASS 전건.

- [ ] **Step 5: 커밋**

```bash
git add lib/mobile/inbound.ts tests/unit/mobileFunnelInbound.test.ts
git commit -m "feat(mobile): address/fgi/cancel 인바운드 파서 + 단위 테스트"
```

---

### Task 5: 서버 라우트 3종 — /address /fgi /cancel (greyd-ops)

**Files:**
- Create: `app/api/mobile/address/route.ts`, `app/api/mobile/fgi/route.ts`, `app/api/mobile/cancel/route.ts`

**Interfaces:**
- Consumes: Task 4 파서, `resolveMobileIdentity(req)` (lib/mobile/session), `prisma` (lib/prisma). received 라우트(app/api/mobile/received/route.ts)의 구조를 그대로 따른다.
- Produces: `POST /api/mobile/address|fgi|cancel` — 200 `{ok:true, matchId}` / 401 / 400 / 404 `{error:'match_not_found'}`.

- [ ] **Step 1: address 라우트**

```ts
// app/api/mobile/address/route.ts — 앱 입력 배송지를 Shipment에 기록 (received 라우트와 동일 골격)
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseAddressBody } from '@/lib/mobile/inbound'
import { resolveMobileIdentity } from '@/lib/mobile/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const ident = await resolveMobileIdentity(req)
  if (!ident) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }) }
  const parsed = parseAddressBody(body)
  if ('error' in parsed) return NextResponse.json(parsed, { status: 400 })
  const input = ident.viaToken ? { ...parsed, greydAppId: ident.greydAppId } : parsed
  try {
    const match = await prisma.match.findFirst({
      where: { campaignId: input.campaignId, state: { not: 'DROPPED' }, influencer: { greydAppId: input.greydAppId } },
      select: { id: true },
    })
    if (!match) return NextResponse.json({ error: 'match_not_found' }, { status: 404 })
    const shippingAddress = { name: input.name, phone: input.phone, addr1: input.addr1, addr2: input.addr2, zip: input.zip }
    await prisma.shipment.upsert({
      where: { matchId: match.id },
      update: { shippingAddress },
      create: { matchId: match.id, shippingAddress },
    })
    return NextResponse.json({ ok: true, matchId: match.id })
  } catch (e: any) {
    console.error('[mobile/address] error', e?.message ?? e)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
```

- [ ] **Step 2: fgi 라우트**

```ts
// app/api/mobile/fgi/route.ts — FGI 설문 upsert (캠페인×인플루언서당 1건)
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseFgiBody } from '@/lib/mobile/inbound'
import { resolveMobileIdentity } from '@/lib/mobile/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const ident = await resolveMobileIdentity(req)
  if (!ident) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }) }
  const parsed = parseFgiBody(body)
  if ('error' in parsed) return NextResponse.json(parsed, { status: 400 })
  const input = ident.viaToken ? { ...parsed, greydAppId: ident.greydAppId } : parsed
  try {
    const influencer = await prisma.influencer.findUnique({ where: { greydAppId: input.greydAppId }, select: { id: true } })
    if (!influencer) return NextResponse.json({ error: 'match_not_found' }, { status: 404 })
    const data = {
      quant: input.quant, pros: input.pros, cons: input.cons,
      fairPriceUsd: input.fairPriceUsd, priceCapUsd: input.priceCapUsd, competitor: input.competitor,
      extraAnswers: input.extraAnswers ?? undefined, firstImpression: input.firstImpression ?? undefined,
      profileSnapshot: input.profileSnapshot, usageDays: input.usageDays,
    }
    await prisma.fgiResponse.upsert({
      where: { campaignId_influencerId: { campaignId: input.campaignId, influencerId: influencer.id } },
      update: data,
      create: { campaignId: input.campaignId, influencerId: influencer.id, ...data },
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[mobile/fgi] error', e?.message ?? e)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
```

- [ ] **Step 3: cancel 라우트**

Match 상태 전이값은 병합된 스키마의 `MatchState` enum에서 이탈 상태(예: `DROPPED`)를 확인해 사용한다.

```ts
// app/api/mobile/cancel/route.ts — 앱 취소(무페널티) → Match 이탈 기록
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseCancelBody } from '@/lib/mobile/inbound'
import { resolveMobileIdentity } from '@/lib/mobile/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const ident = await resolveMobileIdentity(req)
  if (!ident) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }) }
  const parsed = parseCancelBody(body)
  if ('error' in parsed) return NextResponse.json(parsed, { status: 400 })
  const input = ident.viaToken ? { ...parsed, greydAppId: ident.greydAppId } : parsed
  try {
    const match = await prisma.match.findFirst({
      where: { campaignId: input.campaignId, state: { not: 'DROPPED' }, influencer: { greydAppId: input.greydAppId } },
      select: { id: true },
    })
    if (!match) return NextResponse.json({ error: 'match_not_found' }, { status: 404 })
    await prisma.match.update({
      where: { id: match.id },
      data: { state: 'DROPPED', rejectReason: 'app_cancel' },
    })
    return NextResponse.json({ ok: true, matchId: match.id })
  } catch (e: any) {
    console.error('[mobile/cancel] error', e?.message ?? e)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
```

- [ ] **Step 4: 전체 테스트 + 타입체크**

```bash
cd /c/Users/ruese/Downloads/greyd-ops && npx vitest run && npx tsc --noEmit
```
Expected: 전건 통과. (라우트는 파서·세션 헬퍼가 테스트를 담당하는 기존 관례를 따름)

- [ ] **Step 5: 커밋**

```bash
git add app/api/mobile/address app/api/mobile/fgi app/api/mobile/cancel
git commit -m "feat(mobile): 배송지·FGI·취소 수신 라우트 3종"
```

---

### Task 6: 콘솔에서 배송지 표시 (greyd-ops)

**Files:**
- Modify: 콘솔에서 Shipment의 `trackingNumber`를 렌더링하는 컴포넌트 (아래 grep으로 특정)

**Interfaces:**
- Consumes: Task 3의 `Shipment.shippingAddress`

- [ ] **Step 1: 표시 위치 특정**

```bash
cd /c/Users/ruese/Downloads/greyd-ops && grep -rn "trackingNumber" app --include=*.tsx | grep -v api | head
```

- [ ] **Step 2: 운송장 표시 바로 옆에 배송지 렌더링 추가**

해당 컴포넌트의 shipment 표시 블록에 추가 (변수명은 파일의 실제 shipment 참조에 맞춤):

```tsx
{shipment?.shippingAddress ? (
  <div className="text-xs text-gray-500">
    배송지: {(shipment.shippingAddress as any).name} · {(shipment.shippingAddress as any).phone} ·{' '}
    {(shipment.shippingAddress as any).addr1} {(shipment.shippingAddress as any).addr2 ?? ''} ({(shipment.shippingAddress as any).zip})
  </div>
) : null}
```

서버 컴포넌트가 shipment를 조회하는 쿼리에 `shippingAddress` select가 빠져 있으면 추가한다.

- [ ] **Step 3: 빌드 확인 + 커밋**

```bash
npx tsc --noEmit && git add -A && git commit -m "feat(console): 시딩 배송지 표시 (앱 입력분)"
```

---

### Task 7: 서버 배포 (greyd-ops — 사용자 협조)

- [ ] **Step 1: 최종 드라이런** — Task 2 Step 3의 migrate diff 사용자 명령 재실행, CREATE/ADD만인지 확인.
- [ ] **Step 2: push + 배포 (사용자 실행)**

```
! cd "/c/Users/ruese/Downloads/greyd-ops" && git push origin main && npx vercel --prod
```

Expected: `Aliased: https://greyd-ops.vercel.app`. 실패 시 빌드 로그의 prisma db push 경고 확인 — 파괴 경고면 즉시 중단.

- [ ] **Step 3: 스모크** — `curl -X POST https://greyd-ops.vercel.app/api/mobile/address` (키 없이) → 401 나오면 라우트 배포 확인. `/api/mobile/seedings` → 401(404 아님) 확인.

---

### Task 8: 앱 opsOutbox 큐 + 테스트 (app-master)

**Files:**
- Create: `api/opsOutbox.js`
- Test: `api/opsOutbox.test.js`

**Interfaces:**
- Consumes: `opsPost(path, body)` (api/opsClient.js), `prefGetSafe/prefSetSafe` (api/prefSafe.js)
- Produces: `enqueue(kind, campaignId, path, body): Promise<void>`, `flush(): Promise<void>`, `sendOrQueue(kind, campaignId, path, body): Promise<void>` — Task 9~11이 사용.

- [ ] **Step 1: 실패하는 테스트 작성**

```js
// api/opsOutbox.test.js
const mockOpsPost = jest.fn();
jest.mock('./opsClient', () => ({ opsPost: (...a) => mockOpsPost(...a) }));

const store = {};
jest.mock('./prefSafe', () => ({
  prefGetSafe: jest.fn(async (k) => store[k] ?? null),
  prefSetSafe: jest.fn(async (k, v) => { store[k] = v; return true; }),
}));

const { enqueue, flush, __KEY } = require('./opsOutbox');
const read = () => JSON.parse(store[__KEY] || '[]');

beforeEach(() => { mockOpsPost.mockReset(); delete store[__KEY]; });

test('성공 전송은 큐에 남지 않는다', async () => {
  mockOpsPost.mockResolvedValue({ ok: true });
  await enqueue('address', 'cmp-1', '/address', { a: 1 });
  await flush();
  expect(read()).toHaveLength(0);
});

test('실패분은 tries 증가하며 보관, 같은 kind+campaignId는 최신으로 교체', async () => {
  mockOpsPost.mockRejectedValue(new Error('offline'));
  await enqueue('address', 'cmp-1', '/address', { a: 1 });
  await enqueue('address', 'cmp-1', '/address', { a: 2 });
  const items = read();
  expect(items).toHaveLength(1);
  expect(items[0].body).toEqual({ a: 2 });
  expect(items[0].tries).toBeGreaterThanOrEqual(1);
});

test('401은 재시도 중단(parked)', async () => {
  const err = new Error('unauthorized'); err.status = 401;
  mockOpsPost.mockRejectedValue(err);
  await enqueue('fgi', 'cmp-2', '/fgi', {});
  await flush();
  expect(read()[0].parked).toBe(true);
});

test('백오프 전에는 재시도하지 않는다', async () => {
  mockOpsPost.mockRejectedValue(new Error('offline'));
  await enqueue('received', 'cmp-3', '/received', {});
  mockOpsPost.mockClear();
  await flush(); // 직후 재호출 — 백오프 창 안
  expect(mockOpsPost).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: 실패 확인** — `corepack yarn test api/opsOutbox.test.js` → FAIL(모듈 없음)

- [ ] **Step 3: 구현**

```js
// api/opsOutbox.js — ops 전송 실패분 재시도 큐 (스펙 2026-08-22 §3)
// 원칙: 로컬 흐름을 절대 막지 않는다. 실패는 적재, 플러시는 기회주의적으로.
import { prefGetSafe, prefSetSafe } from './prefSafe';
import { opsPost } from './opsClient';

export const __KEY = 'opsOutboxV1';
const MAX_TRIES = 5;
const BACKOFF_BASE_MS = 60 * 1000; // 1·2·4·8분

async function load() {
  try {
    const raw = await prefGetSafe(__KEY, 2000);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}
const save = (items) => prefSetSafe(__KEY, JSON.stringify(items), 2000);

async function trySend(item) {
  try {
    await opsPost(item.path, item.body);
    return { done: true };
  } catch (e) {
    item.tries += 1;
    item.lastTriedAt = Date.now();
    if (e?.status === 401) item.parked = true; // 재인증 전엔 낫지 않음
    else if (e?.status >= 400 && e?.status < 500 && item.tries >= 2) item.parked = true;
    return { done: false };
  }
}

let flushing = false;
export async function flush() {
  if (flushing) return;
  flushing = true;
  try {
    const items = await load();
    const now = Date.now();
    const keep = [];
    let changed = false;
    for (const item of items) {
      const backoff = item.tries === 0 ? 0 : BACKOFF_BASE_MS * Math.pow(2, item.tries - 1);
      const eligible = !item.parked && item.tries < MAX_TRIES && now - (item.lastTriedAt || 0) >= backoff;
      if (!eligible) {
        keep.push(item);
        continue;
      }
      const r = await trySend(item);
      changed = true;
      if (!r.done) keep.push(item);
    }
    if (changed) await save(keep);
  } finally {
    flushing = false;
  }
}

export async function enqueue(kind, campaignId, path, body) {
  const items = (await load()).filter((it) => !(it.kind === kind && it.campaignId === campaignId));
  const item = { id: `${kind}:${campaignId}`, kind, campaignId, path, body, tries: 0, lastTriedAt: 0, parked: false };
  const r = await trySend(item); // 1차는 즉시 시도
  if (!r.done) items.push(item);
  await save(items);
}

// 호출부 편의 — 즉시 시도 + 실패 시 큐 적재까지 한 번에
export const sendOrQueue = enqueue;
```

- [ ] **Step 4: 통과 확인** — `corepack yarn test api/opsOutbox.test.js` → PASS
- [ ] **Step 5: 커밋** — `git add api/opsOutbox.js api/opsOutbox.test.js && git commit -m "feat(sync): ops 전송 재시도 큐 opsOutbox"`

---

### Task 9: 앱 호출부 전환 — received/upload/cancel/address (app-master)

**Files:**
- Modify: `api/opsBridge.js` (opsReceived·opsUpload를 큐 경유로), `screens/ActivityScreen/index.js` (취소·주소 저장 시 전송), `navigation/root.js` (nav-ready 후 flush)
- Test: 기존 스위트 회귀

**Interfaces:**
- Consumes: Task 8 `sendOrQueue(kind, campaignId, path, body)`, `flush()`; `getGreydAppId()` (opsBridge)

- [ ] **Step 1: opsBridge 전환**

`api/opsBridge.js`의 `opsReceived`/`opsUpload`를 다음으로 교체:

```js
import { sendOrQueue } from './opsOutbox';

export async function opsReceived(campaignId) {
  if (!FEATURES.LIVE_OPS_API) return;
  const greydAppId = await getGreydAppId();
  await sendOrQueue('received', campaignId, '/received', { campaignId, greydAppId });
}

export async function opsUpload(campaignId, { postUrl, format }) {
  if (!FEATURES.LIVE_OPS_API) return;
  const greydAppId = await getGreydAppId();
  await sendOrQueue('upload', campaignId, '/upload', { campaignId, greydAppId, postUrl, format });
}

export async function opsCancel(campaignId) {
  if (!FEATURES.LIVE_OPS_API) return;
  const greydAppId = await getGreydAppId();
  await sendOrQueue('cancel', campaignId, '/cancel', { campaignId, greydAppId });
}

export async function opsAddress(campaignId, address) {
  if (!FEATURES.LIVE_OPS_API) return;
  const greydAppId = await getGreydAppId();
  await sendOrQueue('address', campaignId, '/address', { campaignId, greydAppId, ...address });
}
```

(기존 함수 시그니처가 다르면 호출부 기준으로 맞춘다 — opsReceived/opsUpload의 기존 호출부: `screens/ActivityScreen/index.js:166`, `screens/TryScreen/ReviewLinkSubmit.js:127`)

- [ ] **Step 2: 취소·주소 호출부 연결**

`screens/ActivityScreen/index.js`
- 취소 액션(약 218행, `setSeedingStatus(..., CANCELLED)` 지점) 직후: `opsCancel(campaignId);`
- 주소 저장(약 271-275행, `upsertSeeding(addressFor, { address })` 지점) 직후: `opsAddress(addressFor, address);`
- 화면 진입 시 플러시: 컴포넌트 mount `useEffect`에 `flush();` 추가 (`import { flush } from '../../api/opsOutbox';`)

`navigation/root.js` onReady 내부(마커 저장 아래):

```js
setTimeout(() => {
  try { require('../api/opsOutbox').flush(); } catch (e) { trace('root:outbox-flush-fail'); }
}, 3000);
```

- [ ] **Step 3: 회귀 테스트** — `corepack yarn test --runInBand` → 전건 PASS
- [ ] **Step 4: 커밋** — `git add -A && git commit -m "feat(sync): 수령·제출·취소·배송지 전송을 재시도 큐 경유로"`

---

### Task 10: FGI 제출 서버 전송 (app-master)

**Files:**
- Modify: `screens/TryScreen/FgiSurvey.js` (제출 지점, 약 110-140행), `api/opsBridge.js`

**Interfaces:**
- Consumes: Task 8 `sendOrQueue`; FgiSurvey가 로컬 저장하는 `fgiSurvey` 객체(정량 4문항·적정가·경쟁제품·장단점·커스텀 답변·프로필 스냅샷·usageDays)와 `seeding.firstImpression`

- [ ] **Step 1: opsBridge에 전송 함수 추가**

```js
export async function opsFgi(campaignId, fgiSurvey, firstImpression) {
  if (!FEATURES.LIVE_OPS_API) return;
  const greydAppId = await getGreydAppId();
  await sendOrQueue('fgi', campaignId, '/fgi', {
    campaignId,
    greydAppId,
    quant: {
      purchaseIntent: fgiSurvey.purchaseIntent,
      priceFairness: fgiSurvey.priceFairness,
      competitiveness: fgiSurvey.competitiveness,
      recommend: fgiSurvey.recommend,
    },
    fairPriceUsd: fgiSurvey.fairPriceUsd ?? null,
    priceCapUsd: fgiSurvey.priceCapUsd ?? null,
    competitor: fgiSurvey.competitor ?? null,
    pros: fgiSurvey.pros,
    cons: fgiSurvey.cons,
    extraAnswers: fgiSurvey.extraAnswers ?? null,
    firstImpression: firstImpression ?? null,
    profileSnapshot: fgiSurvey.profileSnapshot ?? {},
    usageDays: fgiSurvey.usageDays ?? null,
  });
}
```

(FgiSurvey.js가 로컬 저장하는 실제 필드명을 열어 확인하고 위 매핑을 맞춘다 — 필드명이 다르면 이 함수에서 변환)

- [ ] **Step 2: FgiSurvey 제출 지점에 연결** — `seeding.fgiSurvey` 저장 직후:

```js
opsFgi(campaignId, surveyPayload, seeding?.firstImpression ?? null);
```

- [ ] **Step 3: 회귀 + 커밋**

```bash
corepack yarn test --runInBand
git add -A && git commit -m "feat(fgi): FGI 설문 서버 수집 — 첫인상 동봉, 큐 경유"
```

---

### Task 11: 피드 업로드 경로 정합 (app-master)

**Files:**
- Modify: `screens/AddingNewVideoScreen/index.js` (campaignId 경로, 약 826-834행)

**Interfaces:**
- Consumes: `getSeedings()` (api/seedings.js), `opsUpload` (Task 9)

- [ ] **Step 1: FGI 가드 + 전송 추가** — `REVIEWING` 전이 블록을 다음 규칙으로 수정:

```js
// ReviewLinkSubmit과 동일 규칙: FGI 미완이면 리뷰 제출로 치지 않고 FGI로 보낸다
const seedings = await getSeedings();
const seeding = seedings[campaignId];
if (!seeding?.fgiSurvey) {
  navigation.navigate('FgiSurvey', { campaignId });
  return;
}
await setSeedingStatus(campaignId, SEEDING_STATUS.REVIEWING);
opsUpload(campaignId, { postUrl: uploadedVideoUrl ?? '', format: 'short' });
```

(변수명·네비 라우트명은 파일의 실제 컨텍스트에 맞춘다. 업로드 영상의 URL 변수가 없으면 `postUrl: ''`+`format: 'short'`로 보내고 주석으로 명시)

- [ ] **Step 2: 회귀 + 커밋** — `corepack yarn test --runInBand && git add -A && git commit -m "fix(upload): 피드 업로드 경로에 FGI 가드·서버 전송 — 제출 규칙 통일"`

---

### Task 12: devAdvance 릴리스 차단 (app-master)

**Files:**
- Modify: `screens/ActivityScreen/index.js` (약 297-299행)

- [ ] **Step 1: 게이트 축소**

```js
// 운영 시뮬(devAdvance)은 개발 빌드 전용 — TEST_GUEST_ENTRY(테스트 배포용 게스트 입장)와 분리
const canDevAdvance = __DEV__;
```

기존 `__DEV__ || FEATURES.TEST_GUEST_ENTRY` 조건을 `canDevAdvance`로 교체. `guardGuest`(CampaignDetail.js:65-75)는 변경하지 않는다 (게스트 입장은 유지).

- [ ] **Step 2: 회귀 + 커밋** — `corepack yarn test --runInBand && git add -A && git commit -m "fix(release): devAdvance 운영 시뮬을 __DEV__ 전용으로"`

---

### Task 13: 에뮬레이터 통합 검증 (app-master)

- [ ] **Step 1: 에뮬레이터 기동** — Pixel_6_API_35 + Metro(작업 트리) + `adb reverse tcp:8081 tcp:8081`. `pm clear com.arbaim.greyd` 후 실행.
- [ ] **Step 2: 퍼널 왕복** — 게이트(신규 발급 코드, 사용자에게 요청) → 신청 → 주소 입력 → devAdvance로 shipped → 수령 → 첫인상 → FGI → 리뷰 제출.
- [ ] **Step 3: 서버 반영 확인 (사용자 실행)**

```
! cd "/c/Users/ruese/Downloads/greyd-ops" && echo 'DO $$ DECLARE c1 int; c2 int; BEGIN SELECT count(*) INTO c1 FROM "Shipment" WHERE "shippingAddress" IS NOT NULL; SELECT count(*) INTO c2 FROM "FgiResponse"; RAISE EXCEPTION $q$addr=% fgi=%$q$, c1, c2; END $$;' | npx prisma db execute --stdin --url "$(grep -m1 '^DATABASE_URL=' .env.prod.pull | cut -d= -f2- | tr -d '\"')"
```

Expected: `addr=1 fgi=1` 이상.
- [ ] **Step 4: 오프라인 큐 확인** — 에뮬레이터 비행기 모드 → 수령 확인 → 모드 해제 → Activity 재진입 → Step 3 재실행으로 반영 확인.
- [ ] **Step 5: 마무리 커밋·푸시** — 양 저장소 push. TestFlight 반영은 빌드 수단 확보 후 (계획 외).
