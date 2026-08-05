# greyd 앱 디자인 핸드오프 (피그마 작업용)

디자이너가 피그마에서 전면 개선 작업을 시작할 수 있도록 준비한 패키지입니다.

## 피그마 세팅 방법

1. **새 피그마 파일 생성** → 393×852 (또는 390×844) 프레임 기준 권장
2. **`screens/` 폴더의 PNG 전체를 드래그해서 캔버스에 올리기** — 현재 앱의 실제 화면(1080×2400, Pixel 6 캡처)
3. **디자인 토큰 가져오기** — [Tokens Studio for Figma](https://tokens.studio/) 플러그인 설치 후 `design-tokens.json` Import (색상/폰트/간격이 피그마 스타일로 생성됨)
4. **폰트 설치** — 전체 앱이 [Pretendard](https://github.com/orioncactus/pretendard) 단일 폰트 사용. 저장소 `android/app/src/main/assets/fonts/`에 TTF 9종 포함

## 현재 화면 구성 (screens/)

| 파일 | 화면 | 비고 |
| --- | --- | --- |
| `00-sign-in.png` | 로그인 | Google/Facebook/Kakao + 게스트 진입 |
| `01-discover.png` | Discover (홈) | 세로 스와이프 영상 피드. Review/ALL 토글 |
| `02-products.png` | Products | 상품 목록 |
| `03-try.png` | Try | 체험단 캠페인 (신청 → 리뷰 영상 업로드) |
| `04-activity.png` | Activity | 포인트 + 리뷰 미션 현황 |
| `05-mypage.png` | My Page | 게스트 상태 (로그인 유도) |
| `06-video-page.png` | 영상 상세 | 틱톡 스타일: 우측 액션 레일(좋아요·별점·댓글·북마크·공유), 하단 오버레이 |
| `07-review-detail.png` | 리뷰 상세 | 영상 아래로 스크롤: 6개 항목 별점, 설명, 댓글, Question To Reviewer |

## 핵심 인터랙션 (디자인 시 유지할 것)

- **영상 피드는 세로 스와이프**로 전환 (틱톡/릴스 방식, 최근 좌우→상하로 전환 완료)
- 영상 상세에서 **위로 스와이프/Review 핸들 탭 → 리뷰 상세**로 연결
- 별점은 6개 축 (Brand/Quality/Practical/Convenience/Design/Price)
- 우측 상단 영상 조작(배속·음소거·Relay)과 우측 하단 소셜 액션 레일 분리

## 참고 자산

- 온보딩 이미지 (CDN 교체용 최신본): `../onboarding-assets/`
- 아이콘: `../Resources/img/`, `../Resources/newIcon/`
- 색상·상수 원본 코드: `../Components/Constants/Style.js`

## 알아두면 좋은 것

- `COLOR_BACKGROUND_DARK`는 이름과 달리 현재 `#F4F4F4`(라이트)로 쓰입니다 — 개선 시 네이밍 정리 대상
- 브랜드 컬러 `#FFB731`이 `COLOR_MAIN`, `COLOR_POINT_BLUE`(!), `TIER_COLORS.GIVER` 세 곳에 중복 정의돼 있습니다
- 상태바/시스템 내비게이션은 캡처에 포함돼 있으니 디자인 시 제외하고 보면 됩니다
