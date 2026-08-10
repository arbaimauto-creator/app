// 초대 코드 mock 스텁 — 서버 준비 시 이 파일만 교체한다 (campaigns.js와 동일 패턴).
// 주의: 이 코드는 UX 장치이지 보안 장치가 아니다. 실보안은 서버 검증 도입 시.
const INVITE_CODES = [
  { code: 'GREYD1', role: 'influencer', label: 'ARBAIM 크리에이터 초대' },
  { code: 'CREW26', role: 'influencer', label: '크리에이터 추천 코드' },
  { code: 'BRAND1', role: 'brand', brandId: 'brand-sonplan', brandName: 'SonPlan' },
  { code: 'BRAND2', role: 'brand', brandId: 'brand-org', brandName: 'ORG' },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 반환: { success, role, brandId?, brandName? } | { success: false }
export async function verifyInviteCode(rawCode) {
  await delay(400);
  const code = (rawCode || '').trim().toUpperCase();
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
