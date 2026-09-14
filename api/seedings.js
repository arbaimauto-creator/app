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

// 상태머신 진행 순서 — 서버 병합 시 "더 앞선 상태"만 로컬을 덮어쓴다. 종결 상태는 최상위.
const STATUS_RANK = {
  [SEEDING_STATUS.APPLIED]: 1,
  [SEEDING_STATUS.APPROVED]: 2,
  [SEEDING_STATUS.SHIPPED]: 3,
  [SEEDING_STATUS.RECEIVED]: 4,
  [SEEDING_STATUS.REVIEWING]: 5,
  [SEEDING_STATUS.DONE]: 6,
  [SEEDING_STATUS.CANCELLED]: 7,
  [SEEDING_STATUS.NO_SHOW]: 7,
};
const STAMP_FIELDS = [
  'appliedAt',
  'approvedAt',
  'shippedAt',
  'receivedAt',
  'uploadedAt',
  'doneAt',
  'cancelledAt',
  'noShowAt',
];

export const ACTIVE_STATUSES = [
  SEEDING_STATUS.APPLIED,
  SEEDING_STATUS.APPROVED,
  SEEDING_STATUS.SHIPPED,
  SEEDING_STATUS.RECEIVED,
  SEEDING_STATUS.REVIEWING,
];
export const isActiveSeeding = (seeding) => !!seeding && ACTIVE_STATUSES.includes(seeding.status);

// 로컬 전이(수령·업로드)는 ops 반영이 아웃박스로 지연된다. 서버 스냅샷이 뒤처져 있으면
// 로컬 상태·스탬프를 유지하고, 서버가 더 앞선 상태(발송·완료·취소)일 때만 따라간다.
export function mergeSeeding(local, remote) {
  if (!local) {
    return { ...remote };
  }
  const merged = { ...remote, ...local };
  const localRank = STATUS_RANK[local.status] ?? 0;
  const remoteRank = STATUS_RANK[remote.status] ?? 0;
  // 동일 상태에서도 서버 정산 결과는 갱신된다. 로컬의 오래된 금액/지급일로
  // 덮어쓰지 않되, 뒤처진 서버 스냅샷은 로컬 전이를 되돌리지 않는다.
  if (remoteRank >= localRank) {
    for (const field of ['pointsGranted', 'paidAt']) {
      if (Object.prototype.hasOwnProperty.call(remote, field)) {
        merged[field] = remote[field];
      }
    }
  }
  if (remoteRank > localRank) {
    merged.status = remote.status;
    for (const field of STAMP_FIELDS) {
      if (remote[field]) {
        merged[field] = remote[field];
      }
    }
  }
  return merged;
}

async function readLocal() {
  const raw = await Preference.get(KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    return {};
  }
}

export async function getSeedings() {
  const local = await readLocal();
  if (FEATURES.LIVE_OPS_API) {
    try {
      const response = await opsGet('/seedings');
      const remote = Array.isArray(response?.seedings) ? response.seedings : [];
      for (const seeding of remote) {
        if (!seeding?.campaignId) {
          continue;
        }
        local[seeding.campaignId] = mergeSeeding(local[seeding.campaignId], seeding);
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

// 읽기-수정-쓰기가 await 사이에 겹치면 나중 쓰기가 앞 쓰기를 지운다(주소 vs 리뷰 링크 등).
// 모듈 단위 프로미스 체인으로 변경을 직렬화한다.
let writeQueue = Promise.resolve();
function serialized(task) {
  const run = writeQueue.then(task, task);
  writeQueue = run.catch(() => {});
  return run;
}

// seeding: { campaignId, surface, status, appliedAt, approvedAt, shippedAt, receivedAt,
//            uploadedAt, pledgeChecked, appealText, address, trackingNo, extensionUsed }
// surface: 'app' 고정 — ops Match의 표면 구분(I5). 허브(비앱) 시딩은 ops에만 존재한다.
// 앱 인바운드 신청은 ops에 Match를 ACCEPTED로 생성하는 것과 등가 (정합 I2·I3).
export function upsertSeeding(campaignId, patch) {
  // 쓰기 경로는 서버를 다시 읽지 않는다(호출마다 8초 타임아웃의 왕복이 걸리던 문제).
  // 서버 병합은 getSeedings()(화면 진입·새로고침)가 담당한다.
  return serialized(async () => {
    const seedings = await readLocal();
    seedings[campaignId] = {
      campaignId,
      surface: 'app',
      ...(seedings[campaignId] || {}),
      ...patch,
    };
    return persist(seedings);
  });
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
