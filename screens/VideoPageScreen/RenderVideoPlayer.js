// RenderVideoPlayer.js
import React from 'react';
import { Image, View } from 'react-native';
import { ScrollView as GestureHandlerScrollView } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Header from './Header';
import VideoOverlay from './VideoOverlay';
import { styles } from '.';
import RenderSlide from './RenderSlide';

export default function RenderVideoPlayer({ context }) {
  return (
    <View style={context.getPlayerStyle()}>
      <GestureHandlerScrollView
        ref={(ref) => {
          context._carousel = ref;
        }}
        scrollEnabled={false}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToAlignment={'center'}
      >
        {context.state.slides.map((item, index) => (
          <RenderSlide item={item} index={index} context={context} key={index} />
        ))}
      </GestureHandlerScrollView>

      {!context.state.isFullScreen && (
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0.45)',
            'rgba(0, 0, 0, 0)',
            'rgba(0, 0, 0, 0.15)',
            'rgba(0, 0, 0, 0.55)',
          ]}
          locations={[0, 0.25, 0.65, 1]}
          pointerEvents="none"
          style={{ width: '100%', height: '100%', position: 'absolute', bottom: 0 }}
        />
      )}

      {/* 틱톡/릴스 스타일 오버레이 (액션 레일 + 하단 정보) */}
      {!context.state.isFullScreen && <VideoOverlay context={context} />}

      <Header context={context} />

      <View pointerEvents="none" style={[context.getPlayerStyle(), styles.checkSign]}>
        <Image
          style={{
            width: context.state.isShowingCheckSign ? 80 : 1,
            height: context.state.isShowingCheckSign ? 80 : 1,
            opacity: context.state.isShowingCheckSign ? 1 : 0,
          }}
          resizeMode={'contain'}
          source={{
            uri: 'https://intro.greyd.app/resources/checked_v_white.png',
          }}
        />
      </View>

      {/* HeaderRight(Relay·배속·음소거)는 ⋯ 메뉴로 이동 — 화면당 핵심 액션 3개 원칙 */}
    </View>
  );
}
