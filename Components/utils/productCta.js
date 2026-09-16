// 상품 구매 버튼 상태 판정 (2026-09-16) — docs/commerce-and-seller-2026-09-16.md P0
// 화면 3곳(쇼츠 상품 카드·상품 상세·주문 카드)이 같은 규칙을 쓰도록 한 곳에 모은다.
// 원칙: 사용자에게 "데이터 없음"·영어 오류 문구를 보이지 않는다. 팔 수 없으면 버튼을 숨기고 이유를 한 줄로 말한다.
import { Alert, Linking } from 'react-native';
import FEATURES from '../Constants/Features';
import Strings from '../Strings';

export const PRODUCT_CTA = {
  IN_APP: 'in_app', // 앱 안에서 결제 (커머스 켜짐)
  EXTERNAL: 'external', // 외부 판매처로 이동
  SOON: 'soon', // 앱 내 구매 준비 중 (커머스 꺼짐)
  NONE: 'none', // 연결 상품 없음·삭제됨 → 카드도 버튼도 없음
};

// 서버는 리뷰의 linkedProduct엔 externalLink, 상품 문서엔 externalProductPageUrl로 같은 뜻을 담는다.
export function externalProductUrl(linkedProduct) {
  if (!linkedProduct) {
    return '';
  }
  const url = linkedProduct.externalLink || linkedProduct.externalProductPageUrl || '';
  return typeof url === 'string' ? url.trim() : '';
}

export function productCtaState(linkedProduct, options = {}) {
  const commerceEnabled =
    options.commerceEnabled === undefined ? !!FEATURES.COMMERCE : !!options.commerceEnabled;

  if (!linkedProduct || linkedProduct.statusCode === 1) {
    return PRODUCT_CTA.NONE;
  }
  if (externalProductUrl(linkedProduct)) {
    return PRODUCT_CTA.EXTERNAL;
  }
  if (!linkedProduct.productId) {
    return PRODUCT_CTA.NONE;
  }
  return commerceEnabled ? PRODUCT_CTA.IN_APP : PRODUCT_CTA.SOON;
}

// 외부 판매처 열기 — 열 수 없으면 조용히 실패하지 않고 한 줄로 알린다.
export async function openExternalProduct(linkedProduct) {
  const url = externalProductUrl(linkedProduct);
  if (!url) {
    return false;
  }
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert(Strings.PRODUCT_LINK_OPEN_FAILED, url);
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch (e) {
    Alert.alert(Strings.PRODUCT_LINK_OPEN_FAILED, url);
    return false;
  }
}

// 커머스가 꺼진 동안의 안내 — 기존 영어 알럿('Unavailable / Ordering is not available in this version.') 대체
export function alertInAppPurchaseSoon() {
  Alert.alert(Strings.PRODUCT_IN_APP_SOON, Strings.PRODUCT_IN_APP_SOON_BODY, [
    { text: Strings.OK },
  ]);
}
