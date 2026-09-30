# iOS 검증 결과 — 2026-09-17

대상 커밋: `9a6eb9ddef42b42e50a71e41c85b81b68777a2a7`. Windows에서 수행한 소스 및 번들 검증이다. Xcode 네이티브 빌드, CocoaPods 설치, 서명, 시뮬레이터 및 실기기 실행 성공을 의미하지 않는다. 앱 코드는 변경하지 않았다.

## 통과

- `node node_modules/jest/bin/jest.js --runInBand`: 25개 스위트, 146개 테스트 통과. 네이티브 기능은 mock을 사용하는 테스트이므로 실제 iOS 동작의 증거는 아니다.
- `node scripts/verify-release.js`: 통과. 기존 검사에는 Android 관련 항목도 포함되어 있다.
- `node node_modules/react-native/cli.js bundle --platform ios --dev false --entry-file index.js --bundle-output .harness/ios-validation/main.jsbundle --assets-dest .harness/ios-validation/assets --max-workers 2`: 성공, 에셋 208개 복사. 번들 8,398,510바이트.
- 설치된 React Native의 Windows Hermes 컴파일러로 위 번들을 바이트코드로 변환: 종료 코드 0, `.harness/ios-validation/main.hbc` 11,750,059바이트. 미선언 전역 변수 등의 경고가 출력되었으며 iOS 런타임 실행 검증은 아니다.
- `xcode` 패키지로 `project.pbxproj` 파싱 성공.
- Info.plist, entitlements, PrivacyInfo.xcprivacy 파싱 성공. Node XML 파서가 UTF-8 BOM을 거부하여 메모리에서 BOM을 제거한 뒤 검사했다. 원본은 변경하지 않았다.
- Info.plist에 등록된 폰트 56개 모두 소스 파일 존재 확인. 설치된 앱에서의 렌더링은 미확인.
- AppDelegate의 Release 경로는 앱 내 `main.jsbundle`을 사용한다. Podfile과 EAS 설정 모두 새 아키텍처를 비활성화한다.

## 발견 사항

1. 최소 iOS 버전 불일치: Podfile 및 Pod 타깃 후처리는 16.0, 앱 Debug/Release는 15.6, 테스트 타깃은 12.4, 프로젝트 기본값은 13.0이다. 지원 최소 버전을 정리하고 실제 Xcode 빌드로 확인해야 한다.
2. `ios/Podfile.lock`이 없다. 이번 검증에서는 CocoaPods 의존성 해석과 네이티브 링크를 검증하지 못했다.
3. AppDelegate에 5초 후 부팅 진단 오버레이 및 8초 후 알림 코드가 남아 있다. 느린 정상 부팅에서도 진단 화면이 노출되는지 실기기 확인이 필요하다.

## 기존 원격 빌드

[최근 iOS GitHub Actions 작업](https://github.com/rueseo92-create/greyd-app/actions/runs/35182122016)은 2026-09-17 04:29 UTC에 시작하여 실패했다. 대상 커밋은 `412381e79ded8d19760292ba9be5acc1a94adf4b`로 이번 로컬 검증 대상과 다르다. API 응답에 실행 단계가 없고 로그 조회는 `log not found`를 반환했다. 따라서 앱 컴파일 오류인지 러너/CI 문제인지 확정할 수 없다.

기존 워크플로에는 TestFlight 제출 단계가 포함되어 있다. 이번 검증에서는 워크플로를 실행하거나 배포하지 않았다.

## 남은 실제 iOS 검증

- macOS에서 CocoaPods 설치 및 Xcode Release 빌드.
- iPhone에서 신규 설치와 기존 버전 업데이트 후 콜드 스타트 및 화면 진입 확인.
- 로그인, 딥링크, 알림, 카메라/사진 권한, 영상 재생·업로드 확인.
- 서명된 앱의 entitlements 및 포함 리소스 확인.

판정: JavaScript 번들 및 기존 자동 테스트 통과. iOS 전체 검증 완료 또는 배포 가능 판정은 보류.
