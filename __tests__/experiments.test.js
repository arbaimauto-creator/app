// P4 기반 — A/B 배정·이벤트 큐 (2026-09-16)
jest.mock('../Components/Constants/Features', () => ({ LIVE_OPS_API: true }));

const mockOpsGet = jest.fn();
const mockOpsPost = jest.fn();
jest.mock('../api/opsClient', () => ({
  opsGet: (...args) => mockOpsGet(...args),
  opsPost: (...args) => mockOpsPost(...args),
  getGreydAppId: async () => 'app-test-device',
}));

const mockStore = {};
jest.mock('../api/prefSafe', () => ({
  prefGetSafe: async (k) => (k in mockStore ? mockStore[k] : null),
  prefSetSafe: async (k, v) => {
    mockStore[k] = v;
  },
}));

import {
  EXPERIMENTS,
  _queuedEventsForTest,
  _resetExperimentsForTest,
  bucketOf,
  flushEvents,
  pickVariant,
  trackConversion,
  trackEvent,
  trackExposure,
  variantFor,
} from '../api/experiments';

beforeEach(() => {
  mockOpsGet.mockReset();
  mockOpsPost.mockReset();
  _resetExperimentsForTest();
  for (const k of Object.keys(mockStore)) {
    delete mockStore[k];
  }
});

test('버킷은 결정적이고 0~99 안이다', () => {
  expect(bucketOf('abc')).toBe(bucketOf('abc'));
  expect(bucketOf('abc')).not.toBe(bucketOf('abd'));
  for (const s of ['', 'x', 'app-123', 'app-456']) {
    const b = bucketOf(s);
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(100);
  }
});

test('가중치대로 나뉘고 같은 기기는 항상 같은 쪽이다', () => {
  const exp = { key: 'k', variants: ['a', 'b'], weights: [100, 0] };
  for (let i = 0; i < 50; i += 1) {
    expect(pickVariant(exp, `dev-${i}`)).toBe('a');
  }
  const half = { key: 'k', variants: ['a', 'b'], weights: [50, 50] };
  const counts = { a: 0, b: 0 };
  for (let i = 0; i < 400; i += 1) {
    counts[pickVariant(half, `dev-${i}`)] += 1;
  }
  expect(counts.a).toBeGreaterThan(120);
  expect(counts.b).toBeGreaterThan(120);
  expect(pickVariant(half, 'dev-7')).toBe(pickVariant(half, 'dev-7'));
  expect(pickVariant({ key: 'k', variants: [] }, 'x')).toBeNull();
});

test('서버에 실험이 없으면 앱 기본 variant, 있으면 서버 설정으로 배정하고 캐시한다', async () => {
  mockOpsGet.mockResolvedValue({ experiments: {} });
  expect(await variantFor(EXPERIMENTS.HOME_RANKING)).toBe('personalized');

  _resetExperimentsForTest();
  delete mockStore.experimentsConfigV1;
  mockOpsGet.mockClear();
  mockOpsGet.mockResolvedValue({
    experiments: { home_ranking: { variants: ['latest'], weights: [100] } },
  });
  expect(await variantFor(EXPERIMENTS.HOME_RANKING)).toBe('latest');
  expect(await variantFor(EXPERIMENTS.HOME_RANKING)).toBe('latest');
  expect(mockOpsGet).toHaveBeenCalledTimes(1);

  // 서버가 앱이 모르는 variant를 주면 기본값
  _resetExperimentsForTest();
  delete mockStore.experimentsConfigV1;
  mockOpsGet.mockResolvedValue({
    experiments: { home_ranking: { variants: ['weird'], weights: [100] } },
  });
  expect(await variantFor(EXPERIMENTS.HOME_RANKING)).toBe('personalized');
});

test('서버가 죽어도 기본 variant로 동작한다', async () => {
  mockOpsGet.mockRejectedValue(new Error('offline'));
  expect(await variantFor(EXPERIMENTS.HOME_RANKING)).toBe('personalized');
});

test('이벤트는 이름을 검사하고 묶어 보내며 실패분은 남긴다', async () => {
  expect(trackEvent('Bad Name!')).toBe(false);
  expect(trackEvent('order.paid', { attributed: true })).toBe(true);
  trackExposure(EXPERIMENTS.HOME_RANKING, 'latest');
  trackConversion(EXPERIMENTS.HOME_RANKING, 'latest', { campaignId: 'c1' });
  expect(_queuedEventsForTest().map((e) => e.name)).toEqual([
    'order.paid',
    'exp.home_ranking.exposure',
    'exp.home_ranking.conversion',
  ]);

  mockOpsPost.mockRejectedValueOnce(new Error('offline'));
  expect(await flushEvents()).toBe(0);
  expect(_queuedEventsForTest()).toHaveLength(3);

  mockOpsPost.mockResolvedValueOnce({ ok: true, accepted: 3 });
  expect(await flushEvents()).toBe(3);
  expect(_queuedEventsForTest()).toHaveLength(0);
  const body = mockOpsPost.mock.calls[1][1];
  expect(body.events[2].props).toEqual({ variant: 'latest', campaignId: 'c1' });
});

test('20개가 쌓이면 바로 보낸다', async () => {
  mockOpsPost.mockResolvedValue({ ok: true });
  for (let i = 0; i < 20; i += 1) {
    trackEvent('screen.view', { i });
  }
  await new Promise((r) => setTimeout(r, 0));
  expect(mockOpsPost).toHaveBeenCalledWith('/events', expect.objectContaining({ events: expect.any(Array) }));
});
