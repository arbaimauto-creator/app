// 초대 코드 mock 스텁 — 서버 준비 시 이 파일만 교체한다 (campaigns.js와 동일 패턴).
// 주의: 이 코드는 UX 장치이지 보안 장치가 아니다. 실보안은 서버 검증 도입 시.
// D26 확정: 브랜드 코드는 발급 개념 자체가 없다 — 앱 초대 코드는 인플루언서 전용.
// (브랜드는 ops 웹 매직링크, 운영은 ops 콘솔 — 앱 게이트를 지나지 않는다)
const INVITE_CODES = [
  { code: 'GREYD1', role: 'influencer', label: 'ARBAIM 크리에이터 초대' },
  { code: 'CREW26', role: 'influencer', label: '크리에이터 추천 코드' },
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
