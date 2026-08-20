// 크리에이터 프로필 — 인구통계·채널은 로컬(온보딩 입력), 스탯은 서버가 정본.
// LIVE_OPS_API ON이면 gScore/strikes/completedCount/포인트를 GET /me로 덮어쓴다:
// 재설치·기기 변경에도 서버 값이 살아남고, 로컬 mock 지급은 표시용 낙관치가 된다.
// 스키마 원칙(v2 §6): 리포트 역산 필드만 수집, 밴드형 인구통계, 자가신고 표기.
import Preference from 'react-native-default-preference';
import FEATURES from '../Components/Constants/Features';
import { opsGet } from './opsClient';

const PROFILE_KEY = 'creatorProfileV2';

// /me는 프로필 조회마다 부르기엔 잦다(홈·Try·Activity·마이가 포커스마다 호출).
// 60초 캐시 — 완주 직후에는 refreshServerStats()로 즉시 무효화한다.
let meCache = { at: 0, data: null };
const ME_TTL_MS = 60 * 1000;

async function fetchServerStats(force = false) {
  if (!FEATURES.LIVE_OPS_API) {
    return null;
  }
  const now = Date.now();
  if (!force && meCache.data && now - meCache.at < ME_TTL_MS) {
    return meCache.data;
  }
  try {
    const greydAppId = await Preference.get('greydAppId');
    const query = greydAppId ? `?greydAppId=${encodeURIComponent(greydAppId)}` : '';
    const me = await opsGet(`/me${query}`);
    if (me && typeof me.gScore === 'number') {
      meCache = { at: now, data: me };
      return me;
    }
  } catch (e) {
    // 서버 미도달 — 로컬 값으로 계속 (다음 호출에서 재시도)
  }
  return meCache.data;
}

export function refreshServerStats() {
  meCache = { at: 0, data: null };
}

// 프로필: { country, ageBand, gender, primaryPlatform, handleUrl,
//           followerBand, followerSnapshot, contentCategories[], skinType,
//           gScore, strikes, completedCount, onboardedAt }
export async function getCreatorProfile() {
  const raw = await Preference.get(PROFILE_KEY);
  let local = null;
  if (raw) {
    try {
      local = JSON.parse(raw);
    } catch (e) {
      local = null;
    }
  }
  const server = await fetchServerStats();
  if (!server) {
    return local;
  }
  // 서버가 스탯 정본 — 로컬 지급(낙관치)은 서버 반영 전까지의 표시용이므로
  // exists:true(서버에 레코드 있음)일 때만 덮어쓴다. 새 기기는 로컬 온보딩 값 유지.
  if (!server.exists) {
    return local;
  }
  return {
    ...(local || {}),
    gScore: server.gScore,
    strikes: server.strikes,
    completedCount: server.completedCount,
    rewardPoints: server.points,
  };
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
