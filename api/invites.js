// 초대 코드 mock 스텁 — 서버 준비 시 이 파일만 교체한다 (campaigns.js와 동일 패턴).
// 주의: 이 코드는 UX 장치이지 보안 장치가 아니다. 실보안은 서버 검증 도입 시.
// D26 확정: 브랜드 코드는 발급 개념 자체가 없다 — 앱 초대 코드는 인플루언서 전용.
// (브랜드는 ops 웹 매직링크, 운영은 ops 콘솔 — 앱 게이트를 지나지 않는다)
import { opsPost, setOpsToken } from './opsClient';
import { getGreydAppId } from './opsBridge';

const INVITE_CODES = [
  { code: 'GREYD1', role: 'influencer', label: 'ARBAIM 크리에이터 초대' },
  { code: 'CREW26', role: 'influencer', label: '크리에이터 추천 코드' },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 반환: { success, role, brandId?, brandName? } | { success: false, reason? }
// LIVE_OPS_API ON이면 ops /auth가 정본 — 코드 검증 + greydAppId 매핑 + 토큰 발급을 한 번에.
// 서버 도달 실패(네트워크)면 mock으로 폴백하지만, 서버가 코드를 거부한 건 폴백하지 않는다.
export async function verifyInviteCode(rawCode, profile) {
  const code = (rawCode || '').trim().toUpperCase();
  // Authentication is release-critical and must never be disabled by a feature flag.
  try {
    const greydAppId = await getGreydAppId();
    const res = await opsPost('/auth', {
      inviteCode: code,
      greydAppId,
      handle: profile?.handle ?? null,
      country: profile?.country ?? null,
    });
    if (res?.token) {
      await setOpsToken(res.token);
      return { success: true, role: res.role || 'influencer' };
    }
    return { success: false };
  } catch (e) {
    // 401 = 서버가 코드를 거부(invalid/expired/used) — 정본 판정이므로 그대로 반환
    if (e?.status === 401) {
      return { success: false, reason: e?.body?.error };
    }
    if (__DEV__) {
      console.log('ops auth unreachable, fallback to mock', e?.message);
    }
  }
  await delay(400);
  const found = INVITE_CODES.find((c) => c.code === code);
  if (!found) {
    return { success: false };
  }
  return {
    success: true,
    role: found.role,
    brandId: found.brandId,
    brandName: found.brandName,
  };
}
