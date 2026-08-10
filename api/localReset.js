// 탈퇴·로그아웃 시 기기 잔존 PII·상태 클리어 (보안 감사 H7)
// 평문 SharedPreferences에 남는 주소·전화·프로필·시딩을 반드시 지운다.
import Preference from 'react-native-default-preference';

const GREYD_LOCAL_KEYS = [
  'savedAddressV2', // 배송 주소·전화 (PII)
  'seedingsV2', // 시딩 상태 + 주소 사본 (PII)
  'creatorProfileV2', // 핸들·G-스코어·인구통계
  'inviteRole',
  'inviteBrandName',
  'onboardingBonusGranted',
  'notifPromptShown',
];

export async function clearGreydLocalData() {
  await Promise.all(GREYD_LOCAL_KEYS.map((key) => Preference.set(key, '')));
}
