// Greyd 1단계(클로즈드 FGI 앱) 기능 플래그 — 단일 출처.
// 회의 결정(2026-08-10): 기능은 삭제하지 않고 플래그로 숨긴다. 복원 = 플래그 한 줄.
// 스펙: docs/superpowers/specs/2026-08-10-greyd-phase1-v2-design.md
const FEATURES = {
  // 초대 코드 게이트 (로그인 후 1회). 켜지면 게스트 입장 버튼 숨김.
  INVITE_GATE: true,

  // 커머스 노출 (Products 탭, Buy 버튼/가격, 구매/장바구니, Cart/OrderList)
  COMMERCE: false,

  // 평가 UI의 부정(비추천) 옵션 노출 (데이터 스키마는 유지 — 축적만)
  DOWNVOTE: false,

  // B2B 화면 진입점 (셀러 접근은 brand 역할로 대체)
  B2B_TAB: false,

  // 브랜드 퍼널 앱 노출 (D26, 2026-08-11 대표 결정: 브랜드는 웹(ops 매직링크)으로 —
  // 일하는 사람들은 데스크톱이 편하다. 앱은 인플루언서 전용. 화면은 보존, 진입만 차단)
  BRAND_APP: false,

  // G-스코어 v2 (2-트랙 잠금·차등 포인트·진행바)
  GRADING_V2: true,

  // 브랜드 평가 트리아지(👍👌👎) 우선 방식
  TRIAGE_EVAL: true,

  // 추천 코드 (첫 루프 완료 시 3장)
  REFERRAL: true,

  // 좋아요(하트)·좋아요 목록 등 소셜 장식 (회의: "라이크 등 소셜 장식 제거" — 데이터는 유지, UI만 숨김)
  SOCIAL_LIKES: false,
};

export default FEATURES;
