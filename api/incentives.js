// 내 2차 활용 현황 (2026-09-16 P2·P3) — ops /api/mobile/incentives.
// 가공물 성과·인센티브·공동구매 진행률을 읽기만 한다. 제작·운영·정산은 브랜드·greyd 몫이다.
import FEATURES from '../Components/Constants/Features';
import { opsGet } from './opsClient';

export const EMPTY_INCENTIVES = {
  assets: [],
  grants: [],
  groupBuys: [],
  totals: { pending: 0, approved: 0, paid: 0 },
};

export async function getMyIncentives() {
  if (!FEATURES.LIVE_OPS_API) {
    return EMPTY_INCENTIVES;
  }
  try {
    const res = await opsGet('/incentives');
    return {
      assets: Array.isArray(res?.assets) ? res.assets : [],
      grants: Array.isArray(res?.grants) ? res.grants : [],
      groupBuys: Array.isArray(res?.groupBuys) ? res.groupBuys : [],
      totals: { ...EMPTY_INCENTIVES.totals, ...(res?.totals || {}) },
    };
  } catch (e) {
    return EMPTY_INCENTIVES;
  }
}

export function hasAnyIncentiveActivity(data) {
  const d = data || EMPTY_INCENTIVES;
  return d.assets.length > 0 || d.grants.length > 0 || d.groupBuys.length > 0;
}

// 공동구매 진행률 0~1 — 최소 수량 대비. 성사(REACHED 이후)는 1로 고정.
export function groupBuyProgress(gb) {
  if (!gb || !gb.minQuantity) {
    return 0;
  }
  if (['REACHED', 'SHIPPING', 'DONE'].includes(gb.state)) {
    return 1;
  }
  return Math.max(0, Math.min(1, (gb.joinedQuantity || 0) / gb.minQuantity));
}

export function daysLeftUntil(iso, now = new Date()) {
  if (!iso) {
    return null;
  }
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) {
    return null;
  }
  return Math.max(0, Math.ceil((end - now.getTime()) / 86400000));
}
