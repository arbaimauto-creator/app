// 브랜드 코드 검증 (2026-09-23) — ops 정본, 실패 시 dev mock 폴백
jest.mock('./opsClient', () => ({
  opsPost: jest.fn(),
  setOpsToken: jest.fn(async () => {}),
}));
jest.mock('./opsBridge', () => ({ getGreydAppId: jest.fn(async () => 'dev-device') }));
jest.mock(
  'react-native-default-preference',
  () => {
    const store = {};
    return { set: jest.fn(async (k, v) => { store[k] = v; }), __store: store };
  },
  { virtual: true },
);

global.__DEV__ = true;
const { verifyBrandCode, enterSellerMode } = require('./brandCode');
const ops = require('./opsClient');
const Preference = require('react-native-default-preference');

beforeEach(() => {
  ops.opsPost.mockReset();
  ops.setOpsToken.mockClear();
});

test('ops가 유효 코드를 승인하면 성공 + 토큰 저장', async () => {
  ops.opsPost.mockResolvedValueOnce({ ok: true, brandId: 7, brandName: '디어브', token: 'tk' });
  const r = await verifyBrandCode(' dearb-123 ');
  expect(r).toEqual({ success: true, brandId: 7, brandName: '디어브' });
  expect(ops.setOpsToken).toHaveBeenCalledWith('tk');
  expect(ops.opsPost).toHaveBeenCalledWith(
    '/brand/verify-code',
    expect.objectContaining({ brandCode: 'DEARB-123' }),
  );
});

test('ops 401(거부)은 폴백하지 않고 실패로', async () => {
  ops.opsPost.mockRejectedValueOnce({ status: 401, body: { error: 'invalid' } });
  expect(await verifyBrandCode('BAD')).toEqual({ success: false, reason: 'invalid' });
});

test('서버 도달 실패 시 dev mock 코드로 폴백', async () => {
  ops.opsPost.mockRejectedValueOnce({ status: 0 });
  expect(await verifyBrandCode('ARBAIM-SELLER')).toMatchObject({ success: true });
  ops.opsPost.mockRejectedValueOnce({ status: 0 });
  expect(await verifyBrandCode('NOPE')).toEqual({ success: false });
});

test('빈 코드는 즉시 실패', async () => {
  expect(await verifyBrandCode('')).toEqual({ success: false, reason: 'empty' });
});

test('enterSellerMode가 역할·판매자 플래그를 저장', async () => {
  await enterSellerMode({ brandName: '디어브', brandId: 7 });
  expect(Preference.set).toHaveBeenCalledWith('inviteRole', 'brand');
  expect(Preference.set).toHaveBeenCalledWith('userIsSeller', 'true');
  expect(Preference.set).toHaveBeenCalledWith('sellerBrandName', '디어브');
});
