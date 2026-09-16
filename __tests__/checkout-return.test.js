// 결제창 복귀 판정 (2026-09-16) — docs/commerce-and-seller-2026-09-16.md P1
import { CHECKOUT_RESULT, classifyCheckoutUrl } from '../Components/utils/checkout';

const BASE = 'https://api.greyd.app/orders/checkout';

test('성공 복귀 주소에서 주문번호와 세션을 읽는다', () => {
  const url = `${BASE}/success?orderId=o1&session_id=cs_test_123`;

  expect(classifyCheckoutUrl(url, BASE)).toEqual({
    result: CHECKOUT_RESULT.SUCCESS,
    orderId: 'o1',
    sessionId: 'cs_test_123',
  });
});

test('취소 복귀 주소는 취소로 본다', () => {
  expect(classifyCheckoutUrl(`${BASE}/cancel?orderId=o1`, BASE)).toEqual({
    result: CHECKOUT_RESULT.CANCEL,
    orderId: 'o1',
  });
});

test('결제창 안의 다른 주소(카드사 인증 등)는 진행 중으로 본다', () => {
  expect(classifyCheckoutUrl('https://checkout.stripe.com/c/pay/cs_test_123', BASE).result).toBe(
    CHECKOUT_RESULT.PENDING,
  );
  expect(classifyCheckoutUrl('https://hooks.stripe.com/3d_secure/authenticate', BASE).result).toBe(
    CHECKOUT_RESULT.PENDING,
  );
});

test('복귀 주소를 흉내 낸 다른 도메인은 결과로 인정하지 않는다', () => {
  const fake = 'https://evil.example.com/orders/checkout/success?orderId=o1&session_id=cs_x';

  expect(classifyCheckoutUrl(fake, BASE).result).toBe(CHECKOUT_RESULT.PENDING);
});

test('주소나 기준값이 없으면 진행 중으로 본다', () => {
  expect(classifyCheckoutUrl('', BASE).result).toBe(CHECKOUT_RESULT.PENDING);
  expect(classifyCheckoutUrl(`${BASE}/success?orderId=o1`, '').result).toBe(
    CHECKOUT_RESULT.PENDING,
  );
});
