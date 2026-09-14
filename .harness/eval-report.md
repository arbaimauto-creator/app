# QA Report: CameraScreen route.params 옵셔널 체이닝 수정 — Round 1

날짜: 2026-08-19 / 환경: Pixel_6_API_35 에뮬레이터 + Metro (LIVE_OPS_API: false)

## 판정: PASS ✅ (수정 범위 한정)

Sprint Contract(.harness/sprint-contract.md)가 없어 이번 수정의 완료 기준
"Create 진입 시 크래시 제거 + 기존 linkedProduct 플로우 무회귀"로 평가함.

## 점수 테이블

| 기준 | 점수 | 근거 |
|------|------|------|
| 제품 완성도 | 85 | Create/Post 진입 → 업로더 폼 실동작 확인 (스텁 아님) |
| 기능 정확성 | 80 | 크래시 재현 불가, 진입 2회 반복 검증, X 닫기 정상 |
| 디자인 품질 | N/A | 이번 수정은 UI 변경 없음 |
| 코드 품질 | 85 | 최소 침습(옵셔널 체이닝 4곳), 주변 코드 스타일 유지 |

## 검증 내역

1. **Create 버튼 (홈 상단)** — 진입 2회: 에러 없이 리뷰 작성 폼 렌더 ✅
2. **"+Post" 스토리 서클** — 진입 1회: 동일 폼 정상 렌더 ✅ (`CuratedHome.js`의
   3개 진입점 중 2개 실기기 검증; 3번째(onCreate, 386행)는 동일 핸들러)
3. **X 닫기** — 홈 복귀 정상 ✅
4. **logcat/Metro** — `linkedProduct` 관련 에러 0건 ✅
5. **회귀(정적 검증)** — linkedProduct를 넘기는 플로우(ProductPage 917행,
   VideoPage 777·1088행)는 전부 메인 스택 'AddingNewVideo'로 직행, 수정된
   CameraScreen을 경유하지 않음. params가 존재할 때 `?.`는 `.`와 동일 동작 →
   회귀 불가능. CameraScreen 내 잔여 `route.params.` 직접 접근 0건(285행은 주석).

## Critical Issues (이번 수정과 무관, 기존 이슈)

- **게스트 로그아웃 후 재진입 불가**: 게스트로 리뷰 카드 탭 → API 응답 파싱
  실패(`JSON Parse error: Unexpected end of input`) → 강제 로그아웃 → 로그인
  게이트. "Browse Without Signing Up"(`guestUser`,
  `screens/SignInScreen/commonHelperFunction.js:414`)은 LIVE_OPS_API=false여도
  항상 실서버 `APIprovider.login`을 호출 → 서버 미도달 환경에서 **게스트 복귀
  경로가 완전히 막힘**. 현재 에뮬레이터가 이 상태로 게이트에 묶여 있음.

## Major Issues (기존 이슈)

- mock 모드에서도 일부 요청이 실서버로 나감 (로그인/유저 조회 계열) →
  `request error [SyntaxError...]` 다발.
- 로그인 실패 직후 `TypeError: Cannot read property 'toString' of undefined`
  1건 (재현 경로: 게스트 로그인 실패 콜백 이후).

## Minor Issues

- 없음 (수정 범위 내).

## 잘된 점

- 수정이 크래시 지점 4곳에 국한되고, params가 있는 기존 경로의 의미를 바꾸지
  않는 최소 변경.

## 후속 제안 (Generator 수정 지침 아님 — PASS)

- 게스트 진입을 mock 모드에서 로컬 스텁으로 처리하거나, 실패 시 게이트에
  묶이지 않는 폴백 필요 → 별도 이슈로 처리 권장.
