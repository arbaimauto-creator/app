# greyd Phase 1.5 — 서버 이관 API 명세서

작성: 2026-08-11 · 대상: greyd 앱 mock 계층(`api/*.js`)의 실서버 이관
입력: Phase 1 v2 설계(`2026-08-10-greyd-phase1-v2-design.md` §3-2·§4·§6) · ops 정합(`2026-08-10-app-ops-integration.md` I1~I11) · 보안 감사(`.harness/security-review-2026-08-10.md` H1·H5·H6·M3·M5·M8)
원칙: **"함수 본문만 교체"** — 클라이언트 `api/*.js`의 함수 시그니처·반환 형태를 유지한 채 본문을 HTTP 호출로 바꾼다(§10 이관 맵).

---

## 1. 개요·공통 규약

### 1-1. 신뢰 경계 (보안 감사 H6 이행)

> **모든 판정·지급·전이는 서버가 확정한다. 클라이언트는 표시만 한다.**

| 항목 | Phase 1 (mock) | Phase 1.5 (본 명세) |
|---|---|---|
| 포인트 계산·지급 | `TryScreen/points.js` 클라 계산 | 서버 원장(ledger) 확정 — §2-8 |
| G-스코어 | `creators.js adjustGScore()` 로컬 | 서버 전용 필드, 클라 API에 쓰기 경로 없음 |
| 상태 전이 8종 | `seedings.js setSeedingStatus()` 로컬 | 서버 전이 규칙 표(§2-5-3)로만 변경 |
| 동시 한도·자동 확정 | `points.js concurrentLimit()/canAutoConfirm()` | 신청 API에서 서버 재검증 |
| 초대 코드 | `invites.js` 번들 하드코딩 (M3) | 서버 검증 + 1회성 + 유효 7일 + 레이트리밋 |
| 선착순 잔여(remaining) | mock 카운트 | DB 원자적 차감 (§2-5-1 동시성) |

클라이언트의 `points.js`·`missionLogic.js`는 **표시용 미리보기 계산**으로만 남긴다. 서버 응답 값과 다르면 서버 값이 정본.

### 1-2. 인증 (H1·M8 이행)

- **서버 발급 세션 토큰**만 사용한다. 소셜 `idToken`은 서버가 서명·`aud`·`exp`를 검증한 뒤 자체 액세스/리프레시 토큰을 발급한다. 클라이언트에 하드코딩된 게스트 JWT(`commonHelperFunction.js`)는 폐기하고 §2-1-2 익명 세션 API로 대체한다.
- 전송은 **`Authorization: Bearer <accessToken>` 헤더 전용**. 쿼리스트링 토큰(M8, 구 `APIprovider.js` 패턴) 금지 — 서버는 쿼리스트링에 토큰이 오면 `401 AUTH_TOKEN_IN_QUERY`로 거부한다.
- 액세스 토큰 수명 1시간, 리프레시 토큰 30일·회전(rotate) 방식. 리프레시 재사용 감지 시 토큰 패밀리 전체 폐기.
- **모든 대상 식별자는 토큰에서 도출한다(H5·IDOR).** `creatorId`·`brandId`를 요청 본문/쿼리로 받는 엔드포인트는 없다. `/me/*` 경로는 토큰의 주체를, `/brand/*`는 토큰의 `brandId` 클레임을, `/ops/*`는 운영자 역할을 사용한다. 경로 파라미터(seedingId 등)는 항상 **소유권 검증 후** 처리하며, 불일치 시 `404 NOT_FOUND`(존재 여부 열거 방지 — 403 아님).

토큰 클레임(서버 서명 JWT):

```json
{ "sub": "cr-8f2e...", "role": "influencer|brand|guest|ops",
  "brandId": "brand-sonplan",  // role=brand일 때만
  "sessionId": "ses-...", "iat": 1770000000, "exp": 1770003600 }
```

### 1-3. 에러 규약 (M5 이행)

- 서버 내부 에러 원문(스택·DB 메시지)은 **절대 응답에 싣지 않는다**. 클라이언트는 `code`를 로컬라이즈 문자열로 매핑해 표시한다.
- 형식 (모든 4xx/5xx 공통):

```json
{ "error": { "code": "SEEDING_QUOTA_EXHAUSTED", "message": "developer-facing short text", "retryAfter": 30 } }
```

| 공통 코드 | HTTP | 의미 |
|---|---|---|
| `AUTH_INVALID_TOKEN` | 401 | 토큰 없음/서명 불일치/만료 |
| `AUTH_TOKEN_IN_QUERY` | 401 | 쿼리스트링 토큰 전송(M8) |
| `FORBIDDEN_ROLE` | 403 | 역할 불충분 (guest가 신청 등) |
| `NOT_FOUND` | 404 | 리소스 없음 **또는 소유권 불일치**(H5) |
| `VALIDATION_FAILED` | 400 | 필드 검증 실패 (`details[]`에 필드 단위 코드) |
| `CONFLICT_STATE` | 409 | 상태 전이 규칙 위반 |
| `IDEMPOTENCY_REPLAYED` | 200 | 멱등 재전송 — 원 응답 그대로 반환 (에러 아님) |
| `IDEMPOTENCY_KEY_CONFLICT` | 409 | 같은 키·다른 본문 |
| `RATE_LIMITED` | 429 | 레이트리밋 초과 (`retryAfter` 초 단위 필수) |
| `INTERNAL` | 500 | 내부 오류 — 상세 비노출, `traceId`만 포함 |

### 1-4. 멱등성 키 규약

- 상태를 만들거나 돈(포인트)·재고(쿼터)에 닿는 모든 POST는 **`Idempotency-Key` 헤더 필수**: 신청·수령 확인·리뷰 제출·FGI 응답·취소·연장·오퍼 응답·초대 코드 사용·운영 지급.
- 키는 클라이언트 생성 UUIDv4. 서버는 `(creatorId, 키)` 단위로 24시간 보관, 동일 키 재수신 시 저장된 원 응답을 그대로 반환(부수효과 재실행 금지). 같은 키에 다른 본문이면 `409 IDEMPOTENCY_KEY_CONFLICT`.
- GET/PUT(전체 교체형)은 자연 멱등이므로 키 불요.

### 1-5. 레이트리밋 정책표 (보안 감사 "레이트리밋 필수 목록" 반영)

식별 기준: 미인증 = IP, 인증 = creatorId(+IP 보조). 초과 시 `429 RATE_LIMITED` + `Retry-After` 헤더.

| 엔드포인트 | 한도 | 근거 |
|---|---|---|
| `POST /v1/auth/social` | IP당 10회/분 | 감사: 로그인 |
| `POST /v1/auth/guest` | IP당 5회/시간 | H1·M2 — 링크發 세션 남발 방지 |
| `POST /v1/auth/refresh` | 세션당 10회/분 | 회전 남용 방지 |
| `POST /v1/invites/verify` · `/redeem` | IP당 5회/분 + **10회 연속 실패 시 1시간 차단** | M3 — 무차별 대입 |
| `POST /v1/campaigns/{id}/apply` | 유저당 10회/분 | 재고 두들김 방지 |
| `POST /v1/seedings/{id}/review` | 유저당 10회/시간 | 스팸 링크 |
| `PUT /v1/me/profile` | 유저당 30회/시간 | 열거·스팸 |
| `DELETE /v1/me` (탈퇴) | 유저당 2회/일 | 감사: 탈퇴 |
| `/v1/ops/*` 전체 | 운영자당 300회/분 | 콘솔 배치 작업 여유 |
| 그 외 인증 GET | 유저당 120회/분 | 기본 버킷 |

### 1-6. 공통 표기

- Base URL: `https://api.greyd.app` · 버전 프리픽스 `/v1` · 본문 `application/json; charset=utf-8`
- 시각은 전부 ISO 8601 UTC(`2026-08-20T23:59:59.000Z`) — mock과 동일.
- ID 규약: `cr-`(creator) `cmp-`(campaign) `sd-`(seeding) `rv-`(review) `ev-`(evaluation) `off-`(offer) `led-`(ledger). 서버 발급, 추측 불가능한 난수부 포함.
- 페이지네이션: `?cursor=<opaque>&limit=20`(기본 20, 최대 50), 응답 `nextCursor`.

---

## 2. 리소스별 엔드포인트 명세

### 2-1. Auth

#### 2-1-1. `POST /v1/auth/social` — 소셜 로그인

권한: 없음(공개). 레이트리밋 §1-5.

요청:
```json
{ "provider": "google|apple|kakao", "idToken": "<provider JWT>", "authorizationCode": "<apple만>" }
```

검증 규칙:
- `idToken` 서명을 provider 공개키(JWKS)로 검증, `aud`=우리 클라이언트 ID, `exp` 미래, `iss` 일치 — **전부 서버에서** (H1: 만료 토큰 수용 금지).
- 최초 로그인이면 creator 레코드 생성(`role` 미정 — 초대 게이트 통과 전까지 `pending`).

응답 `200`:
```json
{ "accessToken": "eyJ...", "refreshToken": "rt_...", "expiresIn": 3600,
  "creator": { "id": "cr-8f2e", "role": "influencer", "onboarded": true, "inviteRequired": false } }
```

에러: `401 AUTH_IDTOKEN_INVALID`(서명/만료/aud 불일치 — 사유 구분 없이 단일 코드), `403 ACCOUNT_DELETED`(탈퇴 계정), `429`.

#### 2-1-2. `POST /v1/auth/guest` — 익명(게스트) 세션

권한: 없음. **딥링크 진입만으로 자동 호출 금지**(M2) — 명시적 "둘러보기" 액션에서만.

요청: `{ "deviceId": "<앱 설치 단위 UUID>" }`
응답 `200`: `{ "accessToken": "...", "refreshToken": "...", "expiresIn": 3600, "creator": { "id": "cr-guest-...", "role": "guest" } }`

- 게스트 토큰의 `role=guest`는 읽기 전용 표면(캠페인 목록/상세)만 통과. 신청·프로필·주소는 `403 FORBIDDEN_ROLE`.
- 하드코딩 공유 게스트 계정(H1)은 이 API 배포와 동시에 서버에서 해당 sub 차단.

#### 2-1-3. `POST /v1/auth/refresh`

요청: `{ "refreshToken": "rt_..." }` → 응답: 새 액세스+**새 리프레시**(회전). 재사용 감지 시 `401 AUTH_REFRESH_REUSED` + 세션 패밀리 전체 폐기.

#### 2-1-4. `POST /v1/auth/logout`

권한: 인증. 요청: `{ "refreshToken": "rt_...", "allDevices": false }` → `204`. 서버 세션 폐기. 클라는 로컬 PII(`savedAddressV2`/`seedingsV2`/`creatorProfileV2`/`inviteRole`)도 클리어(H7).

#### 2-1-5. `DELETE /v1/me` — 계정 삭제 (D10, Apple 5.1.1(v))

권한: 인증(influencer/brand). 진행 중 seeding(`applied|approved|shipped|received|reviewing`)이 있으면 `409 SEEDING_IN_PROGRESS`. 성공 시 PII 즉시 삭제·원장은 익명화 보존, `204`.

### 2-2. InviteCodes (M3 이행)

코드 정책 (v2 §3-1①·D17·mock `invites.js` 계약): 6자리 영숫자 대문자 · **1회성** · **발급 후 7일 유효** · 역할 분기(`influencer` | `brand`+brandId). 서버는 코드를 해시로 저장(평문 미보관), 대소문자 무시 비교(mock의 `trim().toUpperCase()` 동일).

#### 2-2-1. `POST /v1/invites/verify` — 사전 검증 (입력 UX용, 소모 안 함)

권한: 없음(게이트는 로그인 전 진입 가능). 레이트리밋 §1-5 + 연속 실패 차단.

요청: `{ "code": "GREYD1" }`

응답 `200` (mock `verifyInviteCode` 반환 계약 유지):
```json
{ "success": true, "role": "influencer", "brandId": null, "brandName": null,
  "expiresAt": "2026-08-18T00:00:00.000Z", "invitedBy": "@mia_beauty" }
```
실패는 사유 무구분 단일 응답(열거 방지): `200 { "success": false }` — 존재하지 않음/만료/사용됨을 구분해 주지 않는다.

#### 2-2-2. `POST /v1/invites/redeem` — 사용 확정 (1회성 소모)

권한: 인증(로그인 직후, `role=pending|guest`). `Idempotency-Key` 필수.

요청: `{ "code": "GREYD1", "country": "US" }`

처리: 코드 검증 → **원자적 사용 처리**(`UPDATE invite_codes SET used_by=?, used_at=now() WHERE code_hash=? AND used_by IS NULL AND expires_at>now()` — 영향 행 0이면 실패) → creator에 `role`(+brand면 `brandId`) 확정 → 새 토큰 발급(role 클레임 갱신).

응답 `200`: `{ "success": true, "role": "brand", "brandId": "brand-sonplan", "brandName": "SonPlan", "accessToken": "...", "refreshToken": "..." }`
에러: `409 INVITE_ALREADY_USED`는 노출하지 않고 verify와 동일하게 `{ "success": false }` (열거 방지), `409 ROLE_ALREADY_SET`(이미 게이트 통과 계정), `429`.

### 2-3. Creators (프로필)

프로필 필드 계약 = mock `creators.js` 주석 그대로: `country, ageBand, gender, primaryPlatform, handleUrl, followerBand, followerSnapshot, contentCategories[], skinType` + 서버 전용 `gScore, strikes, completedCount, onboardedAt`.

#### 2-3-1. `GET /v1/me/profile`

권한: influencer. 응답 `200`:
```json
{ "id": "cr-8f2e", "country": "US", "ageBand": "25-34", "gender": "female",
  "primaryPlatform": "instagram", "handleUrl": "https://instagram.com/mia_beauty",
  "followerBand": "micro", "followerSnapshot": 8200,
  "contentCategories": ["skincare", "makeup"], "skinType": "sensitive",
  "gScore": 57, "strikes": 0, "completedCount": 2, "concurrentLimit": 2,
  "curatedEligible": false, "onboardedAt": "2026-08-01T02:00:00.000Z" }
```
- `concurrentLimit`·`curatedEligible`(G≥60 또는 완주 2회, v2 §4-1)은 **서버 계산 파생값** — 클라 재계산 금지.
- 온보딩 미완이면 `200`에 `"onboardedAt": null`(mock의 `null` 반환 계약과 정합).

#### 2-3-2. `PUT /v1/me/profile`

권한: influencer. 요청은 위 필드 중 **수집 필드만** 허용.
검증: `ageBand ∈ {18-24, 25-34, 35-44, 45+}`(v2 §6) · `followerBand ∈ {nano, micro, mid, macro}` · `handleUrl`은 URL 형식 + 허용 도메인(instagram/tiktok/youtube).
**`gScore`/`strikes`/`completedCount`/`referralCodes`가 본문에 있으면 `400 READONLY_FIELD`** — 무시가 아니라 명시 거부(H6). mock `adjustGScore()`의 대체 API는 존재하지 않는다 — G-스코어는 §2-8 원장 이벤트로만 변한다.
응답 `200`: 저장된 전체 프로필(서버 계산 필드 포함).

#### 2-3-3. 기본 배송지 — `GET | PUT | DELETE /v1/me/address`

mock `address.js` 계약: `{ name, line, city, state, postalCode, phone }`. 권한: influencer.
- `GET` → `200` 주소 또는 `{ "address": null }`
- `PUT` → 전체 교체, 검증: 필수 `name/line/city/postalCode/phone`, `phone`은 E.164. `200`
- `DELETE` → `204` (mock `clearSavedAddress` 대응)
- 저장은 서버 측 암호화(PII). 응답에 다른 유저 주소가 나갈 경로 없음(토큰 주체 고정).

### 2-4. Campaigns

캠페인 필드 계약 = mock `campaigns.js`: `id, brand, brandId, title, thumbnailUrl, remaining, total, deadline, countries[], seedingQuotaPerCountry, basePoints, track:'SEEDING', applyMode:'open'|'curated', uploadDays:14, contentGuide[], fgiExtraQuestions[], status:'open'|'closed'` (+하위 호환 `rewardPoint`).

#### 2-4-1. `GET /v1/campaigns` — 목록

권한: 인증(guest 포함). 쿼리: `?status=open&category=skincare&cursor=&limit=`

응답 `200` (개인화 필드는 **서버 계산** — H6):
```json
{ "items": [ {
    "id": "cmp-001", "brand": "SonPlan", "brandId": "brand-sonplan",
    "title": "썬플랜 타임 슬립 아이크림 글로벌 체험단",
    "thumbnailUrl": "https://...", "remaining": 12, "total": 30,
    "deadline": "2026-08-20T23:59:59.000Z",
    "countries": ["KR", "US", "JP"], "seedingQuotaPerCountry": { "KR": 10, "US": 10, "JP": 10 },
    "basePoints": 500, "rewardPoint": 500, "track": "SEEDING", "applyMode": "open",
    "uploadDays": 14, "contentGuide": ["타임 슬립 성분 언급", "..."], "status": "open",
    "personalized": {
      "points": 550,            // personalizedPoints(basePoints, gScore) — 10P 단위 반올림, 서버 계산
      "multiplier": 1.1,        // gradeMultiplier: G50~59 ×1.0 / 60~79 ×1.1 / 80~99 ×1.25 / 100+ ×1.5
      "eligible": true,         // curated면 G≥60(CURATED_MIN_G) 또는 완주 2회, 국가·동시한도 포함 판정
      "lockReason": null        // "CURATED_G60" | "COUNTRY_NOT_TARGET" | "CONCURRENT_LIMIT" | "ALREADY_APPLIED"
    } } ],
  "nextCursor": null }
```
- guest는 `personalized`가 `null`(G50 기준값도 주지 않음 — 가입 유도).
- `remaining`은 캐시 허용(§12) — 정확한 재고 판정은 신청 API에서만.
- Curated 미달 캠페인도 **목록에 노출**(v2 §4-1 "숨기지 말고 잠가서 보여준다") — `eligible:false + lockReason`.

#### 2-4-2. `GET /v1/campaigns/{campaignId}` — 상세

권한: 인증(guest 포함). 응답: 목록 항목 + `fgiExtraQuestions[]` + `fgiQuantItems`(서버가 `campaigns.js FGI_QUANT_ITEMS` 반환: `purchaseIntent/priceFairness/competitiveness`). 미존재 `404 NOT_FOUND`.

### 2-5. Seedings (미션 인스턴스)

상태 enum 8종 (mock `seedings.js SEEDING_STATUS` 그대로):
`applied · approved · shipped · received · reviewing · done · cancelled · no_show`

#### 2-5-1. `POST /v1/campaigns/{campaignId}/apply` — 신청 (선착순 원자적 차감)

권한: influencer(온보딩 완료). `Idempotency-Key` **필수**.

요청 (mock `upsertSeeding` 신청 필드 계약):
```json
{ "pledgeChecked": true, "appealText": "민감성 피부 리뷰 전문입니다" }
```

검증 규칙 (전부 서버, 순서대로):
1. `pledgeChecked === true` 아니면 `400 PLEDGE_REQUIRED`
2. `appealText` ≤ 100자 (v2 §6 seeding.appeal_text)
3. 캠페인 `status='open'` && `deadline` 미경과 — 아니면 `409 CAMPAIGN_CLOSED`
4. 프로필 `country` ∈ `campaign.countries` — 아니면 `403 COUNTRY_NOT_TARGET`
5. 중복 신청(동일 campaignId에 활성 seeding) — `409 ALREADY_APPLIED`
6. **동시 진행 한도** (points.js `concurrentLimit`): 이력 0회=1건 / G80+=3건 / 그 외 2건. 활성 = `applied|approved|shipped|received|reviewing`. 초과 시 `409 CONCURRENT_LIMIT`
7. Curated면 `gScore ≥ 60(CURATED_MIN_G) || completedCount ≥ 2` — 아니면 `403 CURATED_LOCKED`
8. Strike로 인한 30일 Curated 잠금(v2 §4-2) 검사 — `403 CURATED_STRIKE_LOCKED`

**동시성 처리 명세 (선착순 필수):**
- 국가별 쿼터를 단일 SQL로 원자 차감한다. 조건부 UPDATE(영향 행 검사) 또는 동등한 직렬화 수단(row lock/Redis Lua) 사용:

```sql
UPDATE campaign_quota
   SET remaining = remaining - 1
 WHERE campaign_id = :cid AND country = :creatorCountry AND remaining > 0;
-- affected_rows = 0 → 409 SEEDING_QUOTA_EXHAUSTED (쿼터 원복 불필요)
```
- 차감과 seeding INSERT는 **같은 트랜잭션**. 이후 단계(자동 확정 판정) 실패 시 롤백으로 쿼터 복원.
- `Idempotency-Key` 재전송은 차감을 재실행하지 않고 원 응답 반환(§1-4).
- 취소/반려 시 쿼터 +1 원복(동일 원자 UPDATE, 상한 `total` 클램프).

**자동 확정 (D24, points.js `canAutoConfirm`):** Open 캠페인 & `strikes === 0` & (`gScore ≥ 60` || `completedCount === 0`) → 서버가 즉시 `applied→approved` 전이(`autoConfirmed: true`). 미충족 시 `applied` 유지 + 운영 승인 큐(§2-10) 폴백. Curated는 항상 수동.

응답 `201`:
```json
{ "seeding": { "id": "sd-201", "campaignId": "cmp-001", "surface": "app",
    "status": "approved", "autoConfirmed": true,
    "appliedAt": "2026-08-11T04:00:00.000Z", "approvedAt": "2026-08-11T04:00:00.000Z",
    "pledgeChecked": true, "appealText": "...", "extensionUsed": false,
    "addressDeadline": "2026-08-13T04:00:00.000Z" },
  "campaignRemaining": 11 }
```
`addressDeadline` = approvedAt + **48h**(missionLogic.js `ADDRESS_DEADLINE_HOURS`), 서버 계산.

#### 2-5-2. `GET /v1/me/seedings` — 내 시딩 목록

권한: influencer. 쿼리 `?status=active|done|all`. 응답: seeding 배열(§3 스키마 전 필드 + 조인된 campaign 요약 + 서버 계산 `daysLeft`·`inGrace`). `daysLeft` 규칙 = missionLogic.js: `receivedAt + (14 + extensionUsed?7:0)일` 기준, 유예는 마감 후 **2일**(`GRACE_DAYS`).

#### 2-5-3. 상태 전이 규칙 표 (정본 — 이 표에 없는 전이는 전부 `409 CONFLICT_STATE`)

| # | 전이 | 행위자 | 트리거 API / 조건 |
|---|---|---|---|
| T1 | `applied → approved` | **시스템**(자동 확정 D24) 또는 **운영**(승인 큐) | apply 내 판정 / `POST /v1/ops/seedings/{id}/decision` |
| T2 | `applied → cancelled` | **운영**(반려) 또는 **유저**(신청 철회) | decision(reject) / `POST /v1/seedings/{id}/cancel` — 무페널티, 쿼터 원복 |
| T3 | `approved → shipped` | **운영** (운송장 입력과 동시) | `POST /v1/ops/seedings/{id}/shipment` |
| T4 | `approved → cancelled` | **유저**(본인 취소, shipped 전까지 — D12) 또는 **시스템**(주소 48h 미입력 자동 취소) | cancel API / 서버 배치. 무페널티(v2 §3-2) |
| T5 | `shipped → received` | **유저** (수령 확인 버튼) | `POST /v1/seedings/{id}/receive` — D+14 타이머 기점 |
| T6 | `shipped → received` | **시스템** (발송 후 21일 경과 수령 간주 — v2 §3-1⑥, Phase 1.5는 운영 수동 실행) | ops status API |
| T7 | `received → reviewing` | **유저** (리뷰 링크 제출) | `POST /v1/seedings/{id}/review` |
| T8 | `received → no_show` | **시스템** (D+16 = 마감+유예 2일 경과 미업로드) | 서버 배치 — Strike 1 부여·G−10·0P (§2-8) |
| T9 | `reviewing → done` | **시스템** (브랜드 트리아지 이상 평가 수신 시) 또는 **운영** | evaluation 저장 훅 / ops status API — 포인트 지급(§2-8) |
| T10 | `shipped 이후 → cancelled` | **운영만** (배송 사고 등 CS — D12: 유저는 문의하기로) | ops status API |

- 유저 발 전이(T2·T4·T5·T7)는 소유권 검증(토큰 sub = seeding.creatorId, 불일치 `404`).
- 모든 전이는 타임스탬프 스탬핑(mock `setSeedingStatus`의 `appliedAt/approvedAt/shippedAt/receivedAt/uploadedAt/doneAt/cancelledAt/noShowAt` 필드명 유지) + 감사 로그(§3 audit).
- 통관 지연 등 타이머 수동 정지(D14)는 ops status API의 `timerPausedAt`로 처리, Strike 배치는 정지 기간 제외.

#### 2-5-4. `POST /v1/seedings/{seedingId}/address` — 주소 제출

권한: influencer(소유자). 조건: `status=approved` && `addressDeadline` 이전. 요청: §2-3-3 주소 형식 + `"saveAsDefault": true`. 응답 `200`(마스킹된 주소 에코). 에러: `409 CONFLICT_STATE`(approved 아님), `409 ADDRESS_DEADLINE_PASSED`.

#### 2-5-5. `POST /v1/seedings/{seedingId}/receive` — 수령 확인

권한: influencer(소유자). `Idempotency-Key` 필수. 조건: `status=shipped`. 처리: T5 전이, `receivedAt` 기록 → 업로드 마감 = `receivedAt + uploadDays(14)일`(캠페인 값, 기본 missionLogic.js `UPLOAD_DAYS=14`). 응답 `200`: `{ "seeding": {...}, "uploadDeadline": "...", "graceDeadline": "<+2일>" }`.

#### 2-5-6. `POST /v1/seedings/{seedingId}/cancel` — 본인 취소

권한: influencer(소유자). 조건: `status ∈ {applied, approved}` (D12 — shipped 이후 `409 CANCEL_NOT_ALLOWED`, 문의 유도). `Idempotency-Key` 필수. 요청: `{ "reason": "personal|address|other" }`(선택). 처리: T2/T4, 무페널티, 쿼터 원복. 응답 `200`.

#### 2-5-7. `POST /v1/seedings/{seedingId}/extend` — 무료 마감 연장 1회

권한: influencer(소유자). `Idempotency-Key` 필수. 조건: `status=received` && `extensionUsed=false` && 유예 종료 전. 처리: `extensionUsed=true`, 마감 +**7일**(missionLogic.js `EXTENSION_DAYS`). 재호출 `409 EXTENSION_ALREADY_USED`. 응답 `200`: 새 `uploadDeadline`. (D7: 연장은 포인트와 무관한 무료 1회.)

### 2-6. Reviews (업로드·FGI)

#### 2-6-1. `POST /v1/seedings/{seedingId}/review` — 리뷰 링크 제출

권한: influencer(소유자). `Idempotency-Key` 필수. 조건: `status=received` (유예 D+16까지 허용 — 이후는 T8 no_show).

요청 (mock review 계약: `platformUrl, format`):
```json
{ "platformUrl": "https://instagram.com/p/abc123", "format": "short" }
```
검증: `format ∈ {short, long, image, story}`(v2 §6 review.format) · `platformUrl`은 https + 허용 플랫폼 도메인 화이트리스트(instagram.com/tiktok.com/youtube.com 등) · 동일 seeding 중복 제출 `409 REVIEW_ALREADY_SUBMITTED`.

처리: review 생성 + T7 전이(`uploadedAt` 스탬프). **유예 여부는 서버가 판정**해 review에 `graceUsed` 기록(마감<제출≤마감+2일) — 지급 시 ×0.7의 근거(H6).

응답 `201`: `{ "review": { "id": "rv-201", "seedingId": "sd-201", "platformUrl": "...", "format": "short", "uploadedAt": "...", "graceUsed": false }, "seeding": { "status": "reviewing", ... } }`

#### 2-6-2. `POST /v1/seedings/{seedingId}/fgi-response` — FGI 설문 응답

권한: influencer(소유자). `Idempotency-Key` 필수. 조건: 리뷰 제출 플로우 내(업로드 직전 — D20). 1회만(`409 FGI_ALREADY_SUBMITTED`).

요청 (campaigns.js `FGI_QUANT_ITEMS` 3항목 + 캠페인 커스텀):
```json
{ "quant": { "purchaseIntent": 4, "priceFairness": 3, "competitiveness": 5 },
  "fairPriceUsd": 24,
  "extraAnswers": [ { "question": "향에 대한 인상은 어땠나요?", "answer": "..." } ],
  "qualitative": "..." }
```
검증: quant 3키 필수, 각 1~5 정수. **응답 내용은 포인트·G-스코어에 절대 미반영(D2)** — 서버 지급 로직에서 이 테이블 참조 금지. 응답 `201`.

집계(브랜드 대시보드 `fgiStats`: overallScore=정량평균×20, purchaseIntentRate=4점 이상 비율 — mock `MOCK_FGI_STATS` 계약)는 서버 배치 계산.

### 2-7. Evaluations (브랜드 — 접근 제어 필수)

**접근 제어**: 모든 `/v1/brand/*`는 `role=brand` 토큰 필수, 대상 캠페인의 `campaign.brandId === token.brandId`가 아니면 `404 NOT_FOUND`. brandId는 요청 파라미터로 받지 않는다(H5·C2 재발 방지 — mock 웹의 `|| true` 필터 같은 클라 필터링 금지, 서버 WHERE 절 고정).

#### 2-7-1. `GET /v1/brand/campaigns` — 소속 캠페인 목록

응답: 토큰 brandId 소유 캠페인만.

#### 2-7-2. `GET /v1/brand/campaigns/{campaignId}/reviews` — 평가 대상 리뷰 목록

응답 항목 = mock `reviews.js` 계약: `id, seedingId, reviewer(핸들), country, thumbnailUrl, uploadedAt, platformUrl, format, productionStyle, views7d, likes7d, metricsSource:'manual', capturedAt` + `evaluation`(있으면 조인). **크리에이터 PII(실명·주소·연락처)는 절대 미포함.** 쿼리 `?triage=pending|pick|ok|skip`.

#### 2-7-3. `PUT /v1/brand/reviews/{reviewId}/evaluation` — 트리아지·루브릭 저장

mock `evaluations.js` 계약 유지:
```json
{ "triage": "pick",
  "skipReason": null,
  "scores": { "authenticity": 4, "delivery": 5, "quality": 4, "marketSignal": 3 },
  "rebook": true, "comment": "포장 연출이 좋았어요" }
```
검증:
- `triage ∈ {pick, ok, skip}` (`TRIAGE` enum) · `skip`이면 `skipReason ∈ {low_quality, guide_violation, cannot_judge}`(`SKIP_REASONS`) 필수
- `scores`는 `triage='pick'`일 때만 허용(D3 — 후보만 정량), 4키 각 1~5 정수
- 대상 review의 캠페인이 토큰 brandId 소속인지 검증(아니면 `404`)

처리: upsert(`updatedAt` 갱신 — mock `saveEvaluation` 패턴). **트리아지 이상 첫 평가 저장 시 서버가 T9(`reviewing→done`) 전이 + 포인트·G-스코어 지급 트리거(§2-8).** 품질 보너스 판정도 이때: `scores.quality ≥ 4 → ×1.2`(v2 §4-3), `quality=5 → G+2`(points.js `QUALITY_5`). 응답 `200`.

#### 2-7-4. `GET /v1/brand/campaigns/{campaignId}/dashboard` — 대시보드 통합 조회

mock 4함수(`fetchCampaignReviews` 제외한 `fetchFgiStats`/`fetchCountryStats`/`fetchWeeklyFinding`) 통합:
```json
{ "summary": { "totalUploads": 24, "totalReach": 143000, "avgScore": 4.2, "countryCount": 3, "capturedAt": "2026-08-12T00:00:00.000Z" },
  "weeklyFinding": "🇯🇵 일본: 예상 밖 '지속력' 언급 집중 (7건 중 5건). ...",
  "countryStats": [ { "country": "US", "quota": 10, "uploaded": 9, "avgScore": 4.2, "avgViews": 5200, "avgDaysToUpload": 6 } ],
  "fgiStats": { "overallScore": 82, "purchaseIntentRate": 71,
    "quant": { "purchaseIntent": 4.1, "priceFairness": 3.6, "competitiveness": 4.3 },
    "fairPriceUsdMedian": 24, "responses": 24 } }
```
도달 지표는 운영 수동 입력분(`metricsSource:'manual'`)의 집계 — `capturedAt` 필수 노출(가짜 실시간 연출 금지 원칙).

### 2-8. Points / G-score — 원장(ledger) 방식

**쓰기 API 없음.** 포인트·G-스코어는 서버 내부 이벤트로만 적립/변동되는 append-only 원장이다(H6). 클라이언트는 조회만.

#### 2-8-1. 지급 이벤트 유형과 서버 계산 규칙 (points.js 값이 정본)

| 이벤트 | 트리거 | 포인트 | G-스코어 |
|---|---|---|---|
| `COMPLETE` | T9 done 전이 (기한 내) | `round(basePoints × 등급배수 × 품질보너스 / 10) × 10` | **+3** (`G_DELTA.COMPLETE`) |
| `QUALITY` | 루브릭 `quality ≥ 4` | 위 식의 품질보너스 = **×1.2** (v2 §4-3 +20%) | `quality=5`면 추가 **+2** (`QUALITY_5`) |
| `GRACE` | `review.graceUsed=true`로 done | 위 식에 **×0.7** (`GRACE_MULTIPLIER`) 추가 곱 | COMPLETE +3 대신 **+1** (`GRACE_COMPLETE`) |
| `STRIKE` | T8 no_show 배치 | **0P** (해당 캠페인 지급 없음) | **−10** (`G_DELTA.STRIKE`) + strikes+1 + 30일 Curated 잠금. Strike 2회 = 계정 차단(운영 집행) |
| `BONUS` | 운영 수동 지급 (온보딩 +50P 등) | ops API 지정값 | 0 |

- 등급배수 = `gradeMultiplier(지급 시점 gScore)`: G50~59 ×1.0 / G60~79 ×1.1 / G80~99 ×1.25 / G100+ ×1.5. 반올림은 **최종 1회, 10P 단위**(`personalizedPoints` 식과 동일).
- G-스코어 하한 0 (mock `adjustGScore`의 `Math.max(0, ...)` 유지), 시작값 **G50**(v2 §4-4).
- 지급은 seeding당 1회 — 원장에 `seedingId` unique 제약(STRIKE·BONUS 제외).
- Strike 1 후 연속 3회 완주 시 strikes 0 복귀(v2 §4-2, 감점 회복 없음) — 서버 배치.
- 사용처 없음(D7) — 차감 이벤트는 Phase 1.5 스코프 밖(Q4 APP_REWARD 출금 시 추가).

#### 2-8-2. `GET /v1/me/ledger` — 원장 조회

권한: influencer. 쿼리 `?type=points|gscore&cursor=&limit=`.
```json
{ "balance": { "points": 1250, "gScore": 57, "strikes": 0 },
  "items": [ { "id": "led-901", "type": "COMPLETE", "seedingId": "sd-101", "campaignTitle": "...",
      "points": 550, "gScoreDelta": 3, "detail": { "basePoints": 500, "multiplier": 1.1, "qualityBonus": 1.0, "graceMultiplier": 1.0 },
      "createdAt": "2026-08-09T00:00:00.000Z" } ],
  "nextCursor": null }
```

### 2-9. Referral (추천 코드)

정책(D6·v2 §7-4): **첫 검증 루프 완료(첫 done)** 시 서버가 자동으로 3장 발급 — 클라 발급 API 없음(mock `referral.js`의 로컬 생성식 폐기). 코드는 발급자 각인(`invitedBy` = 발급자 핸들), 초대 코드와 동일 정책(1회성·7일 유효·§2-2로 사용).

#### 2-9-1. `GET /v1/me/referral-codes`

권한: influencer. 응답:
```json
{ "eligible": true,
  "codes": [ { "code": "MIA101", "status": "active|used|expired", "usedBy": "@newbie" , "expiresAt": "..." } ] }
```
첫 done 전이면 `{ "eligible": false, "codes": [] }`(done 화면 노출 조건). 발급 시 유효기간 시작.

### 2-10. Offers (제안형 시딩 — D25·I11)

mock `offers.js` 계약: 상태 `pending | accepted | declined | expired`, 수락 = applied 스킵 approved 시작, 거절/만료 = G·Strike 무영향.

#### 2-10-1. `GET /v1/me/offers`

권한: influencer. 응답: `[ { "id": "off-001", "campaignId": "cmp-003", "proposedAt": "...", "expiresAt": "...", "status": "pending", "campaign": { ...캠페인 요약 } } ]`. `expiresAt` 경과 pending은 서버가 `expired`로 반환(응답 시한 D-3 — 만료 판정도 서버).

#### 2-10-2. `POST /v1/offers/{offerId}/respond`

권한: influencer(제안 대상자만 — 아니면 `404`). `Idempotency-Key` 필수.
요청: `{ "status": "accepted|declined", "declineReason": "schedule|product_fit|other" }`(declined 시 선택 — 매칭 학습용).
검증: `status=pending` && 미만료(`409 OFFER_EXPIRED`) · **수락 시 동시 한도 재검사**(`409 CONCURRENT_LIMIT` — ops 필터와 이중 방어).
처리(수락): seeding을 `approved`로 생성(applied 스킵) + addressDeadline 48h 시작. 응답 `200`: `{ "response": {...}, "seeding": {...} }`.

### 2-11. Admin / Ops (운영자 전용)

권한: 전부 `role=ops` 토큰(ops 콘솔 서비스 계정). 앱 클라이언트에는 이 경로 호출 코드가 없어야 한다. 모든 쓰기는 감사 로그 필수(§3 audit — actor·before·after).

| # | 메서드/경로 | 기능 | 핵심 규칙 |
|---|---|---|---|
| O1 | `POST /v1/ops/campaigns` | 캠페인 개설 | §2-4 필드 + `applyMode`·`basePoints`(100~500, v2 §6)·국가별 쿼터. `remaining` 초기값 = `total` |
| O2 | `PATCH /v1/ops/campaigns/{id}` | 수정·마감(`status:'closed'`) | 쿼터 축소는 현재 신청 수 미만 불가 |
| O3 | `GET /v1/ops/approval-queue` | 승인 큐 (자동 확정 미충족 `applied` + Curated 전건) | `?campaignId=&cursor=` — 어필 문구·프로필 요약 포함 |
| O4 | `POST /v1/ops/seedings/{id}/decision` | 승인/반려 | `{ "decision": "approve|reject", "reason": "..." }` → T1/T2. `Idempotency-Key` 필수 |
| O5 | `POST /v1/ops/seedings/{id}/shipment` | 운송장 입력 = shipped 전이 | `{ "trackingNo": "...", "carrier": "..." }` → T3. 조건 `status=approved && 주소 제출됨` |
| O6 | `POST /v1/ops/seedings/{id}/status` | 운영 수동 전이·타이머 정지 | `{ "status": "received|done|cancelled|no_show", "reason": "...", "timerPausedAt": null }` — §2-5-3 표 내 전이만, 위반 `409` |
| O7 | `POST /v1/ops/reviews/{id}/metrics` | SNS 지표 수동 입력 (주간 루틴 D21) | `{ "views7d": 4200, "likes7d": 512, "views30d": null, "capturedAt": "..." }` — `capturedAt` 필수(누락 `400`), `metricsSource:'manual'` 서버 고정 |
| O8 | `PUT /v1/ops/campaigns/{id}/weekly-finding` | 위클리 발견 카드 텍스트 | `{ "text": "..." }` |
| O9 | `POST /v1/ops/invites` | 초대 코드 발급 | `{ "role": "influencer|brand", "brandId": null, "count": 10, "influencerId": "<ops 매핑용, 선택>" }` → 코드 목록 1회 반환(서버는 해시만 보관), 유효 7일. greydAppId 매핑 대장(I4·I9-6) 연동 |
| O10 | `POST /v1/ops/creators/{id}/bonus` | 수동 포인트 지급(BONUS) | `{ "points": 50, "reason": "onboarding" }` — 원장 append, `Idempotency-Key` 필수 |
| O11 | `POST /v1/ops/offers` | 제안 발급 (D25 수동 브리지 → API화) | `{ "campaignId": "...", "creatorId": "...", "expiresAt": "..." }` — 동시 한도 초과 대상은 `409`(노출 보류 정책) |

---

## 3. 데이터 모델

공통 서버 전용 필드(전 테이블): `createdAt`, `updatedAt` (ISO UTC). 필드명은 ops Prisma 정합 원칙(I10) 유지 — mock 필드명 그대로.

### creators
| 필드 | 타입 | 출처 |
|---|---|---|
| id (PK, `cr-`) | string | 서버 발급 |
| authProvider, authSubject (unique) | string | 소셜 로그인 |
| role | `pending\|guest\|influencer\|brand\|ops` | 초대 게이트 확정 |
| brandId (nullable) | string | role=brand |
| country, ageBand, gender, primaryPlatform, handleUrl, followerBand, followerSnapshot, contentCategories[], skinType | mock 계약 | 온보딩 폼 |
| **gScore** (기본 50, ≥0) / **strikes** / **completedCount** | int | **서버 전용 — 원장 파생** |
| curatedLockUntil (nullable) | timestamp | Strike 30일 잠금 |
| onboardedAt, deletedAt | timestamp | |

### addresses (creator 1:1 기본 배송지, 암호화 저장)
`creatorId(PK/FK), name, line, city, state, postalCode, phone` — mock `address.js` 계약.

### invite_codes
`id, codeHash(unique), role, brandId?, brandName?, issuedBy(ops|referral:creatorId), influencerId?(I4 매핑), expiresAt(발급+7일), usedBy?(creatorId), usedAt?` — 1회성은 `usedBy IS NULL` 조건부 UPDATE로 보장.

### campaigns + campaign_quota
campaigns: mock 필드 전부(`brand, brandId, title, thumbnailUrl, total, deadline, countries[], basePoints, track='SEEDING', applyMode, uploadDays, contentGuide[], fgiExtraQuestions[], status`) + `productCost, shippingCost`(브랜드 비노출 — 브랜드 API 응답 제외).
campaign_quota: `(campaignId, country) PK, quota, remaining` — 원자 차감 대상. 목록 응답 `remaining` = SUM.

### seedings
| 필드 | 타입 | 비고 |
|---|---|---|
| id (`sd-`), campaignId, creatorId, surface=`'app'` | | (campaignId, creatorId) 활성 unique |
| status | enum 8종 §2-5 | |
| appliedAt, approvedAt, shippedAt, receivedAt, uploadedAt, doneAt, cancelledAt, noShowAt | timestamp | mock `setSeedingStatus` 스탬프 필드명 |
| pledgeChecked, appealText(≤100), autoConfirmed | bool/string/bool | |
| address(스냅샷, 암호화), trackingNo, carrier | | 운송장 = 운영 입력 |
| extensionUsed | bool 기본 false | 1회 제한 |
| addressDeadline, uploadDeadline, timerPausedAt | timestamp | 서버 계산·D14 |
| cancelReason, dropReason | string | ops DROPPED 사유 매핑(I3) |

### reviews
`id(rv-), seedingId(unique), platformUrl, format(short|long|image|story), productionStyle?(운영 태깅), uploadedAt, graceUsed, thumbnailUrl?, views7d?, likes7d?, views30d?, likes30d?, capturedAt?, metricsSource='manual'` — 지표는 O7로만 기록.

### fgi_responses
`id, seedingId(unique), campaignId, quant{purchaseIntent,priceFairness,competitiveness}(1~5), fairPriceUsd?, extraAnswers[], qualitative?` — 지급 로직 참조 금지(D2).

### evaluations
`id(ev-), reviewId(unique), evaluatorId(brand creator), triage(pick|ok|skip), skipReason?(low_quality|guide_violation|cannot_judge), scores{authenticity,delivery,quality,marketSignal}?(pick만), rebook?, comment?, updatedAt` — mock `evaluations.js` 계약.

### ledger (append-only)
`id(led-), creatorId, type(COMPLETE|QUALITY|GRACE|STRIKE|BONUS), seedingId?, points, gScoreDelta, detail{basePoints,multiplier,qualityBonus,graceMultiplier}, createdAt` — UPDATE/DELETE 금지, 정정은 반대 분개.

### offers
`id(off-), campaignId, creatorId, proposedAt, expiresAt, status(pending|accepted|declined|expired), declineReason?, respondedAt, seedingId?(수락 시)`.

### referral_codes — invite_codes 재사용(`issuedBy='referral:cr-...'`), creator당 3장, 첫 done 트리거 발급.

### audit_log (서버 전용)
`id, actorId, actorRole, action, resourceType, resourceId, before(json), after(json), ip, createdAt` — 전 상태 전이·ops 쓰기·원장 이벤트에 기록.

### sessions / idempotency_keys
sessions: `id, creatorId, refreshTokenHash, familyId, deviceId, expiresAt, revokedAt`.
idempotency_keys: `(creatorId, key) PK, requestHash, responseBody, status, createdAt(TTL 24h)`.

---

## 4. 클라이언트 이관 맵 ("함수 본문만 교체")

| mock 함수 | 대체 엔드포인트 | 비고 |
|---|---|---|
| `invites.js verifyInviteCode(code)` | `POST /v1/invites/verify` | 반환 `{success, role, brandId?, brandName?}` 동일. 가입 확정 시 `redeem` 추가 호출 |
| `creators.js getCreatorProfile()` | `GET /v1/me/profile` | null 반환 계약 유지(`onboardedAt:null` → null 매핑 가능) |
| `creators.js saveCreatorProfile(p)` | `PUT /v1/me/profile` | 병합 응답 동일 |
| `creators.js adjustGScore(delta)` | **삭제** — 대체 없음 | H6: G-스코어는 서버 원장 파생. 표시 갱신은 profile/ledger 재조회 |
| `address.js getSavedAddress()` | `GET /v1/me/address` | |
| `address.js saveSavedAddress(a)` | `PUT /v1/me/address` | |
| `address.js clearSavedAddress()` | `DELETE /v1/me/address` | |
| `campaigns.js fetchCampaignList()` | `GET /v1/campaigns` | `personalized.*` 신규 — TryScreen의 로컬 `personalizedPoints` 호출을 응답 값 표시로 교체 |
| `campaigns.js applyCampaign(id)` | `POST /v1/campaigns/{id}/apply` | `{success:true}` → `{seeding}` — 성공 판정 유지 |
| `seedings.js getSeedings()` | `GET /v1/me/seedings` | 객체 맵 반환 유지 시 클라에서 `campaignId` 키잉 |
| `seedings.js upsertSeeding(id, patch)` | 목적별 API로 분해: 주소=`/seedings/{id}/address` · 연장=`/extend` | 임의 patch 금지(H6) |
| `seedings.js setSeedingStatus(id, s)` | 전이별 API: receive/cancel/review — 유저 가능 전이만 | 그 외 전이는 클라 경로 없음 |
| `reviews.js fetchCampaignReviews(id)` | `GET /v1/brand/campaigns/{id}/reviews` | |
| `reviews.js fetchFgiStats/fetchCountryStats/fetchWeeklyFinding` | `GET /v1/brand/campaigns/{id}/dashboard` | 3함수 → 1호출, 클라에서 분배 |
| `evaluations.js getEvaluations()` | `GET /v1/brand/campaigns/{id}/reviews` (evaluation 조인) | 전역 맵 → 캠페인 스코프 |
| `evaluations.js saveEvaluation(reviewId, patch)` | `PUT /v1/brand/reviews/{reviewId}/evaluation` | |
| `referral.js referralCodesFor(profile)` | `GET /v1/me/referral-codes` | 로컬 생성식 폐기 — 서버 발급분 표시 |
| `offers.js getOffers()` | `GET /v1/me/offers` | 캠페인 조인·만료 판정 서버 이관 |
| `offers.js respondToOffer(id, status, reason)` | `POST /v1/offers/{id}/respond` | |
| (신규) 리뷰 제출 화면 | `POST /v1/seedings/{id}/review` + `/fgi-response` | Phase 1은 setSeedingStatus(reviewing)로 우회하던 경로 |
| (신규) 게스트 로그인 `GUEST_AUTH_DATA_JSON` | `POST /v1/auth/guest` | H1 — 하드코딩 JWT 삭제 |
| `points.js` / `missionLogic.js` | API 아님 — **표시용으로 유지** | 서버 응답(`personalized`, `daysLeft`, ledger `detail`)이 정본 |

---

## 5. 비기능 요구

### 5-1. 레이트리밋
§1-5 표가 정본. 구현: 토큰 버킷(Redis), 응답 헤더 `X-RateLimit-Remaining`·`Retry-After`. 초대 코드 실패 카운터는 IP+계정 이중 키.

### 5-2. 캐시 (동접 3천 대비)
| 지점 | TTL/방식 | 비고 |
|---|---|---|
| `GET /v1/campaigns` 목록 공통부 | 서버 캐시 60s (CDN 불가 — 인증 응답) | `personalized`는 응답 조립 시 G-스코어만 조회해 캐시본에 합성. `remaining`은 60s 지연 허용(정확 판정은 apply 원자 차감) |
| `GET /v1/campaigns/{id}` | 서버 캐시 60s, O1/O2 쓰기 시 무효화 | |
| 브랜드 dashboard | 5분 (수동 입력 데이터 — 실시간성 무의미, `capturedAt` 표기) | |
| 홈 피드(리뷰 그리드, D23) | 5분 + 썸네일 CDN | |
| `GET /v1/me/*` | 캐시 금지 (`Cache-Control: no-store`) | PII·상태 |

### 5-3. 관측성
- **구조화 로그**: 전 요청 `traceId, creatorId(해시), route, status, latency` — 토큰·PII·주소·코드 평문 로그 금지(M8 취지). 에러 응답의 `traceId`로 역추적.
- **감사 로그**: §3 audit_log — 상태 전이·원장·ops 쓰기 100%.
- **메트릭**(북극성·가드레일 직결): 루프 완료율(received→done), 수령→업로드 소요 p50(목표 ≤14일), apply 성공/`SEEDING_QUOTA_EXHAUSTED` 비율, 자동 확정률(D24), 429 발생률, 초대 코드 실패율(공격 감지), 원장 지급 오류율(0 목표), T8 배치 처리 지연.
- **알람**: 초대 코드 실패 급증(무차별 대입), 쿼터 음수(불변식 위반 — 즉시 페이지), 멱등 키 충돌 급증, 5xx > 1%.
- **배치 잡**(전부 멱등): 주소 48h 자동 취소(T4) · no_show 확정(T8, D+16, timerPaused 제외) · 오퍼 만료 · Strike 소멸(연속 3완주) · FGI 집계.

---

부록: 본 명세의 수치 출처 — `CURATED_MIN_G=60`·배수 4단계·10P 반올림·`GRACE_MULTIPLIER=0.7`·`G_DELTA{+3,+2,+1,−10}`·동시한도 1/2/3·`canAutoConfirm` = `screens/TryScreen/points.js` / `UPLOAD_DAYS=14`·`GRACE_DAYS=2`·`EXTENSION_DAYS=7`·`ADDRESS_DEADLINE_HOURS=48` = `screens/ActivityScreen/missionLogic.js` / 상태 enum 8종 = `api/seedings.js SEEDING_STATUS` / 시작 G50 = `api/creators.js` / 품질 보너스 +20%·Base 100~500·초대 7일·Strike 정책 = v2 설계 §4·§3-1.
