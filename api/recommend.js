// 캠페인 추천 정렬 (기획서 §5.1 개인화): 프로필·참여 이력·마감 임박도를 조합해 정렬하고,
// 왜 추천됐는지(reasons)를 카드에 그대로 보여준다. 숨김(관심 없음)은 목록에서 뺀다.
// 순수 함수 — 화면과 테스트가 같은 결과를 본다.
import { CURATED_MIN_G } from '../screens/TryScreen/points';
import { closedReason, daysToDeadline } from './campaignMeta';
import { isActiveSeeding, SEEDING_STATUS } from './seedings';
import { daysLeft } from '../screens/ActivityScreen/missionLogic';

export const REASON = {
  COUNTRY: 'country',
  DEADLINE: 'deadline',
  UNLOCKED: 'unlocked',
  BRAND_AGAIN: 'brand_again',
  FIRST: 'first',
  POINTS: 'points',
  NEW: 'new',
};

const DEADLINE_SOON_DAYS = 7;

export function scoreCampaign(campaign, ctx) {
  const { profile, seedings = {}, now = new Date() } = ctx;
  const gScore = profile?.gScore ?? 50;
  const completedCount = profile?.completedCount ?? 0;
  const reasons = [];
  let score = 0;

  const countries = Array.isArray(campaign.countries) ? campaign.countries : [];
  if (profile?.country && countries.includes(profile.country)) {
    score += 40;
    reasons.push(REASON.COUNTRY);
  } else if (countries.length && profile?.country) {
    // 내 국가로 배송이 안 되면 뒤로 — 카드 정보에서 조건 불일치가 보인다
    score -= 30;
  }

  const left = daysToDeadline(campaign, now);
  if (left != null && left >= 0 && left <= DEADLINE_SOON_DAYS) {
    score += 25 - left * 2;
    reasons.push(REASON.DEADLINE);
  }

  const isCurated = campaign.applyMode === 'curated';
  const curatedUnlocked = gScore >= CURATED_MIN_G || completedCount >= 2;
  if (isCurated) {
    if (curatedUnlocked) {
      score += 15;
      reasons.push(REASON.UNLOCKED);
    } else {
      score -= 20; // 잠긴 카드는 보여주되 뒤로
    }
  } else if (completedCount === 0) {
    score += 20;
    reasons.push(REASON.FIRST);
  }

  const brandRepeat = Object.values(seedings).some(
    (s) => s.status === 'done' && s.brandId && s.brandId === campaign.brandId,
  );
  if (brandRepeat) {
    score += 12;
    reasons.push(REASON.BRAND_AGAIN);
  }

  const base = campaign.basePoints ?? campaign.rewardPoint ?? 0;
  if (base >= 700) {
    score += 8;
    reasons.push(REASON.POINTS);
  }

  return { score, reasons: reasons.slice(0, 2) };
}

// → [{ campaign, score, reasons }] 점수 내림차순. 마감·숨김·진행 중인 캠페인 제외.
export function rankCampaigns(campaigns, ctx = {}) {
  const { seedings = {}, hidden = [], now = new Date() } = ctx;
  const hiddenSet = new Set(hidden);
  return (Array.isArray(campaigns) ? campaigns : [])
    .filter((c) => c && c.id && !hiddenSet.has(c.id))
    .filter((c) => closedReason(c, now) == null)
    .filter((c) => !isActiveSeeding(seedings[c.id]))
    .map((campaign) => ({ campaign, ...scoreCampaign(campaign, { ...ctx, now }) }))
    .sort((a, b) => b.score - a.score);
}

// 진행 중 미션 → 홈 "지금 할 일" 스트립 항목. 우선순위: 행동이 필요한 것부터.
export function buildTodoItems(seedings, campaigns, now = new Date()) {
  const byId = Object.fromEntries((campaigns || []).map((c) => [c.id, c]));
  const items = [];
  for (const s of Object.values(seedings || {})) {
    const campaign = byId[s.campaignId];
    if (!campaign || !isActiveSeeding(s)) {
      continue;
    }
    let action = null;
    let order = 9;
    if (s.status === SEEDING_STATUS.APPROVED && !s.address) {
      action = 'address';
      order = 0;
    } else if (s.status === SEEDING_STATUS.SHIPPED) {
      action = 'receive';
      order = 1;
    } else if (s.status === SEEDING_STATUS.RECEIVED) {
      action = 'upload';
      order = 2;
    } else if (s.status === SEEDING_STATUS.REVIEWING) {
      action = 'wait_brand';
      order = 5;
    } else if (s.status === SEEDING_STATUS.APPLIED || s.status === SEEDING_STATUS.APPROVED) {
      action = 'wait';
      order = 6;
    }
    // 업로드 기한(14일 + 연장 7일)은 Activity 카드와 같은 규칙(missionLogic.daysLeft)을 쓴다
    const dayLeft = daysLeft(s, now);
    items.push({
      campaignId: s.campaignId,
      title: campaign.title,
      brand: campaign.brand,
      status: s.status,
      action,
      order,
      dayLeft,
    });
  }
  return items.sort((a, b) => a.order - b.order || (a.dayLeft ?? 99) - (b.dayLeft ?? 99));
}
