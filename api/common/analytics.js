// D19 애널리틱스 공통 래퍼 — 스펙: docs/superpowers/specs/2026-08-10-phase1-analytics-events.md
// 규칙:
//  - 모든 이벤트에 공통 파라미터(role/country/g_band/app_lang) 자동 첨부
//  - PII(주소·전화·이메일·핸들·닉네임) 파라미터 절대 금지 — 코드리뷰 체크 항목
//  - mock 단계에서도 전부 실전송 (소급 불가능한 데이터)
//  - 네이티브 모듈 미빌드 환경(기존 APK)에서도 JS가 죽지 않도록 lazy require + no-op 폴백
import Preference from 'react-native-default-preference';
import { getLanguage } from '../../Components/Strings';

let analyticsModule = null;
let unavailable = false;

function getAnalytics() {
  if (unavailable) {
    return null;
  }
  if (!analyticsModule) {
    try {
      // eslint-disable-next-line global-require
      analyticsModule = require('@react-native-firebase/analytics').default;
    } catch (e) {
      // 네이티브 재빌드 전(구 APK)에는 모듈이 없다 — 조용히 no-op
      unavailable = true;
      return null;
    }
  }
  try {
    return analyticsModule();
  } catch (e) {
    unavailable = true;
    return null;
  }
}

// g_band: 정확값 대신 밴드로만 (이벤트 맵 §0)
export function toGBand(gScore) {
  if (gScore >= 100) {
    return 'g100';
  }
  if (gScore >= 80) {
    return 'g80';
  }
  if (gScore >= 60) {
    return 'g60';
  }
  return 'g50';
}

let cachedCommon = null;

async function commonParams() {
  if (cachedCommon) {
    return cachedCommon;
  }
  const [role, country] = await Promise.all([
    Preference.get('inviteRole'),
    Preference.get('creatorCountry'),
  ]);
  cachedCommon = {
    role: role || 'unknown',
    country: country || 'unknown',
    app_lang: getLanguage(),
  };
  return cachedCommon;
}

// 로그인/게이트 통과 등으로 공통 파라미터가 바뀌면 호출
export function resetAnalyticsContext() {
  cachedCommon = null;
}

export async function logEvent(name, params = {}) {
  try {
    const a = getAnalytics();
    if (!a) {
      return;
    }
    const common = await commonParams();
    await a.logEvent(name, { ...common, ...params });
  } catch (e) {
    // 애널리틱스 실패가 UX를 깨면 안 된다 — 무시
  }
}

export async function setAnalyticsUser(userId, gScore) {
  try {
    const a = getAnalytics();
    if (!a) {
      return;
    }
    if (userId) {
      await a.setUserId(String(userId));
    }
    if (typeof gScore === 'number') {
      await a.setUserProperty('g_band', toGBand(gScore));
    }
  } catch (e) {
    // no-op
  }
}
