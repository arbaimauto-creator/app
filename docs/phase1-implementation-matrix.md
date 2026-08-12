# GREYD Phase 1 구현 매트릭스

기준일: 2026-08-12
정본: `docs/superpowers/specs/2026-08-10-greyd-phase1-v2-design.md`

## 범위 원칙

- 모바일 앱 구현 범위는 인플루언서 화면 01~27이다.
- D26 최신 결정에 따라 브랜드 화면 28~34는 앱 진입을 차단하고 ops 웹으로 제공한다.
- 운영 화면 35~40은 별도 greyd-ops 저장소의 범위다.
- 파일이 존재하는 것만으로 완료 처리하지 않는다. 화면 진입, 상태 전이, 저장/API, 실패 복구, 뒤로가기, 테스트가 모두 확인돼야 `완료`다.

## 인플루언서 화면 01~27

| # | 디자인 화면 | 코드 표면 | 판정 | 남은 검증/작업 |
|---|---|---|---|---|
| 01 | 소셜 로그인 | `screens/SignInScreen` | 부분 구현 | 신규가입 포함 게이트 상태 보존, provider별 실패·취소 회귀 |
| 02 | 초대 게이트 | `screens/InviteGateScreen/index.js` | 부분 구현 | iOS 실기기 저장·전환 검증, 중복 탭 수정 통합 |
| 03 | 게이트 스텝 2 | 02 화면의 국가 선택에 통합 | 구현 | 닉네임은 소셜/프로필 정책과 중복되어 최신 D28/D29 기준 통합 |
| 04 | 온보딩 검증 루프 | `CreatorOnboarding` | 부분 구현 | 완료 저장 실패, 중복 제출, 재진입 복구 처리 |
| 05 | 온보딩 구조 | `CreatorOnboarding` | 부분 구현 | 동일 |
| 06 | 온보딩 첫 행동 | `CreatorOnboarding` | 부분 구현 | 동일 |
| 07 | 프로필 폼 | `CreatorOnboarding`, `api/creators.js` | 부분 구현 | 필수값 오류 안내, 저장/ops 동기화 상태, 재시도 |
| 08 | 큐레이션 홈 | `screens/HomeScreen/CuratedHome.js` | 부분 구현 | 빈 상태·API 실패·캠페인/피드 진입 E2E |
| 08b | 리뷰 피드 | `Components/MainScreen.js`, `SliderEntry.js` | 부분 구현 | 홈 복귀, iOS 선로딩·메모리 실기기 검증 |
| 09 | Try 목록 | `screens/TryScreen/index.js` | 부분 구현 | 실API 실패/빈 상태, 신청 자격과 동시 한도 검증 |
| 10 | 캠페인 상세·신청 시트 | `CampaignDetail.js` | 부분 구현 | 서약·어필·중복 신청·실패 복구 E2E |
| 11 | 신청 완료 | `ApplyDone.js` | 부분 구현 | 자동확정/승인대기별 다음 단계와 복귀 경로 |
| 12 | 주소 입력 모달 | `ActivityScreen/AddressModal.js` | 부분 구현 | 48시간·관세 고지, 저장 재사용, 취소 경로 |
| 13 | 활동 진행 카드 | `ActivityScreen/index.js` | 부분 구현 | 8단계 상태머신 전이와 ops 정합 |
| 14 | 활동 빈 상태 | `ActivityScreen/index.js` | 부분 구현 | 열린 캠페인 CTA 실제 진입 검증 |
| 15 | 업로드 | `AddingNewVideoScreen`, `ReviewLinkSubmit.js` | 부분 구현 | 앱 업로드/외부 링크 분기, 중복 제출·실패 복구 |
| 16 | 완주 보상 | `MissionDone.js` | 부분 구현 | done 진입, 포인트/G-score 단일 지급 보장 |
| 17 | 추천 코드 공유 | `MissionDone.js`/My 관련 UI | 부분 구현 | OS 공유, 3장 소진 상태, 재진입 |
| 18 | My | `screens/MyScreen/index.js` | 부분 구현 | 실제 상태와 점수·포인트·이력 일치 |
| 19 | 배송지 관리 | `AddressBook.js` | 부분 구현 | 12번과 동일 저장소 사용 및 기본 주소 반영 |
| 20 | About | `AboutScreen.js` | 구현 | 사업자 정보 최신성 확인 필요 |
| 21 | 로컬 리마인더 | `ActivityScreen/reminders.js` | 부분 구현 | iOS 권한별 예약/취소와 상태변경 중복 방지 |
| 22 | 알림 권한 요청 | Activity 수령 흐름 | 부분 구현 | 수령 직후 노출, 거부 배너·설정 이동 실기기 검증 |
| 23 | 취소 확인 | Activity 흐름 | 부분 구현 | shipped 전후 정책과 cancelled 영속화 검증 |
| 24 | 완주 히스토리 | Activity 진행/완료 세그먼트 | 부분 구현 | done/cancelled/no_show 및 피드백 재열람 |
| 25 | 설정·계정 삭제 | `MyScreen/SettingsScreen.js` | 부분 구현 | 진행 미션 가드, 실제 삭제 API, 로그인 상태 초기화 |
| 26 | 프로필/채널 보강(D29) | `CreatorOnboarding`, `api/channels.js` | 부분 구현 | 3채널 저장 및 ops 실측 우선 병합 검증 |
| 27 | FGI 2-touch | `FirstImpression.js`, `FgiSurvey.js` | 부분 구현 | 수령→첫인상, 업로드→본설문 강제 순서 및 복구 |

## 완료 판정 게이트

각 퍼널은 아래 항목이 모두 통과될 때만 완료로 바꾼다.

1. 디자인의 정상·빈·로딩·오류 상태가 존재한다.
2. 내비게이션 진입과 뒤로가기/재실행 복구가 된다.
3. 버튼 연타가 상태 전이나 보상을 중복 실행하지 않는다.
4. 로컬 저장/API 실패가 무한 로딩이나 흰 화면을 만들지 않는다.
5. iOS release 번들 및 TestFlight 실기기 시나리오를 통과한다.

## 구현 순서

1. 진입: 초대 → 로그인 → 온보딩 → 프로필 → 홈
2. 신청: 홈/Try → 상세 → 신청 → 주소 → 완료
3. 이행: 배송 → 수령 → 첫인상 → 업로드/FGI → 보상
4. 유지: 히스토리 → 추천 → My/설정 → 알림/취소
