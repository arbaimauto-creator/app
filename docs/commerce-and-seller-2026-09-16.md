# 앱 내 구매 · 판매자 페이지 · 결제 연동 계획 (2026-09-16)

대표 요청: "앱 내 구매를 할 수 있게, 판매자 페이지도, 앱 내 마켓은 스트라이프·레몬스퀴즈 등 결제까지."
착수 전에 현재 코드가 어디까지 살아 있는지 확인한 결과와, 그에 맞춘 단계·역할을 적는다.

## 1. 지금 사실 (코드 확인 결과)

**앱 (app-master, RN 0.76.6)**
- 결제 라이브러리 없음. `react-native-webview` 13.12는 설치되어 있음(호스티드 결제창에 쓸 수 있음).
- **구매 화면이 남아 있지 않다.** `MakeOrder`·`Cart`·`OrderList` 라우트는 `MainDrawerNavigator`에 등록되어 있지 않고,
  `screens/MakeOrderScreen/`은 빈 폴더다. `Components`에도 Cart/MakeOrder/Payment 화면 파일이 없다.
  남아 있는 건 `OrderListItemView`(판매자·구매자 주문 카드)와 `ProductPageScreen`의 구매 팝업, 그리고 존재하지 않는 화면으로
  보내는 `navigate('MakeOrder')` 호출 3곳이다. 이 호출들은 `FEATURES.COMMERCE=false` 가드에 막혀 영어 알럿만 띄운다.
- 즉 "플래그만 켜면 구매가 된다"가 아니다. **결제·주문 화면을 다시 만들어야 한다.**

**앱 API 서버 (greyd_server, 로컬 사본 `Downloads/api_backend-master/api_backend-master`)**
- Node/Express + MongoDB. 로컬 사본은 **git 저장소가 아니고 2026-08-03 기준**이다. 원본은 `github.com/RenovJ/greyd_server`.
  → 서버 변경은 이 저장소 접근 권한과 배포 담당이 있어야 한다. (현재 우리 쪽에서 배포 불가)
- 이미 있는 것: `/orders`(목록·조회·생성), `/orders/:id/pay`, `/orders/pay/paypal`, `/orders/:id/pay/reward`,
  `/cart`, `/products`(등록·수정·삭제·리뷰·북마크), 판매자 등록 `/users/seller`(사업자등록증·통장사본·통신판매업 신고증 업로드).
- 환경 키에 `PAYPAL_CLIENT_ID`/`PAYPAL_SECRET`가 있다. **스트라이프·국내 PG 키는 없다.**
- 상품 스키마 주요 필드: 다국어 title/description, seller, price, discountPrice, discountRate,
  shipmentCost(KR/US), 무료배송 기준액(KR/US), categoryCode, `externalProductPageUrl`, options(checks/lists), attachmentList.
  **없는 필드: 배송 가능 국가 목록, 재고, 결제 링크(checkoutUrl).**
- 사용자 스키마에 `store`(주문 카운트·매출·정산액) 블록이 이미 있다. 판매자 개념은 서버에 이미 존재한다.

**ops (greyd-ops, Next.js)**
- 브랜드·인플루언서용 매직링크 포털이 있다(`/portal/<purpose>/<token>`), 목적 enum은 Prisma `MagicPurpose`에 고정.
  `greyd-store/page.tsx`는 **입점 안내 문서 페이지**일 뿐, 상품 등록 기능은 없다.
- ops DB의 `Product`는 캠페인에 딸린 이름·메모뿐이라 판매용이 아니다.
- ops는 앱 API 서버를 호출하지 않는다(연동 코드 없음).

## 2. 결제 수단 선택 (권장안)

| 수단 | 쓸 곳 | 판단 |
|---|---|---|
| **Stripe** | 해외(미국·유럽) 카드 결제 | **1순위.** 실물 재화라 앱스토어 IAP 대상이 아니고 외부 결제가 허용된다. Checkout(호스티드) → 웹뷰로 붙이면 카드정보를 앱이 다루지 않아 PCI 부담이 작다. |
| **PortOne(아임포트)·토스페이먼츠** | 국내 카드·간편결제(카카오·네이버) | **국내 판매를 열 때 필수.** 한국 구매자는 Stripe 카드결제 이탈률이 높다. 사업자등록·통신판매업 신고 후 PG 심사 필요. |
| **Lemon Squeezy** | 디지털 재화 | 실물 배송 상품에는 부적합(MoR·세금 처리가 디지털 기준). 앱에서 디지털 상품(강의·PDF 등)을 팔 때만 검토. |
| PayPal | 기존 코드 잔존 | 서버에 붙어 있으나 앱 화면이 없다. 우선순위 낮음, Stripe로 대체 가능. |

**주의:** 앱에서 디지털 재화를 팔면 애플·구글이 IAP를 요구한다. 지금 계획은 실물 배송 상품 전제다.

## 3. 단계

### P0 — 앱 단독으로 지금 할 수 있는 것 (서버 무관)
- 상품 카드·상품 상세의 버튼 상태를 정리한다.
  - 외부 링크 상품(`externalProductPageUrl`): **"사러 가기"** → 외부 브라우저로 이동.
  - 앱 내 구매 준비 전: 버튼 숨김 + "앱 내 구매는 준비 중" 안내. 영어 알럿 "Unavailable" 제거.
  - 데이터 없음류 문구는 사용자에게 노출하지 않는다.
- 문구는 한/영 Strings에 추가한다.

### P1 — 앱 내 결제 (서버 필요)
1. 서버: 상품에 `shippingCountries: [String]`, `stock: Number` 추가.
2. 서버: `POST /orders/:orderId/pay/stripe` → Stripe Checkout Session 생성해 `url` 반환.
   `POST /webhooks/stripe` → `checkout.session.completed`에서 주문 상태를 결제완료로 전이(기존 `payWithPaypal` 흐름과 동일 지점).
3. 앱: 주문서 화면(배송지·수량·옵션·금액) 재작성 → 결제 버튼 → 웹뷰로 Checkout URL 오픈 →
   `success_url`/`cancel_url`을 앱 딥링크(`greyd://order/{id}/done`)로 받아 결과 화면.
4. 앱: 주문 내역 화면(기존 `OrderListItemView` 재사용).
- 필요한 것: Stripe 계정·시크릿키·웹훅 시크릿, 서버 저장소 접근/배포 담당.

### P2 — 판매자 페이지 (웹)
- 판매자는 앱이 아니라 **웹에서 상품을 등록·관리**한다(D26 결정과 동일선: 앱은 인플루언서·구매자 전용).
- 두 가지 안:
  - **(a) ops 포털 확장** — `/portal/store/<token>`(새 `MagicPurpose STORE`). 브랜드가 이미 ops 매직링크로 들어오므로 진입이 자연스럽다.
    ops가 앱 API 서버의 `/products`를 호출해 상품을 만든다(정본은 앱 서버, ops는 참조 id만 보관). Prisma 마이그레이션 + ops 배포 필요.
  - **(b) 앱 서버에 판매자 웹 추가** — 서버 저장소에 판매자용 페이지를 새로 만든다. ops와 분리되지만 서버 팀 작업량이 크다.
- 권장: **(a)**. 단 ops 배포는 자동화 시스템에 영향이 가므로 별도 승인 후 배포한다.
- 등록 화면 필드(1차): 상품명(국문/영문), 설명, 대표 이미지, 가격·할인가·통화, 옵션, 재고, **배송 가능 국가**,
  배송비·무료배송 기준, 외부 링크(있으면 "사러 가기"로 전환), 연결 캠페인/리뷰.

### P3 — 배송 불가 지역의 "구매 희망" (수요 신호)
- 2026-09-15 문서(`purchase-cta-definition-2026-09-15.md`) 그대로. 서버에 희망 저장·집계 API가 필요하다.

## 4. 막힌 곳 · 결정이 필요한 것

1. **서버 배포 주체.** `greyd_server` 저장소 접근 권한과 배포 담당이 없으면 P1·P3는 시작할 수 없다.
2. **판매 주체와 정산.** greyd가 판매자(MoR)로 받고 정산할지, 브랜드가 각자 자기 Stripe 계정으로 받을지(Stripe Connect).
   후자면 Connect 온보딩이 추가된다. 세금계산서·환불 책임이 갈리므로 먼저 정해야 한다.
3. **사업자 요건.** 국내 판매를 열면 통신판매업 신고·전자상거래 표시(청약철회·교환반품 안내)가 앱 화면에 필요하다.
4. **1차 판매 국가.** 배송 가능 국가 목록이 정해져야 P0의 버튼 분기와 P3의 희망 집계가 의미를 가진다.

## 5. 진행 상태 (2026-09-16 오후 갱신)

대표 결정(9/16): **greyd가 판매자(MoR)**, **Stripe 먼저**, 판매 국가 미정, 서버 저장소는 **권한 받아 우리가 작업**.

**완료 — 앱 (커밋됨)**
- P0 구매 CTA 상태 정리(`Components/utils/productCta.js`), 영어 알럿 제거, 한/영 문구, 테스트 5개.
- 결제 웹뷰 화면 `Components/CheckoutScreen.js` + 복귀 판정 `Components/utils/checkout.js` + 테스트 5개.
  `Checkout` 라우트 등록. 카드정보는 앱이 만지지 않는다(호스티드 Checkout).
- `APIprovider.createStripeCheckoutSession` / `confirmStripePayment`.

**작성 완료, 적용 대기 — 서버 (`docs/server-patches/`)**
로컬 스냅샷(2026-08-03)에 구현하고 패치로 떠 두었다. 저장소 권한이 열리면 최신 HEAD에 다시 맞춰 적용한다.
- `stripe-checkout-2026-09-16.patch` — 수수료 상수 `PG_STRIPE`, Payment 스키마 `stripe` 필드 + `createStripeNew`(세션 서버 검증·중복 차단·금액 대조),
  `payOrderNew`의 stripe 분기, 주문 라우트 3개(세션 생성·확정·복귀 페이지), 웹훅 raw 마운트, `stripe` 의존성.
- `stripeWebhook.js.new` — `POST /webhooks/stripe`. 서명 검증 후 `checkout.session.completed`에서 주문을 결제완료로 전이.
  앱 확정 경로와 웹훅이 겹치면 중복 검사에 막힌다(정상).

**남은 작업**
1. 서버 저장소 접근(현재 `rueseo92-create` 계정으로 `RenovJ/greyd_server` 조회 불가) → 권한 후 패치 적용·배포.
2. Stripe 계정 키 3개: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, (선택) `STRIPE_CURRENCY`·`APP_CHECKOUT_RETURN_URL`.
3. ~~주문서 화면~~ → **완료**: `Components/OrderSheetScreen.js`(배송지·수량·옵션·금액 → 장바구니 생성 → 주문 생성 → Checkout 세션),
   `Components/utils/orderSheet.js`(필수값·국내외 판정·금액·주문 본문 조립) + 테스트 5개. `OrderSheet` 라우트 등록.
   확인된 결함 하나를 함께 고쳤다: **`APIprovider.newCartItem` 정의가 없어** 호출부 4곳이 전부 끊겨 있었다(이제 `POST /cart`로 연결).
   남은 연결: 구매 버튼(쇼츠 카드·상품 상세)에서 OrderSheet로 보내는 배선은 `FEATURES.COMMERCE`를 켜는 시점에 맞춘다.
4. 커머스 노출 플래그(`FEATURES.COMMERCE`)를 켜는 시점 결정 — 켜기 전까지 버튼은 '앱 내 구매 준비 중'.
5. 판매 국가 확정 → 배송 가능 국가 필드와 '구매 희망'(P3).
6. 판매자 웹(P2): ops 포털 `/portal/store/<token>` — Prisma `MagicPurpose`에 STORE 추가 + ops 배포 승인 필요.
