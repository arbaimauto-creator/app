import { useRoute } from '@react-navigation/native';
import PropTypes from 'prop-types';
import React, { PureComponent, useContext, useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  BackHandler,
  Dimensions,
  Easing,
  Linking,
  NativeModules,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import { Context } from '../Contexts';
import APIprovider from './APIprovider';
import Constants from './Constants';
import { shareLink } from './utils/share';
import ReviewDescriptionSummary from './CustomComponents/ReviewDescriptionSummary';
import SliderRightButtons from './CustomComponents/SliderRightButtons';
import Strings from './Strings';
import { LoadingView, ReviewGradeBadgeView } from './Views';
import Utils, { LogoutAlert, getKRWPerUSD, isGuestUser } from './utils';

const { UIManager } = NativeModules;
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

function ReviewInfo({ review }) {
  const [title, setTitle] = useState(review.title.trim());
  const [description, setDescription] = useState(review.description.trim());

  useEffect(() => {
    if (review.titleByCountry) {
      setTitle(review.titleByCountry.trim());
    }

    if (review.descriptionByCountry) {
      setDescription(review.descriptionByCountry.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.reviewInfo}>
      <ReviewGradeBadgeView
        type={'main'}
        ratingScore={review.ratingScore}
        ratingCount={review.ratingCount}
        g6RatingCount={review.g6RatingCount}
        g6AvgRatingScore={review.g6AvgRatingScore}
      />
      {review.title !== null && review.title !== undefined && review.title !== '' && (
        <Text style={styles.reviewTitle} numberOfLines={1}>
          {/* {review.title.trim()} */}
          {title}
        </Text>
      )}
      {/* <Text style={styles.reviewSubInfoText}> */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text
          style={{
            color: Constants.TIER_COLORS.PIONEER,
            fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Regular,
          }}
        >
          {review.author.name}
        </Text>
        <FastImage
          style={{ width: 30, height: 30 }}
          source={
            Constants.TIER_ICONS[
              Utils.getTierNameByClass(review.author.class) || Utils.getTierNameByClass(0)
            ]
          }
        />
        <Text style={{ marginHorizontal: 5, color: Constants.TIER_COLORS.PIONEER }}>・</Text>
        <Text style={{ color: Constants.TIER_COLORS.PIONEER, marginLeft: 5 }}>
          {Strings.VIEW_COUNT(review.viewCount)}
        </Text>
        <Text style={{ marginHorizontal: 5, color: Constants.TIER_COLORS.PIONEER }}>・</Text>
        <FastImage
          style={{ marginLeft: 5, marginRight: 3, width: 18, height: 18 }}
          source={require('../Resources/img/iconRenewal/heart-on-outlined.png')}
        />
        <Text style={{ color: Constants.TIER_COLORS.PIONEER }}>{review?.likes || 0}</Text>
        {review?.isSponsored ? (
          <>
            <Text style={{ marginHorizontal: 5, color: Constants.TIER_COLORS.PIONEER }}>・</Text>
            <Text style={{ marginHorizontal: 5, color: Constants.TIER_COLORS.GIVER }}>
              {Strings.SPONSORED}
            </Text>
          </>
        ) : null}
      </View>
      {/* <ReviewDescriptionSummary description={review.description} isMain /> */}
      <ReviewDescriptionSummary description={description} isMain />
      {/* <LinkedProduct
        videoId={videoId}
        product={review.linkedProduct}
        navigation={navigation}
        KRWPerUSD={KRWPerUSD}
      /> */}
    </View>
  );
}

// 현재 미사용 — ReviewInfo의 주석 처리된 상품 카드용으로 보존
function _LinkedProduct({ videoId, product, navigation, KRWPerUSD }) {
  const route = useRoute();

  if (product && product.productId) {
    return (
      <TouchableOpacity
        onPress={() => {
          if (isGuestUser(route.params.logonUserId)) {
            route.path = `products/${product.productId._id}`;
            return LogoutAlert({ route, navigation });
          }

          onLinkedProductClicked(videoId, product, navigation);
        }}
        activeOpacity={0.9}
      >
        <View style={styles.linkedProductContainer}>
          {product.thumbnailUrl && <ProductThumbnail product={product} />}
          <ProductDescription
            product={product}
            KRWPerUSD={KRWPerUSD}
            logonUserId={route.params.logonUserId}
          />
        </View>
      </TouchableOpacity>
    );
  } else {
    return <View />;
  }
}

function ProductThumbnail({ product }) {
  return <FastImage style={styles.linkedProductThumbnail} source={{ uri: product.thumbnailUrl }} />;
}

function ProductDescription({ product, logonUserId }) {
  const global = useContext(Context);
  const { price, discountPrice, discountRate } = product.productId;
  return (
    <View style={styles.linkedProductDescription}>
      <Text style={styles.linkedProductTitle} numberOfLines={1}>
        {product.title}
      </Text>
      {(product.price || price) && (
        <View>
          {isGuestUser(logonUserId) ? (
            <Text style={styles.linkedProductPrice} numberOfLines={1}>
              <Text
                style={{
                  color: Constants.COLOR_RED,
                  fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Regular,
                  shadowOffset: {
                    x: 10,
                    y: 10,
                  },
                  shadowColor: '#0000ff',
                  shadowRadius: 5,
                }}
              >
                {Strings.SIGN_IN_AND_CHECK_LOWEST_PRICE}
              </Text>
            </Text>
          ) : (product.discountPrice || discountPrice) > 0 ? (
            <View style={{ flexDirection: 'row' }}>
              <Text style={styles.linkedProductDiscountRate}>
                {Utils.displayDiscountRate(product.discountRate || discountRate)}%
              </Text>
              <Text style={styles.linkedProductPrice}>
                {Utils.displayPrice(product.discountPrice || discountPrice, global.state.region)}
              </Text>
            </View>
          ) : (
            <Text style={styles.linkedProductPrice}>
              {Utils.displayPrice(product.price || price, global.state.region)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

async function onLinkedProductClicked(videoId, data, navigation) {
  if (data && data.productId) {
    navigation.navigate('ProductPage', {
      videoId,
      productId: data.productId._id, // TODO: 임시구현, productId가 객체인 케이스가 있음
    });
  } else if (data.externalLink) {
    const supported = await Linking.canOpenURL(data.externalLink);
    if (supported) {
      // Opening the link with some app, if the URL scheme is "http" the web link should be opened
      // by some browser in the mobile
      await Linking.openURL(data.externalLink);
    } else {
      Alert.alert(`${Strings.UNSUPPORTED_EXTERNAL_URL}: ${data.externalLink}`);
    }
  }
}

export default class SliderEntry extends PureComponent {
  videoPlayer;
  focused = false;

  static propTypes = {
    data: PropTypes.object.isRequired,
    parallax: PropTypes.bool,
    parallaxProps: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.cumulativeTime = 0;

    this.state = {
      currentTime: 0,
      duration: 0,
      isFullScreen: false,
      isLoading: true,
      isBlurred: false,
      isPaused: false,
      screenType: 'cover',
      isBookmarked: this.props.data.isBookmarked,
      isHLS: false,
      isNavigationFocused: true,
      isNavigatedVideoScreen: false,
      KRWPerUSD: 1300,
      likes: this.props.data.likes,
      fadeAnim: new Animated.Value(0),
      isMuted: true,
    };
    this.isPaused = false;
  }

  fadeIn = () => {
    Animated.timing(this.state.fadeAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  fadeOut = () => {
    Animated.timing(this.state.fadeAnim, {
      toValue: 0,
      duration: 500,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  startAnimation = () => {
    this.fadeIn();

    // After a delay, fade out
    setTimeout(() => {
      this.fadeOut();
    }, 2000); // Adjust the delay between fade in and fade out as needed
  };

  onPaused = () => {
    //Handler for Video Pause
    this.setState({
      isPaused: !this.state.isPaused,
    });
  };

  onProgress = (data) => {
    if (this.isPaused || this.props.paused) {
      return;
    }
    // Video Player will continue progress even if the video already ended
    this.setState({ currentTime: data.currentTime });

    /*if (this.cumulativeTime < data.playableDuration) {
          this.cumulativeTime = data.currentTime
          if (this.cumulativeTime > 25 && this.state.ratableCount === 2) {
              this.setState({ratableCount: 3})
          } else if (this.cumulativeTime > 15 && this.cumulativeTime < 25 && this.state.ratableCount === 1) {
              this.setState({ratableCount: 2})
          } else if (this.cumulativeTime > 5 && this.cumulativeTime < 15 && this.state.ratableCount === 0) {
              this.setState({ratableCount: 1})
          }
      }*/
  };

  onLoad = (data) => {
    this.setState({ duration: data.duration, isLoading: false });
    this.props.onPreviewLoaded(this.props.index);
  };

  onLoadStart = (_data) => {
    //      console.log('onLoadStart()', this.props.index)
    let isHLS = false;
    if (this.props.data.videoUrl) {
      isHLS =
        this.props.data.videoUrl.substring(this.props.data.videoUrl.length - '.hls'.length) ===
        '.hls';
    }
    this.setState({
      isLoading: true,
      isHLS: isHLS,
    });
  };

  onEnd = () => {
    if (this.isPaused || this.props.paused) {
      return;
    }
    this.props.onPreviewEnded(this.props.index, false);
  };

  onError = (error) => {
    console.log('onError()', error);

    // RNRestart.Restart();
    // RNExitApp.exitApp();
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    } else {
      // iOS: 앱 종료 대신 경고 또는 홈 화면으로 이동
      // Alert.alert('앱 종료', 'iOS에서는 홈 버튼을 눌러 앱을 종료해주세요.', [{ text: '확인' }]);
      const { AppUtilsModule } = NativeModules;
      AppUtilsModule.minimizeApp();
    }
  };

  exitFullScreen = () => {
    alert('Exit full screen');
  };

  enterFullScreen = () => {};

  onFullScreen = (isFullScreen) => {
    this.setState({ isFullScreen: isFullScreen });
    if (this.state.screenType === 'contain') {
      this.setState({ screenType: 'cover' });
    } else {
      this.setState({ screenType: 'contain' });
    }
  };

  onFocused = () => {
    APIprovider.getVideoDetails(this.props.data.videoId);
    this.isPaused = false;
  };

  onUnfocused = () => {};

  onBuffer = (_data) => {};

  get videoThumbnail() {
    const {
      data: { videoUrl, thumbnailUrl },
      index,
      focusedIndex,
    } = this.props;

    if (focusedIndex === index) {
      if (this.focused === false) {
        this.onFocused();
      }
      this.focused = true;
      if (this.state.isPaused === true) {
        this.setState({ isPaused: false });
      }
    } else {
      if (this.focused === true) {
        this.onUnfocused();
      }
      // this.focused = false;
    }

    if (!videoUrl) {
      return;
    }
    // const renderingCondition =
    //   index === focusedIndex ||
    //   ((index === focusedIndex + 1 || index === focusedIndex - 1) && !this.props.paused);
    const renderingCondition = index === focusedIndex && !this.props.paused;

    if (this.state.isNavigatedVideoScreen) {
      return <View />;
    }

    // 세로 피드는 끝까지 내려가는 UX라, 한 번 로드된 Video를 계속 붙여두면
    // 마운트된 디코더가 단조 증가한다. 현재 항목 ±1로 제한한다.
    const isNearFocus = Math.abs(index - focusedIndex) <= 1;

    return (
      <View style={styles.video}>
        {(renderingCondition || (!this.state.isLoading && isNearFocus)) && (
          <Video
            source={this.state.isHLS ? { uri: videoUrl, type: 'm3u8' } : { uri: videoUrl }}
            onEnd={this.onEnd}
            onLoad={this.onLoad}
            onLoadStart={this.onLoadStart}
            onProgress={this.onProgress}
            onPause={this.onPaused}
            onError={this.onError}
            onBuffer={this.onBuffer}
            paused={
              this.state.isLoading ||
              this.props.paused ||
              this.isPaused ||
              this.state.isPaused ||
              !this.focused ||
              focusedIndex !== index ||
              this.state.isBlurred ||
              !this.state.isNavigationFocused ||
              !this.props.navigation.isFocused()
            }
            ref={(videoPlayer) => {
              this.videoPlayer = videoPlayer;
            }}
            resizeMode={'cover'}
            onFullScreen={false}
            style={styles.video}
            repeat={false} // true
            muted={this.state.isMuted}
            volume={1}
            poster={thumbnailUrl}
            posterResizeMode={'cover'}
            automaticallyWaitsToMinimizeStalling={false}
            // bufferConfig={{
            //   minBufferMs: 1000,
            //   maxBufferMs: 4000,
            //   bufferForPlaybackMs: 100,
            //   bufferForPlaybackAfterRebufferMs: 200,
            // }}
            bufferConfig={{
              minBufferMs: 2500,
              maxBufferMs: 3000, // 기본값은 50세군도, 3초
              bufferForPlaybackMs: 2500,
              bufferForPlaybackAfterRebufferMs: 2500,
            }}
            ignoreSilentSwitch={'obey'}
          />
        )}

        {index !== focusedIndex && (
          <FastImage
            source={{ uri: thumbnailUrl }}
            resizeMode={'cover'}
            style={styles.coverImage}
          />
        )}
        {false && this.state.isLoading && <LoadingView />}
      </View>
    );
  }

  async componentDidMount() {
    this._isMounted = true;
    // RN 0.65+: removeEventListener가 없으므로 subscription을 저장해 언마운트 시 해제
    this._appStateSubscription = AppState.addEventListener('change', this._handleAppStateChange);
    // if (AppState.currentState.match(/inactive|background/)) {
    //   this.setState({ isBlurred: true });
    // }

    this._unsubscribeFocusEvent = this.props.navigation.addListener('focus', () => {
      if (this.focused) {
        // for a bug on android that not playing video after change back navigation focus

        this.setState({
          isNavigationFocused: true,
        });
        if (Platform.OS !== 'ios') {
          setTimeout(() => {
            this.setState({
              isNavigationFocused: false,
            });
            setTimeout(() => {
              this.setState({
                isNavigationFocused: true,
              });
            }, 1);
          }, 1);
        }
      }
    });
    this._unsubscribeUnfocusEvent = this.props.navigation.addListener('blur', () => {
      if (this.focused) {
        this.setState({
          isNavigationFocused: false,
        });
      }
    });

    this.intervalId = setInterval(() => {
      this.startAnimation();
    }, 3000); // Adjust the interval between animations as needed

    // 환율 조회는 네트워크 대기라 리스너 등록보다 뒤에 두고, 언마운트 후 setState를 막는다.
    const KRWPerUSD = await getKRWPerUSD();
    if (this._isMounted) {
      this.setState({ KRWPerUSD: KRWPerUSD });
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    this._appStateSubscription?.remove();
    // 리스너 등록 전에 언마운트되면 undefined일 수 있다
    this._unsubscribeFocusEvent?.();
    this._unsubscribeUnfocusEvent?.();

    clearInterval(this.intervalId);
  }

  _handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active') {
      this.setState({ isBlurred: false });
    } else {
      this.setState({ isBlurred: true });
    }

    if (AppState.currentState.match(/inactive|background/)) {
      this.setState({ isBlurred: true });
    }
  };

  bookmarkVideoCallback(_result) {
    // reflect UI by result
  }

  shareToExport = function (videoId, description) {
    const url = Constants.CONTENTS_PAGE_ENDPOINT + 'videos/' + videoId;
    const message = Strings.SHARE_REVIEW_MESSAGE;

    shareLink({ url, message, description });
  };

  render() {
    const {
      data: { videoId, videoUrl, thumbnailUrl },
      navigation,
    } = this.props;
    // 세로 피드에서는 부모가 실측한 뷰포트 높이를 내려준다. 없으면 기존 상수를 쓴다.
    const itemHeight = this.props.height || slideHeight;

    return (
      <TouchableOpacity
        activeOpacity={1}
        style={[styles.slideInnerContainer, itemHeight ? { height: itemHeight } : null]}
        onPress={() => {
          this.setState({ isNavigatedVideoScreen: true });

          navigation.navigate('VideoPage', {
            videoId,
            videoSortType: this.props.dataSortType,
            videoType: this.props.dataType,
            videoList: this.props.dataList,
            onVideoListChanged: this.props.onVideoListChanged,
            onVideoIndexChanged: this.props.onVideoIndexChanged,
            totalReward: this.props.totalReward,
            changeNavigatedVideoScreen: () => this.setState({ isNavigatedVideoScreen: false }),
            videoUrl,
            thumbnailUrl,
          });
        }}
      >
        {this.props.isSheetOpened ? (
          <View style={{ flex: 1 }}>
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0)']}
              locations={[0, 0.4]}
              style={[styles.video, { position: 'absolute' }]}
            />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={styles.videoContainer}>{this.videoThumbnail}</View>
            {/* "Touch the screen…"/"Swipe up…" 안내 텍스트 제거 — 온보딩에서 이미 설명, 매 영상 반복은 소음 */}
            <LinearGradient
              colors={[
                'rgba(58, 58, 58, 0.6)',
                'rgba(0, 0, 0, 0)',
                'rgba(58, 58, 58, 0.6)',
                'rgba(58, 58, 58, 0.6)',
                // 'rgba(58, 58, 58, 1)',
              ]}
              locations={[0, 0.4, 0.7, 1]}
              style={[styles.video, { position: 'absolute' }]}
            />

            <SliderRightButtons context={this} />

            <ReviewInfo
              videoId={videoId}
              review={this.props.data}
              navigation={this.props.navigation}
              KRWPerUSD={this.state.KRWPerUSD}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  }
}

const IS_IOS = Platform.OS === 'ios';
const { width: viewportWidth, height: viewportHeight } = Dimensions.get('window');

function wp(percentage) {
  const value = (percentage * viewportWidth) / 100;
  return Math.round(value);
}

// const slideHeight =
//   viewportWidth * 1.5 > viewportHeight * 0.618 ? viewportHeight * 0.618 : viewportWidth * 1.5;
const slideHeight = viewportHeight * 0.95;

const slideWidth = wp(100);
const itemHorizontalMargin = wp(0);
const itemWidth = slideWidth + itemHorizontalMargin * 2;

const styles = StyleSheet.create({
  slideInnerContainer: {
    width: itemWidth,
    height: slideHeight,
  },
  // image's border radius is buggy on iOS; let's hack it!
  videoContainer: {
    flex: 1,
    marginBottom: IS_IOS ? 0 : -1, // Prevent a random Android rendering issue
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  reviewInfo: {
    width: '100%',
    position: 'absolute',
    bottom: '7%', //'9%',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  reviewTitle: {
    marginTop: 5,
    fontSize: 18,
    lineHeight: 30,
    color: 'white',
    fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Medium,
  },
  reviewSubInfoText: {
    color: Constants.TIER_COLORS.EXPLORER,
    fontSize: 14,
    marginTop: 3,
    fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Regular,
  },
  linkedProductContainer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    // backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, .5)',
    borderRadius: 14,
  },
  linkedProductThumbnail: {
    width: 54,
    height: 54,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  linkedProductDescription: {
    flexShrink: 1,
    alignSelf: 'center',
    paddingHorizontal: 12,
    width: '100%',
  },
  linkedProductTitle: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 13,
    alignSelf: 'flex-start',
    marginBottom: 4,
    fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Regular,
  },
  linkedProductDiscountRate: {
    color: Constants.COLOR_RED,
    fontSize: 14,
    marginRight: 4,
    fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Bold,
  },
  linkedProductPrice: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 14,
    fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.ExtraBold,
  },
});
