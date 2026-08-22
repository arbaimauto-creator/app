# 시딩 퍼널 완성 — 서버 동기화 보강 설계

2026-08-22 승인됨. 범위: greyd 앱(`app-master`) + greyd-ops 서버(`Downloads\greyd-ops`).

## 배경 / 문제

퍼널 조사(2026-08-22) 결과 핵심 구멍 4개:

1. **배송지가 서버로 전송되지 않는다** — `AddressModal`이 로컬 `seedingsV2`에만 저장. 운영이 주소를 볼 수 없어 실제 배송 불가.
2. **FGI·첫인상 설문이 전량 로컬** — 시딩 앱의 핵심 산출물이 폰에만 남는다.
3. **전송 실패분이 소실된다** — `safePost` 실패는 로그만 남김. 취소(cancelled) 전이는 아예 전송 코드가 없어, `/seedings` 머지 시 서버 상태로 되살아날 수 있다.
4. **릴리스 빌드에 운영 시뮬 치트가 열려 있다** — devAdvance(상태 롱프레스)가 `__DEV__ || TEST_GUEST_ENTRY` 게이트인데 `TEST_GUEST_ENTRY=true`로 배포 중. 또 피드 영상 업로드 경로는 FGI 가드·`opsUpload` 없이 `REVIEWING` 전이(ReviewLinkSubmit과 불일치).

전제 조건 문제: 프로덕션 greyd-ops는 **다른 작업 환경(추정: 맥북)에서 CLI 배포**되어 로컬 `Downloads\greyd-ops`보다 최신이다(프로덕션 DB에 enrichment·appStrikes 등 로컬 스키마에 없는 컬럼 + 데이터 8,500여 건). 로컬에서 그대로 배포하면 데이터 손실(`prisma db push` 경고로 확인됨).

## 결정 사항

### 0. 서버 최신 소스 동기화 (선행 작업)

- Vercel API로 현재 프로덕션 배포의 소스 파일을 내려받는 스크립트(`scripts/pull-deployed-source.mjs`)를 작성한다. **Vercel 토큰을 다루므로 사용자가 직접 실행**한다 (자동 실행은 안전장치로 차단됨).
- 내려받은 소스를 로컬 git의 `deployed-snapshot` 브랜치로 커밋 → `main`과 diff → 병합 커밋 생성 → **origin push**. 이후 이 git 저장소를 단일 진실로 삼는다.
- 병합 기준: 충돌 시 배포본(신규 콘솔 기능) 우선, 로컬만 있는 모바일 라우트(`/api/mobile/seedings` 등)는 유지.
- 협업 규칙: 다른 환경(맥북)은 작업 전 `git pull` — 사용자에게 안내.
- 검증: 병합 후 `prisma db push` 드라이런에서 데이터 손실 경고 0건이어야 배포 가능.

### 1. 배송지 서버 전송

**서버**
- 스키마: `Match`에 `shippingAddress Json?` 컬럼 추가 (추가 전용).
- 라우트: `POST /api/mobile/address` — Bearer 토큰(AppSession) 인증. 입력 `{campaignId, name, phone, addr1, addr2?, zip}`. 토큰의 influencerId + campaignId로 Match를 찾아 `shippingAddress` 저장. Match 없으면 404 `{error:'no_match'}`.
- 콘솔: 시딩(매치) 상세에 배송지 표시 1곳 추가 (읽기 전용).

**앱**
- `AddressModal` 저장 시 현행 로컬 저장 유지 + `opsOutbox.enqueue('address', campaignId, payload)`.

### 2. FGI 설문 서버 수집

**서버**
- 스키마: 새 모델 `FgiResponse` — `id, campaignId, influencerId, quant Json(정량 4문항), fairPriceUsd Int?, priceCapUsd Int?, competitor String?, pros String, cons String, extraAnswers Json?, firstImpression Json?, profileSnapshot Json, usageDays Int?, createdAt`. `@@unique([campaignId, influencerId])` — 재제출은 upsert.
- 라우트: `POST /api/mobile/fgi` — Bearer 인증, upsert.

**앱**
- `FgiSurvey` 제출 시 현행 로컬 저장 유지 + 큐 전송. `firstImpression`이 로컬에 있으면 페이로드에 동봉 (첫인상만 따로 전송하지 않는다 — FGI 제출이 유일한 전송 시점).

### 3. 전송 실패 재시도 큐 (`opsOutbox`)

- `api/opsOutbox.js` 신설. 저장: Preference 키 `opsOutboxV1`, 배열 `[{id, kind, campaignId, path, body, tries, lastTriedAt}]`.
- 규칙:
  - 같은 `(kind, campaignId)` 항목은 최신 것으로 교체 (주소 수정 재제출 등).
  - 플러시 시점: ① 부팅 완료(nav-ready 후 지연 3초), ② Activity 화면 진입, ③ 새 항목 enqueue 직후.
  - 항목당 최대 5회 시도, 실패 간 지수 백오프(1·2·4·8분). 5회 초과분은 큐에 보관만 하고 자동 시도 중단 (주간 수동 브리지 백업 경로 유지).
  - 401 응답은 재시도하지 않고 보관 (토큰 문제 — 재인증 후 수동 플러시).
  - Preference 접근은 `prefSafe` 사용 (iOS 무응답 방어).
- 전환 대상: `opsReceived`, `opsUpload`, 신규 `address`·`fgi`, 신규 `cancel`.
- **취소 전송 추가**: 서버 `POST /api/mobile/cancel` `{campaignId}` → Match 상태를 취소로 기록. 앱 취소 액션에서 enqueue.

### 4. 릴리스 치트 차단 + 경로 정합

- `devAdvance` 게이트를 `__DEV__` 전용으로 변경 (`TEST_GUEST_ENTRY` 분리 — 게스트 입장은 TestFlight 테스트용으로 유지).
- `AddingNewVideoScreen`의 campaignId 경로: `fgiSurvey` 없으면 FgiSurvey로 우회시키고, `REVIEWING` 전이 시 `opsUpload`(큐 경유) 호출 — ReviewLinkSubmit과 동일 규칙으로 통일.

## 오류 처리 원칙

- 서버 전송 실패는 사용자 흐름을 절대 막지 않는다 (로컬 우선, 큐 재시도).
- 서버 4xx(401 제외)는 재시도해도 낫지 않으므로 2회 후 보관 처리.
- 서버 라우트는 기존 `/api/mobile/*` 패턴(파서·인증 헬퍼 `lib/mobile/auth.ts`) 재사용.

## 테스트

- 서버: vitest — address/fgi/cancel 라우트 (인증 실패·Match 부재·정상·upsert).
- 앱: Jest — opsOutbox 단위(교체·백오프·401 보관), FgiSurvey 페이로드 구성.
- 통합: 에뮬레이터에서 퍼널 왕복(신청→주소→수령→FGI→제출) + 비행기 모드로 큐 적재→해제 후 플러시 확인.

## 배포·전달

- 서버: 스키마 추가 전용 확인(db push 경고 0) 후 `vercel --prod` (병합된 최신 소스 기준).
- 앱: 코드 완성 + 에뮬레이터 검증까지 이번 라운드. TestFlight 반영은 빌드 수단 확보 후(맥북 Xcode 또는 9/1 GitHub·EAS 무료 초기화) 빌드 221+에 포함.

## 이번 라운드에서 하지 않는 것

- no_show 자동 전이, 포인트/G-스코어 서버 이관, 서버 푸시 알림, 리뷰 지표 목업 교체, greydAppId-계정 매핑(3단계), Sentry DSN 교체.
