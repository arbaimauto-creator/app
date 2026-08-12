import { useRoute } from '@react-navigation/native';
import PropTypes from 'prop-types';
import React, { PureComponent, useContext, useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  Dimensions,
  LayoutAnimation,
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
import IconFeather from 'react-native-vector-icons/Feather';
import Video from 'react-native-video';
import { Context } from '../Contexts';
import Constants from './Constants';
import T from './Constants/DesignTokens';
import FEATURES from './Constants/Features';
import { shareLink } from './utils/share';
import SliderRightButtons from './CustomComponents/SliderRightButtons';
import Strings from './Strings';
import { LoadingView, ReviewGradeBadgeView } from './Views';
import Utils, { LogoutAlert, isGuestUser } from './utils';

const { UIManager } = NativeModules;
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

function ReviewInfo({ review, expanded }) {
  const [title, setTitle] = useState(typeof review.title === 'string' ? review.title.trim() : '');
  const [description, setDescription] = useState(
    typeof review.description === 'string' ? review.description.trim() : '',
  );

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
    <View style={[styles.reviewInfo, expanded && styles.reviewInfoExpanded]} pointerEvents="none">
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
      {/* 시안 화면 8 — "@작성자 · 조회수 · Sponsored" 메타 줄 (티어 아이콘 제거, 하트는 플래그) */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={styles.metaText}>{`@${review.author.name}`}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaText}>{Strings.VIEW_COUNT(review.viewCount)}</Text>
        {FEATURES.SOCIAL_LIKES ? (
          <>
            <Text style={styles.metaDot}>·</Text>
            <FastImage
              style={{ marginRight: 3, width: 13, height: 13 }}
              source={require('../Resources/img/iconRenewal/heart-on-outlined.png')}
            />
            <Text style={styles.metaText}>{review?.likes || 0}</Text>
          </>
        ) : null}
        {review?.isSponsored ? (
          <>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaSponsored}>{Strings.SPONSORED}</Text>
          </>
        ) : null}
      </View>
      {/* <ReviewDescriptionSummary description={review.description} isMain /> */}
      <Text style={styles.reviewDescription} numberOfLines={expanded ? 8 : 1}>
        {description}
      </Text>
      <View style={styles.inlineDetailHint}>
        <IconFeather
          name={expanded ? 'chevron-down' : 'chevron-up'}
          size={18}
          color="rgba(255,255,255,0.9)"
        />
      </View>
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
      {/* 커머스 숨김(v2 §D5): 가격·최저가 안내는 COMMERCE가 꺼지면 노출하지 않는다.
          플래그와 무관하게 "Sign in and Check Lowest Price"가 리뷰 상세에 떠 있었다. */}
      {FEATURES.COMMERCE && (product.price || price) && (
        <View>
          {isGuestUser(logonUserId) ? (
            <Text style={styles.linkedProductPrice} numberOfLines={1}>
              <Text
                style={{
                  color: T.COLORS.RED,
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
    this.state = {
      isFullScreen: false,
      isLoading: true,
      isBlurred: false,
      isPaused: false,
      screenType: 'cover',
      isBookmarked: this.props.data.isBookmarked,
      isHLS: false,
      isNavigationFocused: true,
      isNavigatedVideoScreen: false,
      likes: this.props.data.likes,
      isMuted: true,
      isInfoExpanded: false,
    };
    this.isPaused = false;
  }

  onPaused = () => {
    //Handler for Video Pause
    this.setState({
      isPaused: !this.state.isPaused,
    });
  };

  onLoad = () => {
    this.setState({ isLoading: false });
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

    // 재생 실패 시 앱을 종료하지 않고 썸네일 상태로 두고 다음 영상으로 넘긴다
    this.setState({ isLoading: false });
    if (this.props.onPreviewEnded && !this.isPaused && !this.props.paused) {
      this.props.onPreviewEnded(this.props.index, false);
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
    if (this.state.isNavigatedVideoScreen) {
      return <View />;
    }

    // 세로 피드는 끝까지 내려가는 UX라, 한 번 로드된 Video를 계속 붙여두면
    // 마운트된 디코더가 단조 증가한다. 현재 항목 ±1로 제한한다.
    const isNearFocus = Math.abs(index - focusedIndex) <= 1;

    return (
      <View style={styles.video}>
        {isNearFocus && (
          <Video
            source={this.state.isHLS ? { uri: videoUrl, type: 'm3u8' } : { uri: videoUrl }}
            onEnd={this.onEnd}
            onLoad={this.onLoad}
            onLoadStart={this.onLoadStart}
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
            bufferConfig={{
              minBufferMs: 1000,
              maxBufferMs: 3000, // 기본값은 50세군도, 3초
              bufferForPlaybackMs: 350,
              bufferForPlaybackAfterRebufferMs: 1000,
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

  componentDidMount() {
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
            if (!this._isMounted) {
              return;
            }
            this.setState({
              isNavigationFocused: false,
            });
            setTimeout(() => {
              if (this._isMounted) {
                this.setState({
                  isNavigationFocused: true,
                });
              }
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
  }

  componentWillUnmount() {
    this._isMounted = false;
    this._appStateSubscription?.remove();
    // 리스너 등록 전에 언마운트되면 undefined일 수 있다
    this._unsubscribeFocusEvent?.();
    this._unsubscribeUnfocusEvent?.();

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
    // 세로 피드에서는 부모가 실측한 뷰포트 높이를 내려준다. 없으면 기존 상수를 쓴다.
    const itemHeight = this.props.height || slideHeight;

    return (
      <TouchableOpacity
        activeOpacity={1}
        style={[styles.slideInnerContainer, itemHeight ? { height: itemHeight } : null]}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          this.setState((state) => ({ isInfoExpanded: !state.isInfoExpanded }));
        }}
        accessibilityRole="button"
        accessibilityLabel={this.state.isInfoExpanded ? '리뷰 정보 접기' : '리뷰 정보 펼치기'}
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
              review={this.props.data}
              expanded={this.state.isInfoExpanded}
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
  reviewInfoExpanded: {
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 18,
    paddingBottom: 28,
  },
  reviewTitle: {
    marginTop: 5,
    fontSize: 15.5,
    lineHeight: 24,
    color: 'white',
    fontFamily: T.FONT.ExtraBold,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metaText: {
    fontSize: 11,
    fontFamily: T.FONT.Regular,
    color: 'white',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metaDot: {
    marginHorizontal: 5,
    fontSize: 11,
    fontFamily: T.FONT.Regular,
    color: 'white',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  reviewDescription: {
    color: 'white',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    fontFamily: T.FONT.Regular,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  inlineDetailHint: {
    alignSelf: 'center',
    marginTop: 8,
  },
  metaSponsored: {
    fontSize: 11,
    fontFamily: T.FONT.Regular,
    color: T.COLORS.AMBER,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  reviewSubInfoText: {
    color: T.COLORS.LINE,
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
    color: T.COLORS.INK,
    fontSize: 13,
    alignSelf: 'flex-start',
    marginBottom: 4,
    fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Regular,
  },
  linkedProductDiscountRate: {
    color: T.COLORS.RED,
    fontSize: 14,
    marginRight: 4,
    fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Bold,
  },
  linkedProductPrice: {
    color: T.COLORS.INK,
    fontSize: 14,
    fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.ExtraBold,
  },
});
