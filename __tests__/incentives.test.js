// 내 2차 활용 현황 로직 (2026-09-16 P2·P3)
jest.mock('../Components/Constants/Features', () => ({ LIVE_OPS_API: true }));

const mockOpsGet = jest.fn();
jest.mock('../api/opsClient', () => ({ opsGet: (...args) => mockOpsGet(...args) }));

import {
  EMPTY_INCENTIVES,
  daysLeftUntil,
  getMyIncentives,
  groupBuyProgress,
  hasAnyIncentiveActivity,
} from '../api/incentives';

beforeEach(() => mockOpsGet.mockReset());

test('서버가 죽어도 빈 현황으로 뜬다', async () => {
  mockOpsGet.mockRejectedValue(new Error('offline'));
  await expect(getMyIncentives()).resolves.toEqual(EMPTY_INCENTIVES);
});

test('응답의 빠진 필드는 기본값으로 채운다', async () => {
  mockOpsGet.mockResolvedValue({ assets: [{ id: 1 }], totals: { paid: 5000 } });

  const data = await getMyIncentives();

  expect(data.assets).toHaveLength(1);
  expect(data.grants).toEqual([]);
  expect(data.groupBuys).toEqual([]);
  expect(data.totals).toEqual({ pending: 0, approved: 0, paid: 5000 });
  expect(hasAnyIncentiveActivity(data)).toBe(true);
  expect(hasAnyIncentiveActivity(EMPTY_INCENTIVES)).toBe(false);
});

test('공동구매 진행률은 최소 수량 대비이고 성사 뒤엔 가득 찬다', () => {
  expect(groupBuyProgress({ state: 'OPEN', joinedQuantity: 3, minQuantity: 10 })).toBeCloseTo(0.3);
  expect(groupBuyProgress({ state: 'OPEN', joinedQuantity: 15, minQuantity: 10 })).toBe(1);
  expect(groupBuyProgress({ state: 'SHIPPING', joinedQuantity: 2, minQuantity: 10 })).toBe(1);
  expect(groupBuyProgress({ state: 'OPEN', joinedQuantity: 0, minQuantity: 0 })).toBe(0);
});

test('남은 일수는 올림이고 지난 날짜는 0이다', () => {
  const now = new Date('2026-09-16T00:00:00Z');
  expect(daysLeftUntil('2026-09-18T12:00:00Z', now)).toBe(3);
  expect(daysLeftUntil('2026-09-10T00:00:00Z', now)).toBe(0);
  expect(daysLeftUntil(null, now)).toBeNull();
});
