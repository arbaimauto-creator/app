import { mergeSeeding, isActiveSeeding, SEEDING_STATUS } from '../api/seedings';
import { addressHoursLeft, ADDRESS_DEADLINE_HOURS } from '../screens/ActivityScreen/missionLogic';

describe('server/local seeding merge', () => {
  test('server settlement updates replace stale local values at the same status', () => {
    const local = { campaignId: 'c1', status: 'done', pointsGranted: 100, paidAt: null };
    const remote = { campaignId: 'c1', status: 'done', pointsGranted: 200, paidAt: '2026-09-14T00:00:00Z' };
    expect(mergeSeeding(local, remote)).toMatchObject(remote);
    expect(mergeSeeding(local, { ...remote, pointsGranted: 0, paidAt: null }))
      .toMatchObject({ pointsGranted: 0, paidAt: null });
  });

  test('a stale server state cannot overwrite settlement values', () => {
    const local = { campaignId: 'c1', status: 'done', pointsGranted: 200 };
    expect(mergeSeeding(local, { campaignId: 'c1', status: 'reviewing', pointsGranted: 0 }))
      .toMatchObject(local);
  });

  test('a stale server snapshot does not roll back a local transition', () => {
    const local = {
      campaignId: 'c1',
      status: SEEDING_STATUS.RECEIVED,
      receivedAt: '2026-09-01T00:00:00.000Z',
      fgiSurvey: { q1: 3 },
    };
    const remote = { campaignId: 'c1', status: SEEDING_STATUS.SHIPPED, trackingNo: 'TRK1' };
    const merged = mergeSeeding(local, remote);
    expect(merged.status).toBe(SEEDING_STATUS.RECEIVED);
    expect(merged.receivedAt).toBe(local.receivedAt);
    expect(merged.fgiSurvey).toEqual(local.fgiSurvey);
    expect(merged.trackingNo).toBe('TRK1');
  });

  test('a further-along server status wins together with its stamps', () => {
    const local = { campaignId: 'c1', status: SEEDING_STATUS.APPROVED, address: { name: 'A' } };
    const remote = {
      campaignId: 'c1',
      status: SEEDING_STATUS.SHIPPED,
      shippedAt: '2026-09-02T00:00:00.000Z',
    };
    const merged = mergeSeeding(local, remote);
    expect(merged.status).toBe(SEEDING_STATUS.SHIPPED);
    expect(merged.shippedAt).toBe(remote.shippedAt);
    expect(merged.address).toEqual({ name: 'A' });
  });

  test('terminal server states override an in-flight local state', () => {
    const local = { campaignId: 'c1', status: SEEDING_STATUS.RECEIVED };
    const remote = { campaignId: 'c1', status: SEEDING_STATUS.CANCELLED };
    expect(mergeSeeding(local, remote).status).toBe(SEEDING_STATUS.CANCELLED);
  });

  test('no local record takes the server record as-is', () => {
    const remote = { campaignId: 'c9', status: SEEDING_STATUS.APPLIED };
    expect(mergeSeeding(undefined, remote)).toEqual(remote);
  });
});

describe('active seeding judgement', () => {
  test('cancelled and no-show are not active, so re-application is allowed', () => {
    expect(isActiveSeeding({ status: SEEDING_STATUS.CANCELLED })).toBe(false);
    expect(isActiveSeeding({ status: SEEDING_STATUS.NO_SHOW })).toBe(false);
    expect(isActiveSeeding({ status: SEEDING_STATUS.DONE })).toBe(false);
    expect(isActiveSeeding(undefined)).toBe(false);
  });
  test('applied through reviewing are active', () => {
    for (const status of ['applied', 'approved', 'shipped', 'received', 'reviewing']) {
      expect(isActiveSeeding({ status })).toBe(true);
    }
  });
});

describe('address deadline', () => {
  const approvedAt = new Date('2026-09-01T00:00:00.000Z');
  test('counts down from approval', () => {
    expect(addressHoursLeft({ approvedAt: approvedAt.toISOString() }, approvedAt)).toBe(
      ADDRESS_DEADLINE_HOURS,
    );
    const later = new Date(approvedAt.getTime() + 47.5 * 3600 * 1000);
    expect(addressHoursLeft({ approvedAt: approvedAt.toISOString() }, later)).toBe(1);
  });
  test('is negative or zero once the window passed', () => {
    const past = new Date(approvedAt.getTime() + 50 * 3600 * 1000);
    expect(addressHoursLeft({ approvedAt: approvedAt.toISOString() }, past)).toBeLessThanOrEqual(0);
  });
  test('is null without an approval stamp', () => {
    expect(addressHoursLeft({})).toBeNull();
  });
});
