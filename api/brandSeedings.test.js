// 판매자 시딩(제품 뿌리기) 요청 (2026-09-17) — 로컬 기록 + ops 아웃박스 전송
jest.mock('./prefSafe', () => {
  const store = {};
  return {
    prefGetSafe: jest.fn(async (k) => store[k] ?? null),
    prefSetSafe: jest.fn(async (k, v) => {
      store[k] = v;
    }),
    __store: store,
  };
});

jest.mock('./opsOutbox', () => ({
  enqueue: jest.fn(async () => {}),
}));

const { createSeedingRequest, listSeedingRequests } = require('./brandSeedings');
const pref = require('./prefSafe');
const outbox = require('./opsOutbox');

beforeEach(() => {
  Object.keys(pref.__store).forEach((k) => delete pref.__store[k]);
  outbox.enqueue.mockClear();
});

test('요청이 로컬에 최신순으로 쌓이고 ops로 전송을 시도한다', async () => {
  await createSeedingRequest({ title: '앰플 20개', quantity: 20, fgi: true, points: 500 }, 1000);
  await createSeedingRequest({ title: '선크림 10개', quantity: 10, fgi: false, points: 300 }, 2000);

  const list = await listSeedingRequests();
  expect(list).toHaveLength(2);
  expect(list[0].title).toBe('선크림 10개');
  expect(list[0].status).toBe('queued');

  expect(outbox.enqueue).toHaveBeenCalledTimes(2);
  expect(outbox.enqueue).toHaveBeenCalledWith(
    'campaign.create',
    expect.any(String),
    '/brand/campaigns',
    expect.objectContaining({ title: '앰플 20개', quantity: 20, fgi: true }),
  );
});

test('전송 실패해도 로컬 기록은 남는다', async () => {
  outbox.enqueue.mockRejectedValueOnce(new Error('offline'));
  await createSeedingRequest({ title: '실패해도 저장', quantity: 5, fgi: true }, 3000);
  expect(await listSeedingRequests()).toHaveLength(1);
});
