// 주문서 로직 (2026-09-16) — docs/commerce-and-seller-2026-09-16.md P1
// 화면과 분리해 둔 순수 함수들. 금액은 서버가 다시 계산하므로 여기 값은 "보여주기"용이다.
// (서버 createOrder가 cartItem.price와 배송비를 다시 합산한다 — 앱 값이 달라도 서버 값이 이긴다)

export const ORDER_FORM_FIELDS = ['name', 'line', 'city', 'postalCode', 'phone'];

// 배송지 필수값 검사 — 빠진 필드 목록을 돌려준다(빈 배열이면 통과)
export function missingAddressFields(address) {
  const a = address || {};
  return ORDER_FORM_FIELDS.filter((key) => !String(a[key] || '').trim());
}

export function isAddressComplete(address) {
  return missingAddressFields(address).length === 0;
}

// 한국 배송지인지 — 우편번호 5자리 숫자 또는 국가 표기로 판단한다.
// 서버 createOrder는 isAbroad로 배송비를 가른다(국내: 상품 배송비, 해외: 고정 20달러 환산).
export function isAbroadAddress(address) {
  const a = address || {};
  const country = String(a.country || '')
    .trim()
    .toUpperCase();
  if (country) {
    return !(country === 'KR' || country === 'KOREA' || country === '대한민국');
  }
  const postal = String(a.postalCode || '').trim();
  return !/^\d{5}$/.test(postal);
}

// 화면에 보여줄 금액 — 옵션 추가금까지 더한 상품 합계(배송비 제외)
export function itemTotal({ price = 0, quantity = 1, options } = {}) {
  const lists = (options && options.lists) || [];
  const checks = (options && options.checks) || [];
  const listAddition = lists.reduce((sum, o) => sum + Number(o.addition || 0), 0);
  const checkAddition = checks
    .filter((o) => o.isChecked !== false)
    .reduce((sum, o) => sum + Number(o.addition || 0), 0);

  return (Number(price) + listAddition) * Number(quantity || 1) + checkAddition;
}

// 서버 POST /orders 본문 조립. 주소는 한 줄로 합쳐 보낸다(서버 order.address가 문자열).
export function buildOrderParams({
  cartItemId,
  address,
  memo = '',
  buyer = {},
  trackingCode = '',
}) {
  const a = address || {};
  const addressLine = [a.line, a.city, a.state, a.postalCode].filter(Boolean).join(' ').trim();

  return {
    cartItems: [cartItemId],
    address: addressLine,
    receiverName: a.name || '',
    receiverPhone: a.phone || '',
    buyerName: buyer.name || a.name || '',
    buyerPhone: buyer.phone || a.phone || '',
    buyerEmail: buyer.email || '',
    buyerMemo: memo || '',
    isAbroad: isAbroadAddress(a),
    // 2차 가공물·공동구매 귀속 (2026-09-16 P2) — 서버가 주문에 저장하고 결제 완료 시 ops로 보낸다
    ...(trackingCode ? { trackingCode: String(trackingCode).trim() } : {}),
  };
}
