import React from 'react';
import { SafeAreaView, View } from 'react-native';
import SoundOnOff from './SoundOnOff';
import TrustAndBuy from './TrustAndBuy';

export default function SliderRightButtons({ context }) {
  const video = context.props.data;

  return (
    <SafeAreaView
      style={{
        position: 'absolute',
        right: 20,
      }}
    >
      <View style={{ top: 119 }}>
        {video.linkedProduct?.productId ? (
          <View style={{ marginBottom: 20 }}>
            <TrustAndBuy product={video.linkedProduct?.productId} videoId={video.videoid} />
          </View>
        ) : null}
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
