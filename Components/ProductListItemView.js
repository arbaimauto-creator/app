import { useRoute } from '@react-navigation/native';
import FEATURES from './Constants/Features';
import T from './Constants/DesignTokens';
import dayjs from 'dayjs';
import { PureComponent, useContext } from 'react';
import {
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import IconFeather from 'react-native-vector-icons/Feather';
import { Context } from '../Contexts';
import Constants from './Constants';
import Strings from './Strings';
import Utils, { LogoutAlert, getFormattedDate, isGuestUser } from './utils';
import { ProductItemHorizontalView, ProductItemVerticalView } from './Views';
import { PricePrivate } from './Views/ProductItemVerticalView';

const VIEW_TYPE_LIST_VERTICAL = 'list_vertical';

const defaultStyle = {
  width: '100%',
  height: '100%',
};

function ProductPrice({ product, doubleLines, KRWPerUSD }) {
  const discountRate = product.discountRate || product?.productId?.discountRate;
  const discountPrice = product.discountPrice || product?.productId?.discountPrice;
  const price = product.price || product.productId?.price;

  const global = useContext(Context);
  const {
    params: { logonUserId },
  } = useRoute();

  if (!product.productId) {
    return <View />;
  }

  // 커머스 숨김(v2 §D5): 가격 블록 전체를 플래그 뒤로. 리뷰 상세의 연결 상품 카드가
  // 이 경로를 타면서 "Sign in and Check Lowest Price"가 계속 노출되고 있었다.
  if (!FEATURES.COMMERCE) {
    return <View />;
  }

  if (isGuestUser(logonUserId)) {
    return <PricePrivate />;
  }

  if (discountPrice > 0) {
    return (
      <View style={doubleLines ? styles.priceContainerDoubleRow : styles.priceContainerInRow}>
        <View style={styles.discountPriceContainer}>
          <Text style={styles.discountRate}>-{Utils.displayDiscountRate(discountRate)}%</Text>
          <Text style={styles.discountPrice}>
            {Utils.displayPrice(discountPrice, global.state.region, KRWPerUSD)}
          </Text>
        </View>
        <Text style={styles.originalPrice}>
          {Utils.displayPrice(price, global.state.region, KRWPerUSD)}
        </Text>
      </View>
    );
  }

  return (
    <Text style={styles.price}>{Utils.displayPrice(price, global.state.region, KRWPerUSD)}</Text>
  );
}

export default class ProductListItemView extends PureComponent {
  static defaultProps = {
    style: {},
    data: {
      productId: '',
      thumbnailUrl: Constants.NO_IMAGE_URL,
      title: '',
      externalLink: '',
      description: '',
      countryCode: undefined,
      seller: {
        name: '',
      },
      starCount: 0,
      ratingScore: 0,
      ratingCount: 0,
      reviewCount: 0,
      linkedVideoCount: 0,
      revenueTotal: 0,
      revenueNew: 0,
      promotionAmount: 0,
      promotionTimestampBy: 0,
      liked: false,
    },
    type: VIEW_TYPE_LIST_VERTICAL,
    width: null,
    onPress: () => {},
    noPromotion: false,
    disableDefaultNavigation: false,
  };

  constructor(props) {
    super(props);
    this.isTouchValid = true;
    this.touchTimeout = null;
    this.state = {
      KRWPerUSD: this.props.KRWPerUSD || 1300,
    };
  }

  componentWillUnmount() {
    // 리스트 아이템은 스크롤 중 대량 마운트/언마운트되므로 타이머를 반드시 정리
    if (this.touchTimeout != null) {
      clearTimeout(this.touchTimeout);
      this.touchTimeout = null;
    }
  }

  async onClicked() {
    const { data, logonUserId, disableDefaultNavigation } = this.props;

    if (isGuestUser(logonUserId)) {
      let productId;
      if (typeof data.productId === 'object') {
        productId = data.productId._id;
      } else if (typeof data.productId === 'string') {
        productId = data.productId;
      }

      this.props.route.path = `products/${productId}`;
      return LogoutAlert(this.props);
    }

    const onPressResult = this.props.onPress(this.props.data);

    if (disableDefaultNavigation) {
      return;
    }

    if (onPressResult !== false && data.productId) {
      const currentDate = dayjs();
      const promotionStartDate = dayjs(getFormattedDate(data.promotionStartDate));
      const promotionEndDate = dayjs(getFormattedDate(data.promotionEndDate));

      if (data.isPromotion && !currentDate.isAfter(promotionStartDate)) {
        Alert.alert(
          Strings.PROMOTION_PERIOD_NOT_STARTED_YET_TITLE,
          Strings.PROMOTION_PERIOD_NOT_STARTED_YET_CONTENT(
            getFormattedDate(data.promotionStartDate),
          ),
          [{ text: Strings.OK }],
        );
        return;
      }

      if (data.isPromotion && !currentDate.isSameOrBefore(promotionEndDate)) {
        Alert.alert(
          Strings.PROMOTION_PERIOD_EXPIRED_TITLE,
          Strings.PROMOTION_PERIOD_EXPIRED_CONTENT(getFormattedDate(data.promotionEndDate)),
          [{ text: Strings.OK }],
        );
        return;
      }

      this.props.navigation.push('ProductPage', {
        productId: data.productId._id || data.productId,
        videoId: this.props.videoId,
        onItemRemoved: this.props.onItemRemoved,
        fetchData: () => (this.props?.fetchData || (() => {}))(),
      });
    } else if (data.externalLink) {
      const supported = await Linking.canOpenURL(data.externalLink);
      if (supported) {
        await Linking.openURL(data.externalLink);
      } else {
        Alert.alert(`${Strings.UNSUPPORTED_EXTERNAL_URL}: ${data.externalLink}`);
      }
    }
  }

  renderPromotion() {
    const { data } = this.props;
    if (!this.props.noPromotion && data.promotionTimestampBy > new Date().getTime()) {
      return (
        <View style={styles.promotion}>
          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>Promo</Text>
        </View>
      );
    }
  }

  renderSummaryInfo() {
    const { data } = this.props;

    if (data.hasOwnProperty('productId') && data.productId !== '') {
      return (
        <View style={styles.listVerticalTypeDetailsContainer}>
          <ProductPrice product={data} KRWPerUSD={this.props.KRWPerUSD} />
        </View>
      );
    } else if (data.hasOwnProperty('externalLink') && data.externalLink !== '') {
      return (
        <View>
          <Text style={styles.externalLink} numberOfLines={1}>
            {data.externalLink}
          </Text>
        </View>
      );
    }
  }

  renderThumbnailSummaryType() {
    const { data } = this.props;
    if (data.thumbnailUrl) {
      return (
        <FastImage
          resizeMode={'cover'}
          style={styles.thumbnailSummaryType}
          source={{
            uri: data.thumbnailUrl ? data.thumbnailUrl : Constants.NO_IMAGE_URL,
          }}
        />
      );
    } else if (data.hasOwnProperty('externalLink') && data.externalLink !== '') {
      return (
        <View
          style={[
            styles.thumbnailSummaryType,
            {
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
        >
          <IconFeather size={20} name="external-link" color="#999" />
        </View>
      );
    }
  }

  render() {
    const { data } = this.props;
    switch (this.props.type) {
      case VIEW_TYPE_LIST_VERTICAL:
        return (
          <View>
            {Platform.OS === 'android' ? (
              <TouchableNativeFeedback onPress={this.onClicked.bind(this)} activeOpacity={0.9}>
                <View>
                  <ProductItemHorizontalView
                    data={data}
                    style={this.props.style}
                    KRWPerUSD={this.props.KRWPerUSD}
                  />
                </View>
              </TouchableNativeFeedback>
            ) : (
              <TouchableOpacity onPress={this.onClicked.bind(this)} activeOpacity={0.9}>
                <View>
                  <ProductItemHorizontalView
                    data={data}
                    style={this.props.style}
                    KRWPerUSD={this.props.KRWPerUSD}
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>
        );
      default:
        return (
          <View>
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
                <View>
                  <ProductItemVerticalView
                    data={data}
                    style={this.props.style}
                    wide={this.props.wide}
                    logonUserId={this.props.logonUserId}
                    KRWPerUSD={this.props.KRWPerUSD}
                  />
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
              >
                <View>
                  <ProductItemVerticalView
                    data={data}
                    style={this.props.style}
                    wide={this.props.wide}
                    logonUserId={this.props.logonUserId}
                    KRWPerUSD={this.props.KRWPerUSD}
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>
        );
    }
  }
}

const styles = StyleSheet.create({
  promotion: {
    position: 'absolute',
    padding: 4,
    backgroundColor: Constants.COLOR_MAIN,
    margin: 4,
    right: 0,
  },
  listVerticalTypeDetailsContainer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  thumbnail: {
    width: '100%',
    height: Constants.PRODUCT_GRID_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT,
    borderRadius: 4,
  },
  productTitle: {
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
    flexWrap: 'wrap',
    fontSize: 15,
    lineHeight: 19,
    color: T.COLORS.INK,
  },
  priceContainerInRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceContainerDoubleRow: {
    alignItems: 'flex-start',
  },
  discountPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountRate: {
    color: Constants.COLOR_POINT_BLUE,
    fontSize: 15,
    fontWeight: '600',
    marginRight: 6,
  },
  discountPrice: {
    fontSize: 15,
    color: T.COLORS.INK,
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 13,
    color: T.COLORS.GREY,
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 15,
    color: 'black',
  },
  externalLink: {
    marginTop: 5,
    color: 'rgb(69, 139, 210)',
  },
  thumbnailSummaryType: {
    width: 64,
    height: 64,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    marginRight: 14,
  },
  summaryInfoContainer: {
    flex: 1,
    paddingRight: 20,
  },
  summaryTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: Constants.TIER_COLORS.PIONEER,
  },
});
