// Activity 미션 카드의 시간·정책 계산 (v2 §3-⑥⑦, §4-2)
import { SEEDING_STATUS } from '../../api/seedings';

export const UPLOAD_DAYS = 14;
export const GRACE_DAYS = 2;
export const EXTENSION_DAYS = 7;
export const ADDRESS_DEADLINE_HOURS = 48;

export function daysLeft(seeding, now = new Date()) {
  if (!seeding?.receivedAt) {
    return null;
  }
  const received = new Date(seeding.receivedAt);
  const totalDays = UPLOAD_DAYS + (seeding.extensionUsed ? EXTENSION_DAYS : 0);
  const deadline = new Date(received.getTime() + totalDays * 24 * 3600 * 1000);
  return Math.ceil((deadline.getTime() - now.getTime()) / (24 * 3600 * 1000));
}

export function isInGrace(seeding, now = new Date()) {
  const left = daysLeft(seeding, now);
  return left != null && left <= 0 && left > -GRACE_DAYS;
}

export function isNoShowDue(seeding, now = new Date()) {
  const left = daysLeft(seeding, now);
  return left != null && left <= -GRACE_DAYS;
}

export function isActionable(status) {
  return (
    status === SEEDING_STATUS.APPROVED ||
    status === SEEDING_STATUS.SHIPPED ||
    status === SEEDING_STATUS.RECEIVED
  );
}
