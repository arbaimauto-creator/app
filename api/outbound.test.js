// 외부몰 이동 로그 (2026-09-17) — 그레이드 경유 증빙: utm 부착 + 클릭 큐 적재
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

jest.mock('./common/analytics', () => ({
  logEvent: jest.fn(async () => {}),
}));

const { withGreydParams, logOutboundClick, getOutboundQueue } = require('./outbound');
const pref = require('./prefSafe');
const analytics = require('./common/analytics');

beforeEach(() => {
  Object.keys(pref.__store).forEach((k) => delete pref.__store[k]);
  analytics.logEvent.mockClear();
});

test('외부몰 URL에 그레이드 귀속 파라미터를 붙인다 (기존 쿼리 보존)', () => {
  expect(withGreydParams('https://shop.example.com/items?page=2', { uid: 'u1' })).toBe(
    'https://shop.example.com/items?page=2&utm_source=greyd&utm_medium=app&greyd_uid=u1',
  );
  expect(withGreydParams('https://shop.example.com/', {})).toBe(
    'https://shop.example.com/?utm_source=greyd&utm_medium=app',
  );
});

test('잘못된 URL은 원본을 그대로 돌려준다', () => {
  expect(withGreydParams('', { uid: 'u1' })).toBe('');
  expect(withGreydParams(null, { uid: 'u1' })).toBe(null);
});

test('클릭 로그는 이벤트 전송 + 로컬 큐 적재 (클릭마다 기록)', async () => {
  await logOutboundClick({ sellerId: 's1', productId: 'p1', url: 'https://a.com', at: 1000 });
  await logOutboundClick({ sellerId: 's1', productId: 'p1', url: 'https://a.com', at: 2000 });
  expect(analytics.logEvent).toHaveBeenCalledTimes(2);
  expect(analytics.logEvent).toHaveBeenCalledWith(
    'outbound_click',
    expect.objectContaining({ seller_id: 's1', product_id: 'p1' }),
  );
  const queue = await getOutboundQueue();
  expect(queue).toHaveLength(2);
  expect(queue[0]).toMatchObject({ sellerId: 's1', productId: 'p1', at: 1000 });
});
