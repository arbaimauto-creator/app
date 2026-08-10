// 발급자 핸들 기반 개인화 추천 코드 3장 (mock — 서버 발급 시 교체)
export function referralCodesFor(profile) {
  const seed = (profile?.handleUrl || 'GREYD').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const head = (seed + 'XXX').slice(0, 3);
  return [1, 2, 3].map(
    (n) => `${head}${n}${String(seed.length % 10)}${String((seed.charCodeAt(0) || 65) % 10)}`,
  );
}
