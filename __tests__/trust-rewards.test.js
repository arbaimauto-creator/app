import { profileCompleteness, trustComponents } from '../api/trust';
import { buildRewardLedger, ledgerTotals, REWARD_STATE } from '../api/rewards';

describe('profile completeness (plan §5.4)', () => {
  test('counts filled fields and lists the missing ones', () => {
    const r = profileCompleteness({ country: 'KR', handleUrl: '@a', contentCategories: [] });
    expect(r.percent).toBe(25);
    expect(r.missing).toContain('contentCategories');
    expect(r.missing).not.toContain('country');
    expect(profileCompleteness(null).percent).toBe(0);
  });
});

describe('trust components', () => {
  test('on-time rate is derived from done vs no-show, identity is off until verified', () => {
    const t = trustComponents(
      { completedCount: 3, strikes: 1 },
      { a: { status: 'done', fgiSurvey: {} }, b: { status: 'no_show' }, c: { status: 'done' } },
    );
    expect(t.onTimeRate).toBe(67);
    expect(t.surveys).toBe(1);
    expect(t.identityVerified).toBe(false);
    expect(trustComponents(null, {}).onTimeRate).toBeNull();
  });
});

describe('reward ledger', () => {
  const campaigns = [
    { id: 'c1', title: 'One', basePoints: 500 },
    { id: 'c2', title: 'Two', basePoints: 300 },
  ];
  test('maps seeding states to the five reward states with reasons', () => {
    const ledger = buildRewardLedger(
      {
        c1: { campaignId: 'c1', status: 'received' },
        c2: {
          campaignId: 'c2',
          status: 'done',
          pointsGranted: 210,
          graceUsed: true,
          doneAt: '2026-09-01',
        },
        c3: { campaignId: 'c3', status: 'no_show' },
      },
      campaigns,
      { gScore: 50 },
      { onboardingBonus: true },
    );
    const byId = Object.fromEntries(ledger.map((e) => [e.campaignId, e]));
    expect(byId.c1).toMatchObject({
      state: REWARD_STATE.EXPECTED,
      points: 500,
      reason: 'in_progress',
    });
    expect(byId.c2).toMatchObject({
      state: REWARD_STATE.CONFIRMED,
      points: 210,
      reason: 'grace_discount',
    });
    expect(byId.c3).toMatchObject({ state: REWARD_STATE.CANCELLED, points: 0, reason: 'no_show' });
    expect(byId.__onboarding).toMatchObject({ state: REWARD_STATE.CONFIRMED, points: 50 });
    const totals = ledgerTotals(ledger);
    expect(totals.expected).toBe(500);
    expect(totals.confirmed).toBe(260);
  });
  test('done without a granted snapshot stays under review, paidAt becomes paid', () => {
    const ledger = buildRewardLedger(
      {
        a: { campaignId: 'c1', status: 'done' },
        b: { campaignId: 'c2', status: 'done', pointsGranted: 300, paidAt: '2026-09-02' },
      },
      campaigns,
    );
    expect(ledger.find((e) => e.campaignId === 'c1').state).toBe(REWARD_STATE.REVIEWING);
    expect(ledger.find((e) => e.campaignId === 'c2').state).toBe(REWARD_STATE.PAID);
  });
});
