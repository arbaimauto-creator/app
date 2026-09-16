// import * as React from 'react';
// import {
//   Dimensions,
//   LayoutAnimation,
//   StyleSheet,
//   TouchableWithoutFeedback,
//   View,
// } from 'react-native';
// import IconIonicons from 'react-native-vector-icons/Ionicons';
// import Video from 'react-native-video-controls';
// import Constants from './Constants';

// export default function VideoPlayerView({
//   style = {},
//   showOnStart,
//   onInit,
//   videoPlayerRef,
//   onProgress: onProgressProp,
//   onShowControls: onShowControlsProp,
//   onHideControls: onHideControlsProp,
//   onPaused: onPausedProp,
//   paused: pausedProp,
//   isSeekBarMoved,
//   setIsSeekBarMoved,
//   rate,
//   onPress,
//   ...props
// }) {
//   const [paused, setPaused] = React.useState(false);
//   const [isShowingVideoControl, setIsShowingVideoControl] = React.useState(showOnStart);
//   const [currentTime, setCurrentTime] = React.useState(false);
//   const [isShowPlayPause, setIsShowPlayPause] = React.useState(false);

//   const getPlayerControlStyle = React.useCallback(
//     function () {
//       const playerHeight = style.height;
//       return {
//         // opacity: isShowingVideoControl ? 1 : 0,
//         width: Dimensions.get('window').width,
//         height: playerHeight - 140,
//       };
//     },
//     [style.height],
//     // [isShowingVideoControl, style.height],
//   );

//   const onProgress = (data) => {
//     setCurrentTime(data.currentTime);
//   };

//   // var videoPlayer = null;
//   const [videoPlayer, setVideoPlayer] = React.useState(null);

//   React.useEffect(() => {
//     if (videoPlayer && videoPlayer.methods) {
//       videoPlayer.methods.showControls();
//       if (onInit) {
//         onInit();
//       }
//     }

//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [videoPlayer]);

//   return (
//     // <View style={style}>
//     <View style={style}>
//       <Video
//         {...props}
//         videoStyle={{ backgroundColor: T.COLORS.INK }}
//         ref={(videoPlayerRef) => {
//           // videoPlayer = videoPlayerRef;
//           setVideoPlayer(videoPlayerRef);

//           if (videoPlayerRef && typeof videoPlayerRef === 'function') {
//             videoPlayerRef(videoPlayerRef);
//           }
//         }}
//         onProgress={(data) => {
//           onProgress(data);
//           if (onProgressProp && typeof onProgressProp === 'function') {
//             onProgressProp(data);
//           }
//         }}
//         onShowControls={(data) => {
//           setIsShowingVideoControl(true);
//           if (onShowControlsProp && typeof onShowControlsProp === 'function') {
//             onShowControlsProp(data);
//           }
//         }}
//         onHideControls={(data) => {
//           setIsShowingVideoControl(false);
//           if (onHideControlsProp && typeof onHideControlsProp === 'function') {
//             onHideControlsProp(data);
//           }
//         }}
//         onPaused={(data) => {
//           setPaused(true);
//           if (onPausedProp && typeof onPausedProp === 'function') {
//             onPausedProp(data);
//           }
//         }}
//         paused={pausedProp || paused}
//         doubleTapTime={1}
//         disablePlayPause
//         isSeekBarMoved={isSeekBarMoved}
//         setIsSeekBarMoved={(isSeekBarMoved) => {
//           setIsSeekBarMoved(isSeekBarMoved);
//         }}
//         rate={rate || 1}
//       />

//       <TouchableWithoutFeedback
//         onPress={() => {
//           onPress();
//           setPaused(!paused);

//           setIsShowPlayPause(true);
//           setTimeout(() => {
//             LayoutAnimation.linear();
//             setIsShowPlayPause(false);
//           }, 750);
//           LayoutAnimation.linear();
//         }}
//       >
//         <View style={[getPlayerControlStyle(), styles.customVideoControl]}>
//           {isShowPlayPause ? (
//             paused ? (
//               <IconIonicons name={'pause'} size={60} color={Constants.TIER_COLORS.PIONEER} />
//             ) : (
//               <IconIonicons name={'play'} size={60} color={Constants.TIER_COLORS.PIONEER} />
//             )
//           ) : null}
//         </View>
//       </TouchableWithoutFeedback>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   customVideoControl: {
//     position: 'absolute',
//     flexDirection: 'row',
//     width: '100%',
//     justifyContent: 'center',
//     alignItems: 'center',
//     alignSelf: 'center',
//     marginVertical: 70,
//   },
// });

import * as React from 'react';
import T from './Constants/DesignTokens';
import {
  Dimensions,
  LayoutAnimation,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video-controls';
import Constants from './Constants';

export default function VideoPlayerView({
  style = {},
  showOnStart,
  onInit,
  videoPlayerRef, // 부모로부터 받은 콜백
  onProgress: onProgressProp,
  onShowControls: onShowControlsProp,
  onHideControls: onHideControlsProp,
  onPaused: onPausedProp,
  paused: pausedProp,
  isSeekBarMoved,
  setIsSeekBarMoved,
  rate,
  onPress,
  ...props
}) {
  const [paused, setPaused] = React.useState(false);
  const [isShowingVideoControl, setIsShowingVideoControl] = React.useState(showOnStart);
  const [currentTime, setCurrentTime] = React.useState(false);
  const [isShowPlayPause, setIsShowPlayPause] = React.useState(false);
  const [videoPlayer, setVideoPlayer] = React.useState(null);

  const getPlayerControlStyle = React.useCallback(
    function () {
      const playerHeight = style.height;
      return {
        width: Dimensions.get('window').width,
        height: playerHeight - 140,
      };
    },
    [style.height],
  );

  const onProgress = (data) => {
    setCurrentTime(data.currentTime);
  };

  const hasCalledInit = React.useRef(false);

  // // videoPlayer가 설정되면 초기화 및 부모 콜백 호출
  // React.useEffect(() => {
  //   if (videoPlayer && videoPlayer.methods) {
  //     // console.log('Video player initialized:', videoPlayer);

  //     // 컨트롤 표시
  //     videoPlayer.methods.showControls();

  //     // 초기화 콜백 실행
  //     if (onInit) {
  //       onInit();
  //     }

  //     // 부모 컴포넌트에 ref 전달
  //     if (videoPlayerRef && typeof videoPlayerRef === 'function') {
  //       videoPlayerRef(videoPlayer);
  //     }
  //   }
  // }, [videoPlayer, onInit, videoPlayerRef]);

  React.useEffect(() => {
    if (videoPlayer && videoPlayer.methods && !hasCalledInit.current) {
      videoPlayer.methods.showControls();
      hasCalledInit.current = true;

      if (onInit) {
        onInit();
      }
    }
    // onInit은 부모에서 매 렌더 재생성되므로 의도적으로 deps에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoPlayer]);

  return (
    <View style={style}>
      <Video
        {...props}
        videoStyle={{ backgroundColor: T.COLORS.INK }}
        ref={(playerRef) => {
          // 파라미터 이름을 다르게 변경
          // console.log('Video ref callback called:', playerRef);

          if (playerRef) {
            // Video 컴포넌트의 ref를 state에 저장
            setVideoPlayer(playerRef);
          }
        }}
        onProgress={(data) => {
          onProgress(data);
          if (onProgressProp && typeof onProgressProp === 'function') {
            onProgressProp(data);
          }
        }}
        onShowControls={(data) => {
          setIsShowingVideoControl(true);
          if (onShowControlsProp && typeof onShowControlsProp === 'function') {
            onShowControlsProp(data);
          }
        }}
        onHideControls={(data) => {
          setIsShowingVideoControl(false);
          if (onHideControlsProp && typeof onHideControlsProp === 'function') {
            onHideControlsProp(data);
          }
        }}
        onPaused={(data) => {
          setPaused(true);
          if (onPausedProp && typeof onPausedProp === 'function') {
            onPausedProp(data);
          }
        }}
        paused={pausedProp || paused}
        doubleTapTime={1}
        disablePlayPause
        isSeekBarMoved={isSeekBarMoved}
        setIsSeekBarMoved={(isSeekBarMoved) => {
          setIsSeekBarMoved(isSeekBarMoved);
        }}
        rate={rate || 1}
      />

      <TouchableWithoutFeedback
        onPress={() => {
          onPress();
          setPaused(!paused);

          setIsShowPlayPause(true);
          setTimeout(() => {
            LayoutAnimation.linear();
            setIsShowPlayPause(false);
          }, 750);
          LayoutAnimation.linear();
        }}
      >
        <View style={[getPlayerControlStyle(), styles.customVideoControl]}>
          {isShowPlayPause ? (
            paused ? (
              <IconIonicons name={'pause'} size={60} color={Constants.TIER_COLORS.PIONEER} />
            ) : (
              <IconIonicons name={'play'} size={60} color={Constants.TIER_COLORS.PIONEER} />
            )
          ) : null}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  customVideoControl: {
    position: 'absolute',
    top: 0,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 70,
  },
});
