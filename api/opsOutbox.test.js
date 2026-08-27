const mockOpsPost = jest.fn();
jest.mock('./opsClient', () => ({ opsPost: (...args) => mockOpsPost(...args) }));

const store = {};
jest.mock('./prefSafe', () => ({
  prefGetSafe: jest.fn(async (key) => store[key] ?? null),
  prefSetSafe: jest.fn(async (key, value) => {
    store[key] = value;
    return true;
  }),
}));

const { enqueue, flush, __KEY } = require('./opsOutbox');
const read = () => JSON.parse(store[__KEY] || '[]');

beforeEach(() => {
  mockOpsPost.mockReset();
  delete store[__KEY];
});

test('successful delivery leaves no queued item', async () => {
  mockOpsPost.mockResolvedValue({ ok: true });
  await enqueue('address', 'cmp-1', '/address', { a: 1 });
  expect(read()).toHaveLength(0);
});

test('failed delivery is retained and duplicate keys are replaced', async () => {
  mockOpsPost.mockRejectedValue(new Error('offline'));
  await enqueue('address', 'cmp-1', '/address', { a: 1 });
  await enqueue('address', 'cmp-1', '/address', { a: 2 });
  expect(read()).toHaveLength(1);
  expect(read()[0].body).toEqual({ a: 2 });
  expect(read()[0].tries).toBe(1);
});

test('401 failures are parked', async () => {
  const error = new Error('unauthorized');
  error.status = 401;
  mockOpsPost.mockRejectedValue(error);
  await enqueue('fgi', 'cmp-2', '/fgi', {});
  expect(read()[0].parked).toBe(true);
});

test('backoff prevents an immediate retry', async () => {
  mockOpsPost.mockRejectedValue(new Error('offline'));
  await enqueue('received', 'cmp-3', '/received', {});
  mockOpsPost.mockClear();
  await flush();
  expect(mockOpsPost).not.toHaveBeenCalled();
});
