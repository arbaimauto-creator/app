// 탈퇴·로그아웃 시 기기 잔존 PII·상태 클리어 (보안 감사 H7)
// 평문 SharedPreferences에 남는 주소·전화·프로필·시딩을 반드시 지운다.
import Preference from 'react-native-default-preference';

const GREYD_PII_KEYS = [
  'savedAddressV2', // 배송 주소·전화 (PII)
  'seedingsV2', // 시딩 상태 + 주소 사본 (PII)
  'creatorProfileV2', // 핸들·G-스코어·인구통계
  'offersV2', // 제안형 시딩 응답 기록 (D25)
  'onboardingBonusGranted',
  'notifPromptShown',
];

// 게이트 통과 상태 — 계정이 아니라 기기 상태. 초대 코드는 유효 7일·1회성이라
// 로그아웃마다 지우면 재입장이 막힌다. 계정 삭제 때만 함께 지운다.
const GREYD_GATE_KEYS = [
  'inviteRole',
  'inviteCode',
  'inviteBrandId',
  'inviteBrandName',
  'greydAppId', // 기기 식별자 — 계정 삭제 시에만 재발급 (ops 골든 레코드 연동 키)
  'opsToken', // ops 세션 토큰 — 게이트 재통과 시 재발급
];

export async function clearGreydLocalData({ keepGate = false } = {}) {
  const keys = keepGate ? GREYD_PII_KEYS : [...GREYD_PII_KEYS, ...GREYD_GATE_KEYS];
  await Promise.all(keys.map((key) => Preference.set(key, '')));
}
