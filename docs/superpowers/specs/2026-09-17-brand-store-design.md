# 앱내 브랜드 스토어 + 외부몰 추적 이동 + 판매자 모드 (2026-09-17 확정)

자사몰이 없는 회사는 그레이드 안이 곧 스토어가 되고, 자사몰이 있는 회사도 같은
스토어 화면을 쓰되 "모든 상품 보러가기 ↗"로 외부몰로 넘어간다. 외부 이동은
로그로 남겨 그레이드 귀속 인센티브의 근거가 된다.

## 이미 있는 것 (재사용)

- 판매자별 상품 목록: `ProductListScreen`(라우트 `ProductList`, `sellerId`·`sellerName` params) — ProductPageScreen `SellerProducts`(:692)가 이미 진입
- 상품 등록/수정: `AddingNewProductScreen`(라우트 `AddingNewProduct`) + `APIprovider.addNewProduct/editProduct`
- 외부몰 URL 필드: 상품의 `lowestPriceLink` (P0에서 `externalProductPageUrl` 예정)
- 브랜드 셸: BrandDashboard·BrandReview·BrandMy (`FEATURES.BRAND_APP=false`로 잠김)
- 로그: `logEvent`(Firebase, api/common/analytics.js) + ops 전송 패턴(api/tracking.js)
- ops 판매자 웹(P2): 구현 완료·배포 보류 — 웹 등록 경로는 ops 배포가 열리면 끝

## 새로 만드는 것

### 1. 외부 이동 로그 `api/outbound.js`

- `withGreydParams(url, { uid })` — 외부몰 URL에 `utm_source=greyd&utm_medium=app&greyd_uid=<uid>` 부착(기존 쿼리 보존, 잘못된 URL은 원본 반환)
- `logOutboundClick({ sellerId, productId, videoId, url })` — `logEvent('outbound_click', …)` 즉시 전송 + 로컬 큐(`outboundClicksV1`, prefSafe)에 적재. 서버가 열리면 큐를 정산용으로 올린다(이번 범위는 적재까지).
- `openExternalStore(params)` — 로그 후 `Linking.openURL(withGreydParams(...))`

### 2. "모든 상품 보러가기 ↗" 버튼

- `ProductPageScreen`: 상품에 `externalProductPageUrl || lowestPriceLink` 있으면 판매자 영역 아래 버튼 노출 → `openExternalStore`
- `ProductListScreen`(판매자 스토어): 목록 상품 중 외부 URL 보유 시 헤더 아래 버튼 노출

### 3. 판매자 모드 전환

- `FEATURES.BRAND_APP: true`로 전환
- 마이 탭: `userIsSeller` Preference가 참일 때 "판매자 모드로 전환" 카드 → `inviteRole='brand'` 저장 후 재시작 안내(셸은 부팅 시 역할을 읽는다)
- BrandMy: "인플루언서 모드로 돌아가기" 카드(역방향, 같은 방식)

### 4. 브랜드 셸 스토어 관리

- BrandMy에 "스토어 관리" 카드 2개: 내 상품 목록(`ProductList`, sellerId=본인) / 상품 등록(`AddingNewProduct`)

## 서버가 풀려야 완결되는 것 (막힘 명시)

- 외부몰 실제 전환(구매) 귀속·인센티브 정산 — 앱은 클릭 로그·큐까지
- 브랜드별 상품 조회 전용 API(지금은 sellerOtherProductList/ProductList 데이터로 충분)
- ops 판매자 웹 배포

## 테스트

- `withGreydParams` URL 조립(기존 쿼리 보존·불량 URL 방어), `logOutboundClick` 큐 적재·dedupe 없음(클릭마다 기록) 확인
