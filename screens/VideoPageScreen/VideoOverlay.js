import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Alert, LayoutAnimation, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import FastImage from 'react-native-fast-image';
import IconMaterialIcons from 'react-native-vector-icons/MaterialIcons';
import APIprovider from '../../Components/APIprovider';
import Constants from '../../Components/Constants';
import FEATURES from '../../Components/Constants/Features';
import VideoLikeButton from '../../Components/CustomComponents/VideoLikeButton';
import Strings from '../../Components/Strings';
import utils, { isGuestUser, LogoutAlert } from '../../Components/utils';
import { ReviewGradeBadgeView } from '../../Components/Views';
import UserProfilePicView from '../UserPageScreen/UserProfilePicView';

/*
 * 틱톡/릴스 스타일 오버레이.
 * - 우측: 프로필/별점/댓글/북마크/공유 액션 레일
 * - 하단: 별점 배지, 작성자, 캡션(2줄), 해시태그, 상품 카드, 상세 핸들
 * 데이터와 동작은 전부 기존 화면(context)의 것을 재사용한다.
 */

function RailButton({ onPress, children, label }) {
  return (
    <TouchableOpacity style={styles.railButton} onPress={onPress} activeOpacity={0.7}>
      {children}
      {label !== undefined && label !== null ? <Text style={styles.railLabel}>{label}</Text> : null}
    </TouchableOpacity>
  );
}

function ActionRail({ context }) {
  const review = context.state.video;
  const navigation = useNavigation();

  const guardGuest = () => {
    if (isGuestUser(context.props.route.params.logonUserId)) {
      LogoutAlert(context.props);
      return true;
    }
    return false;
  };

  const onPressRating = () => {
    if (guardGuest()) {
      return;
    }
    if (review.myG6Rating) {
      APIprovider.getVideoG6RatingList(review.videoId)
        .then((ratingList) => {
          context.setState({ ratingList });
          navigation.navigate('RatingList', { ratingList, context });
        })
        .catch(() => Alert.alert(Strings.FAILED_LOAD_RATINGS));
    } else {
      context.setState({ isGreyingShowed: true, isShowingGreyding: true });
    }
    LayoutAnimation.easeInEaseOut();
  };

  const onPressComment = () => {
    if (guardGuest()) {
      return;
    }
    context.setState({ isShowingCommentInput: true });
    setTimeout(() => context.commentInput?.focus(), 100);
  };

  return (
    <View style={styles.rail} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.railProfile}
        activeOpacity={0.8}
        onPress={() => {
          context.props.navigation.push('UserPage', {
            pageOwnerUserId: review.author?.userId,
            pageOwnerUserName: review.author?.name,
            pageOwnerUserProfilePicUrl: review.author?.profilePicUrl,
          });
        }}
      >
        <UserProfilePicView
          style={styles.railProfilePic}
          source={{ uri: review.author?.profilePicUrl }}
        />
      </TouchableOpacity>

      {/* VideoLikeButton이 자체 탭 처리를 하므로 RailButton(터치)으로 감싸지 않는다 */}
      {FEATURES.SOCIAL_LIKES ? (
        <View style={styles.railButton}>
          <VideoLikeButton context={context} size={30} center />
          <Text style={styles.railLabel}>{review.likes || 0}</Text>
        </View>
      ) : null}

      <RailButton
        onPress={onPressRating}
        label={review.g6RatingCount > 0 ? review.g6RatingCount : Strings.RATE_G_SIX}
      >
        <Animatable.View
          useNativeDriver={true}
          ref={(ref) => {
            context.handleRatingButtonAnimationRef = ref;
          }}
        >
          <FastImage
            style={styles.railIconImage}
            source={require('../../Resources/img/icBadgeGreydW34.png')}
          />
        </Animatable.View>
      </RailButton>

      <RailButton onPress={onPressComment} label={review.commentCount}>
        <IconMaterialIcons name="chat-bubble" size={30} color="#fff" style={styles.railShadow} />
      </RailButton>

      {/* 북마크는 ⋯ 메뉴로 이동 — 레일은 핵심 5개(아바타·좋아요·별점·댓글·공유)만 */}
      <RailButton onPress={() => context.menuShareToExport()}>
        <FastImage
          style={styles.railIconImage}
          source={require('../../Resources/img/iconRenewal/white-share.png')}
        />
      </RailButton>
    </View>
  );
}

function ProductCard({ context }) {
  const review = context.state.video;
  const linkedProduct = review.linkedProduct;

  if (
    !linkedProduct ||
    linkedProduct.title === '0' ||
    !linkedProduct.titleByCountry ||
    (linkedProduct.statusCode && linkedProduct.statusCode === 1)
  ) {
    return null;
  }

  const product = linkedProduct.productId;
  const priceSource = typeof product === 'object' && product ? product : linkedProduct;
  const price = priceSource.discountPrice > 0 ? priceSource.discountPrice : priceSource.price;
  const isPurchasable = !linkedProduct.externalLink && linkedProduct.productId;

  const onPressCard = () => {
    context.props.navigation.push('ProductPage', {
      productId: typeof product === 'object' && product ? product._id : linkedProduct.productId,
      videoId: review._id,
    });
  };

  return (
    <TouchableOpacity style={styles.productCard} activeOpacity={0.85} onPress={onPressCard}>
      <FastImage source={{ uri: linkedProduct.thumbnailUrl }} style={styles.productThumb} />
      <View style={styles.productTextContainer}>
        <Text style={styles.productTitle} numberOfLines={1}>
          {linkedProduct.titleByCountry}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {priceSource.discountRate > 0 ? (
            <Text style={styles.productDiscount}>{`${utils.displayDiscountRate(
              priceSource.discountRate,
            )}% `}</Text>
          ) : null}
          {price > 0 ? (
            <Text style={styles.productPrice}>
              {Strings.MONEY_AMOUNT_UNIT_WON(utils.numberWithCommas(price))}
            </Text>
          ) : null}
        </View>
      </View>
      {isPurchasable ? (
        <TouchableOpacity
          style={styles.productBuyButton}
          onPress={() => {
            if (isGuestUser(context.props.route.params.logonUserId)) {
              return LogoutAlert(context.props);
            }
            LayoutAnimation.easeInEaseOut();
            context.setState({ isShowPurchaseUIInReview: true });
          }}
        >
          <Text style={styles.productBuyButtonText}>{Strings.BUY}</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

function VideoOverlay({ context }) {
  const review = context.state.video;
  const title = (review.titleByCountry || review.title || '').trim();

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      <ActionRail context={context} />

      <View style={styles.bottomContainer} pointerEvents="box-none">
        {review.g6RatingCount > 0 ? (
          <View style={{ alignSelf: 'flex-start', marginBottom: 8 }}>
            <ReviewGradeBadgeView
              g6RatingCount={review.g6RatingCount}
              g6AvgRatingScore={review.g6AvgRatingScore}
              type={review.myG6Rating ? 'review_on' : 'review_off'}
            />
          </View>
        ) : null}

        <View style={styles.authorRow}>
          <Text
            style={styles.authorName}
            onPress={() => {
              context.props.navigation.push('UserPage', {
                pageOwnerUserId: review.author?.userId,
                pageOwnerUserName: review.author?.name,
                pageOwnerUserProfilePicUrl: review.author?.profilePicUrl,
              });
            }}
          >
            {`@${review.author?.name || ''}`}
          </Text>
          <Text style={styles.authorSubText}>{` ・ ${Strings.VIEW_COUNT(review.viewCount)}`}</Text>
          {review?.isSponsored ? (
            <Text style={[styles.authorSubText, { color: Constants.TIER_COLORS.GIVER }]}>
              {` ・ ${Strings.SPONSORED}`}
            </Text>
          ) : null}
        </View>

        {title !== '' ? (
          <Text style={styles.caption} numberOfLines={2} onPress={() => context.openDetails()}>
            {title}
          </Text>
        ) : null}

        {/* 해시태그 줄 제거 — 상세(리뷰)에서 확인 가능. 오버레이는 3줄 이내 유지 */}

        <ProductCard context={context} />

        <TouchableOpacity
          style={styles.detailHandle}
          activeOpacity={0.7}
          onPress={() => context.openDetails()}
        >
          <IconMaterialIcons name="keyboard-arrow-up" size={22} color="#fff" />
          <Text style={styles.detailHandleText}>{Strings.REVIEW}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  rail: {
    position: 'absolute',
    right: 8,
    bottom: 96,
    alignItems: 'center',
  },
  railProfile: {
    marginBottom: 18,
  },
  railProfilePic: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  railButton: {
    alignItems: 'center',
    marginBottom: 16,
    minWidth: 52,
  },
  railIconImage: {
    width: 30,
    height: 30,
  },
  railShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  railLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomContainer: {
    position: 'absolute',
    left: 16,
    right: 72,
    bottom: 18,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  authorSubText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
  },
  caption: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  hashTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  hashTag: {
    color: '#fff',
    fontSize: 14,
    marginRight: 10,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 20, 0.72)',
    borderRadius: 12,
    padding: 8,
    marginTop: 10,
  },
  productThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  productTextContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  productTitle: {
    color: '#fff',
    fontSize: 13,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
  },
  productDiscount: {
    color: Constants.COLOR_RED,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 3,
  },
  productPrice: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 3,
  },
  productBuyButton: {
    backgroundColor: Constants.COLOR_POINT_BLUE,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  productBuyButtonText: {
    color: Constants.COLOR_BACKGROUND_DARK,
    fontSize: 13,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
  },
  detailHandle: {
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  detailHandleText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
  },
});

export default VideoOverlay;
