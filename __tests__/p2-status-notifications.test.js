// P2 기존 기능 고도화 (2026-09-14): 상태 모델 단일 출처 + 캠페인 활동 알림 파생
import {
  seedingStatusLabel,
  ONGOING_STATUSES,
  REWARD_TONE,
  REWARD_STATE_ORDER,
  rewardPointsText,
  gProgressRatio,
} from '../api/statusModel';
import { SEEDING_STATUS, ACTIVE_STATUSES } from '../api/seedings';
import { REWARD_STATE } from '../api/rewards';
import { buildTodoItems } from '../api/recommend';
import {
  buildActivityNotifications,
  countUnread,
  toNotiListItem,
} from '../api/activityNotifications';
import Codes from '../Components/Constants';

describe('status model (plan §7 P2 — one source for labels/tones)', () => {
  test('every seeding status has a non-empty label (home used to cover only 5 of 8)', () => {
    for (const status of Object.values(SEEDING_STATUS)) {
      const label = seedingStatusLabel(status);
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toBe(status);
    }
    expect(seedingStatusLabel('weird')).toBe('weird');
  });

  test('ongoing list is the seeding ACTIVE_STATUSES, not a copy', () => {
    expect(ONGOING_STATUSES).toBe(ACTIVE_STATUSES);
  });

  test('every reward state has a badge tone and an order slot', () => {
    for (const state of Object.values(REWARD_STATE)) {
      expect(REWARD_TONE[state]).toBeTruthy();
      expect(REWARD_STATE_ORDER).toContain(state);
    }
  });

  test('points text: + for earned, bare 0 for cancelled, dash when unknown', () => {
    expect(rewardPointsText({ state: REWARD_STATE.CONFIRMED, points: 500 })).toBe('+500P');
    expect(rewardPointsText({ state: REWARD_STATE.CANCELLED, points: 0 })).toBe('0P');
    expect(rewardPointsText({ state: REWARD_STATE.EXPECTED, points: null })).toBe('—');
  });

  test('G progress: G50 floor 4%, G60 full, same formula for Activity and My', () => {
    expect(gProgressRatio(50)).toBeCloseTo(0.04);
    expect(gProgressRatio(55)).toBeCloseTo(0.5);
    expect(gProgressRatio(60)).toBe(1);
    expect(gProgressRatio(99)).toBe(1);
  });

  test('todo deadline uses the mission rule (14d + 7d extension)', () => {
    const now = new Date('2026-09-14T00:00:00Z');
    const seedings = {
      a: { campaignId: 'a', status: 'received', receivedAt: '2026-09-04T00:00:00Z' },
      b: {
        campaignId: 'b',
        status: 'received',
        receivedAt: '2026-09-04T00:00:00Z',
        extensionUsed: true,
      },
    };
    const campaigns = [
      { id: 'a', title: 'A', brand: 'X' },
      { id: 'b', title: 'B', brand: 'X' },
    ];
    const items = buildTodoItems(seedings, campaigns, now);
    expect(items.find((i) => i.campaignId === 'a').dayLeft).toBe(4);
    expect(items.find((i) => i.campaignId === 'b').dayLeft).toBe(11);
  });
});

describe('campaign activity notifications (plan §7 P2 — 알림)', () => {
  const campaigns = [
    { id: 'c1', title: 'Sun Cream', brand: 'RoundLab', thumbnailUrl: 'https://x/1.jpg' },
    { id: 'c2', title: 'Eye Cream', brand: 'SonPlan' },
  ];
  const seedings = {
    c1: {
      campaignId: 'c1',
      status: 'received',
      appliedAt: '2026-09-01T00:00:00Z',
      approvedAt: '2026-09-02T00:00:00Z',
      shippedAt: '2026-09-03T00:00:00Z',
      receivedAt: '2026-09-05T00:00:00Z',
    },
    c2: {
      campaignId: 'c2',
      status: 'done',
      approvedAt: '2026-08-02T00:00:00Z',
      shippedAt: '2026-08-03T00:00:00Z',
      receivedAt: '2026-08-05T00:00:00Z',
      uploadedAt: '2026-08-10T00:00:00Z',
      doneAt: '2026-08-12T00:00:00Z',
      pointsGranted: 300,
    },
    orphan: { campaignId: 'nope', status: 'approved', approvedAt: '2026-09-10T00:00:00Z' },
  };

  test('derives one item per stamp, newest first, skips unknown campaigns', () => {
    const items = buildActivityNotifications(seedings, campaigns, new Date('2026-09-14T00:00:00Z'));
    expect(items.map((i) => i.codeKey)).toEqual([
      'CAMPAIGN_UPLOAD_DUE',
      'CAMPAIGN_SHIPPED',
      'CAMPAIGN_APPROVED',
      'CAMPAIGN_REWARD_CONFIRMED',
      'CAMPAIGN_REVIEW_RECEIVED',
      'CAMPAIGN_UPLOAD_DUE',
      'CAMPAIGN_SHIPPED',
      'CAMPAIGN_APPROVED',
    ]);
    expect(items.every((i) => i.campaignId !== 'nope')).toBe(true);
    expect(items[0].code).toBe(Codes.NOTIFICATION_CODE.CAMPAIGN_UPLOAD_DUE);
    expect(items[0].title).toContain('Sun Cream');
    expect(items[0].body).toMatch(/5/); // 14일 - 9일 경과 = 5일 남음
  });

  test('cancelled / no-show only when that is the final status', () => {
    const s = {
      a: { campaignId: 'c1', status: 'received', cancelledAt: '2026-09-01T00:00:00Z' },
      b: { campaignId: 'c2', status: 'no_show', noShowAt: '2026-09-02T00:00:00Z' },
    };
    const keys = buildActivityNotifications(s, campaigns).map((i) => i.codeKey);
    expect(keys).toContain('CAMPAIGN_NO_SHOW');
    expect(keys).not.toContain('CAMPAIGN_CANCELLED');
  });

  test('paid stamp adds a paid item', () => {
    const s = { c2: { ...seedings.c2, paidAt: '2026-08-20T00:00:00Z' } };
    const keys = buildActivityNotifications(s, campaigns).map((i) => i.codeKey);
    expect(keys[0]).toBe('CAMPAIGN_REWARD_PAID');
  });

  test('unread count is everything after the last read timestamp', () => {
    const items = buildActivityNotifications(seedings, campaigns);
    expect(countUnread(items, null)).toBe(items.length);
    expect(countUnread(items, '2026-09-03T00:00:00Z')).toBe(1);
    expect(countUnread(items, '2026-12-01T00:00:00Z')).toBe(0);
  });

  test('list item contract: read flag, thumbnail fallback, tab-aware deep link', () => {
    const items = buildActivityNotifications(seedings, campaigns);
    const upload = toNotiListItem(items[0], '2026-09-01T00:00:00Z');
    expect(upload.isRead).toBe(false);
    expect(upload.local).toBe(true);
    expect(upload.icon.imageUrl).toBe('https://x/1.jpg');
    expect(upload.navigationParams).toEqual({ page: 'MainBottom', params: { screen: 'Activity' } });
    const reward = toNotiListItem(
      items.find((i) => i.codeKey === 'CAMPAIGN_REWARD_CONFIRMED'),
      null,
    );
    expect(reward.navigationParams.page).toBe('RewardLedger');
    expect(reward.icon.imageUrl).toBe(Codes.NO_USER_URL);
  });
});
