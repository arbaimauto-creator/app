jest.mock('./opsRuntimeConfig', () => ({
  OPS_API_BASE: 'https://greyd-ops.vercel.app/api/mobile',
}));
jest.mock('./opsClient', () => ({ opsGet: jest.fn(), opsPost: jest.fn() }));
const {
  storeTokenFromLink,
  isStorePortalUrl,
  connectStore,
  sellerProducts,
  startStoreCheckout,
} = require('./store');
const { opsGet, opsPost } = require('./opsClient');
const token = 'a'.repeat(32);
test('seller links accept only the configured portal and exact token format', () => {
  expect(storeTokenFromLink(`https://greyd-ops.vercel.app/portal/store/${token}?edit=4`)).toBe(
    token,
  );
  expect(storeTokenFromLink(token)).toBe(token);
  expect(
    storeTokenFromLink(`https://greyd-ops.vercel.app.evil.com/portal/store/${token}`),
  ).toBeNull();
  expect(storeTokenFromLink(`https://evil.com/portal/store/${token}`)).toBeNull();
  expect(storeTokenFromLink('javascript:alert(1)')).toBeNull();
  expect(isStorePortalUrl(token)).toBe(false);
});
test('seller ownership uses a verified portal link, not a client seller ID', async () => {
  await connectStore(token);
  expect(opsPost).toHaveBeenCalledWith('/store/connect', { token });
  await sellerProducts(4);
  expect(opsGet).toHaveBeenCalledWith('/store/products?campaignId=4');
});
test('checkout retries preserve the same request ID', async () => {
  const body = { productId: 4, quantity: 2, country: 'KR', requestId: 'store-request-retry' };
  await startStoreCheckout(body);
  await startStoreCheckout(body);
  expect(opsPost.mock.calls.slice(-2)).toEqual([
    ['/store/checkout', body],
    ['/store/checkout', body],
  ]);
});
