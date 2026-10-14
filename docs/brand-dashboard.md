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
| 브랜드 API(목록·명단·송장·취소) | ❌ 없음(404) | ops — 규격은 `docs/groupbuy-dev-spec-2026-09-30.md` §4-6 |
| 정산 조건 세팅·월 정산 API | ❌ 없음 | ops — 아래 §정산 |
| 운영 콘솔 정산 조건 입력 화면 | ❌ 없음 | ops 콘솔 |
| 대시보드 배포 | ❌ 안 함 | ops `/portal/brand` 안에 넣기(권장) |

## 3. 남은 일 (순서대로)

1. **ops 브랜드 API** — `/api/mobile/brand/groupbuys`, `…/:code/orders`, `/brand/groupbuy-orders/:id/shipment`, `…/:code/cancel` (규격 완료).
2. **정산** — 공동구매마다 정산 조건(창고형 공급가 / 인스타 인플 수수료율) + 브랜드 계약 지급일(익월 10일) + 반품 차감.
   계산 규칙 정본 `web/src/brand/settlement.js`를 ops로 옮겨 `GET /brand/settlements`로 내려준다. 운영 콘솔에 조건 입력 칸.
3. **상품 진행 요청** — 이미 있는 상품 제안 접수(ProductProposal)를 브랜드 계정에 연결해 `/brand/product-requests`로.
4. **ops 브랜드 포털에 대시보드 넣기** — `/portal/brand`의 로그인(접속 링크)을 그대로 쓰면 별도 토큰·CORS 불필요.
   `web/src/brand/`의 화면과 `api.js` 호출 규격을 그대로 옮긴다. FGI 리포트도 같은 메뉴로.
5. **결정 필요** — 정산 기준(결제 완료 vs 발송 완료), 세금계산서 발행 흐름, 배송비 처리.

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
   - **아직 정할 것**: 정산 기준(결제 완료 vs 발송 완료), 세금계산서 발행 흐름, 배송비 처리(브랜드 직접 발송이면 0).
   모의 서버 예시: 비타 C 앰플 = 인스타(인플 15% · 운영 5%), 히알루론 크림 = 창고형(공급가 9,500원), 마스크팩 = 창고형(5,200원).
5. **상품 진행 요청 (제안)** — `GET /brand/product-requests` → `{ requests }`, `POST /brand/product-requests` `{ items: [{ name, spec, quantity, expiresOn, supplyPrice, goal: "CLEARANCE"|"TEST" }] }` → `{ requests }`.
   상태 `REVIEW | NEGOTIATING | APPROVED | REJECTED`, 담당자 메모 `note`. 운영 콘솔에서 상태를 바꾼다.

## 배포

`VITE_OPS_API_BASE=https://<ops>/api/mobile npm run build` → `web/dist`. 실서버 연결 빌드에서 모의 서버를 강제로 쓰려면 `VITE_BRAND_MOCK=1`.
