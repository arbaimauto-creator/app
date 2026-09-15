import T from '../../Components/Constants/DesignTokens';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  const guardGuest = () => {
    if (isGuestUser(context.props.route.params.logonUserId)) {
      LogoutAlert(context.props);
      return true;
    }
    return false;
  };

  const onPressComment = () => {
    if (guardGuest()) {
      return;
    }
    context.setState({ isShowingCommentInput: true });
    setTimeout(() => context.commentInput?.focus(), 100);
  };

  // 저장 = 레퍼런스 보관. 서버는 기존 북마크 엔드포인트를 그대로 쓴다.
  // 낙관적 반영 후 실패하면 되돌린다 — 탭 반응이 서버 왕복을 기다리지 않게.
  const onPressSave = () => {
    if (guardGuest()) {
      return;
    }
    const next = !review.isBookmarked;
    context.setState({ video: { ...review, isBookmarked: next } });
    APIprovider.bookmarkVideo(review.videoId, next).catch(() => {
      context.setState({ video: { ...review, isBookmarked: !next } });
      Alert.alert(Strings.FAILED_TO_BOOKMARK);
    });
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

      <RailButton onPress={onPressComment} label={review.commentCount}>
        <IconMaterialIcons name="chat-bubble" size={30} color="#fff" style={styles.railShadow} />
      </RailButton>

      {/* 하트 대신 '저장' — 참고할 리뷰를 레퍼런스로 모아두고, 나중에 그걸 보고 만든
          리뷰를 원본에 연결한다(인용 계보). 인기 투표가 아니라 창작 재료 보관함. */}
      {FEATURES.REFERENCE_ARCHIVE ? (
        <RailButton
          onPress={onPressSave}
          label={review.isBookmarked ? Strings.REF_SAVED : Strings.REF_SAVE}
        >
          <IconMaterialIcons
            name={review.isBookmarked ? 'bookmark' : 'bookmark-border'}
            size={30}
            color={review.isBookmarked ? T.COLORS.AMBER : '#fff'}
            style={styles.railShadow}
          />
        </RailButton>
      ) : null}

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
            context.setState({ isShowPurchaseUIInReview: true });
          }}
        >
          <Text style={styles.productBuyButtonText}>{Strings.BUY}</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

// 캡션 본문에서 마크다운 기호만 걷어낸다 (VideoRenderDetails.plainText와 같은 규칙)
function plainText(s) {
  if (!s) {
    return '';
  }
  return String(s)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|\s)\*(\S(?:.*?\S)?)\*(?=\s|$)/g, '$1$2')
    .replace(/(^|\s)__(.+?)__(?=\s|$)/g, '$1$2')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '· ')
    .trim();
}

// 펼쳤을 때 캡션 최대 줄 수 — 스크롤 없이 화면 절반 안에 들어오게(세로 제스처는 전부 페이저 몫)
function VideoOverlay({ context }) {
  const review = context.state.video;
  const caption = plainText(
    review.descriptionByCountry || review.description || review.titleByCountry || review.title,
  );
  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      <ActionRail context={context} />
      <View style={styles.bottomContainer} pointerEvents="box-none">
        <View style={styles.reviewSummary}>
          <View style={styles.summaryHeader}>
            <Text style={styles.reviewEyebrow}>{Strings.SHORTS_REVIEW_LABEL}</Text>
            {review.g6RatingCount > 0 ? (
              <ReviewGradeBadgeView
                g6RatingCount={review.g6RatingCount}
                g6AvgRatingScore={review.g6AvgRatingScore}
                type={review.myG6Rating ? 'review_on' : 'review_off'}
              />
            ) : null}
            {review.isSponsored ? <Text style={styles.sponsored}>{Strings.SPONSORED}</Text> : null}
          </View>
          <TouchableOpacity
            style={styles.authorRow}
            accessibilityRole="button"
            onPress={() =>
              context.props.navigation.push('UserPage', {
                pageOwnerUserId: review.author?.userId,
                pageOwnerUserName: review.author?.name,
                pageOwnerUserProfilePicUrl: review.author?.profilePicUrl,
              })
            }
          >
            <Text style={styles.authorName} numberOfLines={1}>
              @{review.author?.name || 'greyd'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.caption} numberOfLines={2}>
            {caption}
          </Text>
          <TouchableOpacity
            style={styles.readReviewButton}
            onPress={() => context.openDetails()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={Strings.SHORTS_READ_REVIEW}
          >
            <IconMaterialIcons name="article" size={18} color={T.COLORS.ON_AMBER} />
            <Text style={styles.readReviewText}>{Strings.SHORTS_READ_REVIEW}</Text>
            <IconMaterialIcons name="chevron-right" size={20} color={T.COLORS.ON_AMBER} />
          </TouchableOpacity>
        </View>
        <ProductCard context={context} />
      </View>
    </View>
  );
}

const TAB_BAR_INSET = 76;

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  // 탭 토글 시 레일·캡션이 함께 페이드되는 레이어
  overlayFade: {
    ...StyleSheet.absoluteFillObject,
  },
  reviewSummary: {
    backgroundColor: 'rgba(18,18,20,0.82)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: 14,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  reviewEyebrow: {
    fontFamily: T.FONT.Bold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: T.COLORS.AMBER,
  },
  sponsored: { fontFamily: T.FONT.Medium, fontSize: 10, color: '#E2E2E2', flexShrink: 1 },
  readReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    marginTop: 12,
    backgroundColor: T.COLORS.AMBER,
    borderRadius: 10,
  },
  readReviewText: { flex: 1, fontFamily: T.FONT.Bold, fontSize: 13, color: T.COLORS.ON_AMBER },
  rail: {
    position: 'absolute',
    right: 8,
    // 하단 탭바(약 76) 위로 띄운다 — 피드는 탭 안에서 열리므로 탭바가 계속 보인다
    bottom: 96 + TAB_BAR_INSET,
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
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
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
    // 캡션·상세 핸들이 탭바에 가리지 않도록
    bottom: 18 + TAB_BAR_INSET,
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
  caption: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    minHeight: 44,
    marginTop: 6,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
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
    color: T.COLORS.RED,
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
  // 시트 핸들 — 그랩바 + 라벨. 위로 쓸어 올리거나 탭하면 리뷰 상세 시트
  detailHandle: {
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 6,
    minHeight: 44,
  },
  detailHandlePressed: { opacity: 0.7 },
  detailHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 6,
  },
  detailHandleText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11.5,
    fontFamily: T.FONT.Bold,
    letterSpacing: -0.1,
  },
});

export default VideoOverlay;
