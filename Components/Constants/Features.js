// Greyd 1단계(클로즈드 FGI 앱) 기능 플래그 — 단일 출처.
// 회의 결정(2026-08-10): 기능은 삭제하지 않고 플래그로 숨긴다. 복원 = 플래그 한 줄.
// 스펙: docs/superpowers/specs/2026-08-10-greyd-phase1-v2-design.md
const FEATURES = {
  // 초대 코드 게이트 (로그인 후 1회). 켜지면 게스트 입장 버튼 숨김.
  INVITE_GATE: false,

  // 크리에이터 프로필 온보딩 (로그인 후 1회). 게이트와 독립 — 게이트가 꺼져도 프로필은 받는다.
  // 게이트가 꺼져 있으면 온보딩 폼 안에서 활동 국가를 함께 받는다.
  CREATOR_ONBOARDING: true,

  // 커머스 노출 (Products 탭, Buy 버튼/가격, 구매/장바구니, Cart/OrderList)
  COMMERCE: false,

  // (제거된 플래그 — 이제 코드에 고정: 비추천 옵션 비노출·B2B 진입점은 brand 역할·G-스코어 v2 상시·브랜드 트리아지 상시)

  // 브랜드 퍼널 앱 노출. 2026-09-17 결정으로 재개방 — 판매자 모드 전환(마이 탭 ↔ 브랜드 셸)과
  // 앱내 상품 등록·스토어 관리를 연다. (D26의 "웹 전용"은 이 결정으로 대체)
  BRAND_APP: true,

  // 추천 코드 (첫 루프 완료 시 3장)
  REFERRAL: false,

  // 좋아요(하트)·좋아요 목록 등 소셜 장식 (회의: "라이크 등 소셜 장식 제거" — 데이터는 유지, UI만 숨김)
  SOCIAL_LIKES: false,

  // 레퍼런스 아카이브 + 인용 계보.
  // 하트(인기 투표) 대신, 참고할 리뷰를 저장해두고 그걸 보고 만든 리뷰를 원본에 연결한다.
  // 서버·클라 모두 이미 존재하던 것을 앞으로 꺼내는 것: 저장은 PUT /videos/:id/bookmarks,
  // 인용은 업로드 시 relayingVideoId → 원본에 relayedVideoCount 집계.
  REFERENCE_ARCHIVE: true,

  // 테스트 빌드용 게스트 진입 — TestFlight/내부 배포에서 소셜 로그인 없이 전 플로우를 보기 위함.
  // ⚠️ 스토어 정식 배포 전에는 반드시 false (클로즈드 앱 원칙)
  TEST_GUEST_ENTRY: false,

  // 공동구매 (2026-09-30, docs/groupbuy-dev-spec-2026-09-30.md) — 홈 레일·마이 탭·브랜드 셸 진입점.
  // ops 공동구매 API 배포 전이라 개발 빌드에서만 켠다. 서버가 올라가면 true로.
  GROUP_BUY: typeof __DEV__ !== 'undefined' && __DEV__,

  // 공동구매 모의 서버(api/groupBuysMock.js) — 개발 빌드 전용. 릴리스에서는 항상 false여야 한다.
  GROUP_BUY_MOCK: typeof __DEV__ !== 'undefined' && __DEV__,

  // ops 실연동 (Phase 1.5 롤아웃 1단계 — 캠페인 읽기). OFF면 전면 mock (현행 동일)
  LIVE_OPS_API: true,
};

export default FEATURES;
