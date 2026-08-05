// import React, { useEffect, useRef, useState } from 'react';
// import { Animated, Image, View } from 'react-native';
// import { ScrollView as GestureHandlerScrollView } from 'react-native-gesture-handler';
// import LinearGradient from 'react-native-linear-gradient';
// import { FadeIn, FadeOut } from 'react-native-reanimated';
// import { styles } from '.';
// import Header from './Header';
// import HeaderRight from './HeaderRight';
// import RenderSlide from './RenderSlide';
// import VideoInfo from './VideoInfo';

// export default function RenderVideoPlayer({ context }) {
//   const [isVideoPlayerReady, setIsVideoPlayerReady] = useState(false);

//   const fadeAnim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     // videoPlayer가 준비될 때까지 폴링
//     const checkInterval = setInterval(() => {
//       if (context.videoPlayer?.methods) {
//         console.log('videoPlayer ready:', context.videoPlayer);
//         setIsVideoPlayerReady(true);
//         clearInterval(checkInterval);
//       }
//     }, 50);

//     // 5초 후 타임아웃
//     const timeout = setTimeout(() => {
//       clearInterval(checkInterval);
//       console.warn('videoPlayer initialization timeout');
//     }, 5000);

//     return () => {
//       clearInterval(checkInterval);
//       clearTimeout(timeout);
//     };
//   }, []);

//   return (
//     <View>
//       <GestureHandlerScrollView
//         ref={(ref) => {
//           context._carousel = ref;
//         }}
//         scrollEnabled={false}
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         snapToAlignment={'center'}
//       >
//         {context.state.slides.map((item, index) => (
//           <RenderSlide item={item} index={index} context={context} key={index} />
//         ))}
//       </GestureHandlerScrollView>

//       {!context.state.isFullScreen && (
//         <LinearGradient
//           colors={[
//             'rgba(58, 58, 58, 0.8)',
//             'rgba(0, 0, 0, 0)',
//             'rgba(58, 58, 58, 0.1)',
//             'rgba(58, 58, 58, 0.3)',
//           ]}
//           locations={[0, 0.3, 0.8, 1]}
//           pointerEvents="none"
//           style={{ width: '100%', height: '100%', position: 'absolute', bottom: 10 }}
//         />
//       )}
//       {context.state.isShowingVideoInfo && !context.state.isFullScreen && (
//         // <VideoInfo context={context} />
//         <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)}>
//           <VideoInfo context={context} />
//         </Animated.View>
//       )}
//       <Header context={context} />

//       <View pointerEvents="none" style={[context.getPlayerStyle(), styles.checkSign]}>
//         <Image
//           style={{
//             width: context.state.isShowingCheckSign ? 80 : 1,
//             height: context.state.isShowingCheckSign ? 80 : 1,
//             opacity: context.state.isShowingCheckSign ? 1 : 0,
//           }}
//           resizeMode={'contain'}
//           source={{
//             uri: 'https://intro.greyd.app/resources/checked_v_white.png',
//           }}
//         />
//       </View>

//       {/* <HeaderRight
//         context={context}
//         changeSpeedRate={(speedRate) => context.videoPlayer.methods.changeSpeedRate(speedRate)}
//         changeMuteStatus={(muteStatus) => context.videoPlayer.methods.changeMuteStatus(muteStatus)}
//       /> */}

//       {isVideoPlayerReady && (
//         <HeaderRight
//           context={context}
//           changeSpeedRate={(speedRate) => context.videoPlayer?.methods?.changeSpeedRate(speedRate)}
//           changeMuteStatus={(muteStatus) =>
//             context.videoPlayer?.methods?.changeMuteStatus(muteStatus)
//           }
//         />
//       )}
//     </View>
//   );
// }

// RenderVideoPlayer.js
import React, { useEffect, useRef } from 'react';
import { Animated, Image, View } from 'react-native';
import { ScrollView as GestureHandlerScrollView } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Header from './Header';
import VideoOverlay from './VideoOverlay';
import { styles } from '.';
import RenderSlide from './RenderSlide';

export default function RenderVideoPlayer({ context }) {
  // React Native Animated API 사용
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (context.state.isShowingVideoInfo && !context.state.isFullScreen) {
      // 페이드 인
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // 페이드 아웃
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [context.state.isShowingVideoInfo, context.state.isFullScreen, fadeAnim]);

  return (
    <View>
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
