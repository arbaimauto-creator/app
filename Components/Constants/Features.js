// Greyd 1단계(클로즈드 FGI 앱) 기능 플래그 — 단일 출처.
// 회의 결정(2026-08-10): 기능은 삭제하지 않고 플래그로 숨긴다. 복원 = 플래그 한 줄.
// 스펙: docs/superpowers/specs/2026-08-10-greyd-phase1-v2-design.md
const FEATURES = {
  // 초대 코드 게이트 (로그인 후 1회). 켜지면 게스트 입장 버튼 숨김.
  INVITE_GATE: true,

  // 커머스 노출 (Products 탭, Buy 버튼/가격, 구매/장바구니, Cart/OrderList)
  COMMERCE: false,

  // 평가 UI의 부정(비추천) 옵션 노출 (데이터 스키마는 유지 — 축적만)

  // B2B 화면 진입점 (셀러 접근은 brand 역할로 대체)

  // 브랜드 퍼널 앱 노출 (D26, 2026-08-11 대표 결정: 브랜드는 웹(ops 매직링크)으로 —
  // 일하는 사람들은 데스크톱이 편하다. 앱은 인플루언서 전용. 화면은 보존, 진입만 차단)
  BRAND_APP: false,

  // G-스코어 v2 (2-트랙 잠금·차등 포인트·진행바)

  // 브랜드 평가 트리아지(👍👌👎) 우선 방식

  // 추천 코드 (첫 루프 완료 시 3장)
  REFERRAL: true,

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

  // ops 실연동 (Phase 1.5 롤아웃 1단계 — 캠페인 읽기). OFF면 전면 mock (현행 동일)
  LIVE_OPS_API: true,
};

export default FEATURES;
