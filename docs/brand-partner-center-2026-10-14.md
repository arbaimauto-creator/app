# 브랜드 파트너센터 (웹) — 2026-10-14

공동구매를 진행하는 브랜드가 쓰는 웹 화면. `web/` 앱의 `#brand` 경로.

```
cd web && npm install && npm run dev      # http://localhost:5173/#brand
```

`VITE_OPS_API_BASE`가 없으면 브라우저 안 모의 서버(`web/src/brand/mockServer.js`)로 돈다.
화면 상단에 "예시 데이터 · 서버 미연결"이 보이고, 이름·연락처·주소는 전부 지어낸 값이다.

## 화면

| 화면 | 하는 일 | 서버 |
|---|---|---|
| 요약 | 다음(또는 최근) 정산액과 차감 구성, 진행 중 공동구매의 단계(호스트 수락 → 모집 → 결제 확정 → 발송 → 완료), 지금 할 일(송장 입력·호스트 수락 대기·정산 예정) | 아래 API 조합 |
| 공동구매 | 목록·필터, 조건 상세, 시작 전·모집 중 취소(확인 창) | `GET /brand/groupbuys`, `POST /brand/groupbuys/:code/cancel` ✅ 계약 있음 |
| 주문·배송 | 명단 공개 전에는 예약 숫자만. 공개 후 명단, 한 건씩 송장 저장·수정, 여러 건 선택 후 택배사 일괄 지정·저장, 명단 CSV, 송장 양식 CSV(발송 대기 주문번호 미리 채움), 송장 CSV 일괄 업로드(저장 전 오류 미리보기), 옵션별 수량 합계 | `GET /brand/groupbuys/:code/orders`, `POST /brand/groupbuy-orders/:id/shipment` ✅ 계약 있음 |
| 정산 | 주차별 지급액, 주간 정산서(결제 완료 − 취소·환불 − 호스트 인센티브 − 수수료 − 배송비 = 지급액, 공동구매별 결제 금액) | `GET /brand/settlements` ⬜ **제안** |
| 상품 진행 요청 | CSV 끌어다 놓기 또는 한 개씩 등록, 요청 상태(검토 중·조건 협의·진행 확정·진행 어려움) | `GET/POST /brand/product-requests` ⬜ **제안** |

제안 경로가 404면 그 화면은 "준비 중" 안내로 바뀐다(나머지 화면은 그대로 동작).

송장 규칙은 앱과 같다: 택배사 코드 `CJ HANJIN LOTTE EPOST LOGEN CU GS` / `YAMATO SAGAWA JAPANPOST` / `OTHER`,
송장번호는 공백·하이픈 제거 후 영문 대문자·숫자 6~30자. CSV 업로드는 택배사를 코드나 한글 이름("CJ대한통운", "한진")으로 받는다.
CSV 내보내기는 UTF-8 BOM + 수식 주입 방지(`= + - @` 앞 작은따옴표).

## ops에 필요한 것

1. **웹 접속 토큰** — 화면은 `…/#brand?t=<토큰>` 링크로 들어오면 토큰을 세션에 두고 `Authorization: Bearer`로 보낸다.
   ops가 브랜드(`SellerAppAccess`)용 단기 토큰을 발급하고, `/api/mobile/brand/*`가 이 토큰을 받아야 한다. 401이면 화면이 토큰을 지운다.
2. **CORS** — 웹 오리진에서 `/api/mobile/brand/*` 호출 허용(Authorization 헤더 포함).
3. **명단 조회·CSV 감사 로그** — 스펙 §5 그대로. 웹은 CSV를 브라우저에서 만들므로, 서버는 `GET …/orders` 조회를 기록한다.
4. **정산 (제안)** — `GET /brand/settlements`
   ```jsonc
   { "settlements": [{
       "id": "...", "periodStart": "ISO", "periodEnd": "ISO", "payoutDate": "ISO",
       "state": "PLANNED" | "PAID", "currency": "KRW",
       "gross": 0, "refunds": 0, "hostIncentive": 0, "fees": 0, "shipping": 0, "payout": 0,
       "lines": [{ "code": "gb-…", "title": "…", "amount": 0 }]   // 공동구매별 결제 금액
   }] }   // 오래된 주 → 최근 주 순서
   ```
   **결정 필요:** 정산 기준일(결제 완료 시각 vs 발송 완료 시각), 주 경계(월~일), 지급 요일, 호스트 인센티브율(`GroupBuy.incentiveBps`), 수수료율, 배송비 정산 방식, 지급 후 환불 처리(다음 주 차감).
   모의 서버는 월~일 결제 완료분을 다음 주 수요일 지급, 인센티브 6%, 수수료 4%의 **예시 값**을 쓴다.
5. **상품 진행 요청 (제안)** — `GET /brand/product-requests` → `{ requests }`, `POST /brand/product-requests` `{ items: [{ name, spec, quantity, expiresOn, supplyPrice, goal: "CLEARANCE"|"TEST" }] }` → `{ requests }`.
   상태 `REVIEW | NEGOTIATING | APPROVED | REJECTED`, 담당자 메모 `note`. 운영 콘솔에서 상태를 바꾼다.

## 배포

`VITE_OPS_API_BASE=https://<ops>/api/mobile npm run build` → `web/dist`. 실서버 연결 빌드에서 모의 서버를 강제로 쓰려면 `VITE_BRAND_MOCK=1`.
