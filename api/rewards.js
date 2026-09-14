// 보상 상태 원장 (기획서 §5.4): 예정 · 검수 중 · 확정 · 지급 완료 · 취소를 시딩 상태에서 유도하고
// 변경 사유를 함께 기록한다. 서버 지급 원장이 붙기 전까지의 단일 파생 소스. 순수 함수.
import { personalizedPoints } from '../screens/TryScreen/points';
import { SEEDING_STATUS } from './seedings';

export const REWARD_STATE = {
  EXPECTED: 'expected',
  REVIEWING: 'reviewing',
  CONFIRMED: 'confirmed',
  PAID: 'paid',
  CANCELLED: 'cancelled',
};

const ORDER = {
  [REWARD_STATE.REVIEWING]: 0,
  [REWARD_STATE.EXPECTED]: 1,
  [REWARD_STATE.CONFIRMED]: 2,
  [REWARD_STATE.PAID]: 3,
  [REWARD_STATE.CANCELLED]: 4,
};

// → [{ campaignId, title, state, points, reason, at }]
export function buildRewardLedger(seedings = {}, campaigns = [], profile = null, opts = {}) {
  const byId = Object.fromEntries((campaigns || []).map((c) => [c.id, c]));
  const gScore = profile?.gScore ?? 50;
  const entries = [];
  for (const s of Object.values(seedings)) {
    const campaign = byId[s.campaignId];
    const base = campaign?.basePoints ?? campaign?.rewardPoint ?? 0;
    const expected = base ? personalizedPoints(base, gScore) : null;
    const title = campaign?.title || s.campaignId;
    let entry = null;
    switch (s.status) {
      case SEEDING_STATUS.APPLIED:
      case SEEDING_STATUS.APPROVED:
      case SEEDING_STATUS.SHIPPED:
      case SEEDING_STATUS.RECEIVED:
        entry = {
          state: REWARD_STATE.EXPECTED,
          points: expected,
          reason: 'in_progress',
          at: s.appliedAt,
        };
        break;
      case SEEDING_STATUS.REVIEWING:
        entry = {
          state: REWARD_STATE.REVIEWING,
          points: expected,
          reason: 'brand_review',
          at: s.uploadedAt,
        };
        break;
      case SEEDING_STATUS.DONE:
        if (s.paidAt) {
          entry = {
            state: REWARD_STATE.PAID,
            points: s.pointsGranted ?? expected,
            reason: 'paid',
            at: s.paidAt,
          };
        } else if (s.pointsGranted != null) {
          entry = {
            state: REWARD_STATE.CONFIRMED,
            points: s.pointsGranted,
            reason: s.graceUsed || s.grace ? 'grace_discount' : 'confirmed',
            at: s.doneAt,
          };
        } else {
          entry = {
            state: REWARD_STATE.REVIEWING,
            points: expected,
            reason: 'brand_review',
            at: s.doneAt,
          };
        }
        break;
      case SEEDING_STATUS.CANCELLED:
        entry = {
          state: REWARD_STATE.CANCELLED,
          points: 0,
          reason: 'self_cancel',
          at: s.cancelledAt,
        };
        break;
      case SEEDING_STATUS.NO_SHOW:
        entry = { state: REWARD_STATE.CANCELLED, points: 0, reason: 'no_show', at: s.noShowAt };
        break;
      default:
        break;
    }
    if (entry) {
      entries.push({ campaignId: s.campaignId, title, ...entry });
    }
  }
  if (opts.onboardingBonus) {
    entries.push({
      campaignId: '__onboarding',
      title: null,
      state: REWARD_STATE.CONFIRMED,
      points: 50,
      reason: 'onboarding',
      at: profile?.onboardedAt || null,
    });
  }
  return entries.sort(
    (a, b) =>
      ORDER[a.state] - ORDER[b.state] || String(b.at || '').localeCompare(String(a.at || '')),
  );
}

export function ledgerTotals(entries) {
  const sum = (state) =>
    entries.filter((e) => e.state === state).reduce((acc, e) => acc + (e.points || 0), 0);
  return {
    expected: sum(REWARD_STATE.EXPECTED) + sum(REWARD_STATE.REVIEWING),
    confirmed: sum(REWARD_STATE.CONFIRMED) + sum(REWARD_STATE.PAID),
    pendingCount: entries.filter((e) => e.state === REWARD_STATE.REVIEWING).length,
  };
}
