// 주문서 로직 (2026-09-16) — docs/commerce-and-seller-2026-09-16.md P1
import {
  buildOrderParams,
  isAbroadAddress,
  isAddressComplete,
  itemTotal,
  missingAddressFields,
} from '../Components/utils/orderSheet';

const KR_ADDRESS = {
  name: '유수영',
  line: '학동로 212 포스트빌 311호',
  city: '서울 강남구',
  postalCode: '06051',
  phone: '010-0000-0000',
};

test('배송지 필수값이 빠지면 무엇이 빠졌는지 알려준다', () => {
  expect(missingAddressFields({ ...KR_ADDRESS, phone: '  ' })).toEqual(['phone']);
  expect(missingAddressFields(null)).toEqual(['name', 'line', 'city', 'postalCode', 'phone']);
  expect(isAddressComplete(KR_ADDRESS)).toBe(true);
});

test('우편번호 5자리는 국내, 그 외는 해외로 본다', () => {
  expect(isAbroadAddress(KR_ADDRESS)).toBe(false);
  expect(isAbroadAddress({ ...KR_ADDRESS, postalCode: '94103' })).toBe(false);
  expect(isAbroadAddress({ ...KR_ADDRESS, postalCode: 'SW1A 1AA' })).toBe(true);
});

test('국가 표기가 있으면 우편번호보다 국가를 따른다', () => {
  expect(isAbroadAddress({ ...KR_ADDRESS, country: 'KR' })).toBe(false);
  expect(isAbroadAddress({ ...KR_ADDRESS, country: 'US' })).toBe(true);
});

test('상품 합계는 옵션 추가금과 수량을 반영한다', () => {
  const total = itemTotal({
    price: 25500,
    quantity: 2,
    options: {
      lists: [{ name: '색상', selectedItemName: '핑크', addition: 1000 }],
      checks: [
        { name: '선물포장', addition: 2000, isChecked: true },
        { name: '카드', addition: 1500, isChecked: false },
      ],
    },
  });

  // (25500 + 1000) * 2 + 2000
  expect(total).toBe(55000);
});

test('주문 본문은 주소를 한 줄로 합치고 받는 사람 정보를 채운다', () => {
  const params = buildOrderParams({
    cartItemId: 'c1',
    address: { ...KR_ADDRESS, state: '' },
    memo: '부재 시 경비실',
    buyer: { email: 'buyer@example.com' },
  });

  expect(params).toEqual({
    cartItems: ['c1'],
    address: '학동로 212 포스트빌 311호 서울 강남구 06051',
    receiverName: '유수영',
    receiverPhone: '010-0000-0000',
    buyerName: '유수영',
    buyerPhone: '010-0000-0000',
    buyerEmail: 'buyer@example.com',
    buyerMemo: '부재 시 경비실',
    isAbroad: false,
  });
});
