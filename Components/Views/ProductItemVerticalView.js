import React, { Component, useContext } from 'react';
import T from '../Constants/DesignTokens';
import { StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Context } from '../../Contexts';
import Constants from '../Constants';
import Utils, { getFormattedDate, getKRWPerUSD, isGuestUser } from '../utils';
import { ProductGradeBadgeView } from './';
import dayjs from 'dayjs';
import Strings, { getLanguage } from '../Strings';

const defaultStyle = {};

function ProductMain({ product, wide }) {
  // console.log(Constants.PRODUCT_GRID_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT);

  return (
    <View>
      {product.thumbnailUrl && (
        <FastImage
          resizeMode={'cover'}
          style={{
            width: '100%',
            height: wide
              ? Constants.PRODUCT_GRID_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT * 1.4
              : Constants.PRODUCT_GRID_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT,
            borderRadius: 14,
          }}
          source={{ uri: product.thumbnailUrl }}
        />
      )}
      {/* {product.isPromotion && product.eventType === 'refund' ? (
        <>
          <View
            style={{
              position: 'absolute',
              top: 5,
              left: 5,
              backgroundColor: 'rgba(255, 255, 255, .6)',
              borderRadius: 14,
            }}
          >
            <Text
              style={{
                color: 'black',
                paddingHorizontal: 5,
                paddingTop: 5,
                fontSize: 13,
                fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
              }}
            >
              {Strings.REFUND_EVENT_PRODUCT}
            </Text>
            {product.availableNumberToSale && product.availableNumberToSale > 0 ? (
              <Text
                style={{
                  // color: 'black',
                  color: '#3a3a3a',
                  paddingHorizontal: 5,
                  paddingBottom: 5,
                  fontSize: 12,
                  fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
                }}
              >
                {Strings.PRODUCT_REMAINING_QUANTITY(product.availableNumberToSale)}
              </Text>
            ) : null}
          </View>
          {product.availableNumberToSale === 0 ? (
            <View
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  height: 30,
                  width: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  // borderRadius: 14,
                  // transform: [{ rotate: '135deg' }],
                }}
              />
              <Text style={{ fontFamily: Constants.CUSTOM_FONTS.SUIT.EXTRABOLD, fontSize: 22, color: 'red' }}>
                Sold Out
              </Text>
            </View>
          ) : null}
        </>
      ) : null} */}
      <ProductGradeBadgeView
        ratingScore={product.ratingScore}
        ratingCount={product.ratingCount}
        reviewCount={product.linkedVideoCount}
        style={styles.productGradeBadgeView}
        isRefundable={product.isPromotion && product.eventType === 'refund'}
        availableNumberToSale={product.availableNumberToSale}
        isVertical={true}
      />
    </View>
  );
}

function ProductFooter({ product, wide, KRWPerUSD, logonUserId }) {
  return (
    <View style={{ marginTop: 13 }}>
      <Text style={styles.productTitle} numberOfLines={wide ? 1 : 2}>
        {product.title}
      </Text>
      {isGuestUser(logonUserId) ? (
        <PricePrivate />
      ) : (
        <ProductPrice product={product} doubleLines={!wide} KRWPerUSD={KRWPerUSD} />
      )}
    </View>
  );
}

function ProductPrice({ product, doubleLines, KRWPerUSD = 1300 }) {
  const global = useContext(Context);
  if (!product.productId) {
    return <View />;
  }
  if (product.discountPrice > 0) {
    return (
      <View style={doubleLines ? styles.priceContainerDoubleRow : styles.priceContainerInRow}>
        <View style={styles.discountPriceContainer}>
          <Text style={styles.discountRate}>-{Utils.displayDiscountRate(product.discountRate)}%</Text>
          <Text style={styles.discountPrice}>
            {Utils.displayPrice(product.discountPrice, global.state.region, KRWPerUSD)}
          </Text>
        </View>
        <Text style={styles.originalPrice}>
          {Utils.displayPrice(product.price, global.state.region, KRWPerUSD)}
        </Text>
      </View>
    );
  } else {
    return (
      <Text style={styles.price}>
        {Utils.displayPrice(product.price, global.state.region, KRWPerUSD)}
      </Text>
    );
  }
}

export function PricePrivate({ style }) {
  return (
    <View>
      <Text style={{ ...styles.pricePrivate, ...style }}>
        {Strings.SIGN_IN_AND_CHECK_LOWEST_PRICE}
      </Text>
    </View>
  );
}

export default class ProductListItemView extends Component {
  static defaultProps = {
    style: {
      //        width: defaultStyle.width,
      //        height: defaultStyle.height,
    },
    data: {
      productId: '',
      thumbnailUrl: Constants.NO_IMAGE_URL,
      title: '',
      externalLink: '',
      description: '',
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
    wide: null,
    onPress: () => {},
    noPromotion: false,
  };

  constructor(props) {
    super(props);

    this.state = {
      KRWPerUSD: 1300,
    };
  }

  async componentDidMount() {
    // const KRWPerUSD = await getKRWPerUSD();
    // this.setState({ KRWPerUSD: KRWPerUSD });
  }

  render() {
    const { data, logonUserId, KRWPerUSD } = this.props;

    return (
      <View
        style={[
          defaultStyle,
          this.props.style,
          { marginBottom: isGuestUser(logonUserId) ? -20 : 0 },
        ]}
      >
        <ProductMain product={data} wide={this.props.wide} />
        <ProductFooter
          product={data}
          wide={this.props.wide}
          KRWPerUSD={KRWPerUSD}
          logonUserId={logonUserId}
        />
      </View>
    );
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
    flexWrap: 'wrap',
    fontSize: 13, //15
    lineHeight: 19,
    color: T.COLORS.INK,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
  },
  priceContainerInRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceContainerDoubleRow: {
    alignItems: 'flex-start',
  },
  discountPriceContainer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountRate: {
    // color: 'red',
    color: Constants.COLOR_POINT_BLUE,
    fontSize: 16,
    // fontWeight: '600',
    marginRight: 6,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
  discountPrice: {
    fontSize: 14, //16,
    color: 'black',
    marginRight: 10,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM,
  },
  originalPrice: {
    marginTop: 4,
    fontSize: 10, //14,
    color: T.COLORS.GREY,
    textDecorationLine: 'line-through',
    fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM,
  },
  price: {
    marginTop: 4,
    fontSize: 13, //15,
    color: 'black',
  },
  reputationContainer: {
    position: 'absolute',
    bottom: 8,
    marginLeft: 6,
    paddingRight: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    flexDirection: 'row',
    borderRadius: 20,
    alignSelf: 'flex-start',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  productRatingIcon: {
    width: 10,
    height: 10,
  },
  productRatingScore: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  reviewCount: {
    color: 'white',
    fontSize: 11,
    marginLeft: 6,
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
  summaryTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  thumbnailSummaryType: {
    width: 64,
    height: 64,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    marginRight: 14,
  },
  summaryInfoContainer: {
    flex: 1,
    paddingRight: 20,
  },
  productGradeBadgeView: {
    position: 'absolute',
    marginLeft: 6,
    bottom: 8,
  },
  externalLink: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  pricePrivate: {
    marginTop: 5,
    fontSize: getLanguage() === 'ko' ? 14 : 11,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
    // color: T.COLORS.AMBER,
    color: Constants.COLOR_POINT_BLUE,
  },
});
