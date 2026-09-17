// 단골 적중 원장 (2026-09-17, docs/superpowers/specs/2026-09-17-dangol-relationship-design.md)
// 적중 2회(리뷰 단위 dedupe)가 쌓여야 그 리뷰어의 "단골 맺기"가 열린다.
// 서버 배포가 막혀 있어 기기 저장으로 시작 — 관계 자체는 기존 팔로우 API가 저장한다.
import { prefGetSafe, prefSetSafe } from './prefSafe';

export const REGULAR_UNLOCK_HITS = 2;

const HITS_KEY = 'regularHitsV1'; // { [reviewerId]: [{videoId, type, at}] }
const PROMPTS_KEY = 'regularPromptsV1'; // [videoId]
const REGULARS_KEY = 'regularIdsV1'; // [reviewerId] — 팔로우 승계분 포함 캐시

async function readJson(key, fallback) {
  const raw = await prefGetSafe(key);
  if (!raw) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (e) {
    return fallback;
  }
}

export async function recordHit(reviewerId, videoId, type, at = Date.now()) {
  const all = await readJson(HITS_KEY, {});
  const hits = Array.isArray(all[reviewerId]) ? all[reviewerId] : [];
  if (hits.some((h) => h.videoId === videoId)) {
    return { counted: false, hits: hits.length };
  }
  const next = [...hits, { videoId, type, at }];
  await prefSetSafe(HITS_KEY, JSON.stringify({ ...all, [reviewerId]: next }));
  return { counted: true, hits: next.length };
}

export async function hitCount(reviewerId) {
  const all = await readJson(HITS_KEY, {});
  return Array.isArray(all[reviewerId]) ? all[reviewerId].length : 0;
}

export async function isUnlocked(reviewerId) {
  return (await hitCount(reviewerId)) >= REGULAR_UNLOCK_HITS;
}

export async function wasPromptShown(videoId) {
  const shown = await readJson(PROMPTS_KEY, []);
  return Array.isArray(shown) && shown.includes(videoId);
}

export async function markPromptShown(videoId) {
  const shown = await readJson(PROMPTS_KEY, []);
  const list = Array.isArray(shown) ? shown : [];
  if (!list.includes(videoId)) {
    await prefSetSafe(PROMPTS_KEY, JSON.stringify([...list, videoId]));
  }
}

export async function getRegulars() {
  const list = await readJson(REGULARS_KEY, []);
  return Array.isArray(list) ? list : [];
}

export async function addRegular(reviewerId) {
  const list = await getRegulars();
  if (!list.includes(reviewerId)) {
    await prefSetSafe(REGULARS_KEY, JSON.stringify([...list, reviewerId]));
  }
}

export async function removeRegular(reviewerId) {
  const list = await getRegulars();
  await prefSetSafe(REGULARS_KEY, JSON.stringify(list.filter((id) => id !== reviewerId)));
}

// 기존 팔로우 승계 — 잠금 소급 없이 전부 단골로 (설계 §3)
export async function seedRegularsFromFollowing(ids) {
  const list = await getRegulars();
  const merged = [...new Set([...list, ...(ids || [])])];
  await prefSetSafe(REGULARS_KEY, JSON.stringify(merged));
  return merged;
}
