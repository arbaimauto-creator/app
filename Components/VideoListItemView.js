import { useRoute } from '@react-navigation/native';
import T from './Constants/DesignTokens';
import dayjs from 'dayjs';
import React, { PureComponent, useContext } from 'react';
import {
  Image,
  NativeModules,
  Platform,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import IconEntypo from 'react-native-vector-icons/Entypo';
import IconFeather from 'react-native-vector-icons/Feather';
import { Context } from '../Contexts';
import UserProfilePicView from '../screens/UserPageScreen/UserProfilePicView';
import VideoHashTag from '../screens/VideoPageScreen/VideoHashTag';
import Constants from './Constants';
import FEATURES from './Constants/Features';
import ReviewDescriptionSummary from './CustomComponents/ReviewDescriptionSummary';
import Strings from './Strings';
import Utils, { getKRWPerUSD, isGuestUser } from './utils';
import { moderateScale } from './utils/scailing';
import { ReviewGradeBadgeView } from './Views';

const VIEW_TYPE_SIMPLE = 'simple';
const VIEW_TYPE_DETAIL = 'detail';
const VIEW_TYPE_GRID_REVENUE = 'grid_revenue';
const VIEW_TYPE_GRID = 'grid';
const VIEW_TYPE_GRID_DETAIL = 'grid_detail';
const VIEW_TYPE_LIST_HORIZONTAL = 'list_horizontal';
const VIEW_TYPE_LIST_VERTICAL = 'list_vertical';
const VIEW_TYPE_RELAYING = 'relaying';

const defaultStyle = {};

function ReviewMain({ review, KRWPerUSD, videoCategory }) {
  return (
    <View style={styles.reviewMainContainer}>
      {Platform.OS === 'ios' ? (
        <Image
          style={styles.reviewThumbnail}
          source={{ uri: review.thumbnailUrl || review?.relayedVideo?.thumbnailUrl }}
        />
      ) : (
        <FastImage
          style={styles.reviewThumbnail}
          source={{ uri: review.thumbnailUrl || review?.relayedVideo?.thumbnailUrl }}
        />
      )}
      <ReviewGradeBadgeView
        containerStyle={styles.reviewMainGradeBadge}
        g6RatingCount={review.g6RatingCount || review?.relayedVideo?.g6RatingCount}
        g6AvgRatingScore={review.g6AvgRatingScore || review?.relayedVideo?.g6AvgRatingScore}
      />
      <LinearGradient
        colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, .5)', 'rgba(0, 0, 0, .9)']}
        locations={[0, 0.3, 0.8, 1]}
        pointerEvents="none"
        style={{ width: '100%', height: '100%', position: 'absolute', borderRadius: 12 }}
      >
        <View
          style={{
            flex: 1,
            position: 'absolute',
            bottom: 0,
            width: '100%',
            padding: 10,
          }}
        >
          {/* <LinkedProduct product={review.linkedProduct} KRWPerUSD={KRWPerUSD} /> */}
          <ReviewDescriptionSummary description={review.description} review={review} />
        </View>
      </LinearGradient>
    </View>
  );
}

function LinkedProduct({ product, blackBackground, KRWPerUSD }) {
  if (product && product.productId) {
    if (
      (product.statusCode && product.statusCode === 1) ||
      (product.productId?.statusCode && product.productId?.statusCode === 1)
    ) {
      return null;
    }

    return (
      <View
        style={
          blackBackground
            ? styles.linkedProductContainerForBlackBackground
            : styles.linkedProductContainer
        }
      >
        <ProductThumbnail thumbnailUrl={product.thumbnailUrl || product.productId.thumbnailUrl} />
        <ProductDescription product={product} KRWPerUSD={KRWPerUSD} />
      </View>
    );
  } else {
    return <View />;
  }
}

function ProductThumbnail({ thumbnailUrl }) {
  return <FastImage style={styles.linkedProductThumbnail} source={{ uri: thumbnailUrl }} />;
}

function ProductDescription({ product, KRWPerUSD = 1300 }) {
  const {
    params: { logonUserId },
  } = useRoute();
  const global = useContext(Context);
  const { price, discountPrice, discountRate, title } = product.productId;

  return (
    <View style={styles.linkedProductDescription}>
      <Text style={styles.linkedProductTitle} numberOfLines={1}>
        {product.title || title}
      </Text>

      {/* 커머스 숨김(v2 §D5): COMMERCE가 꺼지면 가격·최저가 안내를 노출하지 않는다 */}
      {FEATURES.COMMERCE && (product.price || price) && (
        <View>
          {isGuestUser(logonUserId) ? (
            <Text style={{ ...styles.linkedProductPrice, marginTop: 2 }} numberOfLines={1}>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: Constants.CUSTOM_FONTS.SCDREAM.LIGHT_3,
                  color: T.COLORS.RED,
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
              <Text style={styles.linkedProductPrice} numberOfLines={1}>
                {Utils.displayPrice(product.discountPrice || discountPrice, global.state.region)}
              </Text>
            </View>
          ) : (
            <Text style={styles.linkedProductPrice} numberOfLines={1}>
              {Utils.displayPrice(product.price || price, global.state.region)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function ReviewFooter({ review }) {
  const deviceLanguage =
    Platform.OS === 'ios'
      ? NativeModules.SettingsManager.settings.AppleLocale ||
        NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
      : NativeModules.I18nManager.localeIdentifier;
  const locale = deviceLanguage.substring(0, 2) === 'ko' ? 'ko' : 'en';
  return (
    <View style={{}}>
      {review.title !== null && review.title !== '' && (
        <Text style={styles.reviewTitle} numberOfLines={1}>
          {review.title[locale] ? review.title[locale].trim() : review.title.trim()}
        </Text>
      )}
      <View style={styles.reviewFooterInfoContainer}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.reviewFooterInfoUserId} numberOfLines={1}>
            {review.author?.name}
          </Text>
          <FastImage
            style={{ width: 24, height: 24 }}
            source={
              Constants.TIER_ICONS[
                Utils.getTierNameByClass(review.author?.class) || Utils.getTierNameByClass(0)
              ]
            }
          />
        </View>
        <Text style={styles.reviewFooterInfoViewCount}>
          {' '}
          {/* {utils.timestampToAgo(review.createdAt)} ・ {Strings.VIEW_COUNT(review.viewCount)} */}
          ・ {Strings.VIEW_COUNT(review.viewCount)}
        </Text>
      </View>
    </View>
  );
}

function VerticalItemLeft({ review }) {
  return (
    <View>
      <FastImage style={styles.reviewThumbnailVertical} source={{ uri: review.thumbnailUrl }} />
      <ReviewGradeBadgeView
        // ratingScore={review.ratingScore}
        // ratingCount={review.ratingCount}
        containerStyle={styles.reviewGradeBadge}
        g6RatingCount={review.g6RatingCount}
        g6AvgRatingScore={review.g6AvgRatingScore}
      />
    </View>
  );
}

function VerticalItemRight({ review, isRelaying = false, KRWPerUSD }) {
  const deviceLanguage =
    Platform.OS === 'ios'
      ? NativeModules.SettingsManager.settings.AppleLocale ||
        NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
      : NativeModules.I18nManager.localeIdentifier;
  const locale = deviceLanguage.substring(0, 2) === 'ko' ? 'ko' : 'en';
  return (
    <View style={styles.verticalItemRightContainer}>
      {isRelaying && <Text style={styles.upperReviewTitle}>{Strings.UPPER_REVIEW}</Text>}
      <View style={{ marginBottom: 14 }}>
        {review.title !== null && review.title !== '' && (
          <Text style={styles.reviewTitle} numberOfLines={2}>
            {review.title[locale] ? review.title[locale].trim() : review.title.trim()}
          </Text>
        )}
        <Text style={styles.reviewFooterText}>
          {review.author.name} ・ {Strings.VIEW_COUNT(review.viewCount)}
          {/* ・ {Utils.timestampToAgo(review.createdAt)} */}
        </Text>
      </View>
      {!isRelaying && (
        <LinkedProduct product={review.linkedProduct} blackBackground KRWPerUSD={KRWPerUSD} />
      )}
    </View>
  );
}

export default class VideoListItemView extends PureComponent {
  static contextType = Context;
  static defaultProps = {
    key: 0,
    style: {},
    navigation: '',
    data: {
      thumbnailUrl: '',
      description: '',
      author: {
        userId: '',
        name: '',
        profilePicUrl: '',
      },
      datetime: '',
      videoDuration: 0,
      viewCount: 0,
      liked: 0,
      starCount: 0,
      ratingScore: 0,
      ratingCount: 0,
      revenueTotal: 0,
      revenueNew: 0,
      productId: '',
      productTitle: '',
      productThumbnailUrl: '',
    },
    onPress: () => {},
    type: VIEW_TYPE_GRID,
    noCreator: false,
    noProduct: false,
    showDescription: false,
  };

  constructor(props) {
    super(props);
    this.touchTimeout = null;
    this.isTouchValid = true;
    this.state = {
      KRWPerUSD: 1300,
    };
  }

  async componentDidMount() {
    this._isMounted = true;
    const KRWPerUSD = await getKRWPerUSD();
    if (this._isMounted) {
      this.setState({ KRWPerUSD: KRWPerUSD });
    }
  }

  componentWillUnmount() {
    // 리스트 아이템은 스크롤 중 대량 마운트/언마운트되므로 타이머를 반드시 정리
    this._isMounted = false;
    if (this.touchTimeout != null) {
      clearTimeout(this.touchTimeout);
      this.touchTimeout = null;
    }
  }

  getDurationString = function (seconds) {
    let hour = parseInt(seconds / 3600, 10);
    let min = parseInt((seconds - hour * 3600) / 60, 10);
    let sec = seconds % 60;
    min = hour > 0 && min === 0 ? '00' : min;
    sec = sec === 0 ? '00' : sec;
    return hour > 0 ? hour + ':' + min + ':' + sec : min + ':' + sec;
  };

  async onClicked() {
    const { data } = this.props;
    if (data && (data.videoId || data._id) && this.props.onPress(this.props.data) !== false) {
      this.props.navigation.push('VideoPage', {
        videoId: this.props.data._id,
        // 저장 목록에서 열면 쇼츠 대신 전체 상세(사진·평점표·연관 리뷰) 모드 (2026-09-15)
        detailMode: !!this.props.detailMode,
        videoType: this.props.dataType,
        videoList: this.props.dataList,
        videoSortType: this.props.dataSortType,
        onVideoListChanged: this.props.onVideoListChanged,
        onVideoIndexChanged: this.props.onVideoIndexChanged,
      });
    }
  }

  renderProductThumbnail() {
    // 기능 다이어트 (COMMERCE off): 리뷰 카드의 제품 링크/구매 진입점 숨김
    if (!FEATURES.COMMERCE) {
      return null;
    }
    if (
      !this.props.noProduct &&
      this.props.data.linkedProduct &&
      this.props.data.linkedProduct.thumbnailUrl &&
      this.props.data.linkedProduct.thumbnailUrl !== ''
    ) {
      return Platform.OS === 'android' ? (
        <TouchableWithoutFeedback
          onPress={() => {
            if (this.props.onPress(this.props.data) !== false) {
              this.props.navigation.navigate('ProductPage', {
                productId: this.props.data.linkedProduct.productId,
              });
            }
          }}
        >
          <FastImage
            resizeMode={'cover'}
            style={{ width: 30, height: 30, borderRadius: 4 }}
            source={{ uri: this.props.data.linkedProduct.thumbnailUrl }}
          />
        </TouchableWithoutFeedback>
      ) : (
        <TouchableOpacity
          onPress={() => {
            if (this.props.onPress(this.props.data) !== false) {
              this.props.navigation.navigate('ProductPage', {
                productId: this.props.data.linkedProduct.productId,
              });
            }
          }}
          activeOpacity={0.7}
        >
          <FastImage
            resizeMode={'cover'}
            style={{ width: 30, height: 30, borderRadius: 4 }}
            source={{ uri: this.props.data.linkedProduct.thumbnailUrl }}
          />
        </TouchableOpacity>
      );
    } else if (
      !this.props.noProduct &&
      this.props.data.linkedProduct &&
      this.props.data.linkedProduct.externalLink &&
      this.props.data.linkedProduct.externalLink !== ''
    ) {
      return (
        <TouchableWithoutFeedback
          onPress={() => {
            if (this.props.onPress(this.props.data) !== false) {
              this.props.navigation.navigate('ProductPage', {
                productId: this.props.data.linkedProduct.productId,
              });
            }
          }}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 4,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <IconFeather size={12} name="external-link" color="#fff" />
          </View>
        </TouchableWithoutFeedback>
      );
    }
  }

  renderVideoThumbnail() {
    if (this.props.data.thumbnailUrl) {
      return Platform.OS === 'ios' ? (
        <Image
          resizeMode={'cover'}
          style={{ width: '100%', height: '100%', borderRadius: 10 }}
          source={{ uri: this.props.data.thumbnailUrl }}
        />
      ) : (
        <FastImage
          resizeMode={'cover'}
          style={{ width: '100%', height: '100%' }}
          source={{ uri: this.props.data.thumbnailUrl }}
        />
      );
    }
  }

  render(params) {
    if (this.props.type === VIEW_TYPE_GRID_REVENUE) {
      const global = this.context;
      const currencyChar = global.state.region === 'kr' ? '￦' : '$';
      return (
        <View style={[defaultStyle, this.props.style]}>
          <TouchableOpacity
            onPress={() => {
              this.onClicked();
            }}
            activeOpacity={0.9}
          >
            <View style={{ width: '100%', height: '100%' }}>
              {this.props.data.thumbnailUrl && Platform.OS === 'ios' ? (
                <Image
                  resizeMode={'cover'}
                  style={{ width: '100%', height: '100%', borderRadius: 10 }}
                  source={{ uri: this.props.data.thumbnailUrl }}
                />
              ) : (
                <FastImage
                  resizeMode={'cover'}
                  style={{ width: '100%', height: '100%', borderRadius: 10 }}
                  source={{ uri: this.props.data.thumbnailUrl }}
                />
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.gridDescriptionBackground} />
          <View style={{ margin: 10, position: 'absolute', bottom: 0 }}>
            <Text style={styles.revenueTotal}>
              {currencyChar}
              {Utils.numberWithCommas(this.props.data.revenueTotal)}
            </Text>
          </View>
        </View>
      );
    } else if (
      this.props.type === VIEW_TYPE_GRID ||
      this.props.type === VIEW_TYPE_LIST_HORIZONTAL ||
      this.props.type === VIEW_TYPE_GRID_DETAIL
    ) {
      let isEventPeriod = false;
      let isExpiredEvent = false;
      let isUpcomingEvent = false;
      let { eventSequence } = 0;

      if (this.props.data.scoreEventStartDate && this.props.data.scoreEventEndDate) {
        const currentDate = dayjs(); // Get the current date and time
        const startDate = dayjs(this.props.data.scoreEventStartDate, 'YYYY-MM-DD'); // Set the target start date
        const endDate = dayjs(this.props.data.scoreEventEndDate, 'YYYY-MM-DD'); // Set the target end date
        isEventPeriod = currentDate.isBefore(endDate) && currentDate.isAfter(startDate);
        isExpiredEvent = currentDate.isAfter(endDate);
        isUpcomingEvent = currentDate.isBefore(startDate);

        eventSequence = this.props.data.scoreEventSequence;
      }

      return (
        <View
          style={[
            styles.horizontalTypeContainer,
            this.props.style,
            this.props.data.isScoreEvent ? { marginBottom: 40 } : null,
          ]}
        >
          {Platform.OS === 'android' ? (
            <TouchableNativeFeedback
              onPress={() => {
                if (this.isTouchValid === false) {
                  return;
                }
                this.isTouchValid = false;
                if (this.touchTimeout != null) {
                  clearTimeout(this.touchTimeout);
                  this.touchTimeout = null;
                }
                this.touchTimeout = setTimeout(() => {
                  this.isTouchValid = true;
                }, 500);

                if (!this.props?.isShownFilterSelector) {
                  this.onClicked();
                }
              }}
              activeOpacity={0.9}
            >
              <View style={styles.reviewContainer}>
                <ReviewMain review={this.props.data} KRWPerUSD={this.state.KRWPerUSD} />
                {/* <ReviewFooter review={this.props.data} /> */}
                {this.props.videoCategory === 'scoreEvent' &&
                this.props.data.isScoreEvent &&
                isEventPeriod ? (
                  <View style={styles.participateEventBox}>
                    <Text style={styles.participateEventText}>
                      {eventSequence}차 {Strings.PARICIPATE_EVENT}
                    </Text>
                  </View>
                ) : this.props.videoCategory === 'scoreEvent' &&
                  this.props.data.isScoreEvent &&
                  !isEventPeriod &&
                  isExpiredEvent ? (
                  <View style={styles.exporedEventBox}>
                    <Text style={styles.exporedEventText}>
                      {eventSequence}차 {Strings.EXPIRED_EVENT}
                    </Text>
                  </View>
                ) : this.props.videoCategory === 'scoreEvent' &&
                  this.props.data.isScoreEvent &&
                  !isEventPeriod &&
                  isUpcomingEvent ? (
                  <View style={styles.exporedEventBox}>
                    <Text style={styles.exporedEventText}>
                      {eventSequence}차 {Strings.UPCOMING_EVENT}
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableNativeFeedback>
          ) : (
            <TouchableOpacity
              onPress={() => {
                if (this.isTouchValid === false) {
                  return;
                }
                this.isTouchValid = false;
                if (this.touchTimeout != null) {
                  clearTimeout(this.touchTimeout);
                  this.touchTimeout = null;
                }
                this.touchTimeout = setTimeout(() => {
                  this.isTouchValid = true;
                }, 500);

                if (!this.props?.isShownFilterSelector) {
                  this.onClicked();
                }
              }}
              activeOpacity={0.9}
              style={styles.reviewContainer}
            >
              <ReviewMain review={this.props.data} KRWPerUSD={this.state.KRWPerUSD} />
              {/* <ReviewFooter review={this.props.data} /> */}
              {this.props.videoCategory === 'scoreEvent' &&
              this.props.data.isScoreEvent &&
              isEventPeriod ? (
                <View style={styles.participateEventBox}>
                  <Text style={styles.participateEventText}>
                    {eventSequence}차 {Strings.PARICIPATE_EVENT}
                  </Text>
                </View>
              ) : this.props.videoCategory === 'scoreEvent' &&
                this.props.data.isScoreEvent &&
                !isEventPeriod &&
                isExpiredEvent ? (
                <View style={styles.exporedEventBox}>
                  <Text style={styles.exporedEventText}>
                    {eventSequence}차 {Strings.EXPIRED_EVENT}
                  </Text>
                </View>
              ) : this.props.videoCategory === 'scoreEvent' &&
                this.props.data.isScoreEvent &&
                !isEventPeriod &&
                isUpcomingEvent ? (
                <View style={styles.exporedEventBox}>
                  <Text style={styles.exporedEventText}>
                    {eventSequence}차 {Strings.UPCOMING_EVENT}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          )}
        </View>
      );
    } else if (
      this.props.type === VIEW_TYPE_LIST_VERTICAL ||
      this.props.type === VIEW_TYPE_RELAYING
    ) {
      return (
        <View>
          {Platform.OS === 'android' ? (
            <TouchableNativeFeedback
              onPress={() => {
                this.onClicked();
              }}
              activeOpacity={0.9}
            >
              <View>
                <View style={[styles.verticalTypeContainer, this.props.style]}>
                  <VerticalItemLeft review={this.props.data} />
                  <VerticalItemRight
                    review={this.props.data}
                    isRelaying={this.props.type === VIEW_TYPE_RELAYING}
                    KRWPerUSD={this.state.KRWPerUSD}
                  />
                </View>

                {this.props.data.hashTags ? (
                  <VideoHashTag
                    hashTags={this.props.data.hashTags}
                    navigation={this.props.navigation}
                  />
                ) : null}
              </View>
            </TouchableNativeFeedback>
          ) : (
            <TouchableOpacity
              onPress={() => {
                this.onClicked();
              }}
              activeOpacity={0.9}
            >
              <View>
                <View style={[styles.verticalTypeContainer, this.props.style]}>
                  <VerticalItemLeft review={this.props.data} />
                  <VerticalItemRight
                    review={this.props.data}
                    isRelaying={this.props.type === VIEW_TYPE_RELAYING}
                    KRWPerUSD={this.state.KRWPerUSD}
                  />
                </View>

                {this.props.data.hashTags ? (
                  <VideoHashTag
                    hashTags={this.props.data.hashTags}
                    navigation={this.props.navigation}
                  />
                ) : null}
              </View>
            </TouchableOpacity>
          )}
        </View>
      );
    } else {
      return (
        <View style={[defaultStyle, this.props.style]}>
          {Platform.OS === 'android' ? (
            <TouchableNativeFeedback
              onPress={() => {
                this.onClicked();
              }}
              activeOpacity={0.9}
            >
              <View>
                <View style={{ width: '100%', height: '100%' }}>{this.renderVideoThumbnail()}</View>

                <View
                  style={{
                    position: 'absolute',
                    height: '100%',
                    width: '100%',
                    padding: 5,
                  }}
                >
                  <View style={{}}>
                    {!this.props.noCreator && (
                      <TouchableWithoutFeedback
                        onPress={() => {
                          if (this.props.onPress(this.props.data) !== false) {
                            this.props.navigation.navigate('UserPage', {
                              pageOwnerUserId: this.props.data.author.userId,
                              pageOwnerUserName: this.props.data.author.name,
                            });
                          }
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            width: '100%',
                          }}
                        >
                          <UserProfilePicView
                            style={{ width: 28, height: 28, borderRadius: 24 }}
                            source={{
                              uri: this.props.data.author
                                ? this.props.data.author.profilePicUrl
                                : '',
                            }}
                          />
                        </View>
                      </TouchableWithoutFeedback>
                    )}
                  </View>

                  <View style={{ flex: 1 }} />
                  {this.props.showDescription && (
                    <Text numberOfLines={4} style={{ color: T.COLORS.INK, fontWeight: 'bold' }}>
                      {this.props.data.description}
                    </Text>
                  )}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-end',
                      width: '100%',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        borderRadius: 14,
                        padding: 4,
                      }}
                    >
                      <IconEntypo
                        name="check"
                        size={14}
                        style={{ color: T.COLORS.INK, marginRight: 4 }}
                      />
                      <Text style={{ color: T.COLORS.INK, fontSize: 12 }}>
                        {this.props.data.ratingCount !== 0 ? this.props.data.ratingScore : '-'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <View>{this.renderProductThumbnail()}</View>
                  </View>
                </View>
              </View>
            </TouchableNativeFeedback>
          ) : (
            <TouchableOpacity
              onPress={() => {
                this.onClicked();
              }}
              activeOpacity={0.9}
            >
              <View>
                <View style={{ width: '100%', height: '100%' }}>{this.renderVideoThumbnail()}</View>

                <View
                  style={{
                    position: 'absolute',
                    height: '100%',
                    width: '100%',
                    padding: 5,
                  }}
                >
                  <View style={{}}>
                    {!this.props.noCreator && (
                      <TouchableWithoutFeedback
                        onPress={() => {
                          if (this.props.onPress(this.props.data) !== false) {
                            this.props.navigation.navigate('UserPage', {
                              pageOwnerUserId: this.props.data.author.userId,
                              pageOwnerUserName: this.props.data.author.name,
                            });
                          }
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            width: '100%',
                          }}
                        >
                          <UserProfilePicView
                            style={{ width: 28, height: 28, borderRadius: 24 }}
                            source={{
                              uri: this.props.data.author
                                ? this.props.data.author.profilePicUrl
                                : '',
                            }}
                          />
                        </View>
                      </TouchableWithoutFeedback>
                    )}
                  </View>

                  <View style={{ flex: 1 }} />
                  {this.props.showDescription && (
                    <Text numberOfLines={4} style={{ color: T.COLORS.INK, fontWeight: 'bold' }}>
                      {this.props.data.description}
                    </Text>
                  )}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-end',
                      width: '100%',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        borderRadius: 14,
                        padding: 4,
                      }}
                    >
                      <IconEntypo
                        name="check"
                        size={14}
                        style={{ color: T.COLORS.INK, marginRight: 4 }}
                      />
                      <Text style={{ color: T.COLORS.INK, fontSize: 12 }}>
                        {this.props.data.ratingCount !== 0 ? this.props.data.ratingScore : '-'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <View>{this.renderProductThumbnail()}</View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  itemDuration: {
    fontSize: 10,
    opacity: 0.5,
    color: T.COLORS.INK,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    textAlign: 'center',
    position: 'absolute',
    marginLeft: 4,
  },
  itemInfo: {
    fontSize: 12,
    color: '#666',
  },
  gridDescriptionBackground: {
    position: 'absolute',
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    opacity: 0.3,
    bottom: 0,
    height: 40,
    width: '100%',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  revenueTotal: {
    color: '#eee',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewContainer: {
    width: '100%',
  },
  reviewMainContainer: {
    width: '100%',
    // marginBottom: 13,
    marginBottom: 10,
  },
  reviewThumbnail: {
    width: '100%',
    height: Constants.VIDEO_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT,
    borderRadius: 9,
  },
  reviewThumbnailVertical: {
    width: Constants.VIDEO_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_WIDTH,
    height: Constants.VIDEO_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT,
    borderRadius: 4,
  },
  reviewGradeBadge: {
    position: 'absolute',
    marginLeft: moderateScale(3),
    marginTop: moderateScale(6),
  },
  reviewMainGradeBadge: {
    position: 'absolute',
    // marginLeft: 10,
    // marginTop: 12,
    marginLeft: moderateScale(15),
    marginTop: moderateScale(15),
  },
  reviewRating: {
    color: T.COLORS.INK,
    fontSize: 13,
    fontWeight: 'bold',
  },
  linkedProductContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.5)', //T.COLORS.LINE,
    borderRadius: 4,
  },
  linkedProductContainerForBlackBackground: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.5)', //T.COLORS.LINE,
    borderRadius: 4,
  },
  linkedProductThumbnail: {
    width: 40,
    height: 40,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    marginRight: 8,
  },
  linkedProductDescription: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'center',
    opacity: 0.8,
    //    borderWidth:1, borderColor: 'white'
  },
  linkedProductTitle: {
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
    color: T.COLORS.INK,
    fontWeight: '600',
    fontSize: 12,
  },
  linkedProductDiscountRate: {
    color: T.COLORS.RED,
    fontSize: 12,
    marginRight: 4,
  },
  linkedProductPrice: {
    flex: 1,
    color: 'black',
    fontWeight: '600',
    fontSize: 12,
  },
  reviewTitle: {
    // color: T.COLORS.INK,
    // color: '#e6e6e6',
    color: T.COLORS.INK,
    // fontSize: 15,
    fontSize: 14,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    lineHeight: 19,
    // marginBottom: 3,
    marginBottom: 5,
  },
  reviewFooterText: {
    color: '#888888',
    fontSize: 15,
    lineHeight: 19,
    marginBottom: 3,
  },
  reviewFooterInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewFooterInfoUserId: {
    flexShrink: 1,
    // color: 'rgb(128, 128, 128)',
    // color: '#999',
    color: T.COLORS.INK,
    // fontSize: 13,
    fontSize: 14,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM,
  },
  reviewFooterInfoViewCount: {
    // color: 'rgb(128, 128, 128)',
    color: T.COLORS.GREY,
    // fontSize: 13,
    fontSize: 12,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
  },
  horizontalTypeContainer: {
    width: '100%',
    height: '100%',
  },
  verticalTypeContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  verticalItemRightContainer: {
    flex: 1,
    marginTop: 13,
    marginLeft: 13,
    alignSelf: 'flex-start',
  },
  upperReviewTitle: {
    color: Constants.COLOR_MAIN,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  participateEventBox: {
    marginTop: -5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    backgroundColor: T.COLORS.AMBER,
  },
  participateEventText: {
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    paddingVertical: 5,
    color: T.COLORS.INK,
  },
  exporedEventBox: {
    marginTop: -5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    backgroundColor: T.COLORS.GREY,
  },
  exporedEventText: {
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    paddingVertical: 5,
    color: Constants.COLOR_BACKGROUND_DARK,
  },
});
