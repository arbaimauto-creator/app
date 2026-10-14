# 상품 제안 접수 (greyd.app/propose) — 2026-10-14

브랜드·공급사가 인플루언서 공동구매 / 창고형 공동구매에 상품을 제안하는 양식. 소개서 3페이지 연락처 칸의
"상품 제안서 작성하기" 버튼과 QR이 `https://greyd.app/propose`로 연결된다.

- 양식: `web/public/propose/index.html` (단일 HTML, 외부 의존은 SheetJS CDN과 Google Fonts뿐)
- 항목: 업체 정보(업체명·담당자·연락처·이메일·주소), 희망 판매 방식·목적, 상품(최대 10개: 이미지·품명·규격·소비자가·
  온라인 최저가·공급가(VAT·입고배송비 포함)·공급율 자동·재고량·유통기한·단품 중량/사이즈·소개 콘텐츠 URL),
  공급자 요청사항, 개인정보 제공 동의. 상품마다 **자사몰 상품 링크로 불러오기**(아래 2-1)로 상품명·소비자가·이미지·소개 URL을 채울 수 있다.
- 필요 서류(사업자등록증·통장사본 / 상품소개서 PPT / 콘텐츠)는 **제출 때 받지 않는다** — 안내만 하고, 진행이 정해지면 담당자가 따로 요청한다.
- 제출: `ENDPOINT`(아래 API)로 multipart 전송 → 실패하거나 서버가 없으면 엑셀 저장 + jian@arbaim.com 메일 작성 창으로 대체.

## 할 일

### 1. greyd.app/propose 에 올리기 (웹사이트 Next.js)
`web/public/propose/index.html`을 그대로 `public/propose/index.html`로 두거나 `/propose` 라우트에서 이 HTML을 내려준다.

### 2. ops 접수 API — `POST https://greyd-ops.vercel.app/api/public/product-proposals`
- 인증 없음(공개). CORS: `https://greyd.app` 오리진 허용(`POST`, `OPTIONS`).
- 본문 `multipart/form-data`
  - `data`: JSON 문자열
    ```jsonc
    { "company": "", "contactName": "", "phone": "", "email": "", "address": "",
      "channels": ["인플루언서 공동구매", "창고형 공동구매"], "goals": ["재고 소진", "마켓 테스트"],
      "request": "", "docs": ["biz", "ppt", "media"],
      "products": [{ "name": "", "spec": "", "retail": 0, "lowest": 0, "supply": 0, "rate": 27,
                     "stock": 0, "expiry": "YYYY-MM-DD", "weight": 0, "size": "", "url": "", "image": "파일명|null" }] }
    ```
  - `image_1`…`image_10`: 직접 올린 상품 이미지(선택) / `xlsx`: 같은 내용의 엑셀
  - 상품마다 `imageUrl`(링크로 불러온 이미지 주소)·`sourceUrl`(자사몰 링크)이 `data`에 들어온다. 이미지는 서버가 내려받아 저장해도 된다(같은 SSRF 검사 적용).
  - `website`: 스팸 방지용 숨은 칸 — 값이 있으면 저장하지 않고 200으로 응답
- 처리
  1. 검증: 업체명·담당자·연락처·이메일 형식, 상품 1~10개, 품명·공급가 필수. 실패 시 422 `{ error }`.
  2. 저장: `ProductProposal`(업체 정보·JSON·상태 `RECEIVED`·createdAt) + 첨부는 기존 파일 저장소(`/api/files/...`). 이미지 파일당 10MB.
  3. 알림 메일: 기존 메일 발송 모듈로 **jian@arbaim.com**에 "[greyd 상품 제안] 업체명 · 상품 n개" — 본문 요약 + 엑셀 첨부 + 콘솔 링크.
  4. 제안자에게 접수 확인 메일(선택).
  5. 응답 `201 { id }`.
- 보호: IP당 분당 5회·일 30회 제한, 이메일·연락처는 로그에 남기지 않기.
- 콘솔: 운영 콘솔에 "상품 제안" 목록(상태 `RECEIVED → REVIEWING → ACCEPTED/DECLINED`, 담당자 메모).
  ACCEPTED는 브랜드 파트너센터의 상품 진행 요청(`/brand/product-requests`)과 이어 붙일 수 있게 브랜드 계정 연결 필드를 둔다.

### 2-1. 자사몰 링크 미리보기 — `GET https://greyd-ops.vercel.app/api/public/product-preview?url=...`
- 참고 구현: `docs/server-patches/product-preview-2026-10-14.js` → ops `app/api/public/product-preview/route.js`로 그대로 넣는다(의존성 없음).
- 응답 `200 { product: { name, retailPrice, salePrice, currency, imageUrl, description, brand, sku, siteName, url } }`,
  실패 `{ error: unsupported_site | invalid_url | https_only | not_html | not_a_product | fetch_failed }`.
- 읽는 순서: JSON-LD `Product` → Open Graph·`product:*` 메타(Cafe24·고도몰·아임웹·Shopify 공통) → `<title>`. EUC-KR 페이지도 디코딩.
- **쿠팡·네이버(스마트스토어·브랜드스토어·쇼핑, naver.me)는 받지 않는다** — 크롤링 차단·약관 문제. 양식도 같은 규칙으로 바로 안내한다.
- 보안: https만, 사설·루프백 IP 거부(리다이렉트마다 재검사), 2MB·8초 제한, HTML만. CORS는 `https://greyd.app`만, IP당 분당 10회 제한.

### 3. 확인
서버 배포 후 양식에서 제출 → 201, 메일 수신, 콘솔 목록 확인. 서버가 실패하면 양식은 자동으로 메일 작성으로 넘어간다.
