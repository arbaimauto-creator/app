// P4 기반 — A/B 배정 + 사용 이벤트 (2026-09-16). 기획서 §P4 "추천 고도화·A/B 테스트·데이터 기반 제거·기능 정리 보고서"
// 배정: ops GET /config 가 내려준 실험(variants·weights)을 기기 id 해시로 결정적으로 나눈다 — 재설치 전엔 같은 쪽.
// 이벤트: POST /events 로 묶어 보낸다(20개 또는 30초). 실패하면 다음 묶음에 다시 싣는다. 개인정보는 싣지 않는다.
// 오프라인·서버 미배포에서도 앱은 기본 variant(첫 번째)로 정상 동작한다.
import FEATURES from '../Components/Constants/Features';
import { getGreydAppId, opsGet, opsPost } from './opsClient';
import { prefGetSafe, prefSetSafe } from './prefSafe';

const CONFIG_KEY = 'experimentsConfigV1';
const CONFIG_TTL_MS = 60 * 60 * 1000;
const FLUSH_SIZE = 20;
const FLUSH_DELAY_MS = 30 * 1000;
const MAX_QUEUE = 200;

// 앱이 아는 실험 키와 기본 variant — 서버에 없으면 기본값으로 굳는다.
export const EXPERIMENTS = {
  HOME_RANKING: { key: 'home_ranking', variants: ['personalized', 'latest'] },
};

// FNV-1a 32bit — 문자열을 0~99 버킷으로. 결정적·의존성 없음.
export function bucketOf(seed) {
  let h = 0x811c9dc5;
  const s = String(seed || '');
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % 100;
}

// weights는 퍼센트 합 100. 버킷이 누적 구간에 떨어지는 variant.
export function pickVariant(experiment, seed) {
  const variants = Array.isArray(experiment?.variants) ? experiment.variants : [];
  if (variants.length === 0) {
    return null;
  }
  const weights =
    Array.isArray(experiment.weights) && experiment.weights.length === variants.length
      ? experiment.weights.map((w) => Math.max(0, Number(w) || 0))
      : variants.map(() => 100 / variants.length);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const bucket = bucketOf(`${experiment.key || ''}:${seed}`);
  let acc = 0;
  for (let i = 0; i < variants.length; i += 1) {
    acc += (weights[i] / total) * 100;
    if (bucket < acc) {
      return variants[i];
    }
  }
  return variants[variants.length - 1];
}

let configCache = { at: 0, experiments: null };

async function loadConfig(now = Date.now()) {
  if (configCache.experiments && now - configCache.at < CONFIG_TTL_MS) {
    return configCache.experiments;
  }
  let stored = null;
  try {
    stored = JSON.parse((await prefGetSafe(CONFIG_KEY)) || 'null');
  } catch (e) {
    stored = null;
  }
  if (stored && now - Number(stored.at || 0) < CONFIG_TTL_MS) {
    configCache = { at: Number(stored.at), experiments: stored.experiments || {} };
    return configCache.experiments;
  }
  if (!FEATURES.LIVE_OPS_API) {
    return stored?.experiments || {};
  }
  try {
    const res = await opsGet('/config');
    const experiments = res?.experiments && typeof res.experiments === 'object' ? res.experiments : {};
    configCache = { at: now, experiments };
    await prefSetSafe(CONFIG_KEY, JSON.stringify({ at: now, experiments }));
    return experiments;
  } catch (e) {
    // 서버 미도달 — 예전 값이나 빈 설정으로
    return stored?.experiments || configCache.experiments || {};
  }
}

// 실험의 내 variant. 서버에 실험이 없으면(중지·미배포) 앱 기본 variant(첫 번째).
export async function variantFor(experiment) {
  const fallback = experiment.variants[0];
  try {
    const experiments = await loadConfig();
    const server = experiments?.[experiment.key];
    if (!server || !Array.isArray(server.variants) || server.variants.length === 0) {
      return fallback;
    }
    const seed = await getGreydAppId();
    const v = pickVariant({ ...server, key: experiment.key }, seed);
    return experiment.variants.includes(v) ? v : fallback;
  } catch (e) {
    return fallback;
  }
}

// ── 이벤트 큐 ──
let queue = [];
let flushTimer = null;
let flushing = false;

const NAME_RE = /^[a-z0-9_.]{2,64}$/;

export function trackEvent(name, props) {
  if (!NAME_RE.test(String(name || ''))) {
    return false;
  }
  queue.push({ name, props: props && typeof props === 'object' ? props : undefined, at: new Date().toISOString() });
  if (queue.length > MAX_QUEUE) {
    queue = queue.slice(-MAX_QUEUE);
  }
  if (queue.length >= FLUSH_SIZE) {
    flushEvents();
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushEvents();
    }, FLUSH_DELAY_MS);
    // 테스트 러너(node)에서 프로세스를 붙잡지 않도록. RN에서는 숫자 핸들이라 no-op
    if (flushTimer && typeof flushTimer.unref === 'function') {
      flushTimer.unref();
    }
  }
  return true;
}

export async function flushEvents() {
  if (flushing || queue.length === 0 || !FEATURES.LIVE_OPS_API) {
    return 0;
  }
  flushing = true;
  const batch = queue.slice(0, 50);
  try {
    await opsPost('/events', { events: batch });
    queue = queue.slice(batch.length);
    return batch.length;
  } catch (e) {
    // 다음 묶음에 다시 싣는다
    return 0;
  } finally {
    flushing = false;
  }
}

// 실험 노출·전환 — ops 콘솔 /experiments 보고서가 이 이름을 집계한다
export function trackExposure(experiment, variant) {
  return trackEvent(`exp.${experiment.key}.exposure`, { variant });
}
export function trackConversion(experiment, variant, extra) {
  return trackEvent(`exp.${experiment.key}.conversion`, { variant, ...(extra || {}) });
}

// 테스트용
export function _resetExperimentsForTest() {
  configCache = { at: 0, experiments: null };
  queue = [];
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  flushing = false;
}
export function _queuedEventsForTest() {
  return queue.slice();
}
