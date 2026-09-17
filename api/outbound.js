// 외부몰 이동 로그 (2026-09-17, docs/superpowers/specs/2026-09-17-brand-store-design.md)
// "모든 상품 보러가기 ↗"로 자사몰에 넘어간 클릭을 그레이드 귀속 근거로 남긴다.
// 이벤트는 즉시 전송(logEvent)하고, 정산용 원본은 로컬 큐에 쌓아 서버가 열리면 올린다.
import { Linking } from 'react-native';
import { logEvent } from './common/analytics';
import { prefGetSafe, prefSetSafe } from './prefSafe';

const QUEUE_KEY = 'outboundClicksV1';

// React Native의 URL 폴리필은 불완전하다 — 문자열 조립으로 안전하게 붙인다.
export function withGreydParams(url, { uid } = {}) {
  if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    return url;
  }
  const params = ['utm_source=greyd', 'utm_medium=app'];
  if (uid) {
    params.push(`greyd_uid=${encodeURIComponent(uid)}`);
  }
  const hashIndex = url.indexOf('#');
  const base = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}${params.join('&')}${hash}`;
}

export async function getOutboundQueue() {
  const raw = await prefGetSafe(QUEUE_KEY);
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

export async function logOutboundClick({ sellerId, productId, videoId, url, at = Date.now() }) {
  // 이벤트는 실패해도 이동은 막지 않는다
  logEvent('outbound_click', {
    seller_id: sellerId || '',
    product_id: productId || '',
    video_id: videoId || '',
  }).catch(() => {});
  const queue = await getOutboundQueue();
  await prefSetSafe(
    QUEUE_KEY,
    JSON.stringify([...queue, { sellerId, productId, videoId, url, at }]),
  );
}

export async function openExternalStore({ sellerId, productId, videoId, url, uid }) {
  await logOutboundClick({ sellerId, productId, videoId, url }).catch(() => {});
  return Linking.openURL(withGreydParams(url, { uid }));
}
