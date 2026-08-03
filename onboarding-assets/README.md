# 온보딩 CDN 교체용 이미지

세로 스와이프 UX에 맞춰 갱신한 온보딩 1페이지 이미지 (2588x4600 PNG).

| 파일 | 업로드 대상 URL |
| --- | --- |
| `en-initial-guide-01.png` | `https://d3ags90eq0etbz.cloudfront.net/app-banner/onboarding/en-initial-guide-01.png` |
| `ko-initial-guide-01.png` | `https://d3ags90eq0etbz.cloudfront.net/app-banner/onboarding/ko-initial-guide-01.png` |

## 원본 대비 변경점

1. 타이틀 첫 줄: "Swipe left or right" → "Swipe up or down" / "좌우로" → "위아래로" (Pretendard Regular)
2. 폰 목업 화면: 구버전 스크린샷(좌우 화살표 포함) → 현재 세로 스와이프 UI의 실제 스크린샷
3. 화면 위 장식 화살표: 좌우(◀▶) → 상하(▲▼) 스택

## 배포 후 할 일

- CloudFront 캐시 무효화(invalidation) 필요: `/app-banner/onboarding/*`
- CDN 반영 확인 후 `Components/OnboardingScreen.js`의 `renderSwipeGuidePatch` 인앱 패치 코드를 제거해도 됨
