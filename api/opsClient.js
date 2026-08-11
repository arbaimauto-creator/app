// greyd-ops 모바일 API 클라이언트.
// 인증: 게이트 인증(/auth) 후엔 장수명 Bearer 토큰(3단계), 그 전엔 간이 공유키.
// 키·도메인은 릴리스 설정 시 채운다. (react-native-config 미사용 프로젝트라 상수로 관리)
import Preference from 'react-native-default-preference';

const OPS_API_BASE = 'https://greyd-ops.vercel.app/api/mobile'; // 배포 도메인 확정 시 수정
const OPS_APP_KEY = ''; // GREYD_APP_MOBILE_KEY — 키 설정 전엔 LIVE_OPS_API를 켜지 말 것
const TIMEOUT_MS = 8000;

export async function setOpsToken(token) {
  await Preference.set('opsToken', token || '');
}

async function authHeaders() {
  const token = await Preference.get('opsToken');
  return token ? { Authorization: `Bearer ${token}` } : { 'x-greyd-app-key': OPS_APP_KEY };
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
  return request(path, { headers: await authHeaders() });
}

export async function opsPost(path, body) {
  return request(path, {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
