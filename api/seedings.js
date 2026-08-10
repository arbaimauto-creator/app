// 시딩(미션 인스턴스) mock 스텁 — 상태머신 8종의 로컬 영속 계층.
// enum: applied → approved → shipped → received → reviewing → done
//       approved → cancelled (무페널티) / received → no_show (Strike)
import Preference from 'react-native-default-preference';

const KEY = 'seedingsV2';

export const SEEDING_STATUS = {
  APPLIED: 'applied',
  APPROVED: 'approved',
  SHIPPED: 'shipped',
  RECEIVED: 'received',
  REVIEWING: 'reviewing',
  DONE: 'done',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
};

export async function getSeedings() {
  const raw = await Preference.get(KEY);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

async function persist(seedings) {
  await Preference.set(KEY, JSON.stringify(seedings));
  return seedings;
}

// seeding: { campaignId, status, appliedAt, approvedAt, shippedAt, receivedAt,
//            uploadedAt, pledgeChecked, appealText, address, trackingNo, extensionUsed }
export async function upsertSeeding(campaignId, patch) {
  const seedings = await getSeedings();
  seedings[campaignId] = { campaignId, ...(seedings[campaignId] || {}), ...patch };
  return persist(seedings);
}

export async function setSeedingStatus(campaignId, status) {
  const stampField = {
    [SEEDING_STATUS.APPLIED]: 'appliedAt',
    [SEEDING_STATUS.APPROVED]: 'approvedAt',
    [SEEDING_STATUS.SHIPPED]: 'shippedAt',
    [SEEDING_STATUS.RECEIVED]: 'receivedAt',
    [SEEDING_STATUS.REVIEWING]: 'uploadedAt',
    [SEEDING_STATUS.DONE]: 'doneAt',
    [SEEDING_STATUS.CANCELLED]: 'cancelledAt',
    [SEEDING_STATUS.NO_SHOW]: 'noShowAt',
  }[status];
  return upsertSeeding(campaignId, {
    status,
    ...(stampField ? { [stampField]: new Date().toISOString() } : {}),
  });
}
