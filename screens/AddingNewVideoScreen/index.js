import React, { Component } from 'react';
import {
  Alert,
  AppState,
  BackHandler,
  Dimensions,
  Image,
  Keyboard,
  LayoutAnimation,
  NativeModules,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { AppInstalledChecker } from 'react-native-check-app-install';
import Preference from 'react-native-default-preference';
import Toast from 'react-native-easy-toast';
import { Button } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import RNFS from 'react-native-fs';
import { getBottomSpace, isIphoneX } from 'react-native-iphone-x-helper';
import { KeyboardAwareScrollView as KeyboardAvoidingView } from 'react-native-keyboard-aware-scroll-view';
import { getStatusBarHeight } from 'react-native-safearea-height';
import Share from 'react-native-share';
import { connect } from 'react-redux';
import APIprovider from '../../Components/APIprovider';
import Constants from '../../Components/Constants';
import Codes from '../../Components/Constants/Codes';
import ProgressModal from '../../Components/ProgressModal';
import Strings from '../../Components/Strings';
import Utils from '../../Components/utils';
import VideoListItemView from '../../Components/VideoListItemView';
import { CheckBox, LoadingView } from '../../Components/Views';
import { UPLOADING_VIDEO } from '../../Contexts/actionTypes';
import { Context } from '../../Contexts/index';
import { setTotalReward } from '../../slices/user';
import CoverImages from './CoverImages';
import HashTags from './HashTag';
import LinkProduct from './LinkProduct';
import ProductRating from './ProductRating';
import ShareOtherApp from './ShareOtherApp';
import styles from './styles';
import UploadVideo from './UploadVideo';
import { moderateScale } from '../../Components/utils/scailing';
import HelpBubble from '../../Components/CustomComponents/HelpBubble';
import * as Sentry from '@sentry/react-native';
import MustRead from './MustRead';

let toastRef;

const { UIManager } = NativeModules;
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

function VideoTitle({ context }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.REVIEW_TITLE}</Text>
        <Text style={styles.dataLength}>
          {context.state.title.length}/{Constants.MAX_LENGTH_REVIEW_TITLE}
        </Text>
        <FastImage
          source={require('../../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <TextInput
        style={styles.textInput}
        borderRadius={10}
        placeholder={Strings.INPUT_REVIEW_TITLE}
        placeholderTextColor={Constants.TIER_COLORS.STRIVER}
        onChangeText={(title) => context.setState({ title })}
        value={context.state.title}
        maxLength={Constants.MAX_LENGTH_REVIEW_TITLE}
      />
    </View>
  );
}

function VideoDescription({ context }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.REVIEW_DESCRIPTION}</Text>
        <Text style={styles.dataLength}>
          {context.state.description.length}/{Constants.MAX_LENGTH_REVIEW_DESCRIPTION}
        </Text>
        <FastImage
          source={require('../../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <TextInput
        style={{
          ...styles.textInput,
          textAlignVertical: 'top',
          paddingHorizontal: 10,
          paddingVertical: 5,
        }}
        borderRadius={14}
        multiline={true}
        scrollEnabled={false}
        placeholder={Strings.INPUT_REVIEW_DESCRIPTION}
        placeholderTextColor={Constants.TIER_COLORS.STRIVER}
        onChangeText={(description) => context.setState({ description })}
        value={context.state.description}
        maxLength={Constants.MAX_LENGTH_REVIEW_DESCRIPTION}
      />
    </View>
  );
}

function RelayReview({ context }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.RELAY_REVIEW}</Text>
      </View>
      <View style={{ flex: 1, flexDirection: 'row', padding: 20 }}>
        <VideoListItemView
          navigation={context.props.navigation}
          data={context.state.relayingVideo}
          style={{
            flex: 1,
            // width: Constants.VIDEO_HORIZONTAL_LIST_ITEM_VIEW_WIDTH,
            width: Dimensions.get('window').width - 30,
          }}
          noProduct
          onPress={(item) => {
            return false;
          }}
          type={'list_vertical'}
        />
      </View>
    </View>
  );
}

function SponsoredReview({ context }) {
  return (
    <View style={{ ...styles.sectionContainer, flexDirection: 'row', marginHorizontal: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
        <CheckBox
          key={'checkoption_korea'}
          onChanged={(value) => {
            context.setState({ isSponsored: true });
          }}
          value={context.state.isSponsored}
          style={{ marginRight: 8 }}
        />
        <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>{Strings.SPONSORED_REVIEW}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <CheckBox
          key={'checkoption_us'}
          onChanged={(value) => {
            context.setState({ isSponsored: false });
          }}
          value={!context.state.isSponsored}
          style={{ marginRight: 8 }}
        />
        <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>{Strings.GENERAL_REVIEW}</Text>
      </View>
    </View>
  );
}

function SubmitButton({ context }) {
  return (
    <View style={styles.sectionContainer}>
      <Button
        containerStyle={{
          marginHorizontal: 20,
          borderRadius: 14,
        }}
        buttonStyle={{
          backgroundColor: Constants.COLOR_POINT_BLUE,
          height: 45,
        }}
        titleStyle={{
          color: Constants.COLOR_BACKGROUND_DARK,
          fontSize: 18,
          fontWeight: 'bold',
        }}
        title={Strings.UPLOAD_REVIEW}
        onPress={context.onPressSubmitButton.bind(context)}
      />
    </View>
  );
}

function CloseButton() {
  return (
    <Pressable
      style={{ marginLeft: 20, marginTop: Platform.OS === 'ios' ? 0 : 10 }}
      disabled={this.props.route.params.isSubmitting}
      onPress={() => {
        if (this.state.isShowingReviewGuide === true) {
          this.setState({ isShowingReviewGuide: false });
        } else if (!this._handleBackButton()) {
          this.props.navigation.pop();
        }
      }}
    >
      <FastImage
        source={require('../../Resources/img/iconRenewal/icHeaderClose22.png')}
        style={{ width: 30, height: 30 }}
      />
    </Pressable>
  );
}

function HelpButton() {
  return (
    <Pressable
      style={{ marginLeft: 20, marginTop: Platform.OS === 'ios' ? 0 : 10 }}
      onPress={() => {
        LayoutAnimation.easeInEaseOut();
        this.setState({ isShowingReviewGuide: true });
        toastRef.show(Strings.OVERLAY_EXIT_GUIDE);
      }}
    >
      <Text style={styles.headerTextRightButton}>{Strings.HELP}</Text>
    </Pressable>
  );
}

class AddingNewVideoScreen extends Component {
  videoPlayer;
  static contextType = Context;

  constructor(props) {
    super(props);

    const {
      video = null,
      thumbnailUri = null,
      attachmentList = [],
      videoId,
      title = '',
      description = '',
      linkedProduct = null,
      relayingVideo,
      isEdit,
      hashTags,
      p6Score,
    } = this.props.route.params;

    this.state = {
      watermarkProgress: 0,
      isShowingWartermarkingProgressModal: false,
      readyToShareWatermarkedImage: false,
      uploadToGcsProgress: 0,
      isShowingUploadToGcsProgressModal: false,
      currentTime: 0,
      duration: 0,
      isFullScreen: false,
      isLoading: true,
      isBlurred: false,
      paused: false,
      // contents data
      title: title,
      description: description,
      videoUri: video,
      thumbnailUri: thumbnailUri,
      linkedProduct: linkedProduct,
      isEdit: isEdit,
      attachmentList: attachmentList,
      isSubmitting: false,
      ratingScore: linkedProduct && isEdit ? linkedProduct.uploaderRating : null,
      relayingVideo: relayingVideo,
      videoStartTime: 0,
      videoEndTime: 0,
      p6Score:
        p6Score && isEdit
          ? p6Score
          : {
              brand: 0,
              merchantability: 0,
              practicality: 0,
              convenience: 0,
              design: 0,
              reasonable: 0,
            },
      // share
      shareTo: null,
      isAvailableInstagramToShare: false,
      isInvalidVideo: false,
      isFirstWriting: false,
      isShowingReviewGuide: false,

      videoUrl: '',
      videoPath: '',

      hashTag: '',
      hashTagArr: hashTags || [],
      helpBubbleIndex: null,

      //
      uploadedVideoId: null,
      isSponsored: false,

      isVideoLoading: false,

      // must read
      isRead: false,
    };

    Preference.get('userName').then((value) => {
      this.userName = value;
    });

    AppInstalledChecker.isAppInstalled('instagram').then((isInstalled) => {
      this.setState({ isAvailableInstagramToShare: isInstalled });
    });

    this.removedAttachmentList = [];
    this.attachmentListVar = [];
    this.videoInfoSavingTimerId = undefined;
    this.isWriting = false;
    this.watermarkedVideoUri = undefined;
  }

  componentDidMount() {
    this.props.navigation.setOptions({
      headerLeft: CloseButton.bind(this),
      headerRight: HelpButton.bind(this),
      title: this.props.route.params.isRelay ? this.props.route.params.title : '',
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
    });

    if (this.state.videoUri) {
      RNFS.stat(this.state.videoUri).then((videoStat) => {
        console.log(videoStat);
      });
    }

    // 업로드 화면 자체 방어선: 게스트는 진입 즉시 로그인 유도 후 이탈
    // (호출부 가드 누락 시에도 게스트 공용 계정으로 업로드되는 일이 없도록)
    // __DEV__: 에뮬레이터 검증용으로 개발 빌드에서만 통과 (프로덕션 무영향)
    if (!__DEV__) {
      Preference.get('userId').then((userId) => {
        if (Utils.isGuestUser(userId)) {
          Utils.LogoutAlert(this.props);
          if (this.props.navigation.canGoBack()) {
            this.props.navigation.goBack();
          }
        }
      });
    }

    // subscription을 저장해 언마운트 시 해제 (미해제 시 언마운트 후 setState 발생)
    this._appStateSubscription = AppState.addEventListener('change', this._handleAppStateChange);
    BackHandler.addEventListener('hardwareBackPress', this._handleBackButton);
    this.isBackHandlerEnable = true;

    // this.setState({ paused: false });
    // //p6
    // if (this.state.linkedProduct) {
    //   this.fetchP6Ratings(this.state.linkedProduct.id);
    // }

    this.categoryList = [];
    Constants.CATEGORY_LIST.forEach((category) => {
      this.categoryList.push({
        key: category.key,
        name: category.title,
        onClicked: () => {
          this.setState({
            linkedProduct: {
              ...this.state.linkedProduct,
              categoryCode: category.key,
            },
          });
        },
      });
    });

    this.hideActivityIndicator();
    if (!this.state.isEdit) {
      this.videoInfoSavingTimerId = setInterval(async () => {
        if (this.isWriting === true) {
          this.saveWrittenVideoInfo();
        }
      }, 3000);

      this.checkPreviousReview();
    }

    Preference.get('isFirstReviewPosting').then((value) => {
      if (value !== 'false') {
        //this.props.navigation.navigate('TutorialReview');
      }
    });

    Preference.get(`helpBubble[${Constants.HELP_BUBBLE_PAGE_KEY.ADDING_NEW_VIDEO}]`).then((res) => {
      if (res) {
        this.setState({ helpBubbleIndex: +res });
      }
    });
  }

  componentDidUpdate() {
    if (!this.isBackHandlerEnable) {
      BackHandler.addEventListener('hardwareBackPress', this._handleBackButton);
      this.isBackHandlerEnable = true;
    }
  }

  componentWillUnmount() {
    if (this.props.route.params.hasOwnProperty('hideActivityIndicatorOnCameraScreen')) {
      const { hideActivityIndicatorOnCameraScreen } = this.props.route.params;
      hideActivityIndicatorOnCameraScreen();
    }
    this._appStateSubscription?.remove();
    BackHandler.removeEventListener('hardwareBackPress', this._handleBackButton);
    clearInterval(this.videoInfoSavingTimerId);
    this._isUnmounted = true;
  }

  getVideoInfoByState = () => {
    if (this.state.isEdit) {
      // Caution! The attachments to be are front
      // Caution! The attachments to be removed are back
      this.attachmentListVar = [...this.state.attachmentList, ...this.removedAttachmentList];
    } else {
      this.attachmentListVar = this.state.attachmentList;
    }

    let videoInfo = {
      title: this.state.title,
      description: this.state.description,
      videoUri: this.state.videoUri,
      thumbnailUri: this.state.thumbnailUri,
      attachmentList: this.attachmentListVar,
      linkedProduct: {
        ...this.state.linkedProduct,
        uploaderRating: this.state.ratingScore,
      },
      trimInfo:
        this.state.videoEndTime !== 0
          ? {
              trimBeginTimeSec: this.state.videoStartTime,
              trimEndTimeSec: this.state.videoEndTime,
            }
          : undefined,
      videoUrl: this.state.videoUrl,
      videoPath: this.state.videoPath,
      hashTagArr: this.state.hashTagArr,
      isSponsored: this.state.isSponsored,
      p6Score: this.state.p6Score,
    };
    if (this.state.relayingVideo) {
      videoInfo.relayingVideoId = this.state.relayingVideo.videoId;
    }
    videoInfo.videoUri = this.state.videoUri;
    return videoInfo;
  };

  checkPreviousReview = () => {
    Preference.get('PreviousWrittenReview').then((value) => {
      if (!value) {
        this.isWriting = true;
        return;
      }
      this.setState({
        isPreviousReview: 'true',
      });
      Alert.alert(Strings.WRITTEN_REVIEW_EXIST, Strings.SURE_TO_RESTORE_REVIEW, [
        {
          text: Strings.RESTORE,
          onPress: () => {
            this.setStateWithPreviousReview();
            this.isWriting = true;
          },
        },
        {
          text: Strings.WRITE_NEW_REVIEW,
          onPress: () => {
            this.clearWrittenPreviousReview();
            this.isWriting = true;
          },
        },
      ]);
    });
  };

  setStateWithPreviousReview = () => {
    Preference.get('PreviousWrittenReview').then((value) => {
      if (!value) {
        return;
      }
      const previousVideoInfo = JSON.parse(value);
      this.setState({
        ...this.state,
        ...previousVideoInfo,
        ratingScore: previousVideoInfo?.linkedProduct?.uploaderRating,
        linkedProduct: previousVideoInfo?.linkedProduct?.title
          ? previousVideoInfo?.linkedProduct
          : undefined,
      });
      LayoutAnimation.linear();
    });
  };

  saveWrittenVideoInfo = () => {
    const videoInfo = this.getVideoInfoByState();
    videoInfo.videoUri = undefined;
    videoInfo.thumbnailUri = undefined;
    videoInfo.attachmentList = undefined;
    if (
      videoInfo.title.replace(/ /g, '') !== '' ||
      videoInfo.description.replace(/ /g, '') !== ''
    ) {
      Preference.set('PreviousWrittenReview', JSON.stringify(videoInfo));
    } else {
      Preference.clear('PreviousWrittenReview');
    }
  };

  clearWrittenPreviousReview = () => {
    Preference.clear('PreviousWrittenReview');
  };

  saveUploadingVideosInfo = (videoId) => {
    Preference.get('UploadingReviews').then((value) => {
      const uploadingReviews = value ? JSON.parse(value) : {};
      const videoInfo = this.getVideoInfoByState();
      if (
        videoInfo.title.replace(/ /g, '') !== '' ||
        videoInfo.description.replace(/ /g, '') !== ''
      ) {
        uploadingReviews[videoId] = videoInfo;
        Preference.set('UploadingReviews', JSON.stringify(uploadingReviews));
      }
    });
  };

  removeUploadingVideoInfo = (videoId) => {
    Preference.get('UploadingReviews').then((value) => {
      const uploadingReviews = value ? JSON.parse(value) : {};
      delete uploadingReviews[videoId];
      Preference.set('UploadingReviews', JSON.stringify(uploadingReviews));
    });
  };

  _handleAppStateChange = (nextAppState) => {
    if (this._isUnmounted) {
      return;
    }
    if (nextAppState === 'active') {
      this.setState({ isBlurred: false });
    } else {
      this.setState({ isBlurred: true });
    }
  };

  _handleBackButton = () => {
    if (this.state.isShowingReviewGuide) {
      this.setState({ isShowingReviewGuide: false });
      return true;
    }
    if (
      this.state.videoUri !== null ||
      this.state.title !== '' ||
      this.state.description !== '' ||
      this.state.attachmentList.length > 0 ||
      this.state.linkedProduct
    ) {
      Alert.alert(
        this.state.isEdit ? Strings.CHANGES_NOT_SAVED_TITLE : Strings.SURE_TO_EXIT_WRITTING_REVIEW,
        this.state.isEdit ? Strings.CHANGES_NOT_SAVED_MESSAGE : Strings.CAN_RESTORE_REVIEW,
        [
          { text: Strings.CANCEL, onPress: () => {}, style: 'cancel' },
          {
            text: this.state.isEdit ? Strings.DELETE : Strings.EXIT,
            onPress: () => {
              if (!this.state.isEdit) {
                this.saveWrittenVideoInfo();
              }
              this.props.navigation.pop();
            },
          },
        ],
        { cancelable: true },
      );
      return true;
    }
    return false;
  };
  // fetchP6Ratings = async (productId) => {
  //   try {
  //     const response = await APIprovider.getP6Ratings(productId);
  //     this.setState({
  //       brandRatingScore: response.brand,
  //       merchantabilityRatingScore: response.merchantability,
  //       practicalityRatingScore: response.practicality,
  //       convenienceRatingScore: response.convenience,
  //       designRatingScore: response.design,
  //       reasonabilityRatingScore: response.reasonable,
  //     });
  //   } catch (error) {
  //     console.error('Error fetching P6 ratings:', error);
  //   }
  // };
  onPressSubmitButton() {
    Keyboard.dismiss();
    if (this.state.isSubmitting) {
      return;
    }

    const validation = (condition, message) => {
      if (!condition) {
        Alert.alert(Strings.UPLOAD_REVIEW, message, [{ text: Strings.OK }], {
          cancelable: true,
        });
        return false;
      }
      return true;
    };

    if (
      !validation(this.state.videoUri, Strings.SELECT_REVIEW_VIDEO) ||
      !validation(this.state.title !== '', Strings.INPUT_REVIEW_TITLE) ||
      !validation(this.state.description !== '', Strings.INPUT_REVIEW_DESCRIPTION) ||
      !validation(
        this.state.attachmentList.length <= Constants.MAX_NUMBER_REVIEW_IMAGE,
        `${Strings.MAXIMUM_NUMBER_IMAGES_TO_ADD} : ${Constants.MAX_NUMBER_REVIEW_IMAGE}`,
      ) ||
      !validation(
        this.props.route.params.linkedProduct || this.state.linkedProduct,
        Strings.LINK_PRODUCT_TO_REVIEW,
      ) ||
      !validation(this.state.p6Score.brand, Strings.GRADE_PRODUCT_TO_REVIEW) ||
      !validation(this.state.p6Score.merchantability, Strings.GRADE_PRODUCT_TO_REVIEW) ||
      !validation(this.state.p6Score.practicality, Strings.GRADE_PRODUCT_TO_REVIEW) ||
      !validation(this.state.p6Score.convenience, Strings.GRADE_PRODUCT_TO_REVIEW) ||
      !validation(this.state.p6Score.design, Strings.GRADE_PRODUCT_TO_REVIEW) ||
      !validation(this.state.p6Score.reasonable, Strings.GRADE_PRODUCT_TO_REVIEW) ||
      !validation(this.state.thumbnailUri, Strings.SELECT_REVIEW_COVER_IMAGE) ||
      !validation(this.state.isInvalidVideo === false, Strings.CANT_LOAD_VIDEO_TRY_AGAIN) ||
      !validation(this.state.isLoading === false, Strings.LOADING_VIDEO_WAIT) ||
      !validation(this.state.isRead, Strings.SHOULD_AGREE_TO_REVIEW_POLICY)
    ) {
      return false;
    }

    let newVideo = this.getVideoInfoByState();

    if (!this.state.isEdit) {
      this.clearWrittenPreviousReview();
    }
    if (this.state.isEdit) {
      newVideo.videoId = this.props.route.params.videoId;
      newVideo.oldThumbnailPath = this.state.oldThumbnailPath || newVideo.thumbnailUri;

      APIprovider.editVideo(newVideo)
        .then((result) => {
          this.hideActivityIndicator();
          this.props.route.params.onFinishedToEdit(result);
          this.props.navigation.pop();
          if (this.props.route.params.onVideoSubmitted) {
            this.props.route.params.onVideoSubmitted(result);
          }
        })
        .catch((err) => {
          this.hideActivityIndicator();
          Alert.alert(
            Strings.FAILED_TO_EDIT_REVIEW,
            err.errorMsg ? err.errorMsg : '',
            [{ text: Strings.OK }],
            { cancelable: true },
          );
        });
    } else {
      const dispatchContext = this.context.dispatch;
      const videoId = new Date().getTime();
      dispatchContext({
        id: videoId,
        type: UPLOADING_VIDEO.ADD,
        payload: newVideo,
      });
      this.saveUploadingVideosInfo(videoId);
      if (!this.state.shareTo) {
        this.props.navigation.reset({
          index: 0,
          routes: [{ name: 'MainBottom' }],
        });
      } else {
        this.setState({ isShowingWartermarkingProgressModal: true });
      }
      Utils.simpleNotification({
        title: Strings.REVIEW_UPLOAD_BEGIN_TITLE(),
        description: Strings.REVIEW_UPLOAD_BEGIN_BODY(),
        thumbnailUrl: this.state.thumbnailUri,
        data: {
          type: 'mypage',
          id: this.props.route.params.logonUserId,
        },
      });
      dispatchContext({
        id: videoId,
        type: UPLOADING_VIDEO.UPLOAD,
      });

      Utils.scheduleBackgroundTask({
        onTask: async () => {
          const onSuccess = (result) => {
            dispatchContext({
              id: videoId,
              type: UPLOADING_VIDEO.UPLOAD_COMPLETE,
            });
            Utils.simpleNotification({
              title: Strings.REVIEW_UPLOAD_COMPLETE_TITLE(),
              description: Strings.REVIEW_UPLOAD_COMPLETE_BODY(this.state),
              thumbnailUrl: this.state.thumbnailUri,
              data: {
                type: 'mypage',
                id: this.props.route.params.logonUserId,
              },
            });

            this.removeUploadingVideoInfo(videoId);
            if (this.props.route.params.onVideoSubmitted) {
              this.props.route.params.onVideoSubmitted(result);
            }
          };
          const onError = (err) => {
            console.log('onTask: onError', err);
            Sentry.captureException(err);
            dispatchContext({
              id: videoId,
              type: UPLOADING_VIDEO.UPLOAD_ERROR,
            });
            Utils.simpleNotification({
              title: Strings.REVIEW_UPLOAD_ERROR_TITLE(),
              description: Strings.REVIEW_UPLOAD_ERROR_BODY(this.state),
              thumbnailUrl: this.state.thumbnailUri,
              data: {
                type: 'mypage',
                id: this.props.route.params.logonUserId,
              },
            });
          };

          const upload = async (id, onSuccess, onError) => {
            //adding uploading video
            const video = this.context.state.uploadingVideos.find((item) => id === item.id);
            const onExecution = (executionId) => {
              video.videoProcessingId = executionId;
            };
            if (
              video.trimInfo !== undefined &&
              video.trimInfo.trimEndTimeSec > video.trimInfo.trimBeginTimeSec
            ) {
              const videoUri = video.videoUri;
              try {
                const trimBegin = video.trimInfo.trimBeginTimeSec;
                const trimEnd = video.trimInfo.trimEndTimeSec;
                const result = await Utils.trimVideo(videoUri, trimBegin, trimEnd, onExecution);
                video.uploadingVideoUri = result;
              } catch (err) {
                if (video.state !== Codes.UPLOADING_VIDEO_STATE.STOPPED) {
                  onError(err);
                }
                return;
              }
            } else {
              video.uploadingVideoUri = video.videoUri;
            }
            video.videoUri = video.uploadingVideoUri;
            if (this.state.hashTagArr.length > 0) {
              video.hashTags = this.state.hashTagArr;
            }
            video.isSponsored = this.state.isSponsored;

            video.p6Score = {
              brand: this.state.p6Score.brand,
              merchantability: this.state.p6Score.merchantability,
              practicality: this.state.p6Score.practicality,
              convenience: this.state.p6Score.convenience,
              design: this.state.p6Score.design,
              reasonable: this.state.p6Score.reasonable,
            };

            try {
              const result = await APIprovider.createVideo(video);

              if (result) {
                // 캠페인 미션에서 진입한 업로드면 상태머신을 reviewing으로 전이 + 리마인더 취소
                const missionCampaignId = this.props.route?.params?.campaignId;
                if (missionCampaignId) {
                  const { setSeedingStatus, SEEDING_STATUS } = require('../../api/seedings');
                  const {
                    cancelUploadReminders,
                  } = require('../ActivityScreen/reminders');
                  setSeedingStatus(missionCampaignId, SEEDING_STATUS.REVIEWING).catch(() => {});
                  cancelUploadReminders(missionCampaignId);
                }
                this.props.setReward(result.totalReward);
                APIprovider.createNotification({
                  title: Strings.REVIEW_UPLOAD_COMPLETE_TITLE(),
                  message: Strings.REVIEW_UPLOAD_COMPLETE_BODY(this.state),
                  imageUrl: this.state.thumbnailUri,
                  navigationParams: {
                    page: 'VideoPage',
                    params: result._id,
                  },
                  userId: this.props.route.params.logonUserId,
                });

                onSuccess(result);
              }
            } catch (err) {
              if (video.state !== Codes.UPLOADING_VIDEO_STATE.STOPPED) {
                onError(err);
              }
            }
            return;
          };
          await upload(videoId, onSuccess, onError);
        },
      });
    }

    const handleProgress = (progress) => {
      this.setState({ watermarkProgress: progress });
      if (progress === 1) {
        this.setState({ readyToShareWatermarkedImage: true });
      }
    };

    if (this.state.shareTo) {
      Utils.putWatermarkOnVideo(
        this.state.videoUri,
        this.userName,
        Share.Social.INSTAGRAM,
        handleProgress,
      ).then((watermarkedVideoUri) => {
        this.watermarkedVideoUri = watermarkedVideoUri;
      });
    }
  }
  handleShareImage() {
    if (this.state.shareTo === Share.Social.INSTAGRAM) {
      Utils.shareVideo(this.watermarkedVideoUri, null, Share.Social.INSTAGRAM)
        .then((res) => {
          console.log('handleShareImage result', res);
        })
        .catch((err) => {
          console.error('handleShareImage error', err);
        });
    }
  }
  onLinkedProductSelected(product) {
    this.setState({ linkedProduct: product });
  }

  onRelayingVideoSelected(video) {
    this.setState({ relayingVideo: video });
  }

  onSeek = (seek) => {
    //Handler for change in seekbar
    this.videoPlayer.seek(seek);
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
    this.videoPlayer.seek(0);
  };
  onProgress = (data) => {
    // Video Player will continue progress even if the video already ended
    this.setState({ currentTime: data.currentTime });
  };
  onLoad = (data) => {
    this.setState({
      duration: data.duration,
      isLoading: false,
      isInvalidVideo: false,
    });
  };
  onLoadStart = async (data) => {
    this.setState({ isLoading: true });
  };
  onError = (err) => {
    console.log('err', err);
    Sentry.captureException(err);

    this.setState({
      isInvalidVideo: true,
    });
  };
  onFullScreen = () => {
    this.setState({ isFullScreen: !this.state.isFullScreen });
    LayoutAnimation.easeInEaseOut();
    this.setState({
      screenHeight: this.state.isFullScreen
        ? (Dimensions.get('window').width / 16) * 9 //- getStatusBarHeight(true) - (isIphoneX() ? getBottomSpace() : 0)
        : Dimensions.get('window').height -
          getStatusBarHeight(true) -
          (isIphoneX() ? getBottomSpace() : 0),
    });
  };

  onSeeking = (currentTime) => this.setState({ currentTime });

  removeAttachment(removeItem) {
    if (this.state.isEdit && this.props.route.params.attachmentList) {
      this.props.route.params.attachmentList.forEach((att) => {
        if (att.url === removeItem.url) {
          att.change = Constants.ATTACHMENT_CHANGE_REMOVED;
          this.removedAttachmentList.push(att);
        }
      });
    }

    let pos = 0;
    for (const att of this.state.attachmentList) {
      if (att === removeItem) {
        this.setState({
          attachmentList: [
            ...this.state.attachmentList.slice(0, pos),
            ...this.state.attachmentList.slice(pos + 1, this.state.attachmentList.length),
          ],
        });
        break;
      }
      pos++;
    }
  }

  getPlayerStyle = function () {
    if (this.state.isFullScreen) {
      const headerHeight = 44;
      return {
        flex: 1,
        width: Dimensions.get('window').width,
        height:
          Dimensions.get('window').height -
          headerHeight -
          getStatusBarHeight(true) -
          (isIphoneX() ? getBottomSpace() : 0),
        alignSelf: 'center',
        justifyContent: 'center',
        backgroundColor: Constants.COLOR_BACKGROUND_DARK,
      };
    } else {
      return {
        width: (Dimensions.get('window').width / 16) * 9,
        height: (Dimensions.get('window').width / 16) * 9,
        backgroundColor: 'rgb(31, 31, 31)',
        borderRadius: 14,
      };
    }
  };

  showActivityIndicator() {
    this.props.navigation.setParams({
      isSubmitting: true,
    });
    this.setState({ isSubmitting: true });
  }

  hideActivityIndicator() {
    this.props.navigation.setParams({
      isSubmitting: false,
    });
    this.setState({
      isSubmitting: false,
    });
    this.forceUpdate();
  }

  renderActivityIndicator() {
    if (this.state.isSubmitting) {
      return <LoadingView />;
    }
  }

  renderRelayVideoSection() {
    if (this.props.route.params.relayingVideo) {
      return (
        <View>
          <View style={styles.divider} />
          <RelayReview context={this} />
        </View>
      );
    }
  }

  render() {
    const deviceLanguage =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager.settings.AppleLocale ||
          NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
        : NativeModules.I18nManager.localeIdentifier;
    const locale = deviceLanguage.substring(0, 2);
    return (
      <>
        {this.state.isVideoLoading ? (
          <LoadingView message={Strings.WAIT_VIDEO_LOADING} opacity={0.5} />
        ) : null}
        <SafeAreaView style={styles.container}>
          <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
            }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : null}
              enableResetScrollToCoords={false}
              style={styles.container}
            >
              <View style={{ marginTop: Platform.OS === 'ios' ? 0 : 20 }} />
              <UploadVideo context={this} />
              <CoverImages context={this} />
              <MustRead context={this} />
              <VideoTitle context={this} />
              <VideoDescription context={this} />
              <HashTags context={this} />
              <ProductRating context={this} />
              {/* P6 here  */}
              <LinkProduct context={this} />
              <View style={styles.divider} />
              {this.renderRelayVideoSection()}
              <ShareOtherApp context={this} />
              <SponsoredReview context={this} />
              <SubmitButton context={this} />
              <View style={{ marginBottom: 20 }} />
              {this.state.isShowingReviewGuide && (
                <Pressable
                  style={{
                    width: Dimensions.get('window').width,
                    height: '100%',
                    flex: 1,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                  }}
                  onPress={() => {
                    LayoutAnimation.easeInEaseOut();
                    this.setState({
                      isShowingReviewGuide: false,
                    });
                  }}
                >
                  <FastImage
                    style={{
                      height: (331 / 1080) * Dimensions.get('window').width,
                      width: Dimensions.get('window').width,
                    }}
                    source={
                      locale === 'ko'
                        ? require('../../Resources/img/tutorialReviewKor-1.png')
                        : require('../../Resources/img/tutorialReviewEng-1.png')
                    }
                    resizeMode={FastImage.resizeMode.contain}
                  />
                  <FastImage
                    style={{
                      height: (630 / 1080) * Dimensions.get('window').width,
                      width: Dimensions.get('window').width,
                      marginTop:
                        Platform.OS === 'ios'
                          ? Dimensions.get('window').width / 3 - 10
                          : Dimensions.get('window').width / 3,
                    }}
                    source={
                      locale === 'ko'
                        ? require('../../Resources/img/tutorialReviewKor-2.png')
                        : require('../../Resources/img/tutorialReviewEng-2.png')
                    }
                    resizeMode={FastImage.resizeMode.contain}
                  />
                  <FastImage
                    style={{
                      position: 'absolute',
                      bottom: this.state.isAvailableInstagramToShare
                        ? Dimensions.get('window').width / 2 + 20
                        : Dimensions.get('window').width / 3,
                      height: (315 / 1080) * Dimensions.get('window').width,
                      width: Dimensions.get('window').width,
                    }}
                    source={
                      locale === 'ko'
                        ? require('../../Resources/img/tutorialReviewKor-3.png')
                        : require('../../Resources/img/tutorialReviewEng-3.png')
                    }
                    resizeMode={FastImage.resizeMode.contain}
                  />
                </Pressable>
              )}
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
          {this.renderActivityIndicator()}
          <Toast
            ref={(ref) => {
              toastRef = ref;
            }}
            fadeInDuration={100}
            fadeOutDuration={1900}
            position={'bottom'}
            style={{
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: 20,
              paddingHorizontal: 20,
              bottom: getStatusBarHeight(),
            }}
            opacity={0.9}
          />
          <ProgressModal
            progress={this.state.watermarkProgress}
            visible={this.state.isShowingWartermarkingProgressModal}
            guidelines={[
              Strings.INSTAGRAM_SHARE_MODAL_GUIDE_1,
              Strings.INSTAGRAM_SHARE_MODAL_GUIDE_2,
            ]}
            cancelAlertEnable={!this.state.readyToShareWatermarkedImage}
            buttons={[
              {
                title: Strings.SHARE,
                onPress: () => {
                  this.handleShareImage();
                },
                disabled: !this.state.readyToShareWatermarkedImage,
              },
            ]}
            onCancel={() => {
              this.setState({ isShowingWartermarkingProgressModal: false });
              this.props.navigation.reset({
                index: 0,
                routes: [{ name: 'MainBottom' }],
              });
            }}
          />
          <ProgressModal
            progress={this.state.uploadToGcsProgress}
            visible={this.state.isShowingUploadToGcsProgressModal}
            guidelines={[Strings.UPLOAD_TO_GCS_MODAL_GUIDE_1, Strings.UPLOAD_TO_GCS_MODAL_GUIDE_2]}
            cancelAlertEnable={true}
            buttons={[
              {
                title: Strings.CLOSE,
                onPress: () => {
                  this.setState({ isShowingUploadToGcsProgressModal: false });
                },
                // (0 || 1)은 항상 1 — 진행률 0(시작 전)에도 닫기가 눌리던 버그 수정
                disabled:
                  this.state.uploadToGcsProgress === 0 || this.state.uploadToGcsProgress === 1,
              },
            ]}
            onCancel={() => {
              this.setState({ isShowingUploadToGcsProgressModal: false });
            }}
          />
          <HelpBubble
            type={Constants.HELP_BUBBLE_PAGE_KEY.ADDING_NEW_VIDEO}
            helpBubbleIndex={this.state.helpBubbleIndex}
            onPress={() => {
              const { helpBubbleIndex } = this.state;

              if (helpBubbleIndex <= 2) {
                Preference.set(
                  `helpBubble[${Constants.HELP_BUBBLE_PAGE_KEY.ADDING_NEW_VIDEO}]`,
                  (helpBubbleIndex + 1).toString(),
                );
                this.setState({ helpBubbleIndex: helpBubbleIndex + 1 });
              }
            }}
          />
        </SafeAreaView>
      </>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  setReward: (totalReward) => dispatch(setTotalReward({ totalReward })),
});

export default connect(null, mapDispatchToProps)(AddingNewVideoScreen);
