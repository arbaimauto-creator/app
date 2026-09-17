// 단골 적중 원장 (2026-09-17) — 리뷰 단위 dedupe, 2회 도달 시 잠금 해제
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

const {
  REGULAR_UNLOCK_HITS,
  recordHit,
  hitCount,
  isUnlocked,
  wasPromptShown,
  markPromptShown,
  getRegulars,
  addRegular,
  removeRegular,
  seedRegularsFromFollowing,
} = require('./regulars');

const pref = require('./prefSafe');

beforeEach(() => {
  Object.keys(pref.__store).forEach((k) => delete pref.__store[k]);
});

test('적중이 쌓이면 카운트되고 2회에 잠금이 풀린다', async () => {
  expect(await isUnlocked('rev1')).toBe(false);
  const first = await recordHit('rev1', 'v1', 'helpful', 1000);
  expect(first).toEqual({ counted: true, hits: 1 });
  expect(await isUnlocked('rev1')).toBe(false);
  const second = await recordHit('rev1', 'v2', 'purchase', 2000);
  expect(second).toEqual({ counted: true, hits: REGULAR_UNLOCK_HITS });
  expect(await isUnlocked('rev1')).toBe(true);
});

test('같은 리뷰로는 두 번 적중되지 않는다', async () => {
  await recordHit('rev1', 'v1', 'helpful', 1000);
  const dup = await recordHit('rev1', 'v1', 'purchase', 2000);
  expect(dup).toEqual({ counted: false, hits: 1 });
  expect(await hitCount('rev1')).toBe(1);
});

test('프롬프트는 리뷰당 한 번만', async () => {
  expect(await wasPromptShown('v1')).toBe(false);
  await markPromptShown('v1');
  expect(await wasPromptShown('v1')).toBe(true);
});

test('단골 등록·해제·팔로우 승계', async () => {
  await addRegular('rev1');
  await seedRegularsFromFollowing(['rev2', 'rev3', 'rev1']);
  expect((await getRegulars()).sort()).toEqual(['rev1', 'rev2', 'rev3']);
  await removeRegular('rev2');
  expect((await getRegulars()).sort()).toEqual(['rev1', 'rev3']);
});

test('저장값이 깨져 있어도 빈 상태로 동작한다', async () => {
  pref.__store.regularHitsV1 = '{{{broken';
  expect(await hitCount('rev1')).toBe(0);
  const r = await recordHit('rev1', 'v1', 'helpful', 1000);
  expect(r.counted).toBe(true);
});
