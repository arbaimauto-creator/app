// 결제창(웹뷰) 복귀 판정 (2026-09-16) — docs/commerce-and-seller-2026-09-16.md P1
// Stripe Checkout은 결제 후 success_url / cancel_url로 이동한다. 앱은 딥링크 대신 웹뷰의 주소 변화를 보고
// 결과를 판단한다(커스텀 스킴 화이트리스트·다이나믹 링크를 거치지 않아 복귀가 확실하다).
export const CHECKOUT_RESULT = {
  SUCCESS: 'success',
  CANCEL: 'cancel',
  PENDING: 'pending', // 아직 결제창 안
};

function queryValue(url, key) {
  const m = new RegExp('[?&]' + key + '=([^&#]*)').exec(url || '');
  return m ? decodeURIComponent(m[1]) : '';
}

// 서버가 만든 복귀 주소만 결과로 인정한다. 그 외 주소(카드사 인증 등)는 결제 진행 중으로 본다.
export function classifyCheckoutUrl(url, returnBase) {
  if (!url || !returnBase) {
    return { result: CHECKOUT_RESULT.PENDING };
  }
  const base = String(returnBase).replace(/\/$/, '');
  if (url.indexOf(base + '/success') === 0) {
    return {
      result: CHECKOUT_RESULT.SUCCESS,
      orderId: queryValue(url, 'orderId'),
      sessionId: queryValue(url, 'session_id'),
    };
  }
  if (url.indexOf(base + '/cancel') === 0) {
    return { result: CHECKOUT_RESULT.CANCEL, orderId: queryValue(url, 'orderId') };
  }
  return { result: CHECKOUT_RESULT.PENDING };
}
