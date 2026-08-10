// 크리에이터 프로필 mock 스텁 — 서버 연동 시 함수 본문만 교체.
// 스키마 원칙(v2 §6): 리포트 역산 필드만 수집, 밴드형 인구통계, 자가신고 표기.
import Preference from 'react-native-default-preference';

const PROFILE_KEY = 'creatorProfileV2';

// 프로필: { country, ageBand, gender, primaryPlatform, handleUrl,
//           followerBand, followerSnapshot, contentCategories[], skinType,
//           gScore, strikes, completedCount, onboardedAt }
export async function getCreatorProfile() {
  const raw = await Preference.get(PROFILE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export async function saveCreatorProfile(profile) {
  const existing = (await getCreatorProfile()) || {};
  const merged = {
    gScore: 50, // G-스코어 시작값 (v2 §4-4)
    strikes: 0,
    completedCount: 0,
    ...existing,
    ...profile,
  };
  await Preference.set(PROFILE_KEY, JSON.stringify(merged));
  return merged;
}

export async function adjustGScore(delta) {
  const profile = (await getCreatorProfile()) || {};
  const next = Math.max(0, (profile.gScore ?? 50) + delta);
  return saveCreatorProfile({ ...profile, gScore: next });
}
