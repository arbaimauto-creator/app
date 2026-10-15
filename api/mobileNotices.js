// 인앱 공지 팝업 (2026-10) — greyd-ops가 운영하는 공지를 앱 실행·복귀 시 받아 온다.
// 로그인 전(게이트·가입 화면)에도 불러야 하므로 인증 헤더 없이 호출한다.
// 어떤 실패도 앱 진입을 막지 않는다: 네트워크·파싱 오류는 빈 목록으로 수렴.
import { prefGetSafe, prefSetSafe } from './prefSafe';

export const NOTICES_API_BASE = 'https://ops.greyd.app/api/mobile/notices';
const TIMEOUT_MS = 8000;

// ONCE 공지의 노출 기록. key가 바뀌면(= 운영이 내용을 고침) 다른 값이 되어 한 번 더 보인다.
export const SEEN_KEYS_PREF = 'inAppNoticeSeenKeys';
const MAX_SEEN_KEYS = 200;

// 같은 실행(프로세스) 안에서 이미 띄운 공지 — EVERY_LAUNCH도 실행당 한 번만.
const shownThisLaunch = new Set();

export function normalizeCountry(country) {
  return typeof country === 'string' && /^[A-Za-z]{2}$/.test(country.trim())
    ? country.trim().toUpperCase()
    : '';
}

export function buildNoticesUrl({ lang, country, platform, version }) {
  const params = [
    ['lang', lang === 'ko' ? 'ko' : 'en'],
    ['country', normalizeCountry(country)],
    ['platform', platform === 'ios' ? 'ios' : 'android'],
    ['version', version || ''],
  ];
  return `${NOTICES_API_BASE}?${params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
}

function withTimeout(fetchImpl, url, init) {
  if (typeof AbortController === 'undefined') {
    return fetchImpl(url, init);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetchImpl(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

// 응답 한 건을 화면이 쓸 수 있는 모양으로 정리. 필수값(id·key·제목 또는 본문)이 없으면 버린다.
export function sanitizeNotice(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const id = raw.id != null ? String(raw.id) : '';
  const key = raw.key != null ? String(raw.key) : '';
  const title = typeof raw.title === 'string' ? raw.title : '';
  const body = typeof raw.body === 'string' ? raw.body : '';
  if (!id || !key || (!title && !body)) {
    return null;
  }
  const cta =
    raw.cta &&
    typeof raw.cta.label === 'string' &&
    raw.cta.label &&
    typeof raw.cta.url === 'string' &&
    isSupportedCtaUrl(raw.cta.url)
      ? { label: raw.cta.label, url: raw.cta.url }
      : null;
  return {
    id,
    key,
    title,
    body,
    imageUrl:
      typeof raw.imageUrl === 'string' && /^https:\/\//i.test(raw.imageUrl) ? raw.imageUrl : null,
    cta,
    showMode: raw.showMode === 'EVERY_LAUNCH' ? 'EVERY_LAUNCH' : 'ONCE',
  };
}

export function isSupportedCtaUrl(url) {
  return typeof url === 'string' && (/^https:\/\//i.test(url) || /^greyd:\/\//i.test(url));
}

// 서버 정렬 순서를 그대로 유지하고, 이미 본 ONCE·이번 실행에 띄운 공지만 거른다.
export function selectNoticesToShow(notices, seenKeys, shownKeys = shownThisLaunch) {
  const seen = new Set(seenKeys || []);
  const picked = new Set();
  return (Array.isArray(notices) ? notices : []).map(sanitizeNotice).filter((n) => {
    if (!n || shownKeys.has(n.key) || picked.has(n.key)) {
      return false;
    }
    if (n.showMode === 'ONCE' && seen.has(n.key)) {
      return false;
    }
    picked.add(n.key);
    return true;
  });
}

export async function fetchNotices(query, fetchImpl = fetch) {
  try {
    const res = await withTimeout(fetchImpl, buildNoticesUrl(query), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res || !res.ok) {
      return [];
    }
    const json = await res.json();
    return Array.isArray(json?.notices) ? json.notices : [];
  } catch (e) {
    return [];
  }
}

export async function loadSeenKeys() {
  try {
    const raw = await prefGetSafe(SEEN_KEYS_PREF);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((k) => typeof k === 'string') : [];
  } catch (e) {
    return [];
  }
}

// 이번 실행에 띄웠음을 기록하고, ONCE면 기기에 key를 남긴다.
export async function rememberShown(notice) {
  shownThisLaunch.add(notice.key);
  if (notice.showMode !== 'ONCE') {
    return;
  }
  const keys = await loadSeenKeys();
  if (keys.includes(notice.key)) {
    return;
  }
  const next = [...keys, notice.key].slice(-MAX_SEEN_KEYS);
  await prefSetSafe(SEEN_KEYS_PREF, JSON.stringify(next));
}

// 노출 집계 — 실패해도 무시한다.
export function reportSeen(id, fetchImpl = fetch) {
  return withTimeout(fetchImpl, `${NOTICES_API_BASE}/${encodeURIComponent(id)}/seen`, {
    method: 'POST',
  })
    .then(() => undefined)
    .catch(() => undefined);
}

// 이번 실행·복귀 시점에 보여 줄 공지 목록.
export async function loadPendingNotices(query, fetchImpl = fetch) {
  const [notices, seenKeys] = await Promise.all([fetchNotices(query, fetchImpl), loadSeenKeys()]);
  return selectNoticesToShow(notices, seenKeys);
}

// 테스트 전용
export function __resetShownThisLaunch() {
  shownThisLaunch.clear();
}
