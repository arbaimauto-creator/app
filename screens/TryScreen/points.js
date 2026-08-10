// v2 §4-3/4-4: 포인트·G-스코어 정책의 단일 출처 (클라이언트 계산, 서버 연동 시 검증 이관)
export const CURATED_MIN_G = 60;

// 등급 배수: G50~59 ×1.0 / G60~79 ×1.1 / G80~99 ×1.25 / G100+ ×1.5
export function gradeMultiplier(gScore) {
  if (gScore >= 100) {
    return 1.5;
  }
  if (gScore >= 80) {
    return 1.25;
  }
  if (gScore >= 60) {
    return 1.1;
  }
  return 1.0;
}

// 개인화 포인트 (10P 단위 반올림)
export function personalizedPoints(basePoints, gScore) {
  return Math.round((basePoints * gradeMultiplier(gScore)) / 10) * 10;
}

// 유예(D+14~16) 업로드 감액
export const GRACE_MULTIPLIER = 0.7;

// G-스코어 변동 (v2 §4-4)
export const G_DELTA = {
  COMPLETE: +3,
  QUALITY_5: +2,
  GRACE_COMPLETE: +1,
  STRIKE: -10,
};

// Open 자동 확정 기준 (D24): Strike 0 + (G60 이상 또는 이력 0회 첫 건 — 콜드스타트 허용).
// 잔여 수량·국가·동시 한도는 신청 가능 조건에서 이미 보장됨. 미충족 시 승인 큐 폴백.
export function canAutoConfirm(profile) {
  const { gScore = 50, strikes = 0, completedCount = 0 } = profile || {};
  if (strikes > 0) {
    return false;
  }
  return gScore >= CURATED_MIN_G || completedCount === 0;
}

// 동시 진행 한도 (v2 §4-1)
export function concurrentLimit(gScore, completedCount) {
  if (completedCount === 0) {
    return 1;
  }
  if (gScore >= 80) {
    return 3;
  }
  return 2;
}
