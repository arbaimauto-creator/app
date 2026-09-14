// 참여 흐름 임시 저장 (기획서 §5.2: "참여 중 임시 저장과 재진입을 지원").
// 어필 문구·FGI 응답·리뷰 링크 폼을 화면을 떠나도 잃지 않게 기기 저장소에 둔다.
// 저장소 무응답이 화면을 막지 않도록 prefSafe(타임아웃 레이스)만 쓴다.
import { prefGetSafe, prefSetSafe } from './prefSafe';

const PREFIX = 'draftV1:';
const DEBOUNCE_MS = 400;

export const draftKey = (kind, campaignId) => `${PREFIX}${kind}:${campaignId}`;

export async function getDraft(kind, campaignId) {
  const raw = await prefGetSafe(draftKey(kind, campaignId));
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (e) {
    return null;
  }
}

const timers = new Map();

// 입력마다 호출해도 마지막 값만 저장된다(디바운스). 제출 성공 시 clearDraft로 정리.
export function saveDraft(kind, campaignId, value) {
  const key = draftKey(kind, campaignId);
  if (timers.has(key)) {
    clearTimeout(timers.get(key));
  }
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      prefSetSafe(key, JSON.stringify({ ...value, savedAt: new Date().toISOString() })).catch(
        () => {},
      );
    }, DEBOUNCE_MS),
  );
}

export async function clearDraft(kind, campaignId) {
  const key = draftKey(kind, campaignId);
  if (timers.has(key)) {
    clearTimeout(timers.get(key));
    timers.delete(key);
  }
  await prefSetSafe(key, '');
}

// 저장된 초안에 실제 입력이 있는지 — 빈 초안을 "복원됨"으로 알리지 않기 위해
export function draftHasContent(draft, fields) {
  if (!draft) {
    return false;
  }
  return fields.some((f) => {
    const v = draft[f];
    if (v == null) {
      return false;
    }
    if (typeof v === 'string') {
      return v.trim().length > 0;
    }
    if (typeof v === 'object') {
      return Object.keys(v).length > 0;
    }
    return Boolean(v);
  });
}
