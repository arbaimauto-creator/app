// 2차 가공 동의 (2026-09-16) — docs/secondary-use-and-groupbuy-2026-09-16.md P1
// 브랜드가 성과 좋은 리뷰의 2차 가공을 요청하면 앱으로 온다. 작성자는 범위를 보고 동의·거절만 하면 되고,
// 동의할 때 베네핏(판매 인센티브 / 공동구매) 하나를 고른다. 제작·유통·정산은 브랜드·greyd·3PL이 한다.
import FEATURES from '../Components/Constants/Features';
import { getGreydAppId, opsGet, opsPost } from './opsClient';

export const CONSENT_BENEFIT = {
  SALES_INCENTIVE: 'SALES_INCENTIVE',
  GROUP_BUY: 'GROUP_BUY',
};

export const CONSENT_STATE = {
  REQUESTED: 'REQUESTED',
  AGREED: 'AGREED',
  DECLINED: 'DECLINED',
  REVOKED: 'REVOKED',
};

// 서버가 응답하지 않아도 화면이 깨지지 않게 빈 목록으로 떨어뜨린다(다른 ops 호출과 같은 규칙).
export async function getMyConsents() {
  if (!FEATURES.LIVE_OPS_API) {
    return [];
  }
  try {
    const greydAppId = await getGreydAppId();
    const res = await opsGet(`/consents?greydAppId=${encodeURIComponent(greydAppId)}`);
    return Array.isArray(res?.consents) ? res.consents : [];
  } catch (e) {
    return [];
  }
}

export function pendingConsents(consents) {
  return (consents || []).filter((c) => c.state === CONSENT_STATE.REQUESTED);
}

// 동의 — 베네핏을 반드시 고른다. 서버도 같은 조건을 검사한다.
export async function agreeConsent(consentId, benefit) {
  if (!CONSENT_BENEFIT[benefit]) {
    throw new Error('benefit_required');
  }
  const greydAppId = await getGreydAppId();
  return opsPost('/consents', { greydAppId, consentId, action: 'agree', benefit });
}

export async function declineConsent(consentId, reason) {
  const greydAppId = await getGreydAppId();
  return opsPost('/consents', { greydAppId, consentId, action: 'decline', reason });
}

// 철회 — 이미 만들어진 가공물의 처리는 운영이 판단한다(즉시 삭제가 아니다).
export async function revokeConsent(consentId) {
  const greydAppId = await getGreydAppId();
  return opsPost('/consents', { greydAppId, consentId, action: 'revoke' });
}

// 화면에 그대로 쓸 수 있는 범위 설명 — 매체·국가·기간·편집을 한 문장씩.
export function describeScope(scope, strings) {
  const s = scope || {};
  const mediaLabels = {
    OWNED_MALL: strings.CONSENT_MEDIA_OWNED_MALL,
    MARKETPLACE: strings.CONSENT_MEDIA_MARKETPLACE,
    PAID_ADS: strings.CONSENT_MEDIA_PAID_ADS,
    APP_FEED: strings.CONSENT_MEDIA_APP_FEED,
  };

  const media = (s.media || []).map((m) => mediaLabels[m] || m);
  const countries = (s.countries || []).length
    ? s.countries.join(', ')
    : strings.CONSENT_SCOPE_ANY_COUNTRY;

  return [
    strings.CONSENT_SCOPE_MEDIA(media.length ? media.join(', ') : strings.CONSENT_SCOPE_NONE),
    strings.CONSENT_SCOPE_COUNTRIES(countries),
    strings.CONSENT_SCOPE_MONTHS(s.months ?? 12),
    s.editAllowed ? strings.CONSENT_SCOPE_EDIT_ON : strings.CONSENT_SCOPE_EDIT_OFF,
  ];
}
