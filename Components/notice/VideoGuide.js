import React from 'react';
import {
  Alert,
  Dimensions,
  Keyboard,
  LayoutAnimation,
  NativeModules,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { getBottomSpace, isIphoneX } from 'react-native-iphone-x-helper';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import APIprovider from '../APIprovider';
import Constants from '../Constants';
import Strings from '../Strings';
import { isGuestUser, LogoutAlert } from '../utils';
import { getDeviceHeight } from '../utils/scailing';
//import Video from 'react-native-video-controls';
import Video from '../VideoPlayerView';
import HeaderLeftBackButton from '../CustomComponents/headerBackButton/headerLeftBackButton';

const { UIManager } = NativeModules;
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default class VideoPageScreen extends React.PureComponent {
  videoPlayer;
  screenHeightNormalScreen;

  isVideoPortrait = () => {
    if (this.state.videoHeight >= this.state.videoWidth) {
      return true;
    } else {
      return false;
    }
  };

  getScreenHeightFullScreen = () => {
    return (
      Dimensions.get('window').height -
      getStatusBarHeight(true) -
      (isIphoneX() ? getBottomSpace() : 0)
    );
  };

  constructor(props) {
    super(props);
    const { videoId } = this.props.route.params;
    this.initialTime = 0;
    this.cumulativeTime = 0;
    this.videoInfoTimer = undefined;
    this._carousel = null;
    this.screenHeightNormalScreen =
      (Dimensions.get('window').height -
        getStatusBarHeight(true) -
        (isIphoneX() ? getBottomSpace() : 0)) *
      0.618;
    this.handleRatingButtonAnimationRef = null;
    this.state = {
      reportedCommentId: undefined,
      isInvalidComment: false,
      isEnableLoadingComment: false,
      isWritingComment: false,
      isInvalidContents: false,
      currentTime: this.initialTime,
      duration: 0,
      isBlurred: false,
      isFullScreen: false,
      isLoading: true,
      paused: true,
      screenType: 'cover',
      isShowingVideoControl: false,
      isShowingVideoInfo: true,
      screenHeight: this.screenHeightNormalScreen,
      videoWidth: 0,
      videoHeight: 0,
      averageRating: 0,
      video: {
        videoId: videoId,
        description: '',
        author: {
          userId: '',
          name: '',
          profilePicUrl: '',
          class: 0,
        },
        postTimestamp: 0,
        thumbnailImageUrl: '',
        thumbnailImagePath: '',
        videoPath: '',
        videoUrl: '',
        viewCount: 0,
        isBookmarked: false,
        myRating: null,
        ratingCount: 0,
        ratingScore: 0,
        commentCount: 0,
        commentList: [],
        linkedProduct: {
          productId: '',
          thumbnailUrl: '',
          title: '',
          seller: {
            name: '',
          },
          starCount: 0,
          ratingScore: 0,
          ratingCount: 0,
          reviewCount: 0,
          videoCount: 0,
          promotionAmount: 0,
          price: 0,
          discountPrice: 0,
          discountRate: 0,
        },
        relayedVideoCount: 0,
        relayedVideoList: [],
        videoCountOfProduct: 0,
        videoListOfLinkedProduct: {
          videoList: [],
          entireCount: -1,
        },
        videoCountOfRelatedProduct: 0,
        videoListOfRelatedVideo: [],
      },
      slides: [],
      activeSlideIndex: 0,
      newComment: '',
      isNewCommentSubmitting: false,
      relayedVideoListIsRefreshing: false,
      linkedProductVideoListIsRefreshing: false,
      relatedProductVideoListIsRefreshing: false,
      isCommentExpanded: true,
      ratableCount: 0,
      myRating: null,
      ratingList: [],
      isShowingRatingList: false,
      isLoadingRatingList: false,
      logonUserProfilePicUrl: this.props.route.params.logonUserProfilePicUrl,
      isShowingCheckSign: false,
      isShowingGreyding: false,
      isShowingGradeBubbleGuide: false,
      isGradedAlready: false,
      isGreyingShowed: false,
      isShowingCommentInput: false,
      isHLS: false,
    };
  }

  static navigationOptions = ({ navigation }) => {
    const { state } = navigation;
    // Setup the header and tabBarVisible status
    const header = null;
    return {
      // For stack navigators, you can hide the header bar like so
      header,
    };
  };

  componentDidMount() {
    const { navigation } = this.props;

    navigation.setOptions({
      title: this.props.route.params.category,
      headerLeft: () => HeaderLeftBackButton({ navigation }),
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  isMyVideo() {
    return this.state.video.author.userId === this.props.route.params.logonUserId;
  }

  onError = (e) => {
    console.log('videoPageScreen onError()', e);
  };

  onBuffer = (data) => {
    //    console.log('onBuffer() ', data)
  };

  onPaused = () => {
    console.log('onPaused');
    //Handler for Video Pause
    this.setState({
      paused: !this.state.paused,
    });
  };

  onProgress = (data) => {
    // Video Player will continue progress even if the video already ended
    this.setState({ currentTime: data.currentTime });

    if (this.cumulativeTime < data.playableDuration) {
      if (data.currentTime > this.initialTime || this.cumulativeTime <= 0) {
        this.cumulativeTime = data.currentTime - this.initialTime;
      } else {
        this.cumulativeTime = data.playableDuration - this.initialTime + data.currentTime;
      }
    }
  };

  async probe() {
    //    const uri = 'https://greyd.s3.ap-northeast-2.amazonaws.com/%5B%EC%A0%9D%EC%8B%9C%EB%AF%B9%EC%8A%A4%5D%EA%B9%80%EC%A2%85%EA%B5%AD%EB%8F%84+%EC%9D%B8%EC%A0%95%ED%95%9C+%EC%A0%9D%EC%8B%9C%EB%AF%B9%EC%8A%A4+%EB%82%A8%EC%9E%90+%EB%A0%88%EA%B9%85%EC%8A%A4+3%EC%A2%85+%EB%A6%AC%EB%B7%B0!+-+%EC%A0%9D%EC%8B%9C%EB%AF%B9%EC%8A%A4%EA%B0%80+%EC%9D%BC+%EB%83%88%EB%8B%A4!!++-+XEXY+MENS+LEGGINGS+REVIEW.mp4'
    //    const uri = 'https://greyd.s3.ap-northeast-2.amazonaws.com/1611191892852_abbac7682a6386ca26cb91d304958432.mp4'
    //    const mediaInfo = (await RNFFprobe.getMediaInformation(uri)).getMediaProperties()
  }

  onLoad = (data) => {
    console.log('onLoad');
    this.forceUpdate();
    this.videoPlayer.seekTo(this.initialTime + 1);
    let height = 0;
    if (
      data.naturalSize.orientation === 'portrait' &&
      data.naturalSize.width > data.naturalSize.height
    ) {
      height = data.naturalSize.width;
      data.naturalSize.width = data.naturalSize.height;
      data.naturalSize.height = height;
    } else {
      height = (Dimensions.get('window').width * data.naturalSize.height) / data.naturalSize.width;
    }
    this.screenHeightNormalScreen = height;

    this.setState({
      videoWidth: data.naturalSize.width,
      videoHeight: data.naturalSize.height,
      duration: data.duration,
      isLoading: false,
      paused: false,
      screenHeight: this.screenHeightNormalScreen,
    });
  };

  onLoadStart = (data) => {
    this.setState({ isLoading: true });
  };

  onEnd = () => {
    console.log('onEnd');
    //Handler for Replay
    this.videoPlayer.seekTo(0);
  };

  onFullScreen = () => {
    const isFullScreen = !this.state.isFullScreen;
    if (isFullScreen === false) {
      this.setState({ isShowingVideoInfo: true });
      if (this.videoInfoTimer !== undefined) {
        clearTimeout(this.videoInfoTimer);
      }
      this.videoInfoTimer = setTimeout(() => {
        LayoutAnimation.linear();
        this.setState({ isShowingVideoInfo: false });
      }, 3000);
    }
    this.setState({ isFullScreen: isFullScreen });
    this.setState({
      screenHeight: isFullScreen ? '100%' : this.screenHeightNormalScreen,
    });
    return;
  };

  getPlayerStyle = function () {
    if (this.state.videoWidth === 0) {
      return { height: Dimensions.get('window').height * 0.618 };
    }

    let screenHeight =
      (this.state.videoHeight * Dimensions.get('window').width) / this.state.videoWidth;
    if (this.isVideoPortrait() && this.screenHeight > Dimensions.get('window').height - 300) {
      screenHeight = Dimensions.get('window').height - 300;
    } else if (!this.isVideoPortrait() && screenHeight < Dimensions.get('window').height * 0.618) {
      screenHeight = Dimensions.get('window').height * 0.618;
    }

    return {
      // height: this.state.isFullScreen ? this.getScreenHeightFullScreen() : screenHeight,
      height: Dimensions.get('window').height * 0.85,
    };
  };

  getPlayerControlStyle = function () {
    const playerHeight = this.getPlayerStyle().height;
    return {
      opacity: this.state.isShowingVideoControl ? 1 : 0,
      width: Dimensions.get('window').width,
      height: playerHeight - 140,
    };
  };

  onAddRelayButtonPressed() {
    if (isGuestUser(this.props.route.params.logonUserId)) {
      return LogoutAlert(this.props);
    }

    const { video } = this.state;
    this.props.navigation.navigate('AddingNewVideo', {
      relayingVideo: video,
      linkedProduct: video.linkedProduct,
      onVideoSubmitted: this.onRelayVideoAdded.bind(this),
    });
  }

  onRelayVideoAdded(data) {
    this.setState({
      video: {
        ...this.state.video,
        relayedVideoList: [data, ...this.state.video.relayedVideoList],
      },
    });
  }

  onSubmitNewComment() {
    this.setState({
      isNewCommentSubmitting: true,
    });
    APIprovider.addNewVideoComment(
      this.state.newComment,
      this.state.video.videoId,
      this.state.video.videoId,
    )
      .then(this.addNewVideoCommentCallback.bind(this))
      .catch((err) => {
        this.setState({ isNewCommentSubmitting: false });
        Alert.alert(
          Strings.FAILED_ADD_COMMENT,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  }

  addNewVideoCommentCallback(data) {
    if (data.comment === this.state.newComment) {
      this.setState({ isShowingCommentInput: false });
      Keyboard.dismiss();
      this.setState({
        video: {
          ...this.state.video,
          commentCount: this.state.video.commentCount + 1,
          commentList: [data, ...this.state.video.commentList],
        },
        isNewCommentSubmitting: false,
        newComment: '',
      });
    }
  }

  getCommentListOfVideoCallback(newList) {
    if (!newList || !newList.length) {
      this.setState({ isEnableLoadingComment: false });
      return;
    }
    this.setState({
      video: {
        ...this.state.video,
        commentList: this.state.video.commentList
          ? [...this.state.video.commentList, ...newList]
          : newList,
      },
    });
    let loadedCommentCount = 0;
    [...this.state.video.commentList, ...newList].forEach((item) => {
      loadedCommentCount = loadedCommentCount + (item.childCount ?? 0) + 1;
    });
    if (loadedCommentCount < this.state.video.commentCount) {
      this.setState({ isEnableLoadingComment: true });
    } else {
      this.setState({ isEnableLoadingComment: false });
    }
  }

  loadCommentList() {
    const { video } = this.state;
    if (video.commentCount === 0 || video.commentCount === video.commentList.length) {
      this.setState({ isEnableLoadingComment: false });
      return;
    }
    if (!this.state.isEnableLoadingComment) {
      return;
    }
    if (video.commentList.length === 0) {
      APIprovider.getVideoCommentList(video.videoId)
        .then(this.getCommentListOfVideoCallback.bind(this))
        .catch((err) => {
          console.log(err);
          Alert.alert(
            Strings.FAILED_LOAD_COMMENTS,
            err.errorMsg ? err.errorMsg : '',
            [{ text: Strings.OK }],
            { cancelable: true },
          );
        });
    } else {
      const offset = video.commentList[video.commentList.length - 1].createdAt;
      APIprovider.getVideoCommentList(video.videoId, undefined, offset, 10)
        .then(this.getCommentListOfVideoCallback.bind(this))
        .catch((err) => {
          console.log(err);
          Alert.alert(
            Strings.FAILED_LOAD_COMMENTS,
            err.errorMsg ? err.errorMsg : '',
            [{ text: Strings.OK }],
            { cancelable: true },
          );
        });
    }
  }

  onCommentDeleteRequested(commentId) {
    APIprovider.deleteVideoComment(this.state.video.videoId, commentId)
      .then(this.deleteVideoCommentCallback.bind(this))
      .catch((err) => {
        console.log(err);
        Alert.alert(
          Strings.FAILED_DELETE_COMMENT,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  }

  deleteVideoCommentCallback(result) {
    for (let i = 0; i < this.state.video.commentList.length; i++) {
      if (this.state.video.commentList[i]._id === result.commentId) {
        this.setState({
          video: {
            ...this.state.video,
            commentCount:
              this.state.video.commentCount - 1 - this.state.video.commentList[i].childCount ?? 0,
            commentList: [
              ...this.state.video.commentList.slice(0, i),
              ...this.state.video.commentList.slice(i + 1, this.state.video.commentList.length),
            ],
          },
        });
      }
    }
  }

  onRatingComplete(ratingScore) {
    this.setState({ isShowingCheckSign: true });
    setTimeout(() => {
      this.setState({ isShowingCheckSign: false });
      LayoutAnimation.spring();
    }, 1000);
    LayoutAnimation.spring();

    const { video } = this.state;
    APIprovider.ratingVideo(video.videoId, ratingScore)
      .then((result) => {
        this.setState({
          video: {
            ...this.state.video,
            myRating: this.state.myRating,
            ratingScore: result.ratingScore,
            ratingCount: result.ratingCount,
          },
        });
      })
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_RATING,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  }

  onRatingCancel() {
    const { video } = this.state;

    this.setState({
      myRating: null,
      video: {
        ...video,
        myRating: null,
      },
    });
    APIprovider.cancelRatingVideo(video.videoId)
      .then((result) => {
        this.setState({
          video: {
            ...this.state.video,
            ratingScore: result.ratingScore,
            ratingCount: result.ratingCount,
          },
        });
      })
      .catch((err) => {
        console.log(err);
        Alert.alert(
          Strings.FAILED_CANCEL_RATING,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  }

  onRelayedVideoListEndReached() {
    this.setState({ relayedVideoListIsRefreshing: true });
    const offset =
      this.state.video.videoListOfRelatedVideo[this.state.video.videoListOfRelatedVideo.length - 1]
        .createdAt;
    const limit = 10;
    APIprovider.getRelayingVideoList(
      this.state.video.videoId,
      undefined,
      offset,
      this.state.video.videoListOfRelatedVideo.length,
      limit,
    )
      .then((data) => {
        this.setState({
          video: {
            ...this.state.video,
            videoListOfRelatedVideo: [
              ...this.state.video.videoListOfRelatedVideo,
              ...data.videoList,
            ],
          },
          relayedVideoListIsRefreshing: false,
        });
      })
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_TO_LOAD_REVIEW_LIST,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
        this.setState({ relayedVideoListIsRefreshing: false });
      });
  }

  onLinkedProductVideoListEndReached() {
    this.setState({ linkedProductVideoListIsRefreshing: true });
    const offset =
      this.state.video.videoListOfLinkedProduct.videoList[
        this.state.video.videoListOfLinkedProduct.videoList.length - 1
      ].createdAt;
    const limit = 10;
    APIprovider.getLinkedVideoListOfProduct(
      this.state.video.linkedProduct.productId,
      undefined,
      offset,
      this.state.video.videoListOfLinkedProduct.videoList.length,
      limit,
    )
      .then((data) => {
        this.setState({
          video: {
            ...this.state.video,
            videoListOfLinkedProduct: {
              ...this.state.video.videoListOfLinkedProduct,
              videoList: [
                ...this.state.video.videoListOfLinkedProduct.videoList,
                ...data.videoList,
              ],
            },
          },
          linkedProductVideoListIsRefreshing: false,
        });
      })
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_TO_LOAD_REVIEW_LIST,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
        this.setState({ linkedProductVideoListIsRefreshing: false });
      });
  }

  onRelatedProductVideoListEndReached() {}

  bookmarkVideoCallback(result) {
    // reflect UI by result
  }

  onVideoRatingListEndReached() {
    this.setState({ isLoadingRatingList: true });
    const offset = this.state.ratingList[this.state.ratingList.length - 1].createdAt;
    APIprovider.getVideoRatingList(this.state.video.videoId, offset)
      .then((ratingList) => {
        this.setState({
          ratingList: [...this.state.ratingList, ...ratingList],
          isLoadingRatingList: false,
        });
      })
      .catch(() => {
        Alert.alert(Strings.FAILED_LOAD_RATINGS);
        this.setState({ isLoadingRatingList: true });
      });
  }

  onPressLeftSide() {
    const screenWidth = Dimensions.get('window').width;
    const activeSlideIndex = this.state.activeSlideIndex;
    if (activeSlideIndex === 0) {
      return;
    }
    // this._carousel.scrollTo({
    //   x: screenWidth * (activeSlideIndex - 1),
    //   y: 0,
    //   animated: true,
    // });
    this.setState({ activeSlideIndex: activeSlideIndex - 1 });
  }

  onPressRightSide() {
    const screenWidth = Dimensions.get('window').width;
    const activeSlideIndex = this.state.activeSlideIndex;
    if (activeSlideIndex === this.state.slides.length - 1) {
      return;
    }
    // this._carousel.scrollTo({
    //   x: screenWidth * (activeSlideIndex + 1),
    //   y: 0,
    //   animated: true,
    // });
    this.setState({ activeSlideIndex: activeSlideIndex + 1 });
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={{ width: Dimensions.get('window').width }}>
          <Video
            source={{ uri: this.props.route.params.videoUrl }}
            onEnd={this.onEnd}
            onLoad={this.onLoad}
            onLoadStart={this.onLoadStart}
            onProgress={this.onProgress}
            onPressLeftSide={this.onPressLeftSide.bind(this)}
            onPressRightSide={this.onPressRightSide.bind(this)}
            onPress={() => {
              this.setState({ isShowingVideoInfo: true });
              if (this.videoInfoTimer !== undefined) {
                clearTimeout(this.videoInfoTimer);
              }
              if (!this.state.isFullScreen && this.state.isShowingVideoInfo) {
                this.onPressRightSide();
              }
              this.videoInfoTimer = setTimeout(() => {
                LayoutAnimation.linear();
                this.setState({ isShowingVideoInfo: false });
              }, 5000);
            }}
            onPause={this.onPaused}
            onError={this.onError}
            onBuffer={this.onBuffer}
            paused={this.state.isLoading || this.state.paused || this.state.isBlurred}
            videoPlayerRef={(videoPlayer) => {
              this.videoPlayer = videoPlayer;
            }}
            resizeMode={this.isVideoPortrait() ? 'contain' : 'cover'}
            style={this.getPlayerStyle()}
            volume={1}
            ignoreSilentSwitch="ignore"
            fullscreen={Platform.OS === 'ios' ? false : this.state.isFullScreen}
            fullscreenAutorotate={true}
            repeat={true}
            // disableControl={!this.state.isFullScreen}
            disableVolume
            disablePlayPause
            disableBack
            onEnterFullscreen={this.onFullScreen.bind(this)}
            onExitFullscreen={this.onFullScreen.bind(this)}
            onShowControls={() => this.setState({ isShowingVideoControl: true })}
            onHideControls={() => this.setState({ isShowingVideoControl: false })}
            showOnStart={false}
            toggleResizeModeOnFullscreen={false}
            disableFullscreen
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  headerBarContainer: {
    width: '100%',
    position: 'absolute',
    marginTop: isIphoneX() ? 50 : 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerRightButtonContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headerButton: {
    width: 22,
    height: 22,
  },
  fullScreenHeaderButton: {
    width: 22,
    height: 22,
    marginTop: 0,
  },
  mediaPlayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  reviewInfo: {
    width: '100%',
    position: 'absolute',
    bottom: 30,
    paddingLeft: 20,
    paddingRight: 18,
  },
  titleContainer: {
    width: Dimensions.get('screen').width - 20,
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: Constants.TIER_COLORS.ARTISAN,
    //    width: Dimensions.get('screen').width - 76
  },
  bookmarkButton: {
    top: -10,
    alignSelf: 'flex-start',
    marginLeft: 9,
    marginRight: 11,
  },
  reviewSubInfoContainer: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
  },
  reviewSubInfoText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
  slidePagination: {
    position: 'absolute',
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  checkSign: {
    flex: 1,
    position: 'absolute',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    paddingVertical: 0,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  detailsProfilePicUrl: {
    width: 30,
    height: 30,
    borderRadius: 30,
  },
  detailsInfoTitle: {
    color: '#999',
  },
  detailsGreydScore: {
    color: Constants.COLOR_MAIN,
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    color: Constants.TIER_COLORS.ARTISAN,
    marginBottom: 4,
    fontSize: 16,
    //fontWeight: 'bold',
  },
  reviewerRatingContainer: {
    marginTop: 40,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
  },
  reviewerRating: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 14,
    lineHeight: 16,
    marginLeft: 4,
  },
  description: {
    marginTop: 13,
    paddingHorizontal: 20,
    fontSize: 16,
    lineHeight: 26,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  relayingVideoContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitleContainer: {
    marginTop: 34,
    marginLeft: 20,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: Constants.TIER_COLORS.ARTISAN,
    marginRight: 6,
  },
  sectionTitleMoreIcon: {
    width: 12,
    height: 20,
  },
  interactionButtonContainer: {
    padding: 10,
  },
  interactionButton: {
    padding: 10,
  },
  addCommentButtonTitle: {
    color: Constants.COLOR_MAIN,
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentContainer: {
    paddingHorizontal: 10,
    // backgroundColor: 'rgb(21,21,21)',
  },
  addCommentButtonContainer: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: 20,
    paddingVertical: 10,
    paddingHorizontal: 21,
    alignItems: 'center',
    backgroundColor: 'rgb(42, 42, 42)',
  },
  addCommentInputContainer: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 21,
    alignItems: 'center',
    backgroundColor: 'rgb(42, 42, 42)',
  },
  userProfilePic: {
    width: 28,
    height: 28,
    borderRadius: 28,
    marginRight: 20,
  },
  customVideoControl: {
    position: 'absolute',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 70,
  },
  relatedInfoContainer: {
    // backgroundColor: 'rgb(21,21,21)',
    paddingBottom: 60,
    marginTop: 50,
  },
  addRelayButton: {
    marginBottom: 53,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    marginHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
  },
  addRelayButtonLabel: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 17,
    fontWeight: '600',
  },
  ratingListModalContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  ratingListModalView: {
    height: '100%',
    width: '100%',
    marginHorizontal: 20,
    paddingVertical: isIphoneX() ? 30 : 0,
    backgroundColor: '#111',
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  openButton: {
    width: '100%',
    borderRadius: 8,
    elevation: 2,
    paddingVertical: 16,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  modalTitle: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 15,
  },
  ratingButtonContainer: {
    backgroundColor: 'rgb(51, 50, 46)',
    borderRadius: 60,
    width: 60,
    height: 60,
    position: 'absolute',
    alignSelf: 'flex-end',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 60,
    right: 14,
  },
  ratingGuideBubbleContainer: {
    position: 'absolute',
    bottom: 130,
    right: 330,
  },
  ratingButton: {
    width: 34,
    height: 34,
  },
  ratingModalContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 15,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  ratingModalView: {
    //    height: '50%',
    //    flexGrow: 0,
    width: '100%',
    margin: 15,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingTop: 25,
    paddingBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonTextStyle: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontWeight: 'bold',
    fontSize: 17,
  },
  myRating: {
    position: 'absolute',
    fontSize: 17,
    fontWeight: 'bold',
  },
  addCommentModalContainer: {
    flex: 1,
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  addCommentModalViewContainer: {
    width: '100%',
    margin: 15,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  usersRatingScore: {
    color: Constants.COLOR_MAIN,
    fontWeight: 'bold',
    fontSize: 18,
    marginHorizontal: 10,
  },
  ratingListModalItemContainer: {
    width: Dimensions.get('window').width,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 20,
  },
  ratingListModalHeaderContainer: {
    width: Dimensions.get('window').width,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 13,
  },
  ratingListModalHeaderRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingListModalHeaderRatingIcon: {
    width: 22,
    height: 22,
  },
  ratingListModalHeaderRatingTitle: {
    marginLeft: 6,
    fontSize: 17,
    color: Constants.TIER_COLORS.ARTISAN,
    fontWeight: '600',
  },
  ratingListModalHeaderRatingSubTitle: {
    marginLeft: 6,
    fontSize: 16,
    color: Constants.TIER_COLORS.ARTISAN,
    fontWeight: '100',
  },
  ratingListModalCloseButton: {
    width: 22,
    height: 22,
    margin: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
  },
  greydScoreGuidelinesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  fieldGreydGuidelines: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
    lineHeight: 18,
  },
  requiredIcon: {
    width: 8,
    height: 10,
    marginHorizontal: 5,
  },
  greyingGuideMessageContainer: {
    width: '100%',
    marginHorizontal: 15,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingTop: 15,
    paddingBottom: 25,
    paddingHorizontal: 45,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  greyingGuideTitle: {
    color: Constants.COLOR_MAIN,
    fontSize: 22,
    lineHeight: 26,
    marginTop: 15,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  greyingGuideWapper: {
    marginVertical: 5,
    flexDirection: 'row',
  },
  greyingGuideMessage: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 17,
    lineHeight: 20,
  },
  // customVideoControl: {
  //   position: 'absolute',
  //   flexDirection: 'row',
  //   width: '100%',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   alignSelf: 'center',
  // },
});
