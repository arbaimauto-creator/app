import React from 'react';
import { SafeAreaView, View } from 'react-native';
import SoundOnOff from './SoundOnOff';

export default function SliderRightButtons({ context }) {

  return (
    <SafeAreaView
      style={{
        position: 'absolute',
        right: 20,
      }}
    >
      <View style={{ top: 119 }}>
        {/* Trust and Buy 플로팅 배지 제거 — 화면 소음 축소 (구매는 영상 상세의 상품 카드로) */}
        <SoundOnOff
          isMuted={context.state.isMuted}
          setMuted={(value) => {
            context.setState({ isMuted: value });
          }}
        />
      </View>
    </SafeAreaView>
  );
}
