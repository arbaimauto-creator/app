// 추적 코드 클릭 집계 + 공동구매 조회·참여 (2026-09-16 P2·P3) — ops /api/mobile/track-click, /groupbuys/:code
// 클릭은 기기당 코드당 하루 한 번만 보낸다(같은 링크를 여러 번 눌러도 소재 성과가 부풀지 않게).
import FEATURES from '../Components/Constants/Features';
import { isTrackingCode } from '../Components/utils/tracking';
import { opsGet, opsPost } from './opsClient';
import { OPS_API_BASE } from './opsRuntimeConfig';
import { prefGetSafe, prefSetSafe } from './prefSafe';

const CLICK_SENT_KEY = 'trackingClickSentV1';
const CLICK_DEDUPE_MS = 24 * 60 * 60 * 1000;

export async function reportTrackingClick(code, now = Date.now()) {
  if (!FEATURES.LIVE_OPS_API || !isTrackingCode(code)) {
    return false;
  }
  let sent = {};
  try {
    sent = JSON.parse((await prefGetSafe(CLICK_SENT_KEY)) || '{}') || {};
  } catch (e) {
    sent = {};
  }
  if (sent[code] && now - Number(sent[code]) < CLICK_DEDUPE_MS) {
    return false;
  }
  try {
    await opsPost('/track-click', { trackingCode: code });
  } catch (e) {
    // 집계 실패는 사용자 흐름을 막지 않는다 — 다음 진입에서 다시 시도
    return false;
  }
  // 오래된 항목은 정리해 저장소가 자라지 않게 한다
  const next = Object.fromEntries(
    Object.entries(sent).filter(([, at]) => now - Number(at) < CLICK_DEDUPE_MS),
  );
  next[code] = now;
  await prefSetSafe(CLICK_SENT_KEY, JSON.stringify(next));
  return true;
}

export const EMPTY_GROUP_BUY = null;

// ops는 상품 이미지를 자기 오리진 상대경로(/api/files/<key>)로 준다 — 앱에서 열 수 있게 절대 URL로
export function absoluteOpsUrl(url, base = OPS_API_BASE) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  if (/^https?:\/\//.test(url)) {
    return url;
  }
  const origin = (String(base || '').match(/^https?:\/\/[^/]+/) || [''])[0];
  return origin ? `${origin}${url.startsWith('/') ? '' : '/'}${url}` : url;
}

export function normalizeGroupBuy(raw) {
  const gb = raw?.groupBuy || raw;
  if (!gb || !gb.id) {
    return null;
  }
  return {
    id: gb.id,
    title: gb.title || '',
    countries: Array.isArray(gb.countries) ? gb.countries : [],
    price: Number(gb.price || 0),
    currency: gb.currency || 'KRW',
    minQuantity: Number(gb.minQuantity || 0),
    joinedQuantity: Number(gb.joinedQuantity || 0),
    intentQuantity: Number(gb.intentQuantity || 0),
    clicks: Number(gb.clicks || 0),
    startsAt: gb.startsAt || null,
    endsAt: gb.endsAt || null,
    state: gb.state || 'OPEN',
    productRef: gb.productRef || null,
    incentivePercent: Number(gb.incentivePercent || 0),
    brandName: gb.brandName || '',
    campaignName: gb.campaignName || '',
    sellerProduct: gb.sellerProduct
      ? { ...gb.sellerProduct, imageUrl: absoluteOpsUrl(gb.sellerProduct.imageUrl) }
      : null,
    myJoin: gb.myJoin && gb.myJoin.quantity ? gb.myJoin : null,
  };
}

// 참여 가능 여부 — OPEN·REACHED이고 기간 안일 때만
export function canJoinGroupBuy(gb, now = Date.now()) {
  if (!gb) {
    return false;
  }
  if (gb.state !== 'OPEN' && gb.state !== 'REACHED') {
    return false;
  }
  if (gb.endsAt && new Date(gb.endsAt).getTime() < now) {
    return false;
  }
  return true;
}

export async function getGroupBuy(code) {
  if (!FEATURES.LIVE_OPS_API || !isTrackingCode(code)) {
    return null;
  }
  const res = await opsGet(`/groupbuys/${encodeURIComponent(code)}`);
  return normalizeGroupBuy(res);
}

export async function joinGroupBuy(code, quantity, country) {
  const qty = Math.max(1, Math.min(99, Math.round(Number(quantity) || 1)));
  return opsPost(`/groupbuys/${encodeURIComponent(code)}/join`, {
    quantity: qty,
    country: country || null,
  });
}

export async function cancelGroupBuyJoin(code) {
  return opsPost(`/groupbuys/${encodeURIComponent(code)}/join`, { cancel: true });
}
