import {
  daysLeft,
  isActionable,
  isInGrace,
  isNoShowDue,
  UPLOAD_DAYS,
  EXTENSION_DAYS,
} from '../screens/ActivityScreen/missionLogic';
import {
  canAutoConfirm,
  concurrentLimit,
  gradeMultiplier,
  personalizedPoints,
} from '../screens/TryScreen/points';
import { SEEDING_STATUS } from '../api/seedings';

const DAY = 24 * 60 * 60 * 1000;

describe('mission deadlines', () => {
  const receivedAt = new Date('2026-08-01T00:00:00.000Z');

  test('uses the standard upload window', () => {
    expect(daysLeft({ receivedAt: receivedAt.toISOString() }, receivedAt)).toBe(UPLOAD_DAYS);
  });

  test('adds the one-time extension', () => {
    expect(
      daysLeft({ receivedAt: receivedAt.toISOString(), extensionUsed: true }, receivedAt),
    ).toBe(UPLOAD_DAYS + EXTENSION_DAYS);
  });

  test('separates grace and no-show states at the boundary', () => {
    const graceNow = new Date(receivedAt.getTime() + (UPLOAD_DAYS + 1) * DAY);
    const noShowNow = new Date(receivedAt.getTime() + (UPLOAD_DAYS + 2) * DAY);
    const seeding = { receivedAt: receivedAt.toISOString() };
    expect(isInGrace(seeding, graceNow)).toBe(true);
    expect(isNoShowDue(seeding, graceNow)).toBe(false);
    expect(isInGrace(seeding, noShowNow)).toBe(false);
    expect(isNoShowDue(seeding, noShowNow)).toBe(true);
  });

  test('only received-workflow statuses are actionable', () => {
    expect(isActionable(SEEDING_STATUS.APPROVED)).toBe(true);
    expect(isActionable(SEEDING_STATUS.SHIPPED)).toBe(true);
    expect(isActionable(SEEDING_STATUS.RECEIVED)).toBe(true);
    expect(isActionable(SEEDING_STATUS.COMPLETED)).toBe(false);
  });
});

describe('creator points and limits', () => {
  test.each([
    [50, 1],
    [60, 1.1],
    [80, 1.25],
    [100, 1.5],
  ])('maps G%s to multiplier %s', (score, multiplier) => {
    expect(gradeMultiplier(score)).toBe(multiplier);
  });

  test('rounds personalized rewards to ten points', () => {
    expect(personalizedPoints(735, 80)).toBe(920);
  });

  test('blocks auto-confirm when a creator has a strike', () => {
    expect(canAutoConfirm({ gScore: 100, strikes: 1, completedCount: 4 })).toBe(false);
  });

  test('keeps first-timers to one mission and experienced high-G creators to three', () => {
    expect(concurrentLimit(100, 0)).toBe(1);
    expect(concurrentLimit(80, 3)).toBe(3);
  });
});
