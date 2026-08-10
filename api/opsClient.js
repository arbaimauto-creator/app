// greyd-ops 모바일 API 클라이언트 (1단계 — 간이 키 인증, 3단계에서 Bearer 토큰으로 교체)
// 키·도메인은 릴리스 설정 시 채운다. (react-native-config 미사용 프로젝트라 상수로 관리)
const OPS_API_BASE = 'https://greyd-ops.vercel.app/api/mobile'; // 배포 도메인 확정 시 수정
const OPS_APP_KEY = ''; // GREYD_APP_MOBILE_KEY — 키 설정 전엔 LIVE_OPS_API를 켜지 말 것
const TIMEOUT_MS = 8000;

export async function opsGet(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${OPS_API_BASE}${path}`, {
      headers: { 'x-greyd-app-key': OPS_APP_KEY },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`ops API ${res.status}: ${path}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// 2단계 쓰기 — apply/received/upload. 4xx도 던진다 (호출부 브리지가 삼키고 로컬은 계속 진행)
export async function opsPost(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${OPS_API_BASE}${path}`, {
      method: 'POST',
      headers: { 'x-greyd-app-key': OPS_APP_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`ops API ${res.status}: ${path}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}
