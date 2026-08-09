import React, { Component, useContext } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Button } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import Animated from 'react-native-reanimated';
import APIprovider from './APIprovider';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import Strings from './Strings';
import Utils from './utils';
import { CheckBox } from './Views';
import { Context } from '../Contexts';
import { moderateScale } from './utils/scailing';

function SelectAll({ items, onCartItemAllSelectChanged }) {
  const unselectedItem = items.find((item) => !item.isSelected);
  const allSelected = !unselectedItem;

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        onCartItemAllSelectChanged(items[0].seller.userId, !allSelected);
      }}
    >
      <View style={styles.selectAllContainer}>
        <CheckBox
          onChanged={(isChecked) => {
            onCartItemAllSelectChanged(items[0].seller.userId, !allSelected);
          }}
          value={allSelected}
          style={{ paddingHorizontal: 5, paddingVertical: 10 }}
        />
        <Text style={styles.selectAllTitle}>{Strings.SELECT_ALL}</Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

function OrderOptions({ options }) {
  const { checks, lists } = options;
  return (
    <View>
      {checks &&
        checks.length > 0 &&
        checks.map((check, idx) => (
          <View key={'key' + idx} style={styles.optionItemContainer}>
            <Text style={styles.optionName}>{check.name}</Text>
          </View>
        ))}
      {lists &&
        lists.length > 0 &&
        lists.map((list, idx) => (
          <View key={'key' + idx} style={styles.optionItemContainer}>
            <Text style={styles.optionName}>
              {list.name}: {list.selectedItemName}
            </Text>
          </View>
        ))}
    </View>
  );
}

function CartHeader({ item, onCartItemRemoved, onCartItemSelectChanged }) {
  return (
    <View style={styles.buyerCartHeaderContainer}>
      <CheckBox
        onChanged={(isChecked) => {
          onCartItemSelectChanged(item.cartItemId, isChecked);
        }}
        value={item.isSelected}
        style={{ paddingRight: 5, paddingVertical: 10 }}
      />
      <Text style={styles.productTitle} numberOfLines={1}>
        {item.product.title}
      </Text>
      <TouchableWithoutFeedback
        onPress={() => {
          onCartItemRemoved(item.cartItemId);
        }}
      >
        <FastImage
          style={styles.deleteButton}
          source={require('../Resources/img/iconRenewal/icHeaderClose22.png')}
        />
      </TouchableWithoutFeedback>
    </View>
  );
}

function CartBody({ item, navigation, region, KRWPerUSD }) {
  return (
    <View style={styles.buyerBodyContainer}>
      <TouchableWithoutFeedback
        onPress={() => {
          navigation.push('ProductPage', {
            productId: item.product.productId,
          });
        }}
      >
        <FastImage style={styles.productThumbnail} source={{ uri: item.product.thumbnailUrl }} />
      </TouchableWithoutFeedback>
      <View style={styles.descriptionContainer}>
        <OrderOptions options={item.options} />
        <Text style={styles.optionName}>
          {Strings.NUMBER_PRODUCTS}: {item.number}
        </Text>
        <Text style={styles.price}>{Utils.displayPrice(item.price, region, KRWPerUSD)}</Text>
      </View>
    </View>
  );
}

function CartItem(props) {
  const { onCartItemSelectChanged, item, KRWPerUSD } = props;
  const context = useContext(Context);
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        onCartItemSelectChanged(item.cartItemId, !item.isSelected);
      }}
    >
      <View key={props.key} style={styles.cartItemContainer}>
        <CartHeader {...props} />
        <CartBody {...props} region={context?.state?.region} KRWPerUSD={KRWPerUSD} />
      </View>
    </TouchableWithoutFeedback>
  );
}

function CartItemBySeller({
  key,
  navigation,
  data,
  onCartItemSelectChanged,
  onCartItemAllSelectChanged,
  onCartItemRemoved,
  onCartPaid,
  context,
}) {
  if (!data) {
    return <View />;
  }

  let priceToPay = 0;
  let shipmentCost = 0;
  let overseaShipmentCost = 0;
  let lowestOrderPriceForFreeDeliveryKR = 0;
  let lowestOrderPriceForFreeDeliveryUS = 0;

  const selectedItems = [];
  for (const item of data) {
    if (item.isSelected) {
      selectedItems.push(item);
      priceToPay += item.price;
      if (item.shipmentCost > shipmentCost) {
        shipmentCost = item.shipmentCost;
        overseaShipmentCost = item.shipmentCostUS;
        lowestOrderPriceForFreeDeliveryKR = item.lowestOrderPriceForFreeDeliveryKR;
        lowestOrderPriceForFreeDeliveryUS = item.lowestOrderPriceForFreeDeliveryUS;
      }
    }
  }
  const totalPriceToPay = priceToPay + shipmentCost;

  const shipmentCostKR =
    lowestOrderPriceForFreeDeliveryKR > 0 && priceToPay >= lowestOrderPriceForFreeDeliveryKR
      ? 0
      : shipmentCost;
  const shipmentCostUS =
    lowestOrderPriceForFreeDeliveryUS > 0 && priceToPay >= lowestOrderPriceForFreeDeliveryUS
      ? 0
      : overseaShipmentCost;
  const KRWPerUSD =
    context?.state?.KRWPerUSD || context?.props?.route?.params?.KRWPerUSD || Constants.KRW_PER_USD;

  return (
    <View key={key} style={styles.cartSellerContainer}>
      <View style={styles.sellerHeader}>
        <Text style={styles.sellerName}>{data[0].seller.name}</Text>
        <SelectAll items={data} onCartItemAllSelectChanged={onCartItemAllSelectChanged} />
      </View>

      <View style={styles.cartItemSellerContainer}>
        {data.map((cartItem, idx) => (
          <View>
            {idx > 0 && <View style={[styles.divider, { marginHorizontal: 20 }]} />}
            <CartItem
              key={cartItem._id}
              item={cartItem}
              navigation={navigation}
              onCartItemSelectChanged={onCartItemSelectChanged}
              onCartItemRemoved={onCartItemRemoved}
              KRWPerUSD={KRWPerUSD}
            />
          </View>
        ))}
      </View>

      {priceToPay > 0 && (
        <View style={styles.pricesContainer}>
          <View style={styles.priceItemContainer}>
            <Text style={styles.priceItemTitle}>{Strings.PRODUCT_PRICE}</Text>
            <Text style={styles.priceItemAmount}>
              {Utils.displayPrice(priceToPay, context?.context?.state?.region, KRWPerUSD)}
            </Text>
          </View>

          <>
            <Text style={{ color: Constants.TIER_COLORS.ARTISAN, marginBottom: 10, fontSize: 15 }}>
              {Strings.SHIPPING_REGION}
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
                <CheckBox
                  key={'checkoption_korea'}
                  onChanged={(value) => {
                    context.setState({ shippingRegion: Constants.COUNTRY.KOREA });
                  }}
                  value={context.state.shippingRegion === Constants.COUNTRY.KOREA}
                  style={{ marginRight: 8 }}
                />
                <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>{Strings.KR}</Text>
              </View>
              {selectedItems.findIndex((item) => item.shipmentCostUS > 0) !== -1 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <CheckBox
                    key={'checkoption_us'}
                    onChanged={(value) => {
                      context.setState({ shippingRegion: Constants.COUNTRY.US });
                    }}
                    value={context.state.shippingRegion === Constants.COUNTRY.US}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>{Strings.US}</Text>
                </View>
              ) : null}
            </View>
          </>

          <View style={styles.priceItemContainer}>
            <Text style={styles.priceItemTitle}>{Strings.SHIPMENT_COST}</Text>
            <Text style={styles.priceItemAmount}>
              {Utils.displayPrice(
                context.state.shippingRegion === Constants.COUNTRY.KOREA
                  ? shipmentCostKR ?? shipmentCost
                  : shipmentCostUS,
                context?.context?.state?.region,
                KRWPerUSD,
              )}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceItemContainer}>
            <Text style={styles.priceItemTitle}>{Strings.TOTAL_PRICE}</Text>
            <Text style={styles.priceItemAmountTotal}>
              {Utils.displayPrice(
                context.state.shippingRegion === Constants.COUNTRY.KOREA
                  ? priceToPay + (shipmentCostKR ?? shipmentCost)
                  : priceToPay + shipmentCostUS,
                context?.context?.state?.region,
                KRWPerUSD,
              )}
            </Text>
          </View>

          <Button
            containerStyle={styles.makeOrderButtonContainer}
            buttonStyle={{
              backgroundColor: Constants.COLOR_MAIN,
              height: 54,
            }}
            titleStyle={styles.makeOrderButtonTitle}
            title={Strings.PROCEED_TO_PAY(
              Utils.displayPrice(
                context.state.shippingRegion === Constants.COUNTRY.KOREA
                  ? priceToPay + (shipmentCostKR ?? shipmentCost)
                  : priceToPay + shipmentCostUS,
                context?.context?.state?.region,
                KRWPerUSD,
              ),
            )}
            onPress={() => {
              console.log(
                shipmentCost,
                shipmentCostUS,
                lowestOrderPriceForFreeDeliveryKR,
                lowestOrderPriceForFreeDeliveryUS,
              );

              navigation.push('MakeOrder', {
                cartItems: selectedItems,
                totalPrice: totalPriceToPay,
                shipmentCost,
                shipmentCostUS: overseaShipmentCost,
                lowestOrderPriceForFreeDeliveryKR,
                lowestOrderPriceForFreeDeliveryUS,
                shippingRegion: context.state.shippingRegion,
                KRWPerUSD,

                onSucceedToPay: (paidItems) => {
                  onCartPaid(paidItems);
                },
              });
            }}
          />
        </View>
      )}
    </View>
  );
}

const cartdata = [
  {
    cartItemId: 1234,
    orderId: 1234,
    buyer: {
      userId: 1234,
    },
    seller: {
      userId: 1234,
      name: '크롬',
      profilePicUrl:
        'https://play-lh.googleusercontent.com/KwUBNPbMTk9jDXYS2AeX3illtVRTkrKVh5xR1Mg4WHd0CG2tV4mrh1z3kXi5z_warlk',
    },
    statusCode: 0,
    product: {
      productId: 1234,
      thumbnailUrl: 'https://d2v80xjmx68n4w.cloudfront.net/gigs/zDyjn1506401650.jpg',
      title: 'Pet 드라이기',
    },
    options: {
      checks: [],
      lists: [],
    },
    number: 2,
    price: 50000,
  },
  {
    cartItemId: 1235,
    orderId: 1235,
    buyer: {
      userId: 1235,
    },
    seller: {
      userId: 1234,
      name: '크롬',
      profilePicUrl:
        'https://play-lh.googleusercontent.com/KwUBNPbMTk9jDXYS2AeX3illtVRTkrKVh5xR1Mg4WHd0CG2tV4mrh1z3kXi5z_warlk',
    },
    statusCode: 0,
    product: {
      productId: 1235,
      thumbnailUrl: 'http://image.newdaily.co.kr/site/data/img/2019/10/06/2019100600029_0.jpg',
      title: '삼성 크롬 세탁기',
    },
    options: {
      checks: [],
      lists: [],
    },
    number: 2,
    price: 50000,
  },
  {
    cartItemId: 1236,
    orderId: 1236,
    buyer: {
      userId: 1236,
    },
    seller: {
      userId: 1236,
      name: '사파리',
      profilePicUrl:
        'https://mblogthumb-phinf.pstatic.net/20160822_26/krazymouse_14718668293697GhzS_PNG/%BB%E7%C6%C4%B8%AE.png?type=w800',
    },
    statusCode: 0,
    product: {
      productId: 1236,
      thumbnailUrl:
        'https://img.insight.co.kr/static/2021/03/29/700/img_20210329143032_432tqe09.webp',
      title: '에버랜드 사파리',
    },
    options: {
      checks: [],
      lists: [],
    },
    number: 2,
    price: 1236,
  },
];

export default class MyOrderListScreen extends Component {
  static contextType = Context;
  constructor(props) {
    super(props);
    this.state = {
      cart: {},
      cartItemList: [],
      shippingRegion: Constants.COUNTRY.KOREA,
      KRWPerUSD: this.props?.route?.params?.KRWPerUSD || Constants.KRW_PER_USD,
    };
    this.isRefreshing = false;
  }

  componentDidMount() {
    const { navigation } = this.props;

    navigation.setOptions({
      title: Strings.CART,
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
      headerLeft: () => HeaderLeftBackButton({ navigation }),
    });

    // Cart 라우트에는 KRWPerUSD 파라미터가 없어 해외 표시가 환율 1로 계산되던 문제 —
    // 최신 환율을 직접 조회한다
    APIprovider.getCurrencyRate().then((result) => {
      if (result?.success && result.currencyRate) {
        this.setState({ KRWPerUSD: result.currencyRate });
      }
    });

    this.loadData();
  }

  getCartCallback(data) {
    this.updateCart(data);
    this.setState({
      isRefreshing: false,
    });
  }

  loadData() {
    if (this.isRefreshing === false) {
      this.isRefreshing = true;
      APIprovider.getCart()
        .then(this.getCartCallback.bind(this))
        .catch((err) => {
          Alert.alert(
            Strings.FAILED_TO_LOAD_CART,
            err.errorMsg ? err.errorMsg : '',
            [{ text: Strings.OK }],
            { cancelable: true },
          );
        });
    }
  }

  updateCart(data) {
    let sorted = {};
    for (let idxInput = 0; idxInput < data.length; idxInput++) {
      const cartItem = data[idxInput];
      const sellerId = data[idxInput].seller.userId;

      // check if the selller of the product is exist
      // if not, adding a seller with the product
      if (sorted[sellerId] === undefined) {
        sorted[sellerId] = [{ ...cartItem }];
      } else {
        // if true, adding the product to exist product
        sorted[sellerId].push({ ...cartItem });
      }
    }
    this.setState({
      cart: sorted,
      cartItemList: data,
    });
    this.isRefreshing = false;
  }

  onCartItemRemoved(cartItemId) {
    APIprovider.deleteCart(cartItemId)
      .then((result) => {
        const { cartItemList } = this.state;
        const idx = cartItemList.findIndex(function (item) {
          return item.cartItemId === cartItemId;
        });
        if (idx > -1) {
          cartItemList.splice(idx, 1);
        }
        this.updateCart(cartItemList);
      })
      .catch((err) => {
        if (err.errorCode === 0) {
          Alert.alert(
            Strings.FAILED_TO_DELETE,
            err.errorMsg ? err.errorMsg : '',
            [{ text: Strings.OK }],
            { cancelable: true },
          );
        }
      });
  }

  onCartItemSelectChanged(cartItemId, isSelected) {
    const { cartItemList } = this.state;
    const idx = cartItemList.findIndex((item) => item.cartItemId === cartItemId);
    cartItemList[idx].isSelected = isSelected;
    this.updateCart(cartItemList);
  }

  onCartItemAllSelectChanged(sellerId, isSelected) {
    const { cartItemList } = this.state;
    const cartItemsOfSeller = cartItemList.filter((item) => item.seller.userId === sellerId);
    for (let i = 0; i < cartItemsOfSeller.length; i++) {
      cartItemsOfSeller[i].isSelected = isSelected;
    }
    this.updateCart(cartItemList);
  }

  onCartPaid(paidItems) {
    //    return // @TODO: UPDATE LIST HERE

    this.loadData();
  }

  onCartItemListEnd() {
    this.isRefreshing = false;
  }

  render() {
    const cartOfSeller = Object.values(this.state.cart);
    const { cartItemList } = this.state;
    return (
      <SafeAreaView style={styles.container} contentContainerStyle={{ flex: 1 }}>
        <Animated.FlatList
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          data={cartOfSeller}
          renderItem={({ item, index }) => (
            <CartItemBySeller
              key={item._id + index}
              navigation={this.props.navigation}
              data={item}
              onCartItemSelectChanged={this.onCartItemSelectChanged.bind(this)}
              onCartItemAllSelectChanged={this.onCartItemAllSelectChanged.bind(this)}
              onCartItemRemoved={this.onCartItemRemoved.bind(this)}
              onCartPaid={this.onCartPaid.bind(this)}
              context={this}
            />
          )}
          keyExtractor={(item) => item.videoId}
          onEndReached={({ distanceFromEnd }) => {
            if (distanceFromEnd > 0 && cartItemList.length >= 10 && !this.isRefreshing) {
              this.isRefreshing = true;
              this.onCartItemListEnd();
            }
          }}
          onEndReachedThreshold={0.5}
          onRefresh={() => {}}
          refreshing={this.isRefreshing}
        />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  cartSellerContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellerName: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 15,
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllTitle: {
    color: Constants.COLOR_POINT_BLUE,
    fontSize: 15,
  },
  cartItemSellerContainer: {
    borderRadius: 10,
    backgroundColor: Constants.TIER_COLORS.PIONEER,
    marginBottom: 20,
  },
  buyerCartHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 6,
  },
  buyerBodyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
  },
  productThumbnail: {
    borderRadius: 4,
    width: 80,
    height: 80,
    marginRight: 13,
  },
  optionName: {
    fontSize: 13,
    color: Constants.TIER_COLORS.ARTISAN,
  },
  productTitle: {
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
    flex: 1,
    fontSize: 15,
    color: Constants.TIER_COLORS.ARTISAN,
    marginLeft: 4,
  },
  price: {
    marginTop: 6,
    fontSize: 15,
    color: 'black',
  },
  deleteButton: {
    width: 24,
    height: 24,
    marginLeft: 20,
  },
  descriptionContainer: {
    flex: 1,
  },
  pricesContainer: {},
  priceItemContainer: {
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceItemTitle: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 15,
  },
  priceItemAmount: {
    fontSize: 15,
    color: Constants.TIER_COLORS.ARTISAN,
    fontWeight: 'bold',
  },
  priceItemAmountTotal: {
    fontSize: 18,
    color: Constants.TIER_COLORS.ARTISAN,
    fontWeight: 'bold',
  },
  makeOrderButtonContainer: {
    marginTop: 10,
    marginBottom: Platform.OS === 'ios' ? 44 : 20,
    marginHorizontal: 20,
  },
  makeOrderButtonTitle: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: Constants.TIER_COLORS.STRIVER,
  },
});
