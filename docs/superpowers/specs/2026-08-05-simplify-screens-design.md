# 화면 단순화 스펙 — "화면당 핵심 액션 3개"

날짜: 2026-08-05 · 승인됨 · 원칙: 요소 수 축소(구조 정리), 비주얼 리뉴얼 아님

## 1. 영상 화면 (screens/VideoPageScreen)
- 우측 레일 유지 5개: 아바타 · 좋아요 · 별점(G) · 댓글 · 공유
- HeaderRight의 Relay·배속·음소거 → 우상단 ⋯ 메뉴(ModalMenuButton menuUploader/menuVisitor)에 항목으로 이동, HeaderRight 컴포넌트는 렌더 제거
- 레일의 북마크 → ⋯ 메뉴로 이동
- VideoOverlay: 해시태그 줄 제거(캡션 탭 시 상세에서 확인 가능), 오버레이는 배지+작성자 줄+캡션 2줄+상품카드+핸들만

## 2. 홈 피드 (Components/MainScreen)
- Review/ALL 토글 제거 → Review 단일 피드 (토글 UI 제거, 데이터는 Review 경로 고정)
- "Trust and Buy" 플로팅 배지 제거
- SliderEntry의 "Touch the screen..." / "Swipe up to see more videos" 안내 텍스트 2종 제거
- ReviewDescriptionSummary 설명 1줄로 (numberOfLines=1 상당)

## 3. 스토어 (Components/StoreScreen)
- 상단 탭 Home/NEW/Promotions/Best/Popular → **Home/NEW/Best** (Promotions·Popular 라우트 제거, 콘텐츠는 Home 섹션에 이미 존재)

## 4. 제외
- 마이페이지 재구성, 색/폰트 리뉴얼 — 디자이너 미팅 후

## 검증
- 화면별 전/후 스크린샷, 제거 기능의 ⋯ 메뉴 접근성 확인, 크래시 0, 린트 0
