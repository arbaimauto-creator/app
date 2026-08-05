import React from 'react';
import MakeOrderScreen from './MakeOrderScreen';

// 해외 주문 화면은 MakeOrderScreen의 global 변형 — 포크를 래퍼로 대체
export default function GlobalMakeOrderScreen(props) {
  return <MakeOrderScreen {...props} isGlobal />;
}
