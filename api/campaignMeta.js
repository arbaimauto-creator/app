// 캠페인 카드·상세에 공통으로 쓰는 파생 정보 (기획서 §5.1 카드 정보, §2.1 FGI 선택형).
// 서버(ops toMobileCampaign)와 mock 모두 같은 키를 쓴다: fgiEnabled·estimatedMinutes·purpose·dataUsage.

// FGI 설문은 캠페인별 선택 — 서버가 명시적으로 활성화한 캠페인만 요구한다.
export const isFgiEnabled = (campaign) => campaign?.fgiEnabled === true;

// 참여 예상 소요 시간(분). 서버 값이 없으면 구성 요소로 추정: 촬영·업로드 15분 + FGI 설문 10분
export function estimatedMinutes(campaign) {
  if (typeof campaign?.estimatedMinutes === 'number' && campaign.estimatedMinutes > 0) {
    return campaign.estimatedMinutes;
  }
  return 15 + (isFgiEnabled(campaign) ? 10 : 0);
}

export const uploadDays = (campaign) =>
  typeof campaign?.uploadDays === 'number' && campaign.uploadDays > 0 ? campaign.uploadDays : 14;

// 'deadline' | 'full' | null — 마감 사유를 구분해 카드에 "왜 못 하는지"를 보여준다
export function closedReason(campaign, now = new Date()) {
  if (!campaign) {
    return null;
  }
  const deadlinePassed = campaign.deadline && new Date(campaign.deadline).getTime() < now.getTime();
  if (deadlinePassed) {
    return 'deadline';
  }
  if (campaign.status !== 'open' || (campaign.remaining ?? 0) <= 0) {
    return 'full';
  }
  return null;
}

export const isClosed = (campaign, now) => closedReason(campaign, now) != null;

// 마감까지 남은 일수 (마감 없으면 null)
export function daysToDeadline(campaign, now = new Date()) {
  if (!campaign?.deadline) {
    return null;
  }
  return Math.ceil((new Date(campaign.deadline).getTime() - now.getTime()) / 86400000);
}
