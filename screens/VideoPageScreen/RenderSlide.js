import React, { useCallback, useMemo } from 'react';
import { Dimensions, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useIsFocused } from '@react-navigation/native';
import Video from '../../Components/VideoPlayerView';
import SliderImage from './SliderImage';

export default function RenderSlide({ context, item, index }) {
  const isFocused = useIsFocused();
  const isCurrentlyFocused = context.props.route.params.isFocused && isFocused;

  // const handleVideoPress = useCallback(() => {
  //   context.setState({ isShowingVideoInfo: true });
  //   if (videoInfoTimerRef.current) {
  //     clearTimeout(videoInfoTimerRef.current);
  //   }

  //   videoInfoTimerRef.current = setTimeout(() => {
  //     LayoutAnimation.linear();
  //     context.setState({ isShowingVideoInfo: false });
  //   }, 5000);
  // }, [context]);

  // const handleVideoPress = useCallback(() => {
  //   // 이미 표시 중이고 타이머가 있으면 타이머만 리셋
  //   if (context.state.isShowingVideoInfo && context.videoInfoTimer !== undefined) {
  //     clearTimeout(context.videoInfoTimer);
  //     context.videoInfoTimer = setTimeout(() => {
  //       LayoutAnimation.linear();
  //       context.setState({ isShowingVideoInfo: false });
  //     }, 5000);
  //     return;
  //   }

  //   // 숨겨진 상태라면 표시하고 타이머 시작
  //   if (!context.state.isShowingVideoInfo) {
  //     context.setState({ isShowingVideoInfo: true });
  //   }

  //   if (context.videoInfoTimer !== undefined) {
  //     clearTimeout(context.videoInfoTimer);
  //   }

  //   context.videoInfoTimer = setTimeout(() => {
  //     LayoutAnimation.linear();
  //     context.setState({ isShowingVideoInfo: false });
  //   }, 5000);
  // }, [context]);

  const handleVideoPress = useCallback(() => {
    context.showVideoInfo(5000); // 통합 메서드 사용
  }, [context]);

  const bufferConfig = {
    minBufferMs: 3000,
    maxBufferMs: 20000,
    bufferForPlaybackMs: 500,
    bufferForPlaybackAfterRebufferMs: 3000,
  };

  const videoSource = useMemo(() => {
    return context.state.isHLS
      ? {
          uri: item.url,
          type: 'm3u8',
          headers: {
            'Cache-Control': 'no-cache',
          },
          maxBitRate: 0,
          automaticallyWaitsToMinimizeStalling: false,
        }
      : { uri: item.url };
  }, [item.url, context.state.isHLS]);

  const isPaused = useMemo(
    () =>
      context.state.isLoading ||
      context.state.paused ||
      context.state.isDetailsOpen ||
      context.state.isBlurred ||
      !isCurrentlyFocused,
    [
      context.state.isLoading,
      context.state.paused,
      context.state.isDetailsOpen,
      context.state.isBlurred,
      isCurrentlyFocused,
    ],
  );

  if (item.type === 'video') {
    return (
      <View style={{ width: Dimensions.get('window').width }} key={`${item.url}_${index}`}>
        {isCurrentlyFocused ? (
          <Video
            source={videoSource}
            onEnd={context.onEnd}
            // onLoad={context.onLoad}
            onLoad={(data) => {
              context.onLoad(data);
              // onLoad 시점에 ref가 준비되었음을 보장
            }}
            onLoadStart={context.onLoadStart}
            onProgress={context.onProgress}
            onPress={handleVideoPress}
            // onInit={handleInit}
            onPause={context.onPaused}
            onError={context.onError}
            onBuffer={context.onBuffer}
            paused={isPaused}
            // videoPlayerRef={(videoPlayer) => {
            //   context.videoPlayer = videoPlayer;
            // }}
            videoPlayerRef={(videoPlayer) => {
              if (videoPlayer && videoPlayer.methods) {
                context.videoPlayer = videoPlayer;
                // console.log('videoPlayer initialized:', videoPlayer);
              }
            }}
            resizeMode={context.isVideoPortrait() ? 'cover' : 'contain'}
            style={context.getPlayerStyle()}
            volume={1}
            // ⋯ 메뉴의 음소거 상태를 플레이어 초기값에 연결
            // (미전달 시 muted:false 고정이라 메뉴 토글이 무동작이었다)
            muted={context.state.isMuted}
            ignoreSilentSwitch="ignore"
            fullscreenAutorotate={true}
            repeat={true}
            disableVolume
            disablePlayPause
            disableBack
            onEnterFullscreen={context.onFullScreen.bind(context)}
            onExitFullscreen={context.onFullScreen.bind(context)}
            onShowControls={() => context.setState({ isShowingVideoControl: true })}
            onHideControls={() => context.setState({ isShowingVideoControl: false })}
            showOnStart={false}
            toggleResizeModeOnFullscreen={false}
            disableFullscreen
            isSeekBarMoved={context.props.route.params.isSeekBarMoved}
            setIsSeekBarMoved={context.props.route.params.setIsSeekBarMoved}
            rate={context.state.speed}
            bufferConfig={bufferConfig}
            poster={item.thumbnailUrl}
            posterResizeMode="cover"
            automaticallyWaitsToMinimizeStalling={true}
            minLoadRetryCount={3}
            cache={true}
            useTextureView={true}
          />
        ) : (
          <View style={context.getPlayerStyle()}>
            <FastImage
              source={{ uri: item.thumbnailUrl }}
              style={context.getPlayerStyle()}
              resizeMode={'contain'}
            />
          </View>
        )}
      </View>
    );
  } else if (item.type === 'image') {
    if (isCurrentlyFocused && !context.state.isBlurred) {
      return <SliderImage key={`${item.url}_${index}`} url={item.url} context={context} />;
    }
    return <View key={`${item.url}_${index}`} />;
  }
}
