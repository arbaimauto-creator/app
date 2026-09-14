// 상태 모델 표준화 (기획서 §7 P2 "상태 모델 표준화·정보 구조 통합").
// 시딩 8상태·보상 5상태의 라벨/톤/진행 구간을 여기 한 곳에서만 정의한다.
// 이전엔 ActivityScreen·HomeHero·MyScreen이 각자 status→라벨/색 맵을 들고 있어 항목이 빠지거나(홈은 5종만) 어긋났다.
import Strings from '../Components/Strings';
import { SEEDING_STATUS, ACTIVE_STATUSES } from './seedings';
import { REWARD_STATE } from './rewards';
import { CURATED_MIN_G } from '../screens/TryScreen/points';

// 진행 중(활성) 상태 — Activity 세그먼트·홈 할 일·보상 예정 판정이 모두 이 목록을 쓴다.
export const ONGOING_STATUSES = ACTIVE_STATUSES;
export const FINISHED_STATUSES = [
  SEEDING_STATUS.DONE,
  SEEDING_STATUS.CANCELLED,
  SEEDING_STATUS.NO_SHOW,
];

// Strings는 기기 언어로 모듈 로드 시 결정되므로 함수로 감싸 호출 시점에 읽는다(테스트에서 mock 교체 가능).
export function seedingStatusLabel(status) {
  const map = {
    [SEEDING_STATUS.APPLIED]: Strings.CAMPAIGN_STATUS_APPLIED,
    [SEEDING_STATUS.APPROVED]: Strings.CAMPAIGN_STATUS_APPROVED,
    [SEEDING_STATUS.SHIPPED]: Strings.CAMPAIGN_STATUS_SHIPPED,
    [SEEDING_STATUS.RECEIVED]: Strings.CAMPAIGN_STATUS_RECEIVED,
    [SEEDING_STATUS.REVIEWING]: Strings.CAMPAIGN_STATUS_REVIEWING,
    [SEEDING_STATUS.DONE]: Strings.CAMPAIGN_STATUS_DONE,
    [SEEDING_STATUS.CANCELLED]: Strings.CAMPAIGN_STATUS_CANCELLED,
    [SEEDING_STATUS.NO_SHOW]: Strings.CAMPAIGN_STATUS_NO_SHOW,
  };
  return map[status] || status || '';
}

// 보상 5상태 → Badge 톤 (Components/UI BADGE_TONES 키)
export const REWARD_TONE = {
  [REWARD_STATE.EXPECTED]: 'curated',
  [REWARD_STATE.REVIEWING]: 'amber',
  [REWARD_STATE.CONFIRMED]: 'open',
  [REWARD_STATE.PAID]: 'open',
  [REWARD_STATE.CANCELLED]: 'red',
};
export const REWARD_STATE_ORDER = [
  REWARD_STATE.EXPECTED,
  REWARD_STATE.REVIEWING,
  REWARD_STATE.CONFIRMED,
  REWARD_STATE.PAID,
  REWARD_STATE.CANCELLED,
];

export function rewardStateLabel(state) {
  return Strings[`REWARD_STATE_${state}`] || state || '';
}
export function rewardReasonLabel(reason) {
  return Strings[`REWARD_REASON_${reason}`] || '';
}
export function rewardTone(state) {
  return REWARD_TONE[state] || 'curated';
}

// 원장 금액 표기 — 취소는 부호 없이 0P, 그 외는 +NP, 미정은 대시
export function rewardPointsText(entry) {
  if (entry?.points == null) {
    return '—';
  }
  const sign = entry.state === REWARD_STATE.CANCELLED ? '' : '+';
  return `${sign}${entry.points}P`;
}

// G-스코어 진행바 — G50→Curated 해제선(G60) 구간을 0~1로. 최소 4%는 보이게.
// Activity(÷10 하드코딩)와 My(÷(CURATED_MIN_G-50))가 달랐던 것을 한 식으로.
export function gProgressRatio(gScore) {
  const base = 50;
  const span = Math.max(1, CURATED_MIN_G - base);
  const pct = Math.min(100, Math.max(4, (((gScore ?? base) - base) / span) * 100));
  return pct / 100;
}
