// greyd-ops 모바일 API 클라이언트.
// 인증: 게이트 인증(/auth) 후엔 장수명 Bearer 토큰(3단계), 그 전엔 간이 공유키.
// 키·도메인은 릴리스 설정 시 채운다. (react-native-config 미사용 프로젝트라 상수로 관리)
import { prefGetSafe, prefSetSafe } from './prefSafe';
import { OPS_API_BASE, OPS_APP_KEY } from './opsRuntimeConfig';

const TIMEOUT_MS = 8000;

// 저장소 무응답이 인증 흐름을 멈추지 않도록 타임아웃 레이스 사용 (iOS 릴리스 사례)
export async function setOpsToken(token) {
  await prefSetSafe('opsToken', token || '');
}

// 기기 식별자 — ops 골든 레코드 연동 키. 최초 1회 생성 후 고정 (계정 삭제 시에만 재발급)
export async function getGreydAppId() {
  let id = await prefGetSafe('greydAppId');
  if (!id) {
    id = `app-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await prefSetSafe('greydAppId', id);
  }
  return id;
}

function appKeyHeaders() {
  if (!OPS_APP_KEY) {
    throw new Error('GREYD_APP_MOBILE_KEY is not configured');
  }
  return { 'x-greyd-app-key': OPS_APP_KEY };
}

// 초대 코드 폐지(2026-09-10): 토큰이 없으면 코드 없이 /auth로 세션을 발급받는다.
// 게이트(초대 코드) 경로는 verifyInviteCode가 별도로 /auth를 호출하며 그대로 유효하다.
// 동시 호출은 한 번의 /auth로 합친다.
let sessionPromise = null;
export async function ensureOpsSession() {
  const existing = await prefGetSafe('opsToken');
  if (existing) {
    return existing;
  }
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const [greydAppId, country, rawProfile] = await Promise.all([
        getGreydAppId(),
        prefGetSafe('creatorCountry'),
        prefGetSafe('creatorProfileV2'),
      ]);
      let handle = null;
      try {
        handle = rawProfile ? JSON.parse(rawProfile)?.handleUrl || null : null;
      } catch (e) {
        handle = null;
      }
      const res = await request('/auth', {
        method: 'POST',
        headers: { ...appKeyHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ greydAppId, handle, country: country || null }),
      });
      if (!res?.token) {
        throw new Error('ops auth: no token');
      }
      await setOpsToken(res.token);
      return res.token;
    })().finally(() => {
      sessionPromise = null;
    });
  }
  return sessionPromise;
}

async function authHeaders() {
  const token = await ensureOpsSession();
  return { Authorization: `Bearer ${token}` };
}

// 토큰이 있는데 401이면 세션이 폐기·만료된 것 — 지워서 다음 호출이 재발급하게 한다.
async function dropSessionOn401(err) {
  if (err?.status === 401) {
    await setOpsToken('');
  }
  throw err;
}

// 4xx/5xx는 status를 담아 던진다 — 호출부가 reason 분기(게이트) 또는 무시(브리지)한다
async function request(path, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${OPS_API_BASE}${path}`, { ...init, signal: controller.signal });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(`ops API ${res.status}: ${path}`);
      err.status = res.status;
      err.body = json;
      throw err;
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

export async function opsGet(path) {
  return request(path, { headers: await authHeaders() }).catch(dropSessionOn401);
}

export async function opsPost(path, body) {
  // /auth 자체는 앱 키로 — 게이트의 verifyInviteCode 경로
  if (path === '/auth') {
    return request(path, {
      method: 'POST',
      headers: { ...appKeyHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
  return request(path, {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(dropSessionOn401);
}
