// 브랜드 평가(트리아지+루브릭) mock 영속 계층 — 서버 연동 시 교체.
// evaluation: { reviewId, triage: 'pick'|'ok'|'skip', skipReason?,
//               scores?: {authenticity, delivery, quality, marketSignal}, rebook?: bool, comment? }
import Preference from 'react-native-default-preference';

const KEY = 'brandEvaluationsV2';

export const TRIAGE = { PICK: 'pick', OK: 'ok', SKIP: 'skip' };
export const SKIP_REASONS = ['low_quality', 'guide_violation', 'cannot_judge'];

export async function getEvaluations() {
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

export async function saveEvaluation(reviewId, patch) {
  const all = await getEvaluations();
  all[reviewId] = {
    reviewId,
    ...(all[reviewId] || {}),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await Preference.set(KEY, JSON.stringify(all));
  return all;
}
