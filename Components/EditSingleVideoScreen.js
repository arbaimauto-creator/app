import React from 'react';
import T from './Constants/DesignTokens';
import {
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  AppState,
  Dimensions,
  Platform,
} from 'react-native';
import { Button } from 'react-native-elements';
import Video from 'react-native-video';
import Trimmer from 'react-native-trimmer';
import Constants from './Constants';
import Strings from './Strings';
import { LoadingView } from './Views';
import { moderateScale } from './utils/scailing';

const MAX_VIDEO_LENGTH = Constants.MAX_VIDEO_LENGTH * 1000;

export default class EditSingleVideoScreen extends React.Component {
  videoPlayer;
  constructor(props) {
    super(props);
    const { video } = this.props.route.params;
    this.state = {
      isBlurred: false,
      isLoading: true,
      paused: true,
      videoWidth: 0,
      videoHeight: 0,
      duration: 10000,
      currentTime: 0,
      videoUri: video.path,
      trimBegin: 0,
      trimEnd: MAX_VIDEO_LENGTH,
      isShowActivityIndicator: false,
    };

    props.navigation.setOptions({
      headerLeft: () => (
        <Button
          title={Strings.CANCEL}
          type="clear"
          containerStyle={{ marginLeft: 10 }}
          disabled={this.props.route.params.isShowActivityIndicator}
          onPress={() => {
            this.setState({ paused: true });
            this.hideActivityIndicator();
            setTimeout(this.props.navigation.pop.bind(this), 1);
          }}
        />
      ),
      title: Strings.TRIM_VIDEO_TITLE(Constants.MAX_VIDEO_LENGTH),
      headerTitleStyle: {
        marginTop: Platform.OS === 'ios' ? 0 : 10,
        fontSize: moderateScale(18),
        fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.SemiBold,
      },
      headerStyle: {
        backgroundColor: T.COLORS.AMBER,
      },
      headerRight: () => (
        <Button
          title={Strings.NEXT}
          type="clear"
          containerStyle={{ marginRight: 10 }}
          disabled={this.props.route.params.isShowActivityIndicator}
          onPress={() => {
            const trimBeginSec = this.state.trimBegin / 1000;
            const trimEndSec = this.state.trimEnd / 1000;
            this.setState({ paused: true });
            this.props.route.params.onTrimmed(trimBeginSec, trimEndSec, this.state.videoUri);
            this.props.navigation.pop();
          }}
        />
      ),
    });
  }

  componentDidMount() {
    // subscription을 저장해 언마운트 시 해제 (미해제 시 화면 재진입마다 리스너 누적)
    this._appStateSubscription = AppState.addEventListener('change', this._handleAppStateChange);

    // this.setState({ paused: false });
    if (this.props.route.params.hasOwnProperty('hideActivityIndicatorPreviousScreen')) {
      const { hideActivityIndicatorPreviousScreen } = this.props.route.params;
      hideActivityIndicatorPreviousScreen();
    }
  }

  componentWillUnmount() {
    if (this.props.route.params.hasOwnProperty('hideActivityIndicatorPreviousScreen')) {
      const { hideActivityIndicatorPreviousScreen } = this.props.route.params;
      hideActivityIndicatorPreviousScreen();
    }
    this._appStateSubscription?.remove();
  }

  _handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active') {
      this.setState({ isBlurred: false });
    } else {
      this.setState({ isBlurred: true });
    }

    this.setState({ paused: false });
  };

  showActivityIndicator() {
    this.setState({ isShowActivityIndicator: true });
    this.props.navigation.setParams({
      isShowActivityIndicator: true,
    });
  }

  hideActivityIndicator() {
    this.setState({
      isShowActivityIndicator: false,
    });
    this.props.navigation.setParams({
      isShowActivityIndicator: false,
    });
  }

  onSeek = (seek) => {
    if (seek < this.state.trimBegin / 1000) {
      this.videoPlayer.seek(this.state.trimBegin / 1000);
    } else if (seek > this.state.trimEnd / 1000) {
      this.videoPlayer.seek(this.state.trimEnd / 1000);
    } else {
      this.videoPlayer.seek(seek);
    }
  };

  onPaused = (playerState) => {
    //Handler for Video Pause
    this.setState({
      paused: !this.state.paused,
      playerState,
    });
  };

  onReplay = () => {
    //Handler for Replay
    this.videoPlayer.seek(this.state.trimBegin / 1000);
  };

  onProgress = (data) => {
    // Video Player will continue progress even if the video already ended
    this.setState({ currentTime: data.currentTime });
    if (data.currentTime * 1000 > this.state.trimEnd - 200) {
      this.videoPlayer.seek(this.state.trimBegin / 1000);
    }
  };

  onLoad = (data) => {
    this.setState({
      duration: data.duration,
      isLoading: false,
      videoWidth: data.naturalSize.width,
      videoHeight: data.naturalSize.height,
    });
    if (this.state.trimEnd > data.duration * 1000) {
      this.setState({
        trimEnd: data.duration * 1000,
      });
    }
  };

  onLoadStart = (data) => this.setState({ isLoading: true });

  onEnd = () => {};

  onError = (error) => alert('Oh! ', error);

  onSeeking = (currentTime) => this.setState({ currentTime });

  onTrimmerChanged(time) {
    if (!isNaN(time.leftPosition) && !isNaN(time.rightPosition)) {
      if (time.rightPosition - time.leftPosition > MAX_VIDEO_LENGTH) {
        if (this.state.trimBegin === time.leftPosition) {
          // end time changed
          time.leftPosition += time.rightPosition - this.state.trimEnd;
        } else {
          // begin time changed
          time.rightPosition += time.leftPosition - this.state.trimBegin;
        }
      }

      this.setState({
        trimBegin: time.leftPosition,
        trimEnd: time.rightPosition,
      });

      if (this.state.currentTime * 1000 < time.leftPosition) {
        this.videoPlayer.seek(time.leftPosition / 1000);
      }
    }
  }

  onTimmerPinChanged(time) {
    this.videoPlayer.seek(time / 1000);
    this.setState({ currentTime: time / 1000 });
  }

  renderActivityIndicator() {
    if (this.state.isShowActivityIndicator) {
      return <LoadingView />;
    } else {
      return <View />;
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <TouchableWithoutFeedback
          onPress={() => {
            this.setState({ paused: !this.state.paused });
          }}
        >
          <Video
            source={{ uri: this.state.videoUri }}
            onEnd={this.onEnd}
            onLoad={this.onLoad}
            onLoadStart={this.onLoadStart}
            onProgress={this.onProgress}
            paused={
              this.state.isLoading ||
              this.state.paused ||
              this.state.isBlurred ||
              !this.props.navigation.isFocused() ||
              this.state.isShowActivityIndicator
            }
            ref={(videoPlayer) => (this.videoPlayer = videoPlayer)}
            resizeMode={'contain'}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: Constants.COLOR_BACKGROUND_DARK,
            }}
            volume={1}
            ignoreSilentSwitch="ignore"
          />
        </TouchableWithoutFeedback>

        <View style={styles.trimmer}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <Text style={styles.trimPosition}>{(this.state.trimBegin / 1000).toFixed(1)}</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.trimPosition}>{(this.state.trimEnd / 1000).toFixed(1)}</Text>
          </View>
          <Trimmer
            tintColor={Constants.COLOR_MAIN}
            markerColor={'#ccc'}
            trackBackgroundColor={Constants.COLOR_GREY}
            trackBorderColor={'#ccc'}
            scrubberColor={Constants.COLOR_MAIN}
            onHandleChange={this.onTrimmerChanged.bind(this)}
            totalDuration={this.state.duration * 1000}
            trimmerLeftHandlePosition={this.state.trimBegin}
            trimmerRightHandlePosition={this.state.trimEnd}
            scrubberPosition={this.state.currentTime * 1000}
            onScrubbingComplete={this.onTimmerPinChanged.bind(this)}
            maxTrimDuration={MAX_VIDEO_LENGTH}
            zoomMultiplier={5}
            initialZoomValue={1}
          />
        </View>
        {this.renderActivityIndicator()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  trimmer: {
    position: 'absolute',
    flex: 1,
    width: Dimensions.get('window').width - 40,
    margin: 0,
    alignSelf: 'center',
    bottom: 20,
    opacity: 0.9,
  },
  trimPosition: {
    color: 'white',
    marginBottom: -10,
  },
});
