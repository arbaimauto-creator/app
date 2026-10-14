# greyd 브랜드 대시보드 — 정리 (2026-10-14)

공동구매를 진행하는 브랜드가 쓰는 화면 **하나**. 예전에 따로 부르던 "브랜드 파트너센터"·"브랜드 대시보드"는 같은 것이고,
`web/` 첫 화면이던 FGI 리포트(greyd for Brands)는 이 대시보드의 **캠페인 리포트** 메뉴로 합쳤다.
최종 목표는 ops 브랜드 포털(`ops.greyd.app/portal/brand`) 안에 이 대시보드를 넣어 브랜드 입구를 하나로 만드는 것.

## 1. 전체 구조 — 앱 · 웹 · ops

```
 [구매자 앱] [호스트 앱]              [greyd.app 웹]  /propose 상품제안서(자사몰 링크 불러오기)
      └──────┬──────┘                       │
             ▼                              ▼
 ┌──────────── ops 서버 (ops.greyd.app) — 데이터·계산의 정본 ────────────┐
 │ 공동구매·주문·결제(토스)·명단·송장·정산 조건/계산·상품 제안 접수·알림 메일 │
 └────────────────────────────────────────────────────────────────────┘
             ▲                              ▲
   [브랜드 대시보드]                  [운영 콘솔(아르바임)]
   ops /portal/brand 안으로            공동구매 개설 · 정산 조건 세팅 · 상품 제안 검토
```

## 2. 현황 (2026-10-14 실제 서버 확인)

| 항목 | 상태 | 위치 |
|---|---|---|
| 상품제안서 greyd.app/propose | ✅ 운영 | 양식 `web/public/propose/index.html` → 서버 `site-live/public/propose.html` |
| 제안서 접수 API `POST /api/public/product-proposals` | ✅ 운영 | ops (jian@arbaim.com 알림) |
| 자사몰 링크 불러오기 `GET /api/public/product-preview` | ✅ 운영 (통화·이미지 수정 `164f4da`, 쿠팡·네이버 거절) | ops `lib/proposals/productPreview.ts` |
| 구매자 공동구매 API `/api/mobile/groupbuys` | ✅ 있음(인증 필요) | ops |
| 브랜드 대시보드 화면 | ✅ 완성 · 예시 데이터 | `web/src/brand/` (요약·공동구매·주문배송·정산·상품 요청·캠페인 리포트) |
| 브랜드 API(목록·명단·송장·취소) | ✅ 구현 (배포 대기) | ops `app/api/mobile/brand/{groupbuys, groupbuys/[code]/orders, groupbuys/[code]/cancel, groupbuy-orders/[id]/shipment}` · 공용 `lib/mobile/brandGroupBuys.ts` |
| 정산 조건 세팅·월 정산 API | ✅ 구현 (배포 대기) | 공동구매별 조건(`GroupBuy.settleType·supplyPrice·feeBps…`) + 정산 기본 설정 `SettlementPolicy` · `GET /api/mobile/brand/settlements` |
| 운영 콘솔 정산 조건 입력 화면 | ✅ 구현 (배포 대기) | ops 콘솔 「공동구매 운영」(`/groupbuys`) — 공동구매별 조건 + 「정산 기본 설정」 카드(전체 기본·브랜드별) |
| 공동구매 개설 API(앱) `POST /brand/groupbuys` | ✅ 구현 (배포 대기) | 검토 대기로 만들고 운영자 승인 뒤 앱에 열림. 상품 = 앱 상품 id·주소 또는 게시된 판매자 상품 번호, 호스트 = 인스타 아이디, 기간 ≤ 30일, 원화만, `requestId` 멱등 |
| 월 정산 지급 기록 | ✅ 구현 (배포 대기) | 콘솔 「공동구매 운영 › 월 정산 지급 기록」(브랜드×달 입금일·금액) → 정산서 「지급 완료」, API `state: "PAID"`·`paidAt`·`paidAmount` |
| `web/src/brand` ↔ ops 응답 맞춤 | ✅ 반영 | `api.js`: 검토 중·반려 상태(`REVIEW`·`REJECTED`), 서버 취소 판정(`cancelable`), 정산 `due`·`open`·`paidAt`·`undecided`, 상품 요청(요청 1건 → 상품 줄), 주문 `orderNo`, ops 오류 코드 문구 |
| 상품 진행 요청 API | ✅ 구현 (배포 대기) | `GET/POST /api/mobile/brand/product-requests` → `ProductProposal(brandId)`, 콘솔 「공동구매 상품제안」에서 상태·답 |
| 대시보드 배포 | ✅ ops 안에 들어감 (배포 대기) | ops 브랜드 웹 `greyd.app/brand/app`(로그인 = 브랜드 코드 + 메일 링크) — 공동구매·주문·배송·월 정산서·상품 진행 요청·캠페인 리포트 메뉴. 별도 토큰·CORS 불필요 |

ops 코드: `rueseo92-create/greyd-ops` 브랜치 `claude/brand-dashboard-remaining`(기준 `release/ops-launch`). DB는 추가만(`SettlementPolicy`) — 배포 때 `db push` 필요.

## 3. 남은 일 (순서대로)

1. ~~**ops 브랜드 API**~~ ✅ (2026-10-14) — 목록·명단·송장·취소. ops 상태를 앱 계약 상태로 바꿔 내려 준다(아래 §ops 구현 메모).
2. ~~**정산**~~ ✅ (2026-10-14) — 공동구매마다 정산 조건(창고형 공급가 / 인스타 인플·운영 수수료율), 지급일(익월 N일), 반품 차감.
   `GET /brand/settlements`, 운영 콘솔 조건 입력 칸. 아직 정하지 않은 세 가지는 **설정값**으로 열어 둠(5번).
3. ~~**상품 진행 요청**~~ ✅ (2026-10-14) — `ProductProposal(brandId)` ↔ `GET/POST /brand/product-requests`.
4. ~~**ops 브랜드 포털에 대시보드 넣기**~~ ✅ — ops 브랜드 웹(`greyd.app/brand/app`)에 같은 화면(공동구매·주문 배송·월 정산서·상품 진행 요청)이 서버 화면으로 들어가 있고,
   「전체 보기」 메뉴에서 캠페인 리포트(FGI)·월 정산서·상품 진행 요청까지 닿는다. 로그인은 브랜드 웹 세션이라 별도 토큰·CORS 불필요.
5. **정산 조건 결정** — ops 콘솔 「공동구매 운영 › 정산 기본 설정」의 **설정값**(코드 수정 없이 바꿈).
   적용 순서: 공동구매별 조건 → 브랜드 설정(브랜드 계약) → 전체 기본 → 내장 값.

   | 항목 | 상태 | 값 |
   |---|---|---|
   | 정산 기준 | ✅ 확정 (2026-10-14) | **결제 완료** — 내장 값. 예외 브랜드·공동구매만 발송 완료로 덮어쓸 수 있음 |
   | 세금계산서 발행 방식 | ⬜ 미정 | 선택지: 매월 정산 확정 후 브랜드 역발행 · 아르바임이 수수료분 발행 · 브랜드가 지급액분 발행 · 둘 다 · 발행 없음 |
   | 배송비 차감 | ⬜ 미정 | 선택지: 차감 없음(브랜드 직접 발송, 지금 계산값) · 주문당 정액 차감. 예외 공동구매는 콘솔 정산 조건 칸에 주문당 금액 |

   미정 항목은 브랜드 화면에 「미정」, API에 `undecided: ["taxInvoice", "shipping"]`.
6. **남은 것** — ops 배포(브랜치 머지 + `db push`: `SettlementPolicy`·`SettlementPayout` 표 추가), 세금계산서·배송비 결정 뒤 콘솔에 값 입력,
   일본 택배사(앱 서버 배송 조회 목록에 추가 후 허용), 앱(React Native) `api/groupBuys.js`가 검토 중 상태(`opsState: "DRAFT"` → `PENDING_HOST`로 옴)를 어떻게 보여 줄지.

## 4. 실행 (예시 데이터)

```
cd web && npm install && npm run dev      # http://localhost:5173  (첫 화면 = 브랜드 대시보드, #admin = 운영)
```

`VITE_OPS_API_BASE`가 없으면 브라우저 안 모의 서버(`web/src/brand/mockServer.js`)로 돈다.
화면 상단에 "예시 데이터 · 서버 미연결"이 보이고, 이름·연락처·주소는 전부 지어낸 값이다.

## 화면

| 화면 | 하는 일 | 서버 |
|---|---|---|
| 요약 | 이번 달(집계 중)·다음 또는 최근 정산액과 차감 구성, 진행 중 공동구매의 단계(호스트 수락 → 모집 → 결제 확정 → 발송 → 완료), 지금 할 일(송장 입력·호스트 수락 대기·정산 예정) | 아래 API 조합 |
| 공동구매 | 목록·필터, 조건 상세, 시작 전·모집 중 취소(확인 창) | `GET /brand/groupbuys`, `POST /brand/groupbuys/:code/cancel` ✅ 계약 있음 |
| 주문·배송 | 명단 공개 전에는 예약 숫자만. 공개 후 명단, 한 건씩 송장 저장·수정, 여러 건 선택 후 택배사 일괄 지정·저장, 명단 CSV, 송장 양식 CSV(발송 대기 주문번호 미리 채움), 송장 CSV 일괄 업로드(저장 전 오류 미리보기), 옵션별 수량 합계 | `GET /brand/groupbuys/:code/orders`, `POST /brand/groupbuy-orders/:id/shipment` ✅ 계약 있음 |
| 정산 | 월별 지급액, 월 정산서(진행 중인 달은 오늘까지 집계, 공동구매별 계산: 창고형 공급가×수량 / 인스타 판매−인플−운영 수수료, 반품 차감) | `GET /brand/settlements` ⬜ **제안** |
| 캠페인 리포트 | 캠페인별 FGI 설문 결과·국가별 이행·후기 콘텐츠(예전 greyd for Brands 화면) | 예시 데이터(서버 없음) |
| 상품 진행 요청 | CSV 끌어다 놓기 또는 한 개씩 등록, 요청 상태(검토 중·조건 협의·진행 확정·진행 어려움) | `GET/POST /brand/product-requests` ⬜ **제안** |

제안 경로가 404면 그 화면은 "준비 중" 안내로 바뀐다(나머지 화면은 그대로 동작).

송장 규칙은 앱과 같다: 택배사 코드 `CJ HANJIN LOTTE EPOST LOGEN CU GS` / `YAMATO SAGAWA JAPANPOST` / `OTHER`,
송장번호는 공백·하이픈 제거 후 영문 대문자·숫자 6~30자. CSV 업로드는 택배사를 코드나 한글 이름("CJ대한통운", "한진")으로 받는다.
CSV 내보내기는 UTF-8 BOM + 수식 주입 방지(`= + - @` 앞 작은따옴표).

## ops에 필요한 것

1. **웹 접속 토큰** — (대시보드를 ops 밖에 따로 둘 때만) 화면은 `…/#brand?t=<토큰>` 링크로 들어오면 토큰을 세션에 두고 `Authorization: Bearer`로 보낸다.
   ops가 브랜드(`SellerAppAccess`)용 단기 토큰을 발급하고, `/api/mobile/brand/*`가 이 토큰을 받아야 한다. 401이면 화면이 토큰을 지운다.
2. **CORS** — 웹 오리진에서 `/api/mobile/brand/*` 호출 허용(Authorization 헤더 포함).
3. **명단 조회·CSV 감사 로그** — 스펙 §5 그대로. 웹은 CSV를 브라우저에서 만들므로, 서버는 `GET …/orders` 조회를 기록한다.
4. **정산 — 케이스마다 세팅** (2026-10-14 대표 협의 사항)
   - **브랜드 계약(브랜드 1건당)** `BrandContract { payoutDay = 10, basis = PAID|SHIPPED }` — 1일~말일분을 **익월 `payoutDay`일** 지급(그 달에 없는 날이면 말일).
   - **공동구매 정산 조건(공동구매 1건당, 운영 콘솔에서 개설 때 세팅)** `GroupBuy.settlement`
     - `type: "SUPPLY"` 창고형 공구 — `supplyPrice`(개당 확정 공급가, VAT 포함) × 판매 수량. 판매가·호스트 몫과 무관.
     - `type: "COMMISSION"` 인스타 공구 — 판매 금액 − 인플루언서 수수료(`hostRateBps`, **인플마다 다름**) − 운영 수수료(`platformRateBps`).
     - 조건이 비어 있으면 그 공동구매는 지급액을 만들지 않고 `unset: true` → 화면에 "조건 확인 중".
   - **반품** — 환불 후 정산에서 뺀다. SUPPLY는 공급가 × 반품 수량, COMMISSION은 환불 금액을 뺀 뒤 수수료를 계산. 지급 뒤 반품은 다음 달에서 차감.
   - **계산 규칙 정본**: `web/src/brand/settlement.js` (`computeLine`·`summarize`·`payoutDateFor`) — ops가 같은 규칙으로 계산해 내려준다.
   - `GET /brand/settlements`
     ```jsonc
     { "contract": { "payoutDay": 10, "basis": "PAID" },
       "settlements": [{
         "id": "...", "periodStart": "ISO", "periodEnd": "ISO", "payoutDate": "ISO", "state": "PLANNED" | "PAID", "currency": "KRW",
         "gross": 0, "refunds": 0, "hostIncentive": 0, "fees": 0, "shipping": 0, "payout": 0, "unset": false,
         "lines": [{ "code": "gb-…", "title": "…", "terms": { "type": "SUPPLY", "supplyPrice": 9500 },
                     "quantity": 0, "amount": 0, "returnedQuantity": 0, "refundAmount": 0,
                     "base": 0, "refunds": 0, "hostFee": 0, "platformFee": 0, "payout": 0 }]
       }] }   // 오래된 달 → 최근 달 순서, 진행 중인 달도 PLANNED로(periodEnd 미래 → "집계 중")
     ```
   - `GET /brand/groupbuys`의 각 공동구매에 `settlement` 조건을 같이 내려 준다(브랜드가 상세에서 조건 확인).
   - **정산 기준 = 결제 완료(2026-10-14 확정)**. **아직 정할 것**: 세금계산서 발행 흐름, 배송비 처리(브랜드 직접 발송이면 0).
     → ops에서 설정값(`SettlementPolicy`, 콘솔 「정산 기본 설정」)으로 열어 둠 — 남은 일 5번 참고.
   모의 서버 예시: 비타 C 앰플 = 인스타(인플 15% · 운영 5%), 히알루론 크림 = 창고형(공급가 9,500원), 마스크팩 = 창고형(5,200원).
5. **상품 진행 요청 (제안)** — `GET /brand/product-requests` → `{ requests }`, `POST /brand/product-requests` `{ items: [{ name, spec, quantity, expiresOn, supplyPrice, goal: "CLEARANCE"|"TEST" }] }` → `{ requests }`.
   상태 `REVIEW | NEGOTIATING | APPROVED | REJECTED`, 담당자 메모 `note`. 운영 콘솔에서 상태를 바꾼다.

## ops 구현 메모 (2026-10-14)

- **권한**: Bearer 세션의 앱 계정 → `SellerAppAccess`(브랜드 코드 등록) → 캠페인 → 계약 → 브랜드. 연결이 없으면 403 `not_brand`. 여러 브랜드를 맡은 계정은 `?brandId=`.
- **상태 매핑**(ops → 이 문서·앱 계약): `DRAFT`(개설 검토) → `PENDING_HOST`, 시작 전 `OPEN` → `SCHEDULED`, `REACHED` → `CONFIRMED`, 나머지 그대로. 원래 값은 `opsState`, 반려는 `rejected`·`reviewNote`.
- **목록** 각 공동구매에 `settlement` = `{ type, supplyPrice, hostRateBps, platformRateBps, note, unset, example(협의 전 예시 값), basis, payoutDay, refundRule, shippingPerOrder, taxInvoice, undecided }`, `cancelable`.
- **명단**: 공개 전(`released: false`)엔 `orders: []`·`summary.reserved`만. 공개 후 명단은 앱 서버가 정본(ops가 읽어 전달), 조회는 감사 로그. 주문 `id`는 앱 서버 주문 id, `orderNo` 같이 내려 줌.
- **송장**: `courier`는 앱 코드(`CJ HANJIN LOTTE EPOST LOGEN CU GS OTHER`) 또는 ops 이름. 일본 택배사(`YAMATO SAGAWA JAPANPOST`)는 아직 422 `unsupported_courier`.
- **취소**: 브랜드 웹과 같은 규칙 — 검토 중이거나, 시작 전이고 주문 0건일 때만. 아니면 409 `not_cancelable`.
- **정산** 응답: `contract = { payoutDay, basis, taxInvoice(UNDECIDED|BRAND_REVERSE|ARBAIM_ISSUES|BRAND_ISSUES|BOTH|NONE), shipping: { mode, perOrder }, note, undecided }`, 달마다 `state: "PLANNED" | "DUE" | "PAID"`(DUE = 지급 예정일 지남·지급 기록 없음, PAID = 콘솔 지급 기록 있음 → `paidAt`·`paidAmount`) + `open`(진행 중인 달), `undecided`, 줄마다 `shipping`·`orders`·`unshipped`·`payoutDate`.
  창고형은 `amount`·`base`가 공급가 × 수량(판매 금액이 아님). 결제 확인 전 주문 수는 `pending`.
- **상품 진행 요청**: 상태 `RECEIVED→REVIEW · REVIEWING→NEGOTIATING · ACCEPTED→APPROVED · DECLINED→REJECTED`(원래 값 `opsStatus`), 담당자 답 `note`. 검증 실패는 422 `{ error: "bad_items", message }`.

## 배포

`VITE_OPS_API_BASE=https://<ops>/api/mobile npm run build` → `web/dist`. 실서버 연결 빌드에서 모의 서버를 강제로 쓰려면 `VITE_BRAND_MOCK=1`.
