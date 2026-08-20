// 시딩(미션 인스턴스) mock 스텁 — 상태머신 8종의 로컬 영속 계층.
// enum: applied → approved → shipped → received → reviewing → done
//       approved → cancelled (무페널티) / received → no_show (Strike)
import Preference from 'react-native-default-preference';
import FEATURES from '../Components/Constants/Features';
import { opsGet } from './opsClient';

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
  let local = {};
  if (raw) {
    try {
      local = JSON.parse(raw);
    } catch (e) {
      local = {};
    }
  }
  if (FEATURES.LIVE_OPS_API) {
    try {
      const response = await opsGet('/seedings');
      const remote = Array.isArray(response?.seedings) ? response.seedings : [];
      for (const seeding of remote) {
        if (!seeding?.campaignId) {
          continue;
        }
        local[seeding.campaignId] = {
          ...(local[seeding.campaignId] || {}),
          ...seeding,
        };
      }
      await Preference.set(KEY, JSON.stringify(local));
    } catch (e) {
      if (__DEV__) {
        console.log('ops seedings sync failed, using local state', e?.message);
      }
    }
  }
  return local;
}

async function persist(seedings) {
  await Preference.set(KEY, JSON.stringify(seedings));
  return seedings;
}

// seeding: { campaignId, surface, status, appliedAt, approvedAt, shippedAt, receivedAt,
//            uploadedAt, pledgeChecked, appealText, address, trackingNo, extensionUsed }
// surface: 'app' 고정 — ops Match의 표면 구분(I5). 허브(비앱) 시딩은 ops에만 존재한다.
// 앱 인바운드 신청은 ops에 Match를 ACCEPTED로 생성하는 것과 등가 (정합 I2·I3).
export async function upsertSeeding(campaignId, patch) {
  const seedings = await getSeedings();
  seedings[campaignId] = {
    campaignId,
    surface: 'app',
    ...(seedings[campaignId] || {}),
    ...patch,
  };
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
