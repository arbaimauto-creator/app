# 공동구매 개발 명세 — 앱 구현 + ops 서버 API 계약 (2026-09-30)

> 대표 결정(9/30): **토스페이먼츠**, 판매 국가 **한국·일본**. 개설은 **브랜드 또는 아르바임이 인플루언서(호스트)를 지정**해서 연다.
> 호스트는 영상을 올리고, 브랜드 상세페이지로 쇼핑몰처럼 보인다. 마감 뒤 **결제된 고객 명단(이름·연락처·주소·금액 등)이 브랜드로** 넘어가고,
> **브랜드가 직접 택배를 보내고 송장번호를 넣으면** 구매자가 배송을 추적한다.
>
> 이 문서는 `groupbuy-plan-2026-09-30.md`(기획)의 결제 방식을 위 결정으로 확정한 **개발 기준 문서**다.
> 앱은 이 브랜치에 구현됐다. **ops 서버 API는 아직 없다** — §4가 서버 개발자가 만들 계약이다.

---

## 1. 전체 흐름

```
[개설]   브랜드(앱 브랜드 셸) 또는 아르바임(ops 콘솔)이 공동구매 생성 + 호스트 지정      → PENDING_HOST
[수락]   호스트(인플루언서)가 앱에서 수락 · 한마디 · 자기 리뷰 영상 붙이기              → SCHEDULED / OPEN
[모집]   구매자: 상세(브랜드 상세페이지 + 호스트 영상) → 주문서(옵션·수량·배송지·동의)
          → 토스 빌링 창에서 카드 등록 = "결제 예약"(돈은 안 나감)                   주문 RESERVED
[마감]   마감 시각에 서버 잡이 판정
          ├ 예약 수량 ≥ 최소 수량 → 등록 카드로 일괄 결제                          → CONFIRMED (주문 PAID / PAYMENT_FAILED)
          └ 미달                  → 결제 없이 무효                                 → FAILED (주문 VOIDED)
[명단]   CONFIRMED 이후에만 브랜드에 결제 완료 주문 명단 공개 (CSV 내보내기)
[배송]   브랜드가 택배사 + 송장번호 입력                                          → 주문 SHIPPED, 공동구매 SHIPPING → 전부 발송 시 DONE
[추적]   구매자 앱 "내 공동구매"에서 택배사 추적 페이지로 이동
```

결제 방식을 "카드 등록 후 마감 결제(토스 빌링)"로 한 이유: 미달이면 결제 자체가 없어 **환불·수수료 손실이 없고**, 모집 기간 제한도 없다(카드 승인 보류는 최대 7일).

---

## 2. 앱 구현 (이 브랜치)

| 역할 | 화면 (라우트) | 파일 |
|---|---|---|
| 구매자 | 홈 공동구매 레일 | `screens/GroupBuyScreen/GroupBuyRail.js` → `CuratedHome` |
| 구매자 | 상세 = 쇼핑몰형 페이지 (`GroupBuy`, 딥링크 `groupbuy/:code`) — 이미지 갤러리, 초 단위 마감 시계, 목표까지 남은 수량, 참여자 수·최근 참여, 고정 탭(상세정보·호스트·구매 안내), 상세 이미지 접기/펼치기, 구매 4단계·배송·교환/반품·판매자·FAQ, 하단 가격 바, 오픈 알림 받기, 공유 | `GroupBuyDetail.js` |
| 구매자 | 옵션 선택 시트(옵션·수량·남은 수량·합계) → 주문서로 선택값 전달 | `OptionSheet.js` |
| 구매자 | 주문서 (`GroupBuyOrder`) | `GroupBuyOrder.js` |
| 구매자 | 토스 카드 등록 웹뷰 (`GroupBuyBilling`) | `GroupBuyBilling.js`, `Components/utils/paymentSchemes.js` |
| 구매자·호스트 | 내 공동구매 — 참여 / 내가 여는 (`MyGroupBuys`) | `MyGroupBuys.js` → 마이 탭 진입 |
| 호스트 | 제안 수락·한마디·영상 붙이기·공유 링크 (`HostGroupBuy`) | `HostGroupBuy.js` |
| 브랜드 | 공동구매 목록·열기 (`BrandGroupBuys`, `BrandGroupBuyCreate`) | `BrandGroupBuys.js` → 브랜드 마이 진입 |
| 브랜드 | 주문 명단·CSV·송장 입력 (`BrandGroupBuyOrders`) | `BrandGroupBuyOrders.js` |
| 공통 | API·상태·검증·CSV·토스 복귀 URL | `api/groupBuys.js` |
| 공통 | 택배사 코드·추적 URL (KR 7곳 + JP 3곳) | `Components/utils/couriers.js` |
| 개발 | 모의 서버 (기기 안) | `api/groupBuysMock.js` |

**플래그** (`Components/Constants/Features.js`)
- `GROUP_BUY` — 진입점 노출. 지금은 개발 빌드만(`__DEV__`). ops API 배포 후 `true`.
- `GROUP_BUY_MOCK` — 모의 서버. 개발 빌드만. `scripts/verify-release.js`가 릴리스에서 켜져 있으면 막는다.

**개발 빌드에서 전 과정 눌러 보기** (모의 서버, 실제 결제 없음)
1. 홈 → 공동구매 레일 → "민지의 수분 크림 공동구매" → 참여하기 → 주문서 → "(테스트) 카드 등록 건너뛰고 참여하기"
2. 마이 → 내 공동구매 → "내가 여는 공동구매" → 선크림 일본 공동구매 → 수락 · 영상 붙이기
3. 판매자 모드 → 마이 → 공동구매 관리 → 클렌징 오일 → "(테스트) 지금 마감 처리" → 명단 공개 → 택배사·송장 입력
4. 구매자 쪽 내 공동구매에서 발송·배송 조회 확인

**테스트**: `__tests__/groupbuys.test.js`(로직·API 경로·모의 서버 전 과정 45개), `__tests__/groupbuy-screens.test.js`(화면 스모크 5개).

**함께 고친 기존 버그**: 마이 탭 "판매자 모드 전환" 버튼이 정의되지 않은 `switchToSellerMode`를 참조해, 판매자 계정은 마이 탭이 그려질 때 오류가 났다 → `goSellerMode`로 연결.

**정리한 것**: 2026-09-16 "참여 희망" 방식의 `Components/GroupBuyScreen.js`와 `api/tracking.js`의 공동구매 함수, 관련 `GB_*` 문구를 제거했다(새 흐름으로 대체).

---

## 3. 상태

### 공동구매 `GroupBuy.state`
| 값 | 뜻 | 구매자 노출 |
|---|---|---|
| `PENDING_HOST` | 개설됨, 호스트 수락 대기 | 비공개 (호스트·브랜드만) |
| `SCHEDULED` | 수락됨, 시작 전 | 레일·상세 "오픈 예정" |
| `OPEN` | 모집 중 | 참여 가능 |
| `CLOSED` | 마감, 판정·결제 진행 중 | "마감 · 결제 진행 중" |
| `CONFIRMED` | 성사, 결제 완료 → 명단 공개 | |
| `SHIPPING` | 일부 발송 | |
| `DONE` | 결제 완료 주문 전부 발송 | |
| `FAILED` | 최소 수량 미달, 결제 없음 | |
| `CANCELLED` | 브랜드·운영 취소 또는 호스트 거절 | |

### 주문 `GroupBuyOrder.state`
`BILLING_PENDING`(주문서 제출, 카드 등록 전) → `RESERVED`(빌링키 발급 = 결제 예약) → `PAID` / `PAYMENT_FAILED` → `SHIPPED`.
예외: `VOIDED`(미달·공동구매 취소로 결제 안 함), `CANCELLED`(마감 전 구매자 취소, 또는 마감 때 카드 미등록 주문).

- 판정 수량 = `RESERVED` 주문 수량 합. `BILLING_PENDING`은 세지 않는다.
- 마감 결제 실패(`PAYMENT_FAILED`)는 성사 여부를 뒤집지 않는다. 실패 건은 명단에서 빠지고 구매자에게 안내한다.

---

## 4. ops 서버 API 계약 (`/api/mobile/*`, 기존 Bearer 인증)

앱은 `api/groupBuys.js`의 경로·본문을 그대로 쓴다. 응답 필드 정규화는 `normalizeGroupBuy`/`normalizeOrder` 참고.

### 4-1. 객체

```jsonc
// GroupBuy
{
  "code": "gb-1a2b3c4d",              // 필수. gb- + 소문자 hex 8자리 (딥링크·추적 코드)
  "title": "...", "state": "OPEN",
  "openedBy": "BRAND" | "ARBAIM",
  "brand": { "id": "...", "name": "..." },
  "host": { "id": "...", "handle": "minji.skin", "name": "...", "avatarUrl": "...", "note": "호스트 한마디" },
  "product": { "id": "<SellerProduct id>", "name": "...", "imageUrl": "/api/files/..", "images": ["/api/files/..", "..."],  // 갤러리(없으면 imageUrl 한 장)
               "description": "...", "listPrice": 28000 },
  "country": "KR" | "JP", "currency": "KRW" | "JPY",
  "price": 19900, "shippingFee": 3000,
  "minQuantity": 30,                   // 0 = 최소 없음
  "maxQuantity": 300,                  // 0 = 제한 없음
  "perUserMax": 5,
  "options": ["50ml", "80ml"],         // 가격 차이 없는 단일 옵션 목록 (1차)
  "detailImages": ["https://..."],     // 브랜드 상세페이지 이미지(세로로 긴 이미지 여러 장)
  "videos": [{ "videoId": "<앱 서버 video _id>", "thumbnailUrl": "...", "caption": "..." }],
  "startsAt": "ISO", "endsAt": "ISO", "shipBy": "ISO|null",
  "reservedQuantity": 21,              // RESERVED(+PAID/SHIPPED) 수량 합
  "orderCount": 10,
  "myRole": "BUYER" | "HOST" | "BRAND",
  "recentBuyers": [{ "name": "김**", "quantity": 2, "at": "ISO" }],   // 최근 참여 최대 5건, 이름은 서버가 가린다(첫 글자 + **)
  "watching": false,                   // 요청자가 오픈 알림을 신청했는지
  "notices": { "shipping": "브랜드 배송 안내", "returns": "교환·반품·환불 안내" },  // 브랜드 입력, 비면 앱 기본 문구
  "myOrders": [ /* 요청자 본인의 GroupBuyOrder */ ]
}

// GroupBuyOrder
{
  "id": "...", "groupBuyCode": "gb-..", "groupBuyTitle": "...",
  "state": "RESERVED", "quantity": 2, "option": "50ml",
  "unitPrice": 19900, "shippingFee": 3000, "total": 42800, "currency": "KRW",
  "recipient": { "name": "", "phone": "", "postalCode": "", "address1": "", "address2": "", "memo": "" },
  "shipment": { "courier": "CJ", "trackingNumber": "123456789012", "shippedAt": "ISO" } | null,
  "createdAt": "ISO", "paidAt": "ISO|null", "chargeAt": "ISO(=endsAt)", "failureReason": "EXCEED_MAX_AMOUNT|..."
}
```

택배사 코드: `CJ HANJIN LOTTE EPOST LOGEN CU GS`(KR), `YAMATO SAGAWA JAPANPOST`(JP), `OTHER`. 송장번호는 공백·하이픈 제거 후 대문자 영숫자 6~30자.

### 4-2. 구매자

| 메서드 | 경로 | 본문 / 응답 | 규칙 |
|---|---|---|---|
| GET | `/groupbuys?scope=live` | → `{ groupBuys: GroupBuy[] }` | `SCHEDULED`·`OPEN`만. 요청자 국가 우선 정렬 권장 |
| GET | `/groupbuys/:code` | → `{ groupBuy }` | `PENDING_HOST`는 호스트·브랜드 외 404 |
| POST | `/groupbuys/:code/orders` | `{ requestId, quantity, option, recipient, agreeCharge, agreeThirdParty }` → `{ order, billingUrl }` | 아래 검증. **`requestId` 멱등**(같은 값이면 같은 주문·같은 URL) |
| POST | `/groupbuys/:code/watch` | `{ on: bool }` → `{ watching }` | 오픈 예정(`SCHEDULED`) 알림 신청/해제. 시작 시각에 신청자에게 푸시 |
| POST | `/groupbuy-orders/:id/cancel` | → `{ order }` | 본인·`OPEN`·`BILLING_PENDING|RESERVED`만. 빌링키 폐기 |
| GET | `/me/groupbuy-orders` | → `{ orders }` | 최신순 |

주문 생성 검증(서버가 정본): `OPEN`이고 기간 안, `quantity ≥ 1`, 본인 활성 주문 수량 합 + quantity ≤ `perUserMax`, `maxQuantity`가 있으면 잔여 수량 이내, 옵션이 목록 안, 받는 분 필수값, 두 동의 true.
에러 본문 `{ error }`: `closed`(409), `sold_out`(409), `per_user_max`(422), `agree_required`(422). 가격은 **서버가 공동구매 레코드로 계산**한다(앱 값 불신).

### 4-3. 토스 빌링 (카드 등록)

`billingUrl`은 ops가 호스팅하는 페이지여야 한다: **`<ops origin>/portal/groupbuy-billing/<orderId>?t=<단기 토큰>`** (앱이 이 접두사만 연다).

1. 그 페이지가 토스 결제위젯/SDK의 **빌링 인증**(`requestBillingAuth`, 카드)을 띄운다. `customerKey`는 사용자별 불투명 값(추측 불가 UUID).
   `successUrl` / `failUrl`은 ops 자신의 콜백.
2. success 콜백: `authKey`, `customerKey`로 서버에서 **빌링키 발급** API(`POST /v1/billing/authorizations/issue`, 시크릿 키 Basic 인증) 호출 →
   빌링키를 **암호화 저장**, 주문 `RESERVED`.
3. 끝나면 **`<ops origin>/portal/groupbuy-billing/done?result=success|fail&orderId=<id>[&code=<토스 에러코드>]`** 로 리다이렉트. 앱은 이 URL을 잡아 웹뷰를 닫는다.
4. 카드사 앱 전환(ISP·앱카드, Android `intent://`)은 앱이 웹뷰 밖으로 연다(`paymentSchemes.js`). iOS `Info.plist`의 `LSApplicationQueriesSchemes`에 카드사 스킴 목록 추가 필요(토스 문서의 목록).

### 4-4. 마감 판정·결제 잡 (`groupbuy.settle.sweep`)

- 주기: **5~15분**(현재 ops 크론은 하루 1회 → 마감 시각 정밀도를 위해 단축 필요). 멱등.
- `SCHEDULED` & `startsAt ≤ now` → `OPEN`.
- `OPEN` & (`endsAt ≤ now` 또는 `maxQuantity` 도달) → `CLOSED` → 판정:
  - `BILLING_PENDING` 주문 → `CANCELLED`.
  - `RESERVED` 수량 합 ≥ `minQuantity`(0이면 1건 이상): 각 주문을 빌링키로 **자동결제 승인**(`POST /v1/billing/{billingKey}`, `orderId`=주문 id, 멱등 키 헤더) → `PAID` / `PAYMENT_FAILED(failureReason)`. 결제가 끝나면 `CONFIRMED`.
  - 미달: `RESERVED` → `VOIDED`, `FAILED`.
  - 판정 후 빌링키는 폐기(재사용하지 않는다).
- 푸시: 성사(결제 완료)·결제 실패·미달 취소를 구매자에게, 결과 요약을 호스트·브랜드에게. 기존 612(`CAMPAIGN_GROUPBUY_REACHED`)를 "성사"로 재사용하고 나머지는 새 번호.

### 4-5. 호스트

| 메서드 | 경로 | 본문 | 규칙 |
|---|---|---|---|
| GET | `/me/hosted-groupbuys` | → `{ groupBuys }` | 요청자가 호스트인 것 전부(취소 포함) |
| POST | `/groupbuys/:code/host` | `{ accept: bool }` 또는 `{ note }` | accept는 `PENDING_HOST`에서만. 수락 → 시작 전이면 `SCHEDULED`, 지났으면 `OPEN`. 거절 → `CANCELLED`. note ≤ 300자, 운영 검수 권장 |
| POST | `/groupbuys/:code/videos` | `{ videoId, thumbnailUrl, caption }` 또는 `{ videoId, remove: true }` | 호스트 본인 영상만(앱 서버 video 작성자 = 호스트 확인), 최대 10개, `PENDING_HOST·SCHEDULED·OPEN`에서만 |

호스트 지정: 개설 요청의 `hostHandle`을 ops `Influencer`의 핸들(인스타 아이디 또는 greyd 닉네임)로 찾는다. 없으면 `{ error: 'host_not_found' }`(422).

### 4-6. 브랜드 (판매자 앱 계정 = ops `SellerAppAccess`)

| 메서드 | 경로 | 본문 / 응답 | 규칙 |
|---|---|---|---|
| GET | `/brand/groupbuys` | → `{ groupBuys }` | 요청 브랜드 소유만 |
| POST | `/brand/groupbuys` | `{ requestId, title, productId, hostHandle, country, currency, price, shippingFee, minQuantity, maxQuantity, perUserMax, options, detailImages, startsAt, endsAt, shipBy }` → `{ groupBuy }` | `productId`는 이 브랜드의 `PUBLISHED` SellerProduct이고 `country`가 배송 가능 국가에 있어야 함. 가격 ≤ 정가, 기간 ≤ 30일. `requestId` 멱등. 생성 상태 `PENDING_HOST` + 호스트 푸시 |
| POST | `/brand/groupbuys/:code/cancel` | → `{ groupBuy }` | `PENDING_HOST·SCHEDULED·OPEN`에서만. 예약 전부 `VOIDED`·빌링키 폐기 |
| GET | `/brand/groupbuys/:code/orders` | → `{ released, summary: {reserved, paid, failed, shipped}, orders }` | **`released`는 `CONFIRMED·SHIPPING·DONE`에서만 true, 그 전엔 `orders: []`**. 공개 주문은 `PAID·SHIPPED`만 |
| POST | `/brand/groupbuy-orders/:id/shipment` | `{ courier, trackingNumber }` → `{ order }` | 명단 공개 상태·`PAID|SHIPPED` 주문만. 수정 허용. 전부 발송되면 `DONE`. 구매자에게 발송 푸시 |

아르바임 운영 개설(`openedBy: ARBAIM`)은 ops 콘솔에서 같은 모델로 만든다(브랜드 지정 + 호스트 지정).

### 4-7. 데이터 모델 (Prisma 초안)

```
GroupBuy        code(unique) title state openedBy brandId campaignId? sellerProductId hostInfluencerId hostNote
                country currency price shippingFee minQuantity maxQuantity perUserMax options(Json) detailImages(Json)
                startsAt endsAt shipBy? createdBy requestId(unique) settledAt? incentiveBps
GroupBuyVideo   groupBuyId videoId thumbnailUrl caption sort
GroupBuyOrder   groupBuyId buyerInfluencerId state quantity option unitPrice shippingFee total currency
                recipientName recipientPhone postalCode address1 address2 memo  (← 개인정보: 암호화 컬럼 권장)
                agreeChargeAt agreeThirdPartyAt termsVersion requestId(unique per buyer)
                tossCustomerKey billingKeyEnc? paymentKey? paidAt? failureReason?
                courier? trackingNumber? shippedAt?
```
기존 `GroupBuy`·`GroupBuyJoin`(9/16 참여 희망)은 새 모델로 대체한다. 운영 데이터가 없다면 마이그레이션 없이 교체.

---

## 5. 개인정보·법

- **제3자 제공 동의**(주문서 필수 체크): 항목 이름·연락처·주소·주문 내역 / 제공받는 자 = 판매 브랜드 / 목적 = 배송 / 보유 = 배송 완료 후 3개월(문구 법무 검토).
- 명단은 **결제 완료 후에만** 브랜드에 공개. 브랜드 명단 조회·CSV 다운로드를 감사 로그로 남긴다. 호스트는 개인정보를 보지 못하고 집계 숫자만 본다.
- 결제 동의 문구에 "마감(일시) 때 최소 수량 충족 시 등록 카드로 결제, 미달이면 결제 없음"을 명시(주문서에 구현됨).
- 호스트 게시물 광고 표기 안내(호스트 화면에 구현됨), 상세 화면에 "호스트는 판매 수수료를 받음" 고지(구현됨).
- 판매자 정보·청약철회·교환반품 안내는 상세 하단 고지 영역에 사업자 정보가 확정되면 추가.

---

## 6. 확인·결정이 남은 것

1. **토스 자동결제(빌링) 계약** — 일반 결제와 별도 심사·계약이 필요한지, 수수료.
2. **일본 판매를 토스 빌링으로 할 수 있는지** — 일본 발행 카드·엔화(JPY) 결제 지원 여부를 토스에 확인해야 한다. 안 되면 JP는 Stripe(카드 승인 보류, 모집 5일 이내)로 서버에서 분기한다.
   앱은 `billingUrl`만 여는 구조라 **결제사가 바뀌어도 앱 수정이 거의 없다**(복귀 URL 규칙만 같으면 됨).
3. 토스 빌링 페이지·콜백·잡을 올릴 ops 배포 승인, `TOSS_SECRET_KEY`·`TOSS_CLIENT_KEY` 환경변수.
4. 옵션별 가격 차이가 필요한지(지금은 가격 동일 옵션만).
5. 브랜드 상세페이지 이미지 업로드 — 지금은 https URL 입력. ops 판매자 포털에 업로드 필드를 두면 URL이 자동으로 채워지게.
6. 호스트 인센티브(공동구매 귀속 판매 N%) 정산 연결 — 기존 `IncentiveGrant`에 `groupBuyId`로 연결(요율 미확정).
