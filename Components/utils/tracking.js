// 2차 가공물 추적 코드 (2026-09-16 P2) — docs/secondary-use-and-groupbuy-2026-09-16.md §3
// 브랜드가 만든 소재(ra-xxxx)나 공동구매(gb-xxxx) 링크로 앱에 들어오면 코드를 기기에 붙잡아 두고,
// 귀속 기간(7일, 제안값) 안에 결제된 주문에 실어 보낸다. 서버는 그 코드로 작성자에게 인센티브를 귀속한다.
// 순수 함수(파싱·판정)와 저장(prefSafe)을 나눠 테스트가 저장소 없이도 돈다.
import { prefGetSafe, prefSetSafe } from '../../api/prefSafe';

export const TRACKING_PARAM = 'tc';
export const TRACKING_KEY = 'trackingCodeV1';
// 귀속 기간 — 정책 확정 전 제안값(문서 §4-A "귀속 7일")
export const ATTRIBUTION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const CODE_RE = /^(ra|gb)-[0-9a-f]{8}$/;

export function isTrackingCode(value) {
  return typeof value === 'string' && CODE_RE.test(value.trim());
}

// 'ra' = 소재(판매 인센티브), 'gb' = 공동구매
export function trackingKind(code) {
  if (!isTrackingCode(code)) {
    return null;
  }
  return code.startsWith('gb-') ? 'groupbuy' : 'asset';
}

// URL에서 ?tc= 를 꺼낸다. 스킴(greyd://)·https 모두. 유효한 코드가 아니면 null.
export function trackingCodeFromUrl(url) {
  if (typeof url !== 'string' || !url.includes('?')) {
    return null;
  }
  const query = url.split('#')[0].split('?')[1] || '';
  for (const pair of query.split('&')) {
    const [k, v = ''] = pair.split('=');
    if (k === TRACKING_PARAM) {
      let decoded = v;
      try {
        decoded = decodeURIComponent(v);
      } catch (e) {
        decoded = v;
      }
      return isTrackingCode(decoded) ? decoded.trim() : null;
    }
  }
  return null;
}

// 경로 화이트리스트 검사 전에 쿼리를 떼기 위한 헬퍼
export function stripQuery(path) {
  if (typeof path !== 'string') {
    return path;
  }
  return path.split('?')[0].split('#')[0];
}

// 저장 형식 { code, at } — 나중 코드가 먼저 코드를 덮는다(마지막 클릭 귀속).
export async function rememberTrackingCode(code, now = Date.now()) {
  if (!isTrackingCode(code)) {
    return false;
  }
  await prefSetSafe(TRACKING_KEY, JSON.stringify({ code: code.trim(), at: now }));
  return true;
}

export function activeCodeFromRecord(raw, now = Date.now()) {
  if (!raw) {
    return null;
  }
  let rec = null;
  try {
    rec = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    return null;
  }
  if (!rec || !isTrackingCode(rec.code)) {
    return null;
  }
  const at = Number(rec.at);
  if (!Number.isFinite(at) || now - at > ATTRIBUTION_WINDOW_MS || at > now + 60 * 1000) {
    return null;
  }
  return rec.code;
}

// 귀속 기간 안의 코드. 없거나 만료면 null.
export async function getActiveTrackingCode(now = Date.now()) {
  const raw = await prefGetSafe(TRACKING_KEY);
  return activeCodeFromRecord(raw, now);
}

// 결제 완료 뒤 호출 — 같은 코드가 다음 주문에도 붙지 않게 한다.
export async function clearTrackingCode() {
  await prefSetSafe(TRACKING_KEY, '');
}
