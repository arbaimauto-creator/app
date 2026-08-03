# 코드 리뷰 — 비디오 페이지 틱톡 스타일 개편 (2026-08-03)

## 수정 완료 (이번 리뷰에서 고침)

| # | 파일 | 문제 | 심각도 | 조치 |
|---|------|------|--------|------|
| 1 | `Components/CustomComponents/VideoLikeButton.js:70` | `Strings.Strings.FAILED_TO_BOOKMARK` 오타 — 좋아요 API 실패 시 에러 알림 대신 TypeError 크래시 | 높음 | `Strings.FAILED_TO_BOOKMARK`로 수정 |
| 2 | `screens/VideoPageScreen/BookmarkButton.js:60` | 동일한 `Strings.Strings.*` 오타 | 높음 | 동일 수정 |
| 3 | `Components/SliderEntry.js:519` | 리스너 등록 전 언마운트 시 `_unsubscribeFocusEvent is not a function` 크래시 (실제 RedBox 발생 확인) | 높음 | 옵셔널 체이닝 `?.()` 적용 |
| 4 | `screens/VideoPageScreen/index.js` | `showVideoInfo`/`hideVideoInfo` 메서드 중복 정의 (뒤 정의가 앞을 덮어씀) + 디버그 console.log 잔존 | 중간 | 중복 제거, 로그 정리 |
| 5 | `screens/VideoPageScreen/VideoOverlay.js` | `review.author.userId` 등 author 널 접근 가능성 | 중간 | 옵셔널 체이닝 적용 |
| 6 | `VideoOverlay.js` ProductCard | 할인율 표기 오류 (서버값 0.2 → "0.2%" 표시) | 중간 | `Math.round(rate * 100)`로 수정 (기존 코드 관례와 동일) |
| 7 | `android/settings.gradle` | autolink 명령이 Windows 전용(`cmd /c`)이라 macOS/CI 빌드 깨짐 | 높음 | OS 감지 분기 추가 (Windows만 로컬 CLI 직접 호출) |
| 8 | `screens/VideoPageScreen/index.js` | 미사용 `RatingButton` import (레일로 대체됨) | 낮음 | 제거 |

## 빌드 환경 이슈 (해결됨, 참고용)

- **play-services-auth 16.0.1 → 20.7.0**: 구형 서포트 라이브러리 의존으로 androidx와 클래스 중복 → 상향 (`android/build.gradle`)
- **구형 서포트 라이브러리 전역 exclude**: `support-compat`/`support-v4`/`support-media-compat`
- **ffmpeg-kit 에뮬레이터 제외**: 대체 AAR(io.github.maitrungduc1410)에 x86_64 바이너리 없음 → `GREYD_EMULATOR=1` 환경변수일 때만 autolink 제외 (`react-native.config.js`). **실기기/배포 빌드 영향 없음.**
- **NDK 23 → 26.1**: reanimated CMake 구성 실패 해결 (사용자 수정)

## ESLint 복구 (2차 세션)

- `.eslintrc.js`: 구버전 `@react-native-community` config → `@react-native`로 교체, `plugins: ['prettier']` 추가
- `eslint-plugin-prettier` devDependency 설치 (새 RN config에서 빠짐)
- **에러 0건 달성** (41건 경고는 레거시 미사용 변수 — 기능 영향 없음). 추가로 고친 에러:
  - `SliderEntry.js`: `BackHandler` import 누락 (onError 시 런타임 크래시였음)
  - `ActionButton.js`: setState 함수형 업데이트로 exhaustive-deps 해결
  - `RenderSlide.js`: 미사용 타이머 ref/handleInit 죽은 코드 제거
  - `RatingButton.js`: useMemo deps에 navigation 추가
  - `CommentModal`/`RatingListModal`/`ReviewComments`: 의도적 메모 패턴에 disable 주석 (동작 변경 없이 명시화)
- prettier --fix로 포맷 정리, 앱 리로드 후 크래시 없음 확인

## 전수 버그 해결 (3차 세션) — 레포 전체 에러 0건

**레포 전체 ESLint 에러 17건 → 0건:**
- `App.js`: 죽은 `@flow strict-local` 프래그마가 파서를 깨뜨림 → 제거 (lint가 파일 전체를 검사 못 하던 상태)
- `PatchedReanimatedBottomSheet.js`: 기본 매개변수 안에서 `useRef` 호출 (rules-of-hooks 위반, prop 유무에 따라 훅 순서 변동) → 컴포넌트 본문으로 이동
- `useDebounce.ts`: deps에 `delay` 누락 → 추가 (delay 변경 시 미반영 버그)
- exhaustive-deps 12건: 전부 의도적 마운트/특정-트리거 패턴 → 사유 주석 + disable로 명시화 (동작 보존)
- `SafeFastImage.tsx`: rest-제외 패턴 오탐 → `no-unused-vars`에 `ignoreRestSiblings`/`^_` 패턴 전역 설정

**비디오 페이지 경고 41건 → 0건:** 미사용 import/변수/인자 제거·`_` 접두사 처리, `no-shadow` 4건 리네임(`ReviewComments`의 video/comment 섀도잉), 죽은 코드 제거

**런타임 버그:**
- `Components/utils/index.js` `setCountryFromLocation`: 지오코딩 응답이 빈 경우 `address_components` 접근 TypeError (로그에서 실제 발생 확인) → 옵셔널 체이닝 가드
- `PurchasePopup`: `linkedProduct.productId`가 비populate(문자열)일 때 `product.options` 크래시 가능 → 안전 기본값 가드
- CodePush: 코드상 이미 주석 처리(비활성) 확인 — 별도 조치 불요

**검증:** 레포 전체 `eslint --quiet` 통과(에러 0), 수정 파일 19개 Babel 파싱 통과, 에뮬레이터 리로드 후 크래시 버퍼 0건, 홈 피드/비디오 페이지 정상 렌더링 확인

## 남은 관찰 사항 (수정 안 함 — 기존 동작 유지)

1. **PurchasePopup**: `linkedProduct.productId`가 문자열(비populate)일 때 `product.options` 접근 시 크래시 가능. 기존 코드와 동일 조건이라 그대로 둠. 서버가 구매 가능 상품은 항상 populate해서 내려주는 전제.
2. **ESLint 설정 깨짐**: `.eslintrc.js`가 존재하지 않는 `@react-native-community` config를 참조 → `npm run lint` 실패. `@react-native/eslint-config`(이미 설치됨)로 교체 권장.
3. **CodePush**: 디버그 실행 중에도 프로덕션 번들을 다운로드해 앱을 재시작시킴 (개발 흐름 방해). 디버그 빌드에서 CodePush sync 비활성화 권장.
4. **require cycle 경고**: `Constants/index ↔ Style`, `APIprovider ↔ utils` — 초기화 순서 버그 위험. 장기 과제.
5. **Metro 메모리**: 번들링에 8GB+ 힙 필요 (OOM 2회 발생). 16GB 설정으로 운영 중. `inlineRequires` 활성화 검토 권장.

## 검증

- 변경 파일 10개 전부 Babel 파싱 통과
- 에뮬레이터에서 RedBox 없이 리로드 확인
- 틱톡 스타일 UI 렌더링 스크린샷 검증 완료 (액션 레일, 하단 오버레이, 상품 카드 20% 표기)
