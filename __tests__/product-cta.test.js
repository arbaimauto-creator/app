// 상품 구매 버튼 상태 규칙 (2026-09-16) — docs/commerce-and-seller-2026-09-16.md P0
jest.mock('../Components/Constants/Features', () => ({ COMMERCE: false }));
jest.mock('../Components/Strings', () => ({
  PRODUCT_LINK_OPEN_FAILED: '링크를 열 수 없어요',
  PRODUCT_IN_APP_SOON: '앱 내 구매 준비 중',
  PRODUCT_IN_APP_SOON_BODY: '지금은 앱에서 바로 결제할 수 없어요.',
  OK: '확인',
}));

import { Alert, Linking } from 'react-native';
import {
  PRODUCT_CTA,
  externalProductUrl,
  openExternalProduct,
  productCtaState,
} from '../Components/utils/productCta';

beforeEach(() => jest.restoreAllMocks());

test('연결 상품이 없거나 삭제된 상품이면 버튼을 만들지 않는다', () => {
  expect(productCtaState(null)).toBe(PRODUCT_CTA.NONE);
  expect(productCtaState({ statusCode: 1, productId: 'p1' })).toBe(PRODUCT_CTA.NONE);
  expect(productCtaState({ titleByCountry: '이름만 있는 상품' })).toBe(PRODUCT_CTA.NONE);
});

test('외부 링크 상품은 판매처로 보낸다 (리뷰·상품 문서 필드 이름이 달라도 동일)', () => {
  expect(productCtaState({ externalLink: 'https://shop.example.com/a' })).toBe(
    PRODUCT_CTA.EXTERNAL,
  );
  expect(productCtaState({ externalProductPageUrl: 'https://shop.example.com/b' })).toBe(
    PRODUCT_CTA.EXTERNAL,
  );
  expect(externalProductUrl({ externalLink: '  https://shop.example.com/a  ' })).toBe(
    'https://shop.example.com/a',
  );
});

test('앱 내 상품은 커머스가 꺼져 있으면 준비 중, 켜지면 구매다', () => {
  const product = { productId: 'p1' };
  expect(productCtaState(product)).toBe(PRODUCT_CTA.SOON);
  expect(productCtaState(product, { commerceEnabled: true })).toBe(PRODUCT_CTA.IN_APP);
});

test('외부 링크를 열 수 없으면 조용히 실패하지 않고 알린다', async () => {
  jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  const opened = await openExternalProduct({ externalLink: 'weirdscheme://x' });

  expect(opened).toBe(false);
  expect(alert).toHaveBeenCalledWith('링크를 열 수 없어요', 'weirdscheme://x');
});

test('열 수 있는 링크는 외부 브라우저로 연다', async () => {
  jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

  const opened = await openExternalProduct({ externalLink: 'https://shop.example.com/a' });

  expect(opened).toBe(true);
  expect(open).toHaveBeenCalledWith('https://shop.example.com/a');
});
