import { CommonActions, useIsFocused } from '@react-navigation/native';
import T from '../../Components/Constants/DesignTokens';
import * as Sentry from '@sentry/react-native';
import React, { useContext, useState } from 'react';
import {
  Alert,
  AppState,
  BackHandler,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  NativeModules,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Preference from 'react-native-default-preference';
import { Button, Text } from 'react-native-elements';
// import FastImage from 'react-native-fast-image';
import FastImage from '../../Components/utils/SafeFastImage.tsx';
import { getBottomSpace, isIphoneX } from 'react-native-iphone-x-helper';
import Animated from 'react-native-reanimated';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import IconMaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { connect, useDispatch } from 'react-redux';
import APIprovider from '../../Components/APIprovider';
import Constants from '../../Components/Constants';
import FEATURES from '../../Components/Constants/Features';
import HelpBubble from '../../Components/CustomComponents/HelpBubble';
import ReportModal from '../../Components/ReportModal';
import { shareLink } from '../../Components/utils/share';
import Strings, { getLanguage } from '../../Components/Strings';
import utils, { LogoutAlert, isGuestUser, videoWatchedFBPixel } from '../../Components/utils';
import { CheckBox, LoadingView } from '../../Components/Views';
import Divider from '../../Components/Views/Divider';
import { Context } from '../../Contexts';
import { changeReward, setTotalRevenue, setTotalReward } from '../../slices/user';
import CommentModal from './CommentModal';
import DetailsSheet from './DetailsSheet';
import { markPromptShown, recordHit, wasPromptShown } from '../../api/regulars';
import { setStatusColor } from './Header';
import LinkedProduct from './LinkedProduct';
import RenderVideoPlayer from './RenderVideoPlayer';
import { alertInAppPurchaseSoon } from '../../Components/utils/productCta';
import ReviewComments from './ReviewComments';
import VideoRenderDetails from './VideoRenderDetails';

const { UIManager } = NativeModules;
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

class VideoPageScreen extends React.PureComponent {
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

    const { videoId, totalReward, video } = this.props.route.params;

    this.initialTime = 0;
    this.cumulativeTime = 0;
    this.videoInfoTimer = undefined;
    this._carousel = null;
    this._isDetailAtTop = true;
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
      averageRating: 0,
      isShowingVideoInfo: true,
      isDetailsOpen: false, // 리뷰 상세 시트(댓글·문의·연관 리뷰) — 2026-09-14
      screenHeight: this.screenHeightNormalScreen,
      videoWidth: 0,
      videoHeight: 0,
      video: {
        videoId,
        // description: '',
        // author: {
        //   userId: '',
        //   name: '',
        //   profilePicUrl: '',
        //   class: 0,
        // },
        //
        author: video?.author || {
          userId: '',
          name: '',
          profilePicUrl: '',
          class: 0,
        },
        title: '' || video?.title,
        description: '' || video?.description,
        //
        postTimestamp: 0,
        thumbnailImageUrl: '',
        thumbnailImagePath: '',
        videoPath: '',
        videoUrl: '' || video?.videoUrl,
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
        // linkedProduct: video.linkedProduct,
        p6Score: {
          brand: 5,
          merchantability: 5,
          practicality: 5,
          convenience: 5,
          design: 5,
          reasonable: 5,
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

        myG6Rating: null,
        isLiked: false,
        likes: 0,
        isMuted: false,
      },
      // slides: [],
      slides:
        video?.videoUrl && video?.thumbnailUrl
          ? [
              {
                type: 'video',
                url: video.videoUrl,
                videoId,
                thumbnailUrl: video.thumbnailUrl,
              },
            ]
          : [],
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
      isGradedAlready: false,
      isShowingCommentInput: false,
      isHLS: false,

      myG6Rating: {
        authentic: 5,
        informative: 5,
        creative: 5,
        aesthetic: 5,
        entertaining: 5,
        attractive: 5,
      },
      myUserId: null,

      currentChangedG6Title: null,
      currentChangedScore: null,

      g6RatingScoreGraph: Strings.SCORE_INNER,
      innerData: null,
      innerMaxima: null,
      totalReward,
      speed: 1,
      isSecretComment: false,
      isQuestionComment: false, // 리뷰어에게 질문 토글 (2026-09-15, 댓글과 Q&A 통합)
      helpBubbleIndex: null,
      isLikeLoading: false,

      // buy product in review page
      isShowPurchaseUIInReview: false,
      // 페이지 실제 렌더 높이 (탭바 등을 제외한 값, onLayout으로 실측)
      pageHeight: null,
      buyNumber: 1,
      isGlobalGroupBuying: false,
      globalGroupBuyingShipmentCost: 0,
      globalGroupBuyingDiscountRate: 0,
    };
  }

  static navigationOptions = () => {
    // Setup the header and tabBarVisible status
    const header = null;
    return {
      // For stack navigators, you can hide the header bar like so
      header,
    };
  };

  componentDidMount() {
    if (Platform.OS !== 'ios') {
      StatusBar.setBackgroundColor(T.COLORS.INK);
      StatusBar.setBarStyle('default', true);
    }

    this.props.navigation.setOptions({
      gestureEnabled: false,
    });

    // If not signed in, move to sign in
    this._isMounted = true;

    // 리스너는 반드시 동기로 등록/해제한다.
    // (기존엔 Preference.get().then() 안에서 등록해, 화면을 빨리 이탈하면
    //  componentWillUnmount 이후에 등록되어 영구 누수 — 죽은 인스턴스의
    //  BackHandler가 뒤로가기를 삼키고 AppState 리스너가 무한 누적됐다)
    this._appStateSubscription = AppState.addEventListener('change', this._handleAppStateChange);
    if (AppState.currentState.match(/inactive|background/)) {
      this.setState({ isBlurred: true });
    }
    this._unsubscribeFocusEvent = this.props.navigation.addListener('focus', () => {
      if (this._isMounted) {
        this.setState({ isBlurred: false });
      }
    });
    this._unsubscribeBlueEvent = this.props.navigation.addListener('blur', () => {
      if (this._isMounted) {
        this.setState({ isBlurred: true });
      }
    });
    BackHandler.addEventListener('hardwareBackPress', this.backAction);
    this._unsubscribeBeforeRemoveEvent = this.props.navigation.addListener('beforeRemove', (_e) => {
      if (
        this.props.route.params.isFocused &&
        this.props.route.params.changeNavigatedVideoScreen &&
        useIsFocused
      ) {
        this.props.route.params.changeNavigatedVideoScreen();
      }
    });

    Preference.get('userId').then((userId) => {
      if (!this._isMounted) {
        return;
      }
      if (userId) {
        this.setState({ myUserId: userId });
        Preference.get('userProfilePicUrl').then((value) => {
          if (this._isMounted) {
            this.setState({
              logonUserProfilePicUrl: value,
            });
          }
        });

        this.loadData();

        Preference.get(`helpBubble[${Constants.HELP_BUBBLE_PAGE_KEY.VIDEO}]`).then((res) => {
          if (res && this._isMounted) {
            this.setState({ helpBubbleIndex: +res });
          }
        });
      } else {
        this.props.navigation.navigate('NotSignedIn');
        this.props.navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'NotSignedIn' }],
          }),
        );
      }
    });
    Preference.get('isGradeBubbleGuided').then((value) => {
      if (value === null) {
        this.gradeBubbleShowTimer = setTimeout(() => {
          if (this._isMounted) {
            this.setState({ isShowingGradeBubbleGuide: true });
            // 앱 전체에서 딱 한 번만 노출 — 보여준 즉시 플래그 저장
            Preference.set('isGradeBubbleGuided', 'true');
            // 5초 뒤 자동 사라짐 (기존에는 탭 전까지 계속 떠 있었음)
            this.gradeBubbleHideTimer = setTimeout(() => {
              if (this._isMounted) {
                LayoutAnimation.easeInEaseOut();
                this.setState({ isShowingGradeBubbleGuide: false });
              }
            }, 5000);
          }
        }, 7000);
      }
    });
    Preference.get('isGradedAlready').then((value) => {
      if (value === 'true' && this._isMounted) {
        this.setState({ isGradedAlready: true });
      }
    });
    // this.videoInfoTimer = setTimeout(() => {
    //   LayoutAnimation.linear();
    //   if (this._isMounted) {
    //     this.setState({ isShowingVideoInfo: false });
    //   }
    // }, 7000);

    // this.showVideoInfo(7000);

    // Video 로드 후 VideoInfo 표시
    this.initialVideoInfoTimer = setTimeout(() => {
      if (this._isMounted) {
        this.showVideoInfo(7000);
      }
    }, 1000); // Video가 충분히 로드되길 기다림

    let animationCount = 0;
    // 인스턴스에 저장해 언마운트 시 정리 (3초 내 이탈 시 타이머가 살아남던 누수 수정)
    this.animationTimer = setInterval(() => {
      this.handleRatingButtonAnimationRef?.bounce(1200);
      animationCount++;
      if (animationCount === 3) {
        clearInterval(this.animationTimer);
      }
    }, 3000);
  }

  componentWillUnmount() {
    // 등록과 대칭으로 전부 동기 해제 (AppState는 subscription.remove 방식)
    this._appStateSubscription?.remove();

    if (this._unsubscribeFocusEvent) {
      this._unsubscribeFocusEvent();
    }
    if (this._unsubscribeBlueEvent) {
      this._unsubscribeBlueEvent();
    }
    BackHandler.removeEventListener('hardwareBackPress', this.backAction);

    if (this._unsubscribeBeforeRemoveEvent) {
      this._unsubscribeBeforeRemoveEvent();
    }

    // setState를 no-op으로 덮어쓰는 안티패턴 제거 — 모든 비동기 콜백은
    // _isMounted 가드를 사용한다 (경고 은폐로 진짜 누수가 감춰지던 문제)
    this._isMounted = false;

    this.clearVideoInfoTimer();

    if (this.initialVideoInfoTimer) {
      clearTimeout(this.initialVideoInfoTimer);
    }
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
    }
    if (this.gradeBubbleShowTimer) {
      clearTimeout(this.gradeBubbleShowTimer);
    }
    if (this.gradeBubbleHideTimer) {
      clearTimeout(this.gradeBubbleHideTimer);
    }
  }

  _handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active' && this._isMounted) {
      this.setState({ isBlurred: false });
    } else {
      this.setState({ isBlurred: true });
    }
  };

  // backAction = () => {
  //   const navigationState = this.props.navigation.getState().routes;
  //   const previousRouteName = navigationState[navigationState.length - 2].name;

  //   if (Platform.OS !== 'ios') {
  //     setStatusColor(previousRouteName);
  //   }

  //   if (this.state.isShowingGreyding === true && this._isMounted) {
  //     this.setState({ isShowingGreyding: false });
  //     // this.setState({isShowingVideoInfo: true})
  //     // if(this.videoInfoTimer!==undefined) clearTimeout(this.videoInfoTimer);
  //     // this.videoInfoTimer = setTimeout(()=>{
  //     //     LayoutAnimation.linear();
  //     //     this.setState({isShowingVideoInfo: false});
  //     //   }, 7000);
  //     return true;
  //   } else if (this.state.isFullScreen === true && this._isMounted) {
  //     this.setState({ isFullScreen: false });
  //     this.setState({ isShowingVideoInfo: true });
  //     if (this.videoInfoTimer !== undefined) {
  //       clearTimeout(this.videoInfoTimer);
  //     }
  //     this.videoInfoTimer = setTimeout(() => {
  //       LayoutAnimation.linear();
  //       this.setState({ isShowingVideoInfo: false });
  //     }, 3000);
  //     return true;
  //   }
  //   return false;
  // };

  backAction = () => {
    const navigationState = this.props.navigation.getState().routes;
    // 딥링크로 직접 진입하면 이전 라우트가 없을 수 있다
    const previousRouteName = navigationState[navigationState.length - 2]?.name;

    if (Platform.OS !== 'ios') {
      setStatusColor(previousRouteName);
    }

    if (this.state.isShowingGreyding === true) {
      if (this._isMounted) {
        this.setState({ isShowingGreyding: false });
        this.showVideoInfo(7000); // 통합 메서드 사용
      }
      return true;
    } else if (this.state.isFullScreen === true) {
      if (this._isMounted) {
        this.setState({ isFullScreen: false });
        this.showVideoInfo(3000); // 통합 메서드 사용
      }
      return true;
    }

    // 컨테이너 ref의 goBack이 무시되는 경우가 있어(페이저 다중 인스턴스 환경)
    // 헤더 뒤로가기와 동일하게 화면 레벨 navigation으로 직접 pop한다.
    if (this.props.navigation.canGoBack()) {
      this.props.navigation.goBack();
      return true;
    }
    return false;
  };

  async loadData() {
    const { video } = this.props.route.params;

    try {
      // const videoResult = await APIprovider.getVideoDetails(this.state.video.videoId);
      const videoResult =
        video &&
        video?.author &&
        video?.title &&
        video?.description &&
        video?.videoUrl &&
        video?.thumbnailUrl
          ? await APIprovider.getVideoExtraInformation(this.state.video.videoId)
          : await APIprovider.getVideoDetails(this.state.video.videoId);

      if (!(videoResult instanceof Error)) {
        this.getVideoDetailsCallback(videoResult);
      } else {
        Alert.alert(Strings.FAILED_TO_LOAD_REVIEW);
        this.props.navigation.pop();
      }
    } catch (err) {
      console.log('video loadData error', err);
      Alert.alert(
        Strings.FAILED_TO_LOAD_REVIEW,
        err.errorMsg ? err.errorMsg : '',
        [{ text: Strings.OK }],
        { cancelable: true },
      );
    }
  }

  getVideoDetailsCallback(data) {
    const { video } = this.state;

    if (
      this.props.route.params.isFocused &&
      useIsFocused &&
      data.statusCode === Constants.POST_STATUS_CODE.DELETED
    ) {
      Alert.alert(Strings.INVALID_REVIEW, Strings.INVALID_REVIEW_UPLOADER_DELETE, [
        {
          text: Strings.OK,
          onPress: () => {
            this.props.navigation.pop();
          },
        },
      ]);
    } else if (
      this.props.route.params.isFocused &&
      useIsFocused &&
      data.statusCode === Constants.POST_STATUS_CODE.REPORTED
    ) {
      Alert.alert(Strings.INVALID_REVIEW, Strings.INVALID_REVIEW_REPORTED, [
        {
          text: Strings.OK,
          onPress: () => {
            this.props.navigation.pop();
          },
        },
      ]);
    } else if (
      this.props.route.params.isFocused &&
      useIsFocused &&
      data.statusCode === Constants.POST_STATUS_CODE.DELETED_BY_ADMIN
    ) {
      Alert.alert(Strings.INVALID_REVIEW, Strings.INVALID_REVIEW_ADMIN_BLOCKING, [
        {
          text: Strings.OK,
          onPress: () => {
            this.props.navigation.pop();
          },
        },
      ]);
    } else {
      let slides = [];
      if (data.attachmentList) {
        for (const image of data.attachmentList) {
          slides.push({
            type: 'image',
            url: image.url,
          });
        }
      }

      // deviceLanguage/isMyReivew는 아래 주석 처리된 분기에서만 쓰이던 값 — 주석 복원 시 함께 되살릴 것
      const _deviceLanguage = (
        Platform.OS === 'ios'
          ? NativeModules.SettingsManager.settings.AppleLocale ||
            NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
          : NativeModules.I18nManager.localeIdentifier
      ).substring(0, 2);

      let _isMyReivew;
      if (data.author) {
        _isMyReivew = data.author.userId === this.props.route.params.logonUserId;
      } else {
        _isMyReivew = video.author.userId === this.props.route.params.logonUserId;
      }

      const userCountryCode = (this.props.userState?.countryCode || 'en').toLowerCase();

      // if (isMyReivew) {
      //   if (typeof data.title === 'object') {
      //     data.title = data.title[data.origLang];
      //     data.description = data.description[data.origLang];
      //   }

      //   data.linkedProduct = {
      //     ...data.linkedProduct,
      //     title:
      //       data.linkedProduct.title[this.props.userState.countryCode] ||
      //       data.linkedProduct.title[data.origLang],
      //   };
      // } else if (deviceLanguage === 'ko') {
      //   if (typeof data.title === 'object') {
      //     data.title = data.title.ko;
      //     data.description = data.description.ko;
      //   }
      //   data.linkedProduct = {
      //     ...data.linkedProduct,
      //     title: data.linkedProduct.title.ko,
      //   };
      // } else {
      //   if (typeof data.title === 'object') {
      //     data.title = data.title.en;
      //     data.description = data.description.en;
      //   }
      //   data.linkedProduct = {
      //     ...data.linkedProduct,
      //     title: data.linkedProduct.title.en,
      //   };
      // }

      if (typeof data.title === 'object') {
        data.title = data.title[userCountryCode];
        data.description = data.description[userCountryCode];
      } else if (!data.title) {
        data.title = this.props.route.params.video.titleByCountry || data.titleByCountry;
        data.description =
          this.props.route.params.video.descriptionByCountry || data.descriptionByCountry;
      }

      if (typeof data.linkedProduct.title === 'object') {
        data.linkedProduct = {
          ...data.linkedProduct,
          title: data.linkedProduct.title[userCountryCode],
        };
      }

      let isHLS;
      if (data.videoUrl) {
        isHLS = data.videoUrl.substring(data.videoUrl.length - '.m3u8'.length) === '.m3u8';
      } else {
        isHLS = video.videoUrl.substring(video.videoUrl.length - '.m3u8'.length) === '.m3u8';
      }

      this.setState({
        video: {
          ...this.state.video,
          // setState() takes a long time, so working on optimization
          // ...data,
          author: data.author ? data.author : this.state.video.author,
          title: data.title ? data.title : this.state.video.title,
          description: data.description ? data.description : this.state.video.description,
          likes: data.likes,
          isLiked: data.isLiked,
          viewCount: data.viewCount,
          g6RatingCount: data.g6RatingCount,
          g6AvgRatingScore: data.g6AvgRatingScore,
          myAvgG6Rating: data.myAvgG6Rating,
          myG6Rating: data.myG6Rating,
          g6RatingList: data.g6RatingList,
          commentCount: data.commentCount,
          linkedProduct: data.linkedProduct,
          p6Score: data?.p6Score?.p6Score
            ? data?.p6Score?.p6Score
            : {
                brand: 5,
                merchantability: 5,
                practicality: 5,
                convenience: 5,
                design: 5,
                reasonable: 5,
              },
          hashTags: data.hashTags,
          relayingVideo: data.relayingVideo,
          relayedVideoList: data.relayedVideoList,
          thumbnailUrl: data.thumbnailUrl,
          relayedVideoCount: data.relayedVideoCount,
          isSponsored: data.isSponsored,
          statusCode: data.statusCode,
          isBookmarked: data.isBookmarked ?? this.state.video.isBookmarked,
          titleByCountry: this.props.route.params.video?.titleByCountry || data.titleByCountry,
          descriptionByCountry:
            this.props.route.params.video?.descriptionByCountry || data.descriptionByCountry,
          isGlobalGroupBuying: data.isGlobalGroupBuying,
          globalGroupBuyingShipmentCost: data.globalGroupBuyingShipmentCost,
          globalGroupBuyingDiscountRate: data.globalGroupBuyingDiscountRate,
        },
        slides:
          this.state.slides.length < 1
            ? [
                {
                  type: 'video',
                  url: data.videoUrl,
                  videoId: data.videoId,
                  thumbnailUrl: data.thumbnailUrl,
                },
                ...slides,
              ]
            : [...this.state.slides, ...slides],
        isHLS: isHLS,
        g6RatingScoreGraph: [
          getLanguage() === 'ko'
            ? {
                표현력: data.g6RatingScore.authentic,
                재미: data.g6RatingScore.entertaining,
                매력도: data.g6RatingScore.attractive,
                정보성: data.g6RatingScore.informative,
                영상미: data.g6RatingScore.aesthetic,
                독창성: data.g6RatingScore.creative,
              }
            : {
                Authentic: data.g6RatingScore.authentic,
                Informative: data.g6RatingScore.informative,
                Attractive: data.g6RatingScore.attractive,
                Entertaining: data.g6RatingScore.entertaining,
                Aesthetic: data.g6RatingScore.aesthetic,
                Creative: data.g6RatingScore.creative,
              },
          this.state.g6RatingScoreGraph[1],
        ],
      });

      if (data.myRating) {
        this.setState({
          isGreyingShowed: true,
          isGradedAlready: true,
        });
        Preference.set('isGradeBubbleGuided', 'true');
        Preference.set('isGradedAlready', 'true');
      }

      // 단골 적중 (2026-09-17): 저장해 둔 리뷰를 다시 열었을 때 한 번만 묻는다
      this.maybePromptHelpfulHit();

      if (this.props.route.params.isFocused && useIsFocused) {
        videoWatchedFBPixel(data);
      }
    }
  }

  menuShareToExport = function () {
    const { videoId, title, description, thumbnailUrl, titleByCountry, descriptionByCountry } =
      this.state.video;

    const dTitle = titleByCountry ? titleByCountry : title;
    const dDescription = descriptionByCountry ? descriptionByCountry : description;

    APIprovider.getVideoDynamicLink(
      videoId,
      dTitle,
      dDescription?.slice(0, 250),
      thumbnailUrl,
    ).then((res) => {
      const url = res?.shortLink;
      const message = Strings.SHARE_REVIEW_MESSAGE;

      shareLink({ url, message, description });
    });
  };

  menuEditVideoClicked = function () {
    const { video } = this.state;

    this.props.navigation.navigate('AddingNewVideo', {
      videoId: video.videoId,
      video: video.videoUrl,
      thumbnailUri: video.thumbnailUrl,
      thumbnailPath: video.thumbnailPath,
      attachmentList: video.attachmentList,
      title: video.title,
      description: video.description,
      linkedProduct: video.linkedProduct,
      relayingVideo: video.relayingVideo,
      isEdit: true,
      onFinishedToEdit: this.loadData.bind(this),
      hashTags: video.hashTags,
      p6Score: video.p6Score,
    });
  };

  menuDeleteVideoClicked = function () {
    Alert.alert(
      Strings.DELETE_REVIEW,
      Strings.SURE_DELETE_REVIEW,
      [
        {
          text: Strings.CANCEL,
          onPress: () => {
            console.log('Cancel Pressed');
          },
          style: 'cancel',
        },
        {
          text: Strings.OK,
          onPress: () => {
            APIprovider.deleteVideo(this.state.video.videoId)
              .then((data) => {
                if (data.result === 1) {
                  console.log(data.reward);
                  this.props.updateReward(data.reward);
                  Alert.alert(Strings.DELETE_REVIEW, Strings.REVIEW_DELETED, [
                    {
                      text: Strings.OK,
                      onPress: () => {
                        this.props.navigation.pop();
                      },
                    },
                  ]);
                }
              })
              .catch((err) => {
                Alert.alert(
                  Strings.FAILED_TO_LOAD_REVIEW,
                  err.errorMsg ? err.errorMsg : '',
                  [{ text: Strings.OK }],
                  { cancelable: true },
                );
              });
          },
        },
      ],
      { cancelable: false },
    );
  };

  menuReportClicked = function () {
    // 같은 메뉴의 북마크/릴레이와 동일하게 게스트는 로그인 유도
    if (isGuestUser(this.props.route.params.logonUserId)) {
      return LogoutAlert(this.props);
    }
    this.setState({
      isInvalidContents: true,
    });
  };

  // 우측 레일에서 ⋯ 메뉴로 이동한 보조 액션들 (화면당 핵심 액션 3개 원칙)
  menuSecondaryActions = [
    {
      key: 'bookmark_video',
      name: Strings.BOOKMARKS,
      icon: <IconMaterialIcons name="bookmark-border" color={'#000'} size={20} />,
      onClicked: this.menuToggleBookmark.bind(this),
    },
    {
      key: 'relay_video',
      name: Strings.RELAY,
      icon: <IconMaterialIcons name="repeat" color={'#000'} size={20} />,
      onClicked: this.onAddRelayButtonPressed.bind(this),
    },
    {
      key: 'playback_speed',
      name: Strings.PLAYBACK_SPEED,
      icon: <IconMaterialIcons name="speed" color={'#000'} size={20} />,
      onClicked: this.menuCycleSpeed.bind(this),
    },
    {
      key: 'toggle_mute',
      name: Strings.TOGGLE_MUTE,
      icon: <IconMaterialIcons name="volume-off" color={'#000'} size={20} />,
      onClicked: this.menuToggleMute.bind(this),
    },
  ];

  menuUploader = [
    ...this.menuSecondaryActions,
    {
      key: 'edit_video',
      name: Strings.EDIT_REVIEW,
      icon: <IconMaterialIcons name="edit" color={'#000'} size={20} />,
      onClicked: this.menuEditVideoClicked.bind(this),
    },
    {
      key: 'delete_video',
      name: Strings.DELETE_REVIEW,
      icon: <IconMaterialIcons name="delete" color={'#000'} size={20} />,
      onClicked: this.menuDeleteVideoClicked.bind(this),
    },
  ];

  menuVisitor = [
    ...this.menuSecondaryActions,
    {
      key: 'report_video',
      name: Strings.REPORT,
      icon: <IconMaterialIcons name="report" color={'#000'} size={20} />,
      onClicked: this.menuReportClicked.bind(this),
    },
  ];

  isMyVideo() {
    return this.state.video.author.userId === this.props.route.params.logonUserId;
  }

  // ⋯ 메뉴로 이동한 보조 액션 핸들러들
  menuToggleBookmark() {
    if (isGuestUser(this.props.route.params.logonUserId)) {
      return LogoutAlert(this.props);
    }
    const review = this.state.video;
    APIprovider.bookmarkVideo(review.videoId, !review.isBookmarked)
      .then(() => {
        this.setState({ video: { ...review, isBookmarked: !review.isBookmarked } });
      })
      .catch((err) => {
        Alert.alert(Strings.FAILED_TO_BOOKMARK, err.errorMsg ? err.errorMsg : '', [
          { text: Strings.OK },
        ]);
      });
  }

  menuCycleSpeed() {
    const next = { 1: 1.25, 1.25: 1.5, 1.5: 2, 2: 1 }[this.state.speed] || 1;
    this.setState({ speed: next });
    this.videoPlayer?.methods?.changeSpeedRate(next);
  }

  menuToggleMute() {
    const next = !this.state.isMuted;
    this.setState({ isMuted: next });
    this.videoPlayer?.methods?.changeMuteStatus(next);
  }

  onError = (e) => {
    console.log('videoPageScreen onError()', e);
    Sentry.captureException(e);

    // 재생 실패 시 앱 종료 대신 안내 후 이전 화면으로 복귀
    Alert.alert(Strings.FAILED_TO_LOAD_REVIEW, '', [
      {
        text: Strings.OK,
        onPress: () => {
          if (this.props.navigation.canGoBack()) {
            this.props.navigation.goBack();
          }
        },
      },
    ]);
  };

  onBuffer = (_data) => {
    //    console.log('onBuffer() ', data)
  };

  onPaused = () => {
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
    this.forceUpdate();

    // videoPlayer가 존재하는지 확인 후 seekTo 호출
    if (this.videoPlayer && this.videoPlayer.seekTo) {
      this.videoPlayer.seekTo(this.initialTime + 1);
    } else {
      console.warn('videoPlayer is not ready yet');

      // 약간의 지연 후 seekTo 호출
      setTimeout(() => {
        if (this.videoPlayer && this.videoPlayer.seekTo) {
          this.videoPlayer.seekTo(this.initialTime + 1);
        }
      }, 100);
    }

    // this.videoPlayer.seekTo(this.initialTime + 1);
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

  onLoadStart = (_data) => {
    this.setState({ isLoading: true });
  };

  onEnd = () => {
    if (this.videoPlayer && this.videoPlayer.seekTo) {
      this.videoPlayer.seekTo(0);
    }

    //Handler for Replay
    // this.videoPlayer.seekTo(0);
  };

  // onFullScreen = () => {
  //   const isFullScreen = !this.state.isFullScreen;
  //   if (isFullScreen === false) {
  //     this.setState({ isShowingVideoInfo: true });
  //     if (this.videoInfoTimer !== undefined) {
  //       clearTimeout(this.videoInfoTimer);
  //     }
  //     this.videoInfoTimer = setTimeout(() => {
  //       LayoutAnimation.linear();
  //       this.setState({ isShowingVideoInfo: false });
  //     }, 3000);
  //   }
  //   this.setState({ isFullScreen: isFullScreen });
  //   this.setState({
  //     screenHeight: isFullScreen ? '100%' : this.screenHeightNormalScreen,
  //   });
  //   return;
  // };

  onFullScreen = () => {
    const isFullScreen = !this.state.isFullScreen;

    if (isFullScreen === false) {
      this.showVideoInfo(3000); // 통합 메서드 사용
    }

    this.setState({
      isFullScreen: isFullScreen,
      screenHeight: isFullScreen ? 100 : this.screenHeightNormalScreen,
    });
  };

  // 틱톡/릴스 스타일: 영상 영역이 화면(탭바 제외 실측 높이)을 꽉 채운다.
  // 가로 영상은 resizeMode(contain)로 중앙에 레터박스 처리된다.
  getPlayerStyle = function () {
    return {
      height: this.state.isFullScreen
        ? this.getScreenHeightFullScreen()
        : this.state.pageHeight || Dimensions.get('window').height,
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
      isRelay: true,
      title: Strings.ADD_RELAY_REVIEW,
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
    APIprovider.addNewVideoComment({
      comment: this.state.newComment,
      videoId: this.state.video.videoId,
      targetId: this.state.video.videoId,
      isSecret: this.state.isSecretComment,
      isQuestion: this.state.isQuestionComment,
    })
      .then((data) =>
        // 서버가 아직 isQuestion을 돌려주지 않아도 방금 쓴 댓글엔 질문 표시가 보이게 한다
        this.addNewVideoCommentCallback(
          data && typeof data === 'object'
            ? { isQuestion: this.state.isQuestionComment, ...data }
            : data,
        ),
      )
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
        isSecretComment: false,
        isQuestionComment: false,
      });

      this.props.setReward(data.totalReward);
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
      // const offset = video.commentList[video.commentList.length - 1].createdAt;
      const skip = video.commentList.length;
      APIprovider.getVideoCommentList(video.videoId, undefined, skip, 10)
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
              this.state.video.commentCount - 1 - (this.state.video.commentList[i].childCount ?? 0),
            commentList: [
              ...this.state.video.commentList.slice(0, i),
              ...this.state.video.commentList.slice(i + 1, this.state.video.commentList.length),
            ],
          },
        });
      }
    }

    this.props.updateReward(result.reward);
  }

  onRatingComplete(ratingScore) {
    this.setState({ isShowingCheckSign: true });
    setTimeout(() => {
      this.setState({ isShowingCheckSign: false });
      LayoutAnimation.spring();
    }, 1000);
    LayoutAnimation.spring();

    const { video } = this.state;

    APIprovider.g6RatingVideo(video.videoId, ratingScore).then((result) => {
      this.setState({
        video: {
          ...this.state.video,
          myRating: this.state.myRating,
          myG6Rating: this.state.myG6Rating,
          myAvgG6Rating: (Object.entries(ratingScore).reduce((p, c) => p + c[1], 0) / 6).toFixed(1),
          g6RatingCount: result.g6RatingCount,
          g6AvgRatingScore: result.g6AvgRatingScore,
          g6RatingScore: result.g6RatingScore,
        },
        g6RatingScoreGraph: [
          getLanguage() === 'ko'
            ? {
                표현력: result.g6RatingScore.authentic,
                재미: result.g6RatingScore.entertaining,
                매력도: result.g6RatingScore.attractive,
                정보성: result.g6RatingScore.informative,
                영상미: result.g6RatingScore.aesthetic,
                독창성: result.g6RatingScore.creative,
              }
            : {
                Authentic: result.g6RatingScore.authentic,
                Informative: result.g6RatingScore.informative,
                Attractive: result.g6RatingScore.attractive,
                Entertaining: result.g6RatingScore.entertaining,
                Aesthetic: result.g6RatingScore.aesthetic,
                Creative: result.g6RatingScore.creative,
              },
          this.state.g6RatingScoreGraph[1],
        ],
      });

      this.props.setReward(result.totalReward);
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
    APIprovider.cancelG6RatingVideo(video.videoId)
      .then((result) => {
        this.setState({
          video: {
            ...this.state.video,
            // ratingScore: result.ratingScore,
            // ratingCount: result.ratingCount,
            g6AvgRatingScore: result.g6AvgRatingScore,
            g6RatingCount: result.g6RatingCount,
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
    // 실제 데이터가 담기는 필드는 relayedVideoList — 기존 코드는 항상 빈
    // videoListOfRelatedVideo를 읽어 [-1].createdAt에서 크래시했다.
    const relayedList = this.state.video.relayedVideoList;
    if (!relayedList || relayedList.length === 0) {
      return;
    }
    this.setState({ relayedVideoListIsRefreshing: true });
    const offset = relayedList[relayedList.length - 1].createdAt;
    const limit = 10;
    APIprovider.getRelayingVideoList(
      this.state.video.videoId,
      undefined,
      offset,
      relayedList.length,
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

    // TODO: 240625 임시처리, this.state.video.videoListOfLinkedProduct.videoList의 길이가 0이다

    const offset =
      this.state.video.videoListOfLinkedProduct.videoList[
        this.state.video.videoListOfLinkedProduct.videoList.length - 1
      ]?.createdAt || 0;
    const limit = 10;
    APIprovider.getLinkedVideoListOfProduct(
      typeof this.state.video.linkedProduct.productId === 'object'
        ? this.state.video.linkedProduct.productId._id
        : this.state.video.linkedProduct.productId,
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

  bookmarkVideoCallback(_result) {
    // reflect UI by result
  }

  onVideoRatingListEndReached() {
    if (!this.state.ratingList || this.state.ratingList.length === 0) {
      return;
    }
    this.setState({ isLoadingRatingList: true });
    const offset = this.state.ratingList[this.state.ratingList.length - 1].createdAt;
    APIprovider.getVideoG6RatingList(this.state.video.videoId, offset)
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

  getPriceToPay() {
    const product = this.state.video.linkedProduct.productId;
    let price = product.discountPrice > 0 ? product.discountPrice : product.price;

    let addition = 0;
    const { checks, lists } = product.options;
    for (let i = 0; i < checks.length; i++) {
      if (checks[i].isChecked === true) {
        addition += checks[i].addition;
      }
    }
    for (let i = 0; i < lists.length; i++) {
      for (let j = 0; j < lists[i].items.length; j++) {
        if (lists[i].selectedItemName === lists[i].items[j].name) {
          addition += lists[i].items[j].addition;
          break;
        }
      }
    }
    price += addition;
    price *= this.state.buyNumber;
    return price;
  }

  // 타이머 초기화 메서드 추가
  // clearVideoInfoTimer() {
  //   if (this.videoInfoTimer !== undefined) {
  //     clearTimeout(this.videoInfoTimer);
  //     this.videoInfoTimer = undefined;
  //   }
  // }
  clearVideoInfoTimer = () => {
    if (this.videoInfoTimer !== null) {
      // console.log('Clearing timer:', this.videoInfoTimer);
      clearTimeout(this.videoInfoTimer);
      this.videoInfoTimer = null;
    }
  };

  // 인스타그램 릴스식: 오버레이는 자동으로 사라지지 않는다. 숨기는 건 사용자의 탭(toggleVideoInfo)뿐.
  // 예전엔 마운트 7초 뒤 자동 숨김이었는데, 페이저가 옆 페이지를 미리 그려 두므로
  // 넘어가 보면 이미 캡션·핸들이 사라진 채였다 (2026-09-15 수정).
  showVideoInfo = () => {
    this.clearVideoInfoTimer();
    if (!this.state.isShowingVideoInfo && this._isMounted) {
      this.setState({ isShowingVideoInfo: true });
    }
  };

  hideVideoInfo = () => {
    this.clearVideoInfoTimer();
    if (this.state.isShowingVideoInfo && this._isMounted) {
      LayoutAnimation.linear();
      this.setState({ isShowingVideoInfo: false });
    }
  };

  // 인스타그램 릴스식 탭 토글 — 영상 빈 곳을 누르면 오버레이가 사라지고, 다시 누르면 나온다.
  // 숨김은 사용자가 명시적으로 선택한 상태이므로 자동 복귀 타이머를 걸지 않는다.
  toggleVideoInfo = () => {
    if (!this._isMounted) {
      return;
    }
    this.clearVideoInfoTimer();
    this.setState((prev) => ({ isShowingVideoInfo: prev.isShowingVideoInfo === false }));
  };

  componentDidUpdate(prevProps) {
    // 페이지를 벗어났다 돌아오면 상세 스크롤 위치는 그대로 남아 있으므로 잠금 상태를 다시 알려준다.
    if (!prevProps.route.params.isFocused && this.props.route.params.isFocused) {
      this.props.route.params.setIsDetailAtTop?.(this._isDetailAtTop);
      // 새 쇼츠로 넘어오면 캡션·핸들이 항상 보이는 상태로 시작한다
      this.showVideoInfo();
    }
  }

  /*
   * 세로 스와이프로 영상을 넘기는 상위 PagerView와 이 화면의 세로 스크롤이 같은 축을 공유한다.
   * 상세를 읽는 동안에는 페이저가 제스처를 가로채지 않도록 상태를 위로 올려 보낸다.
   * 화면 밖(비포커스) 페이지도 레이아웃 중 onScroll을 발생시키므로 포커스된 페이지만 보고한다.
   */
  reportDetailScrollPosition = (scrollY) => {
    if (!this.props.route.params.isFocused) {
      return;
    }

    const isAtTop = scrollY <= 0;
    if (isAtTop === this._isDetailAtTop) {
      return;
    }

    this._isDetailAtTop = isAtTop;
    this.props.route.params.setIsDetailAtTop?.(isAtTop);
  };

  // 오버레이의 "댓글·문의·연관 리뷰 보기" → 영상 위에 상세 시트를 띄운다 (2026-09-14).
  // 이전엔 영상 아래로 스크롤해 들어갔는데, 그 상태에선 쇼츠 페이저가 잠겨 화면이 둘로 느껴졌다.
  openDetails = () => {
    if (this._isMounted) {
      this.setState({ isDetailsOpen: true });
    }
  };

  closeDetails = () => {
    if (this._isMounted) {
      this.setState({ isDetailsOpen: false });
    }
  };

  // 시트 헤더의 저장(북마크) — 오버레이 레일과 같은 낙관적 토글
  toggleBookmarkFromSheet = () => {
    const review = this.state.video;
    if (!review?.videoId) {
      return;
    }
    const next = !review.isBookmarked;
    this.setState({ video: { ...review, isBookmarked: next } });
    APIprovider.bookmarkVideo(review.videoId, next).catch(() => {
      if (this._isMounted) {
        this.setState((prev) => ({ video: { ...prev.video, isBookmarked: !next } }));
      }
    });
  };

  // 단골 적중 (2026-09-17): 저장(북마크)해 둔 리뷰를 다시 열었을 때, 리뷰당 한 번만
  // "도움됐나요?"를 묻고 응답을 적중 원장에 기록한다.
  maybePromptHelpfulHit = async () => {
    const video = this.state.video;
    const reviewerId = video?.author?.userId;
    const videoId = video?.videoId;
    if (!reviewerId || !videoId || !video?.isBookmarked) {
      return;
    }
    if (await wasPromptShown(videoId)) {
      return;
    }
    await markPromptShown(videoId);
    Alert.alert(Strings.REGULAR_PROMPT_HELPFUL_TITLE, '', [
      { text: Strings.REGULAR_PROMPT_LATER, style: 'cancel' },
      {
        text: Strings.REGULAR_PROMPT_HELPFUL_YES,
        onPress: () => recordHit(reviewerId, videoId, 'helpful').catch(() => {}),
      },
    ]);
  };

  openAuthorFromSheet = () => {
    const author = this.state.video?.author;
    if (!author?.userId) {
      return;
    }
    this.closeDetails();
    this.props.navigation.push('UserPage', {
      pageOwnerUserId: author.userId,
      pageOwnerUserName: author.name,
      pageOwnerUserProfilePicUrl: author.profilePicUrl,
    });
  };

  // 시트 안내 → 마이페이지 > 저장 (전체 상세는 거기서 detailMode로 연다)
  openSavedList = () => {
    this.closeDetails();
    this.props.navigation.navigate('BookmarkList');
  };

  onDetailTouchStart = () => {
    if (this.props.route.params.isFocused) {
      this.props.route.params.setIsTouchingDetail?.(true);
    }
  };

  onDetailTouchEnd = () => {
    if (this.props.route.params.isFocused) {
      this.props.route.params.setIsTouchingDetail?.(false);
    }
  };

  render() {
    const isDetailMode = !!this.props.route.params.detailMode;
    return (
      <>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'height' : null}
        >
          {this.state.isLikeLoading ? <LoadingView opacity={0.5} /> : null}
          <View
            style={styles.container}
            onLayout={(e) => {
              const height = Math.round(e.nativeEvent.layout.height);
              if (height > 0 && height !== this.state.pageHeight) {
                this.setState({ pageHeight: height });
              }
            }}
          >
            <Animated.FlatList
              ref={(ref) => {
                this._detailList = ref;
              }}
              onScrollBeginDrag={() => this.props.route.params.setIsSeekBarMoved(false)}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              ListHeaderComponentStyle={styles.container}
              initialNumToRender={5}
              // 쇼츠 모드: 페이지 안 세로 스크롤 금지 — 세로 제스처는 전부 바깥 쇼츠 페이저의 것 (2026-09-14)
              // 상세 모드(마이페이지 > 저장에서 진입): 영상 아래로 사진·평점표·연관 리뷰를 스크롤 (2026-09-15)
              scrollEnabled={isDetailMode}
              legacyImplementation={false}
              disableVirtualization={true}
              maxToRenderPerBatch={5}
              onScroll={(e) => {
                // this.setState({ isShowingVideoInfo: true });
                // if (e.nativeEvent.contentOffset.y > 60) {
                //   if (this.videoInfoTimer !== undefined) {
                //     clearTimeout(this.videoInfoTimer);
                //     this.videoInfoTimer = undefined;
                //   }
                // } else {
                //   if (this.videoInfoTimer === undefined) {
                //     this.videoInfoTimer = setTimeout(() => {
                //       LayoutAnimation.linear();
                //       this.setState({ isShowingVideoInfo: false });
                //     }, 3000);
                //   }
                // }

                // if (e.nativeEvent.contentOffset.y > 60) {
                //   // 스크롤을 많이 내렸을 때만 타이머 취소
                //   if (this.videoInfoTimer !== undefined) {
                //     clearTimeout(this.videoInfoTimer);
                //     this.videoInfoTimer = undefined;
                //     // 스크롤 내릴 때는 VideoInfo 숨김
                //     if (this.state.isShowingVideoInfo) {
                //       this.setState({ isShowingVideoInfo: false });
                //     }
                //   }
                // }

                const scrollY = e.nativeEvent.contentOffset.y;

                if (scrollY > 60) {
                  // 스크롤 많이 내렸을 때 - VideoInfo 숨김
                  this.hideVideoInfo();
                }

                this.reportDetailScrollPosition(scrollY);
              }}
              scrollEventThrottle={16}
              ListHeaderComponent={<RenderVideoPlayer context={this} />}
              ListFooterComponent={
                isDetailMode ? (
                  <VideoRenderDetails context={this} useIsFocused={useIsFocused} />
                ) : null
              }
            />
            {/* 리뷰 상세(댓글·문의·연관 리뷰·상품 리뷰)는 같은 쇼츠 위의 시트로 — 닫으면 그 자리 */}
            <DetailsSheet
              visible={this.state.isDetailsOpen}
              onClose={this.closeDetails}
              review={this.state.video}
              isBookmarked={!!this.state.video?.isBookmarked}
              onToggleBookmark={this.toggleBookmarkFromSheet}
              onPressAuthor={this.openAuthorFromSheet}
              onOpenSaved={this.openSavedList}
              overlay={<CommentModal context={this} />}
            >
              <ReviewComments context={this} />
            </DetailsSheet>
            {/* 시트가 닫혀 있을 때(오버레이 댓글 버튼)만 화면 레이어에 직접 띄운다 —
              시트가 열려 있으면 위의 overlay로 같은 창 안에 렌더링된다 */}
            {!this.state.isDetailsOpen ? <CommentModal context={this} /> : null}
            <ReportModal
              visible={this.state.isInvalidContents}
              onCancel={() => {
                this.setState({ isInvalidContents: false });
              }}
              contentInfo={{ type: 'video', id: this.state.video.videoId }}
            />
            <ReportModal
              visible={this.state.isInvalidComment}
              onCancel={() => {
                this.setState({ isInvalidComment: false });
              }}
              contentInfo={{
                type: 'comment',
                id: this.state.reportedCommentId,
                wrapperId: this.state.video.videoId,
              }}
            />
            <HelpBubble
              type={Constants.HELP_BUBBLE_PAGE_KEY.VIDEO}
              helpBubbleIndex={this.state.helpBubbleIndex}
              onPress={() => {
                const { helpBubbleIndex } = this.state;

                if (helpBubbleIndex <= 0) {
                  Preference.set(
                    `helpBubble[${Constants.HELP_BUBBLE_PAGE_KEY.VIDEO}]`,
                    (helpBubbleIndex + 1).toString(),
                  );
                  this.setState({ helpBubbleIndex: helpBubbleIndex + 1 });
                }
              }}
            />
          </View>

          {/* 하단 고정 구매 바 제거 — 오버레이의 상품 카드가 구매 진입점 (틱톡/릴스 스타일).
              구매 팝업은 오버레이의 구매 버튼이 연다. */}
        </KeyboardAvoidingView>
      </>
    );
  }
}

// 현재 미사용 — 하단 고정 구매 바 복원 시 사용 (오버레이 상품 카드로 대체됨)
function _PurchaseButton({ context }) {
  // return (
  //   <Button
  //     containerStyle={styles.bottomButtonGroupButton}
  //     buttonStyle={{
  //       backgroundColor: Constants.COLOR_POINT_BLUE,
  //       height: 45,
  //     }}
  //     titleStyle={{
  //       color: Constants.COLOR_BACKGROUND_DARK,
  //       fontSize: 18,
  //       fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
  //     }}
  //     title={Strings.BUY}
  //     onPress={() => {
  //       if (isGuestUser(context.props.route.params.logonUserId)) {
  //         return LogoutAlert(context.props);
  //       }
  //       context.setState({ isShowPurchaseUIInReview: true });
  //     }}
  //   />
  // );

  return (
    <View
      style={{
        paddingTop: 10,
        backgroundColor: Constants.COLOR_BACKGROUND_DARK,
        flexDirection: 'row',
      }}
    >
      <Button
        containerStyle={{ flex: 1 }}
        buttonStyle={{
          backgroundColor: Constants.COLOR_POINT_BLUE,
          height: 54,
        }}
        titleStyle={{
          color: Constants.COLOR_BACKGROUND_DARK,
          fontSize: 18,
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
        }}
        title={Strings.BUY_NOW}
        onPress={() => {
          if (isGuestUser(context.props.route.params.logonUserId)) {
            return LogoutAlert(context.props);
          }
          context.setState({ isShowPurchaseUIInReview: true });
        }}
      />
      <Button
        containerStyle={{ marginLeft: 12 }}
        buttonStyle={{
          backgroundColor: Constants.COLOR_POINT_BLUE,
          paddingHorizontal: 24,
          height: 54,
        }}
        titleStyle={{
          color: Constants.COLOR_BACKGROUND_DARK,
          fontSize: 18,
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
        }}
        icon={
          <FastImage
            source={require('../../Resources/img/iconRenewal/white-cart.png')}
            style={styles.addCartIcon}
          />
        }
        onPress={() => {
          if (isGuestUser(context.props.route.params.logonUserId)) {
            return LogoutAlert(context.props);
          }
          context.setState({ isShowPurchaseUIInReview: true });
        }}
      />
    </View>
  );
}

function PurchasePopup({ context }) {
  const { productId: product } = context.state.video.linkedProduct;
  // productId가 populate되지 않은(문자열) 케이스에서 options 접근 크래시 방지
  const [options, setOptions] = useState(
    (typeof product === 'object' && product?.options) || { lists: [], checks: [] },
  );

  const global = useContext(Context);
  const dispatch = useDispatch();

  const listOptionSelectChanged = (name, itemName) => {
    let opts = options.lists;

    for (let i = 0; i < opts.length; i++) {
      if (opts[i].name === name) {
        opts[i].selectedItemName = itemName;
        break;
      }
    }

    setOptions({ ...options, lists: opts });
  };

  const checkOption = (name, isChecked) => {
    let opts = options.checks;

    //check if already added
    for (let i = 0; i < opts.length; i++) {
      if (opts[i].name === name) {
        opts[i].isChecked = isChecked;
        break;
      }
    }

    setOptions({ ...options, checks: opts });
  };

  const handlePressBuy = () => {
    if (!FEATURES.COMMERCE) {
      alertInAppPurchaseSoon();
      return;
    }
    if (options.lists.length && !options.lists.find((option) => option.selectedItemName)) {
      alert(Strings.MUST_SELECT_OPTION);
      return;
    }

    // 주문서로 이동 (2026-09-16) — 장바구니 생성·주문 생성·결제창 열기는 OrderSheet가 한 흐름으로 한다.
    // 예전엔 여기서 장바구니를 만든 뒤 지금은 없는 화면(GlobalMakeOrder)으로 보내 흐름이 끊겨 있었다.
    context.setState({ isShowPurchaseUIInReview: false });
    context.props.navigation.navigate('OrderSheet', {
      product: {
        productId: product._id || product.productId,
        titleByCountry: product.titleByCountry || product.title,
        thumbnailUrl: product.thumbnailUrl,
        price: product.price,
        discountPrice: product.discountPrice,
      },
      quantity: context.state.buyNumber,
      options: product.options,
      reviewerVideoId: context.state.video?._id,
    });
  };

  return (
    <View
      style={[
        styles.purchasePopupContainer,
        {
          bottom: context.state.isShowPurchaseUIInReview ? 0 : -Dimensions.get('window').height,
        },
      ]}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          LayoutAnimation.easeInEaseOut();
          context.setState({ isShowPurchaseUIInReview: false });
        }}
      >
        <View style={{ flex: 1 }} />
      </TouchableWithoutFeedback>
      <View style={styles.divider} />
      <View style={styles.purchasePopupModalContainer}>
        <View style={styles.purchasePopupModalHeaderContainer}>
          <Text style={styles.purchasePopupModalHeaderTitle}>{Strings.CHOOSE_PRODUCT}</Text>
          <TouchableWithoutFeedback
            onPress={() => {
              LayoutAnimation.easeInEaseOut();
              context.setState({ isShowPurchaseUIInReview: false });
            }}
          >
            <View>
              <FastImage
                source={require('../../Resources/img/iconRenewal/icHeaderClose22.png')}
                style={styles.closeIcon}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>

        <LinkedProduct
          context={context}
          linkedProduct={context.state.video.linkedProduct}
          marginTop={10}
          marginHorizontal={0}
        />

        <View style={styles.productNumberContainer}>
          <View>
            <Text style={styles.purchasePopupModalfieldTitle}>
              <Text>{Strings.NUMBER_PRODUCTS}</Text>
              {product.availableNumberToSale !== -1 && (
                <Text
                  style={{
                    fontSize: 13,
                    color: T.COLORS.RED,
                  }}
                >{` (${Strings.REMAINING_QUANTITY(product.availableNumberToSale)})`}</Text>
              )}
            </Text>
            <Text style={styles.delieverElapsedDay}>{Strings.DELIVER_ELAPSED_DAY(3)}</Text>
          </View>
          <View style={styles.numberControllerContainer}>
            <Button
              containerStyle={{
                borderBottomRightRadius: 0,
                borderTopRightRadius: 0,
              }}
              buttonStyle={{
                paddingVertical: 0,
                paddingHorizontal: 10,
                height: 30,
                borderWidth: 0,
                borderBottomRightRadius: 0,
                borderTopRightRadius: 0,
              }}
              titleStyle={{ color: T.COLORS.INK }}
              type={'outline'}
              icon={
                <FastImage
                  source={require('../../Resources/img/iconRenewal/black-minus.png')}
                  style={styles.plusMinusIcon}
                />
              }
              onPress={() => {
                const newNumber = context.state.buyNumber - 1;
                if (newNumber === 0) {
                  return;
                }
                context.setState({ buyNumber: newNumber });
              }}
            />
            <View
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                height: 30,
                borderLeftWidth: 0,
                borderRightWidth: 0,
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: T.COLORS.INK, fontSize: 13 }}>{context.state.buyNumber}</Text>
            </View>
            <Button
              containerStyle={{
                borderBottomLeftRadius: 0,
                borderTopLeftRadius: 0,
              }}
              buttonStyle={{
                paddingVertical: 0,
                paddingHorizontal: 10,
                height: 30,
                borderWidth: 0,
                borderBottomLeftRadius: 0,
                borderTopLeftRadius: 0,
              }}
              titleStyle={{ color: T.COLORS.INK }}
              type={'outline'}
              icon={
                <FastImage
                  source={require('../../Resources/img/iconRenewal/black-plus.png')}
                  style={styles.plusMinusIcon}
                />
              }
              onPress={() => {
                if (product.eventType === 'refund') {
                  Alert.alert(
                    Strings.MAX_AVAILABLE_PRODUCT_NUMBER,
                    Strings.PURCHASE_ONLY_ONE_REFUND_PRODUCT,
                  );
                  return;
                }

                if (context.state.buyNumber === product.availableNumberToSale) {
                  Alert.alert(
                    Strings.MAX_AVAILABLE_PRODUCT_NUMBER,
                    Strings.CHECK_MAX_AVAILABLE_PRODUCT,
                  );
                  return;
                }
                context.setState({ buyNumber: context.state.buyNumber + 1 });
              }}
            />
          </View>
        </View>
        <Divider />
        <ScrollView showsVerticalScrollIndicator={false}>
          {options.lists.length > 0 && (
            <View>
              {options.lists.map((option, idx) => (
                <View key={'listoption' + idx} style={styles.chooseProductOptionContainer}>
                  {option.items.map((item, idxItem) => (
                    <TouchableOpacity
                      style={styles.optionItemContainer}
                      key={'listoption_item_' + idxItem}
                      onPress={() => {
                        listOptionSelectChanged(option.name, item.name);
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <CheckBox
                          key={'listoptionitem' + idxItem}
                          onChanged={() => {
                            listOptionSelectChanged(option.name, item.name);
                          }}
                          value={option.selectedItemName === item.name}
                          style={{ marginRight: 8 }}
                          type={'radio'}
                        />
                        <Text style={styles.purchasePopupModalOptionTitle}>{option.name}</Text>
                        <Text style={styles.purchasePopupModalfieldTitle}>{item.name}</Text>
                      </View>
                      <Text style={styles.optionPrice}>
                        {item.addition > 0 ? '+' : ''}
                        {Strings.MONEY_AMOUNT_UNIT_WON(utils.numberWithCommas(item.addition))}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          )}
          {options.checks.length > 0 && (
            <View style={styles.chooseProductOptionContainer}>
              <Text style={styles.purchasePopupModalOptionTitle}>{Strings.ADDITIONAL_PRODUCT}</Text>
              {options.checks.map((option, idx) => (
                <View style={styles.optionItemContainer} key={option.name + '_' + idx}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CheckBox
                      key={'checkoption' + idx}
                      onChanged={() => {
                        checkOption(option.name, !option.isChecked);
                      }}
                      value={option.isChecked}
                      style={{ marginRight: 8 }}
                    />

                    <Text style={styles.purchasePopupModalfieldTitle}>{option.name}</Text>
                  </View>
                  <Text style={styles.optionPrice}>
                    {option.addition > 0 ? '+' : ''}
                    {utils.displayPrice(
                      option.addition,
                      global?.state?.region,
                      context?.props?.route?.params?.KRWPerUSD,
                    )}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
        <Divider />

        {/* <View style={[styles.divider, { marginTop: 20, marginBottom: 10 }]} /> */}
        <View style={styles.priceToPayContainer}>
          <Text style={styles.purchasePopupModalfieldTitle}>{Strings.TOTAL_PRODUCT_PRICE}</Text>
          <Text style={styles.expectedPrice}>
            {utils.displayPrice(
              context.getPriceToPay(),
              global?.state?.region,
              context?.props?.route?.params?.KRWPerUSD,
            )}
          </Text>
        </View>
      </View>
      <View style={styles.bottomPurchaseButtonContainer}>
        <Button
          containerStyle={{ flex: 1 }}
          buttonStyle={{
            backgroundColor:
              product.isAvailableToSale === false || product.availableNumberToSale === 0
                ? '#999'
                : Constants.COLOR_POINT_BLUE,
            height: 54,
          }}
          titleStyle={{
            color: Constants.COLOR_BACKGROUND_DARK,
            fontSize: 18,
            fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
          }}
          title={Strings.BUY_NOW}
          onPress={() => {
            if (isGuestUser(context.props.route.params.logonUserId)) {
              return LogoutAlert(context.props);
            }
            handlePressBuy();
          }}
        />
        <Button
          containerStyle={{ marginLeft: 12 }}
          buttonStyle={{
            backgroundColor:
              product.isAvailableToSale === false || product.availableNumberToSale === 0
                ? '#999'
                : Constants.COLOR_POINT_BLUE,
            paddingHorizontal: 24,
            height: 54,
          }}
          titleStyle={{
            color: Constants.COLOR_BACKGROUND_DARK,
            fontSize: 18,
            fontWeight: 'bold',
          }}
          icon={
            <View>
              <FastImage
                source={require('../../Resources/img/iconRenewal/white-cart.png')}
                style={styles.addCartIcon}
              />
            </View>
          }
          onPress={() => {
            if (isGuestUser(context.props.route.params.logonUserId)) {
              return LogoutAlert(context.props);
            }
            APIprovider.newCartItem(
              product.productId,
              context.state.buyNumber,
              product.options,
              null,
              Constants.CART_FROM.CART,
            )
              .then((result) => {
                if (result) {
                  // 장바구니 화면은 아직 없다 (2026-09-16) — 등록되지 않은 라우트로 보내던 분기를 지운다.
                  Alert.alert(Strings.SUCCEED_TO_CART, '', [
                    {
                      text: Strings.OK,
                      onPress: () => {
                        context.setState({ isShowPurchaseUIInReview: false });
                      },
                    },
                  ]);
                }
              })
              .catch((err) => {
                Alert.alert(
                  Strings.FAILED_TO_ADD_CART,
                  err.errorMsg ? err.errorMsg : '',
                  [{ text: Strings.OK }],
                  { cancelable: true },
                );
              });
          }}
        />
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  bottomButtonGroupContainer: {
    marginTop: 6,
    marginBottom: Platform.OS === 'ios' ? 12 : 12,
    marginHorizontal: 20,
  },
  bottomButtonGroupButton: {
    marginVertical: 4,
    borderRadius: 14,
  },

  /* --------------------------------------------- */
  bottomButtonTitle: {
    color: Constants.COLOR_BACKGROUND_DARK,
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPurchaseButtonContainer: {
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 44 : 20,
    paddingHorizontal: 20,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    flexDirection: 'row',
  },
  purchasePopupContainer: {
    position: 'absolute',
    justifyContent: 'flex-end',
    width: '100%',
    height: 200 - getBottomSpace(),
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  purchasePopupModalContainer: {
    borderTopWidth: 0.5,
    borderTopColor: T.COLORS.LINE,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  purchasePopupModalHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // marginBottom: 10,
  },
  purchasePopupModalHeaderTitle: {
    fontWeight: '500',
    color: T.COLORS.INK,
    fontSize: 20,
  },
  purchasePopupModalfieldTitle: {
    color: T.COLORS.INK,
    fontSize: 15,
    textAlign: 'center',
  },
  purchasePopupModalOptionTitle: {
    color: T.COLORS.INK,
    fontSize: 15,
    // marginBottom: 5,
    textAlign: 'center',
  },
  delieverElapsedDay: {
    fontSize: 13,
    color: T.COLORS.GREY,
    marginTop: 6,
  },
  productNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    paddingVertical: 14,
  },
  numberControllerContainer: {
    borderRadius: 4,
    borderColor: T.COLORS.GREY,
    borderWidth: 1,
    flexDirection: 'row',
  },
  chooseProductOptionContainer: {
    marginTop: 20,
  },
  optionItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  optionPrice: {
    color: T.COLORS.INK,
    fontSize: 15,
    fontWeight: '500',
  },
  priceToPayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  expectedPrice: {
    fontSize: 18,
    fontWeight: '500',
    color: T.COLORS.INK,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#4d4d4d',
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  closeIcon: {
    width: 22,
    height: 22,
  },
  plusMinusIcon: {
    width: 12,
    height: 12,
  },
  addCartIcon: {
    width: 26,
    height: 26,
  },
  /* --------------------------------------------- */

  slidePagination: {
    // 상세는 이제 시트 안에 뜨므로(2026-09-14) 상태바 여백이 필요 없다
    marginTop: 8,
    marginLeft: 24,
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  sliderViewStyle: { flexDirection: 'row', marginRight: 8, alignItems: 'flex-end' },
  SliderImageStyle: { height: 34, width: 34, marginHorizontal: 1, borderRadius: 4 },
  videoSliderImageStyle: { height: 52, width: 52, marginHorizontal: 1, borderRadius: 4 },
  checkSign: {
    flex: 1,
    position: 'absolute',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    marginTop: 10,
    paddingVertical: 0,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  description: {
    marginTop: 13,
    paddingHorizontal: 20,
    fontSize: 16,
    lineHeight: 26,
    color: T.COLORS.INK,
  },
  relatedInfoContainer: {
    paddingBottom: 60,
    // marginTop: 50,
  },
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  // 틱톡 스타일 우측 액션 레일의 grade 버튼 옆에 표시
  ratingGuideBubbleContainer: {
    position: 'absolute',
    bottom: 300,
    right: 95,
    maxWidth: 230,
  },
});

const mapDispatchToProps = (dispatch) => ({
  setReward: (totalReward) => dispatch(setTotalReward({ totalReward })),
  updateReward: (reward) => dispatch(changeReward({ reward })),
});

export default connect((state) => {
  return { userState: state.user.user.data };
}, mapDispatchToProps)(VideoPageScreen);
