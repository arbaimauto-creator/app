import T from '../../Components/Constants/DesignTokens';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
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
const CAPTION_LINES_COLLAPSED = 2;
// LayoutAnimation은 쓰지 않는다 — Android에서 펼친 뒤 바깥 페이저가 터치를 못 받는 현상(2026-09-14 에뮬 실측)
const CAPTION_LINES_EXPANDED = 12;

function VideoOverlay({ context }) {
  const review = context.state.video;
  const title = (review.titleByCountry || review.title || '').trim();
  // 인스타그램식: 리뷰 본문이 캡션에 함께 붙는다 — 이전엔 제목만 있고 본문은 별도 스크롤 상세에만 있었다
  const body = plainText(review.descriptionByCountry || review.description);
  const hashTags = Array.isArray(review.hashTags) ? [...new Set(review.hashTags)] : [];
  const captionText = [title, body].filter(Boolean).join('\n');
  const [captionTruncated, setCaptionTruncated] = useState(false);
  // 인스타그램 릴스식: 영상을 탭하면 오버레이가 통째로 사라졌다 다시 나타난다.
  // 캡션은 기본 2줄로 접고, 캡션만 따로 탭하면 펼쳐진다 (오버레이는 유지).
  const visible = context.state.isShowingVideoInfo !== false;
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
    if (!visible) {
      setCaptionExpanded(false);
    }
  }, [visible, fade]);

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {/* 영상 탭 영역 — 오버레이 뒤에 깔려 빈 곳을 누르면 토글된다.
          레일·캡션 등 실제 컨트롤은 이 위에 있으므로 각자의 onPress가 우선한다. */}
      <TouchableWithoutFeedback onPress={() => context.toggleVideoInfo?.()}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[styles.overlayFade, { opacity: fade }]}
        pointerEvents={visible ? 'box-none' : 'none'}
      >
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
            <Text
              style={styles.authorSubText}
            >{` ・ ${Strings.VIEW_COUNT(review.viewCount)}`}</Text>
            {review?.isSponsored ? (
              <Text style={[styles.authorSubText, { color: T.COLORS.AMBER }]}>
                {` ・ ${Strings.SPONSORED}`}
              </Text>
            ) : null}
          </View>

          {captionText !== '' ? (
            <View style={captionExpanded ? styles.captionExpandedBox : null}>
              {/* Text.onPress는 Android에서 clickable TextView가 돼 세로 스와이프를 삼킨다(페이저가 못 받음).
                  Touchable 래퍼는 페이저에 제스처를 넘기므로 캡션 탭은 이걸로 받는다. */}
              <TouchableWithoutFeedback
                onPress={() => {
                  setCaptionExpanded((v) => !v);
                }}
              >
                <View>
                  <Text
                    style={styles.caption}
                    numberOfLines={
                      captionExpanded ? CAPTION_LINES_EXPANDED : CAPTION_LINES_COLLAPSED
                    }
                    onTextLayout={(e) => {
                      // 접힌 상태에서 잘렸는지 — 잘린 경우에만 "더보기"를 붙인다
                      if (!captionExpanded) {
                        setCaptionTruncated(e.nativeEvent.lines.length > CAPTION_LINES_COLLAPSED);
                      }
                    }}
                  >
                    {captionText}
                  </Text>
                </View>
              </TouchableWithoutFeedback>
              {captionExpanded && hashTags.length > 0 ? (
                <View style={styles.hashTagRow}>
                  {hashTags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      activeOpacity={0.7}
                      onPress={() =>
                        context.props.navigation.push('Search', {
                          hashTag: tag,
                          isHashtagSearch: true,
                        })
                      }
                    >
                      <Text style={styles.hashTag}>{`#${tag}`}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              {captionExpanded || captionTruncated ? (
                <TouchableOpacity
                  onPress={() => {
                    setCaptionExpanded((v) => !v);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 24 }}
                  accessibilityRole="button"
                  style={styles.captionToggleHit}
                >
                  <Text style={styles.captionToggle}>
                    {captionExpanded ? Strings.CAPTION_LESS : Strings.CAPTION_MORE}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <ProductCard context={context} />

          {/* 나머지 상세(댓글·문의·연관 리뷰)는 같은 쇼츠 위의 시트로 — 세로 스와이프는 계속 다음 쇼츠 */}
          <TouchableOpacity
            style={styles.detailHandle}
            activeOpacity={0.7}
            onPress={() => context.openDetails()}
            accessibilityRole="button"
            accessibilityLabel={Strings.VIDEO_DETAILS_OPEN}
          >
            <IconMaterialIcons name="keyboard-arrow-up" size={22} color="#fff" />
            <Text style={styles.detailHandleText}>{Strings.VIDEO_DETAILS_OPEN}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// 피드는 하단 탭 네비게이터 안에서 열린다 — 탭바 높이만큼 오버레이를 올린다.
const TAB_BAR_INSET = 76;

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  // 탭 토글 시 레일·캡션이 함께 페이드되는 레이어
  overlayFade: {
    ...StyleSheet.absoluteFillObject,
  },
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
  authorSubText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
  },
  // 펼친 캡션 — 영상 위에서 읽히도록 반투명 바탕
  captionExpandedBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
  },
  captionToggleHit: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
  captionToggle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    marginTop: 4,
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
