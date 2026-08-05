import React from 'react';
import ProductPageScreen from '../../Components/ProductPageScreen';

// B2B 상품 페이지는 ProductPageScreen의 B2B 변형이다.
// 기존 2,786줄짜리 포크(약 91% 동일)를 제거하고 isB2B 분기로 통합했다.
// B2B 전용 차이는 ProductPageScreen 내부의 isB2B(context) / props.isB2B 분기 참고.
export default function B2BProductPage(props) {
  return <ProductPageScreen {...props} isB2B />;
}
