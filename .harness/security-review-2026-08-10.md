# greyd 보안 검증 보고서 (2026-08-10)

3개 영역 병렬 감사: ① 비밀키·네이티브 설정 ② 인증·클라이언트 데이터 ③ 웹·API 표면.
범례: 심각도 [Critical]>[High]>[Medium]>[Low] · (지금) = mock 단계에서도 즉시 수정 · (서버) = 서버 이관 시 필수 반영.

## Critical

| # | 항목 | 위치 | 조치 |
|---|---|---|---|
| C1 | **Sentry 조직 인증 토큰이 git에 커밋·추적됨** (`sntrys_...`) | android/sentry.properties:1, ios/sentry.properties:5 | (지금) Sentry에서 토큰 즉시 폐기·재발급 → 파일 untrack + .gitignore. 비공개 레포지만 이력에 남으므로 폐기가 근본 조치 |
| C2 | **웹 Admin/브랜드 게이트 전면 우회 가능** — sessionStorage 한 줄(`adminOk=1`)로 운영 콘솔 접근, ADMIN_CODE/INVITE_CODES 번들 평문, `campaigns.filter(... \|\| true)`로 브랜드 격리 무효 | web/src/App.jsx:37·105·334, Admin.jsx:13, mock.js:4-9 | (지금) `\|\| true` 제거. (서버) 서버 세션 인증 + brandId 서버 필터링 전까지 **실데이터·공개 URL 배포 금지** (내부 mock 데모 전용) |

## High

| # | 항목 | 위치 | 조치 |
|---|---|---|---|
| H1 | 하드코딩 게스트 JWT = 공유 백도어 계정 (2022년 만료 토큰을 서버가 수용 → 서버가 idToken 서명·만료 미검증 시사) | screens/SignInScreen/commonHelperFunction.js:31-32 | (서버) 서버 발급 익명 세션으로 교체, idToken 서명·만료 검증 |
| H2 | PayPal REST **시크릿**이 루트 .env에 평문 (git 미추적이나 클라 레포에 서버 시크릿 존재) | .env:2 | (지금) 시크릿 로테이션 후 파일에서 삭제, 서버에만 보관 |
| H3 | KovanPay 결제 서명 시크릿키 앱 하드코딩 — 결제요청 위조 가능 | Components/PayScreen.js:182 | (서버) checkHash 서명을 서버 생성으로 이전 (커머스 재개 전 필수) |
| H4 | `android:usesCleartextTraffic="true"` — 전 도메인 HTTP 허용 | AndroidManifest.xml:78 | (지금) 제거 또는 networkSecurityConfig로 필요한 도메인만 허용 |
| H5 | IDOR 표면 — userId/buyerId 등 대상 식별자를 클라 파라미터로 전송 (수익 조회·정산 계좌 변경·탈퇴·프로필 수정 등 40+ API) | APIprovider.js:1220·1235·1447·1491·1652 등 | (서버) 모든 대상 식별자를 인증 토큰에서 도출, 파라미터 불일치 거부 |
| H6 | 포인트·G-스코어·상태 전이·동시 한도가 전부 클라이언트 계산·저장 (평문 Preference) — 조작으로 지급액·등급 위조 가능 | api/creators.js, api/seedings.js, TryScreen/points.js, ActivityScreen | (서버) 완료 판정·포인트·G-스코어·상태 전이·한도·보너스·Strike 전부 서버 확정, 클라는 표시만 |
| H7 | 탈퇴 시 로컬 PII 미삭제 — 주소·전화·프로필·시딩이 기기에 잔존 | screens/MyScreen/SettingsScreen.js (탈퇴 플로우), utils/index.js menuLogout | (지금) 탈퇴·로그아웃 시 savedAddressV2/seedingsV2/creatorProfileV2/inviteRole 등 클리어 |

## Medium

- **M1** allowBackup="true" + 평문 SharedPreferences(주소·전화·토큰) → adb/클라우드 백업으로 유출 가능 — AndroidManifest.xml:75. (지금) allowBackup=false 또는 백업 제외 규칙 + PII·토큰은 Keystore 암호화 저장
- **M2** 딥링크 무검증 — `greyd://` 임의 경로 라우팅 + 외부 링크 진입만으로 게스트 세션 자동 생성 — utils/linking.js:52-172. (지금) 라우트 화이트리스트, 링크發 세션 생성 금지
- **M3** 초대 코드 클라 하드코딩(GREYD1 등) + 무차별 대입 무방비 — api/invites.js:3-8. (서버) 서버 검증 + 레이트리밋 + 1회성·만료
- **M4** 릴리스 서명이 debug.keystore(비번 'android') — gradle.properties. (지금) 실제 릴리스 키 + CI 시크릿
- **M5** 서버 에러 원문을 Alert로 노출 (40+ 곳) — APIprovider 500 errorMsg 패스스루. (서버) 코드 매핑 메시지만 표시
- **M6** 결제 금액 클라 계산 + WebView originWhitelist '*' + postMessage origin 미검증 — MakeOrderScreen/PayScreen/PayPaypalScreen. (서버) 승인 시 서버 재계산, origin 한정
- **M7** 업로드 서명 URL에 타입·크기 조건 없음, 1GB 검사도 경고 후 진행 — getSignedUrl/UploadVideo.js:120. (서버) 서명 정책에 조건 포함 + 업로드 후 메타 검증
- **M8** 토큰이 GET 쿼리스트링으로 전송(로그 잔존) + 인증 이원화 — APIprovider.js:47. (서버) 전 구간 헤더 토큰 + 만료·회전

## Low / Info

- 토큰 콘솔 로그(APIprovider.js:31-32) — babel transform-remove-console이 릴리스에서 제거하나 소스에서 삭제 권장
- DOWNLOAD_URL이 http (Constants/index.js:11) → https
- 미사용 권한 정리(LOCATION/RECORD_AUDIO/WRITE_EXTERNAL_STORAGE) — 심사 리스크 겸
- Firebase/Kakao 클라이언트 키는 정상 범위 — 콘솔에서 패키지·키해시 제한 확인 권장
- AppCenter 시크릿(서비스 종료) 제거 권장
- XSS: dangerouslySetInnerHTML 사용 0건, JSX 이스케이프 경로 — 표면 낮음
- 레이트리밋 필수 엔드포인트 목록: 로그인·초대/프로모션 코드 검증·중복확인/열거·정산/탈퇴·신고·결제 시도

## 종합

- 앱 심사·데모 단계(현재): C1·H2(비밀 로테이션), H4, H7, M1, M2, M4가 "지금" 조치 대상.
- 서버 이관 설계에 반드시 포함: H1·H5·H6(신뢰 경계를 서버로), M3(코드 검증), M5~M8, 레이트리밋.
- 웹 대시보드는 서버 인증 전까지 실데이터 금지 (C2).
