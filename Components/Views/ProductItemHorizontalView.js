import React, { Component, useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Context } from '../../Contexts';
import Constants from '../Constants';
import Utils, { getKRWPerUSD } from '../utils';
import { ProductGradeBadgeView } from './';

const defaultStyle = {
  width: '100%',
};

function ProductRatingScore({ ratingScore }) {
  return (
    <View style={styles.ratingContainer}>
      <FastImage style={styles.productRatingIcon} />
      <Text style={styles.productRatingScore}>{ratingScore}</Text>
    </View>
  );
}

function ProductPrice({ product, doubleLines, KRWPerUSD }) {
  console.log('vertical view KRWPerUSD', KRWPerUSD);

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

export default class ProductItemHorizontalView extends Component {
  static defaultProps = {
    style: {
      width: defaultStyle.width,
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
  };

  constructor(props) {
    super(props);
    this.state = {
      KRWPerUSD: 1300,
    };
  }

  async componentDidMount() {
    const KRWPerUSD = await getKRWPerUSD();
    this.setState({ KRWPerUSD: KRWPerUSD });
  }
  renderSummaryInfo() {
    const { data } = this.props;
    if (data.hasOwnProperty('productId') && data.productId !== '') {
      return (
        <View style={styles.listVerticalTypeDetailsContainer}>
          <ProductPrice product={data} doubleLines KRWPerUSD={this.props.KRWPerUSD} />
          {/* <ProductPrice product={data} doubleLines KRWPerUSD={this.state.KRWPerUSD} /> */}
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

  render() {
    const { data } = this.props;
    return (
      <View style={[styles.verticalTypeContainer, this.props.style]}>
        <View style={styles.verticalTypeLeftContainer}>
          <FastImage
            resizeMode={'cover'}
            style={styles.thumbnailVerticalListType}
            source={{
              uri: data.thumbnailUrl ? data.thumbnailUrl : Constants.NO_IMAGE_URL,
            }}
          />

          {/* {data.isPromotion && data.eventType === 'refund' ? (
            <>
              <View
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  backgroundColor: 'rgba(255, 255, 255, .6)',
                  borderRadius: 14,
                }}
              >
                <Text
                  style={{
                    color: 'black',
                    paddingHorizontal: 5,
                    paddingVertical: 5,
                    fontSize: 12,
                    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                  }}
                >
                  {Strings.REFUND_EVENT_PRODUCT}
                </Text>
              </View>
              {data.availableNumberToSale === 0 ? (
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
                      height: 25,
                      width: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                  />
                  <Text style={{ fontFamily: Constants.CUSTOM_FONTS.SUIT.EXTRABOLD, fontSize: 16, color: 'red' }}>
                    Sold Out
                  </Text>
                </View>
              ) : null}
            </>
          ) : null} */}

          <View style={styles.productGradeBadgeViewContainer}>
            <ProductGradeBadgeView
              ratingScore={data.ratingScore}
              ratingCount={data.ratingCount}
              reviewCount={data.linkedVideoCount}
              isRefundable={data.isPromotion && data.eventType === 'refund'}
              availableNumberToSale={data.availableNumberToSale}
              isVertical={false}
            />
          </View>
        </View>
        <View style={styles.verticalInfoContainer}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {data.title}
          </Text>
          {this.renderSummaryInfo()}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
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
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
    flexWrap: 'wrap',
    fontSize: 15,
    lineHeight: 19,
    color: Constants.TIER_COLORS.ARTISAN,
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
    color: Constants.COLOR_POINT_BLUE,
    fontSize: 15,
    fontWeight: '600',
    marginRight: 6,
  },
  discountPrice: {
    fontSize: 15,
    color: 'black',
    marginRight: 10,
  },
  originalPrice: {
    marginTop: 4,
    fontSize: 13,
    color: Constants.TIER_COLORS.OPERATOR,
    textDecorationLine: 'line-through',
  },
  price: {
    marginTop: 4,
    fontSize: 15,
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
  verticalTypeContainer: {
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  thumbnailVerticalListType: {
    width: Constants.PRODUCT_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_WIDTH,
    height: Constants.PRODUCT_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT,
    borderRadius: 4,
  },
  productGradeBadgeViewContainer: {
    position: 'absolute',
    bottom: 0, // 8
    // marginLeft: 6,
    alignSelf: 'center',
  },
  verticalInfoContainer: {
    flex: 1,
    marginTop: 13,
    marginLeft: 13,
    marginRight: 5,
  },
  externalLink: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
