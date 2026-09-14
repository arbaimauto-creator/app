import { rankCampaigns, scoreCampaign, buildTodoItems, REASON } from '../api/recommend';

const now = new Date('2026-09-10T00:00:00.000Z');
const open = (id, over = {}) => ({
  id,
  brand: 'B',
  brandId: `brand-${id}`,
  title: id,
  status: 'open',
  remaining: 5,
  countries: ['KR', 'US'],
  applyMode: 'open',
  basePoints: 500,
  deadline: '2026-10-01T00:00:00.000Z',
  ...over,
});

describe('campaign ranking (plan §5.1 personalization)', () => {
  test('country match and closing-soon outrank the rest, with reasons attached', () => {
    const list = [
      open('far', { countries: ['DE'] }),
      open('soon', { deadline: '2026-09-13T00:00:00.000Z' }),
      open('plain'),
    ];
    const ranked = rankCampaigns(list, { profile: { country: 'KR', completedCount: 1 }, now });
    expect(ranked.map((r) => r.campaign.id)).toEqual(['soon', 'plain', 'far']);
    expect(ranked[0].reasons).toContain(REASON.COUNTRY);
    expect(ranked[0].reasons).toContain(REASON.DEADLINE);
  });
  test('hidden, closed and already-active campaigns are excluded', () => {
    const list = [open('hidden'), open('closed', { remaining: 0 }), open('active'), open('ok')];
    const ranked = rankCampaigns(list, {
      profile: { country: 'KR' },
      seedings: { active: { status: 'approved' } },
      hidden: ['hidden'],
      now,
    });
    expect(ranked.map((r) => r.campaign.id)).toEqual(['ok']);
  });
  test('locked curated campaigns stay visible but sink; unlocked ones rise', () => {
    const list = [open('curated', { applyMode: 'curated' }), open('open')];
    const locked = rankCampaigns(list, { profile: { country: 'KR', gScore: 50 }, now });
    expect(locked[0].campaign.id).toBe('open');
    const unlocked = rankCampaigns(list, {
      profile: { country: 'KR', gScore: 65, completedCount: 3 },
      now,
    });
    expect(unlocked[0].campaign.id).toBe('curated');
    expect(unlocked[0].reasons).toContain(REASON.UNLOCKED);
  });
  test('first campaign and brand repeat are explained', () => {
    expect(
      scoreCampaign(open('a'), { profile: { country: 'KR', completedCount: 0 }, now }).reasons,
    ).toContain(REASON.FIRST);
    const r = scoreCampaign(open('a', { brandId: 'brand-x' }), {
      profile: { country: 'KR', completedCount: 1 },
      seedings: { old: { status: 'done', brandId: 'brand-x' } },
      now,
    });
    expect(r.reasons).toContain(REASON.BRAND_AGAIN);
  });
});

describe('home to-do strip', () => {
  test('orders by required action and shows the upload countdown', () => {
    const campaigns = [open('a'), open('b'), open('c')];
    const items = buildTodoItems(
      {
        a: { campaignId: 'a', status: 'reviewing' },
        b: { campaignId: 'b', status: 'approved' },
        c: { campaignId: 'c', status: 'received', receivedAt: '2026-09-01T00:00:00.000Z' },
      },
      campaigns,
      now,
    );
    expect(items.map((i) => i.action)).toEqual(['address', 'upload', 'wait_brand']);
    expect(items[1].dayLeft).toBe(5);
  });
});
