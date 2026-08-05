import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import Video from '../VideoPlayerView';
import Constants from '../Constants';
import HeaderLeftBackButton from '../CustomComponents/headerBackButton/headerLeftBackButton';

const noop = () => {};

// 가이드용 정적 mp4(route.params.videoUrl)를 재생만 하는 최소 화면.
// 과거에는 VideoPageScreen을 복붙한 1,134줄짜리 컴포넌트였으나,
// render()가 실제로 그리는 것은 <Video> 하나뿐이라 그 부분만 남겼다.
export default function VideoGuide({ navigation, route }) {
  const { videoUrl, category } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [paused, setPaused] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);

  const videoPlayerRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      title: category,
      headerLeft: () => HeaderLeftBackButton({ navigation }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const isVideoPortrait = videoHeight >= videoWidth;

  const getPlayerStyle = () => {
    if (videoWidth === 0) {
      return { height: Dimensions.get('window').height * 0.618 };
    }
    return { height: Dimensions.get('window').height * 0.85 };
  };

  const onLoad = (data) => {
    videoPlayerRef.current.seekTo(1);

    let { width, height } = data.naturalSize;
    if (data.naturalSize.orientation === 'portrait' && width > height) {
      [width, height] = [height, width];
    }

    setVideoWidth(width);
    setVideoHeight(height);
    setIsLoading(false);
    setPaused(false);
  };

  const onLoadStart = () => setIsLoading(true);

  const onEnd = () => videoPlayerRef.current.seekTo(0);

  const onPaused = () => setPaused((prev) => !prev);

  const onFullScreen = () => setIsFullScreen((prev) => !prev);

  const onError = (e) => {
    console.log('VideoGuide onError()', e);
  };

  return (
    <View style={styles.container}>
      <View style={{ width: Dimensions.get('window').width }}>
        <Video
          source={{ uri: videoUrl }}
          onEnd={onEnd}
          onLoad={onLoad}
          onLoadStart={onLoadStart}
          onProgress={noop}
          onPressLeftSide={noop}
          onPressRightSide={noop}
          onPress={noop}
          onPause={onPaused}
          onError={onError}
          onBuffer={noop}
          paused={isLoading || paused}
          videoPlayerRef={(player) => {
            videoPlayerRef.current = player;
          }}
          resizeMode={isVideoPortrait ? 'contain' : 'cover'}
          style={getPlayerStyle()}
          volume={1}
          ignoreSilentSwitch="ignore"
          fullscreen={Platform.OS === 'ios' ? false : isFullScreen}
          fullscreenAutorotate={true}
          repeat={true}
          disableVolume
          disablePlayPause
          disableBack
          onEnterFullscreen={onFullScreen}
          onExitFullscreen={onFullScreen}
          onShowControls={noop}
          onHideControls={noop}
          showOnStart={false}
          toggleResizeModeOnFullscreen={false}
          disableFullscreen
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
});
