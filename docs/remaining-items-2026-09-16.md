# 남은 조각 일괄 구현 (2026-09-16 밤) — "다 만들어줘"

앞선 정리(docs/secondary-use-and-groupbuy-2026-09-16.md "아직 없는 것", docs/p3-status-2026-09-16.md 미착수)에서
**서버 권한·Stripe 키 없이 만들 수 있는 것은 전부** 여기서 구현했다. 남은 것은 맨 아래 "여전히 막힌 것".

## 1. 추적 코드 입구 (딥링크 `?tc=`)

| 조각 | 위치 |
|---|---|
| 코드 파싱·판정·기억 | `Components/utils/tracking.js` — `ra-`/`gb-` + hex 8자리만 인정, 기기에 `{code, at}` 저장, **귀속 7일**(제안값) 안에서만 유효 |
| 링크 입구 | `Components/utils/linking.js` — 초기 URL·다이나믹 링크·실행 중 URL 세 경로 모두 `captureTrackingCode` 먼저(경로 화이트리스트와 무관), 쿼리를 뗀 뒤 화이트리스트 검사 |
| 새 경로 | `groupbuy/:code` → `GroupBuy` 화면 (항상 허용). `products/:id`는 `FEATURES.COMMERCE`가 켜진 빌드에서만 |
| 주문서 | `Components/OrderSheetScreen.js` — 파라미터 코드 > 딥링크 코드 순으로 주문 본문에 실음. 결제 성공 콜백에서 코드를 지워 다음 주문에 붙지 않게 |
| 클릭 집계 | `api/tracking.js` `reportTrackingClick` → ops `POST /api/mobile/track-click`. 기기당 코드당 하루 1회 |

링크 형식: `https://greyd.app/videos/<id>?tc=ra-1a2b3c4d`, `greyd://groupbuy/gb-1a2b3c4d`(공동구매는 경로 자체가 코드).

## 2. 공동구매 참여 화면

`Components/GroupBuyScreen.js` (라우트 `GroupBuy`, `api/tracking.js` `getGroupBuy/joinGroupBuy/cancelGroupBuyJoin`).
- 진행률 = (결제 수량 + 참여 희망 수량) / 최소 수량. 남은 일수, 대상 국가, 상태 배지.
- **결제 전**(커머스 꺼짐 또는 상품 미발행): "참여 희망 남기기" → ops `POST /api/mobile/groupbuys/:code/join` (수량 1~99, 내 국가). 희망 취소 가능.
- **결제 후**(`FEATURES.COMMERCE` + `productRef`): "공동구매 참여 · 결제" → 주문서에 `trackingCode=gb-…`를 실어 Stripe 체크아웃.
- 문자열 `GB_*` kor/eng.

## 3. 서버 푸시 (ops → FCM v1)

- 앱: `api/opsBridge.js` `opsRegisterPushToken` — 메인 화면이 FCM 토큰을 얻는 자리에서 ops `POST /api/mobile/push-token`에 등록. 앱 서버 등록은 그대로.
- 코드(앱 `Codes.NOTIFICATION_CODE` = ops `lib/push/codes.ts`):

| 코드 | 키 | 언제 | 탭하면 |
|---|---|---|---|
| 609 | CAMPAIGN_CONSENT_REQUESTED | 브랜드가 2차 활용 요청 | 동의 화면 |
| 610 | CAMPAIGN_FGI_SELECTED | FGI 선정 | 활동 탭 |
| 611 | CAMPAIGN_INCENTIVE_APPROVED | 인센티브 승인(포인트 적립) | 2차 활용 현황 |
| 612 | CAMPAIGN_GROUPBUY_REACHED | 공동구매 최소 수량 도달 | 2차 활용 현황 |
| 613 | CAMPAIGN_FGI_NO_SHOW | FGI 노쇼 처리 | 활동 탭 |

- 수신은 기존 `Components/services/pushNotifications.js`의 6xx 경로(`campaignPushContents`)를 그대로 탄다. 문구 `NOTI_CAMPAIGN_*` kor/eng, 딥링크는 `NotificationNomalizer` `pageOf`.
- 발송에는 ops 환경변수 `FCM_SERVICE_ACCOUNT_JSON`(Firebase 서비스 계정 JSON)이 필요하다. 없으면 ops가 로그만 남긴다.

## 4. FGI 노쇼 자동화 (ops)

세션 시각 + 2시간이 지나면 잡 `fgi.noshow.sweep`이 선정(SELECTED)·미출석 건에 `fgiNoShowAt`을 찍고 Strike 1을 더한 뒤 613 푸시. 운영이 출석을 되돌리면 노쇼도 풀린다.
앱은 `seeding.fgiNoShowAt`이 있으면 활동 탭 FGI 블록에 빨간 "노쇼 처리됨 · Strike 1" 배지를 보이고 출석 버튼을 숨긴다. (ops 크론은 하루 1회 자정이라 실제 처리는 다음 자정 — 더 촘촘히 하려면 `vercel.json` 크론 주기를 줄인다.)

## 5. P4 기반 — A/B·사용 이벤트·기능 정리 보고서

기획서 P4(추천 고도화·운영 자동화·데이터 기반 제거·A/B·기능 정리 보고서)는 파일럿 데이터가 있어야 결론이 나온다. 여기서는 **데이터가 쌓이는 배관**을 놓았다.

- `api/experiments.js`
  - `variantFor(EXPERIMENTS.X)` — ops `GET /api/mobile/config`의 실험(variants·weights)을 기기 id 해시(FNV-1a)로 결정적으로 배정. 1시간 캐시. 서버에 실험이 없거나 오프라인이면 앱 기본 variant(첫 번째).
  - `trackEvent(name, props)` — 20개 또는 30초마다 ops `POST /api/mobile/events`로 묶어 전송. 실패분은 다음 묶음에. 개인정보 없음.
  - `trackExposure/trackConversion` — `exp.<key>.exposure|conversion` 이름으로 콘솔 보고서가 집계.
- 첫 실험 `home_ranking`: `personalized`(기본, `api/recommend.js` 정렬) vs `latest`. 노출은 홈 세로 피드(`CampaignSwipeFeed`), 전환은 캠페인 신청(`CampaignDetail`).
- 앱이 쏘는 이벤트: `tc.enter`, `order.paid{attributed}`, `groupbuy.join`, `groupbuy.buy_tap`, `exp.*`.
- ops 콘솔 `/experiments`: 실험 만들기(키·variants·가중치 합 100)·시작/중지/승자 확정, 최근 30일 이벤트 이름별 건수·기기 수, 실험별 variant 노출/전환.
- "데이터 기반 제거"는 이 보고서에서 30일 사용 0건인 기능을 골라 플래그로 끄는 절차로 한다(`Components/Constants/Features.js`).

## 6. 요율 콘솔 입력 (ops)

캠페인 "앱 노출 설정" 패널에 판매 인센티브 %·공동구매 인센티브 % 입력. 저장은 `appConfig.salesIncentiveBps` / `groupBuyIncentiveBps`. 비우면 기본 3% / 5%(제안값).

## 검증

- 앱: Jest 145/145 (새 스위트 `tracking-and-groupbuy`, `experiments`), 린트 오류 0, Android 프로덕션 번들 컴파일 정상. 에뮬레이터·실기기 QA는 안 했다(실기기 없음).
- ops: 로컬 커밋 **807a603**(미푸시). `prisma generate`·`tsc`·vitest 128 통과. 스키마 추가: `Match.fgiNoShowAt`, `GroupBuy.clicks/joins`, 모델 `GroupBuyJoin`·`AppPushToken`·`Experiment`·`AppEvent`. 새 환경변수 `FCM_SERVICE_ACCOUNT_JSON`.

## 여전히 막힌 것

1. **greyd_server 권한** — `docs/server-patches/` 패치 2개(Stripe 체크아웃, 주문 귀속) 적용 대기. 이게 없으면 결제·판매 귀속·공동구매 결제는 화면만 있다.
2. **Stripe 키**, **FCM 서비스 계정 JSON**(ops 환경변수).
3. **ops 배포 승인** — 스키마 변경 누적(로컬 커밋 5개). `prisma db push` 필요.
4. **정책값**: 성과 기준, 3%/5%, 귀속 7일, 이용허락 12개월, 공동구매 최소수량·14일·국가. 코드엔 제안값.
5. **Android arm64 실기기 QA**(출시 게이트) — 기기 필요.
6. P4의 결론(추천 고도화 방향, 제거할 기능)은 파일럿 데이터가 쌓인 뒤.
