// "관심 없음"으로 숨긴 캠페인 (기획서 §5.1 개인화: 숨김/관심없음 제공). 기기 저장, 되돌리기 가능.
import { prefGetSafe, prefSetSafe } from './prefSafe';

const KEY = 'hiddenCampaignsV1';

export async function getHiddenCampaigns() {
  const raw = await prefGetSafe(KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export async function hideCampaign(campaignId) {
  const current = await getHiddenCampaigns();
  if (current.includes(campaignId)) {
    return current;
  }
  const next = [...current, campaignId];
  await prefSetSafe(KEY, JSON.stringify(next));
  return next;
}

export async function unhideCampaign(campaignId) {
  const current = await getHiddenCampaigns();
  const next = current.filter((id) => id !== campaignId);
  await prefSetSafe(KEY, JSON.stringify(next));
  return next;
}
