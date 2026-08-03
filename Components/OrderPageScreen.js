import Clipboard from '@react-native-clipboard/clipboard';
import React, { useContext } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-easy-toast';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { getStatusBarHeight } from 'react-native-safearea-height';
import APIprovider from './APIprovider';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import OrderListItemView from './OrderListItemView';
import Strings from './Strings';
import Utils from './utils';
import { Context } from '../Contexts';
import { moderateScale } from './utils/scailing';

let toastRef;

const paymentMethod = {
  [Constants.KOVAN_PAY_GROUP.CREDIT_CARD]: {
    [Constants.KOVAN_PAY_METHOD.CREDIT_CARD]: '신용카드',
  },
  [Constants.KOVAN_PAY_GROUP.KAKAO_PAY]: {
    [Constants.KOVAN_PAY_METHOD.CREDIT_CARD]: '카카오페이 신용카드',
    [Constants.KOVAN_PAY_METHOD.SIMPLE_PAY]: '카카오페이 머니',
  },
  [Constants.KOVAN_PAY_GROUP.NAVER_PAY]: {
    [Constants.KOVAN_PAY_METHOD.CREDIT_CARD]: '네이버페이 신용카드',
    [Constants.KOVAN_PAY_METHOD.SIMPLE_PAY]: '네이버페이 포인트',
  },
};

function formatDate(date) {
  const payDate = new Date(date);
  const payDateYear = payDate.getFullYear();
  const payDateMonth = ('0' + (1 + payDate.getMonth())).slice(-2);
  const payDateDate = ('0' + payDate.getDate()).slice(-2);
  const payDateString = `${payDateYear}.${payDateMonth}.${payDateDate}`;
  return payDateString;
}

function OrderDate({ order }) {
  const payDate = new Date(order.paidAt);
  const payDateYear = payDate.getFullYear();
  const payDateMonth = ('0' + (1 + payDate.getMonth())).slice(-2);
  const payDateDate = ('0' + payDate.getDate()).slice(-2);
  const payDateString = `${payDateYear}.${payDateMonth}.${payDateDate}`;
  return (
    <View style={styles.topItemContainer}>
      <Text style={styles.topItemTitle}>{Strings.ORDER_DATE}</Text>
      <Text style={styles.topItemValue}>{payDateString}</Text>
    </View>
  );
}

function OrderNo({ order }) {
  return (
    <View style={[styles.topItemContainer, { marginTop: 10 }]}>
      <Text style={styles.topItemTitle}>{Strings.ORDER_NO}</Text>
      <Text style={styles.topItemValue}>{order.orderId}</Text>
    </View>
  );
}

function OrderProduct({ order, navigation, viewMode, KRWPerUSD }) {
  return (
    <View>
      <Text style={styles.infoTitle}>{Strings.PRODUCTS}</Text>
      <OrderListItemView
        navigation={navigation}
        data={order}
        //          onOrderAction={this.onOrderAction.bind(this)}
        mode={viewMode === 'buyer' ? 'myorder_detail' : 'mystore_detail'}
        KRWPerUSD={KRWPerUSD}
      />
    </View>
  );
}

function Orderer({ order }) {
  return (
    <View>
      <Text style={styles.infoTitle}>{Strings.ORDERER_INFO}</Text>
      <View style={styles.infoItemContainer}>
        <Text style={styles.infoItemTitle}>{Strings.ORDERER_NAME}</Text>
        <Text style={styles.infoItemValue}>{order.buyerName}</Text>
      </View>
      <View style={styles.infoItemContainer}>
        <Text style={styles.infoItemTitle}>{Strings.PHONE}</Text>
        <Text style={styles.infoItemValue}>{order.buyerPhone}</Text>
      </View>
      <View style={styles.infoItemContainer}>
        <Text style={styles.infoItemTitle}>{Strings.EMAIL}</Text>
        <Text style={styles.infoItemValue}>{order.buyerEmail}</Text>
      </View>
      <View style={styles.infoItemContainer}>
        <Text style={styles.infoItemTitle}>{Strings.MEMO}</Text>
        <Text style={styles.infoItemValue}>{order.memo}</Text>
      </View>
    </View>
  );
}

function Receiver({ order }) {
  return (
    <View>
      <Text style={styles.infoTitle}>{Strings.SHIPPING_INFO}</Text>
      <View style={styles.infoItemContainer}>
        <Text style={styles.infoItemTitle}>{Strings.RECEIVER_NAME}</Text>
        <Text style={styles.infoItemValue}>{order.receiverName}</Text>
      </View>
      <View style={styles.infoItemContainer}>
        <Text style={styles.infoItemTitle}>{Strings.PHONE}</Text>
        <Text style={styles.infoItemValue}>{order.receiverPhone}</Text>
      </View>
      <View style={styles.infoItemContainer}>
        <Text style={styles.infoItemTitle}>{Strings.ADDRESS}</Text>
        <Text style={styles.infoItemValue}>{order.address}</Text>
      </View>
    </View>
  );
}

function Payment({ order, KRWPerUSD }) {
  const global = useContext(Context);
  const { PAY_GROUP: payGroup, PAY_METHOD: payMethod } = order.payment;
  console.log(order.payment);

  return (
    <View>
      <Text style={styles.infoTitle}>{Strings.PAYMENT_INFO}</Text>
      <View style={styles.infoItemContainer}>
        <Text style={styles.infoItemTitle}>{Strings.ORDER_AMOUNT}</Text>
        <Text style={styles.infoItemValue}>
          {Utils.displayPrice(
            order.totalPrice - order.shipmentCost,
            global?.state?.region,
            KRWPerUSD,
          )}
        </Text>
      </View>
      <View style={styles.infoItemContainer}>
        <Text style={styles.infoItemTitle}>{Strings.SHIPMENT_COST}</Text>
        <Text style={styles.infoItemValue}>
          +{Utils.displayPrice(order.shipmentCost, global?.state?.region, KRWPerUSD)}
        </Text>
      </View>
      {order.rewardUse ? (
        <>
          <View style={styles.infoItemContainer}>
            <Text style={styles.infoItemTitle}>{Strings.PRICE_TO_PAY}</Text>
            <Text style={styles.infoItemValue}>
              {Utils.displayPrice(order.totalPrice, global?.state?.region, KRWPerUSD)}
            </Text>
          </View>
          <View style={styles.infoItemContainer}>
            <Text style={styles.infoItemTitle}>{Strings.POINT_TYPE.DEDUCT}</Text>
            <Text style={styles.infoItemValue}>
              -{Utils.displayPrice(order.rewardUse, global?.state?.region, KRWPerUSD)}
            </Text>
          </View>
        </>
      ) : null}
      {order.discountCode ? (
        <>
          <View style={styles.infoItemContainer}>
            <Text style={styles.infoItemTitle}>{'프로모션 코드 할인'}</Text>
            <Text style={styles.infoItemValue}>
              -{Utils.displayPrice(order.promotionDiscount, global?.state?.region, KRWPerUSD)}
            </Text>
          </View>
        </>
      ) : null}
      <View style={styles.infoItemContainer}>
        <Text style={styles.infoItemTitle}>결제수단</Text>
        <Text style={styles.infoItemValue}>{paymentMethod[payGroup]?.[payMethod] || '리워드'}</Text>
      </View>
      <View style={styles.infoItemContainer}>
        <Text style={styles.infoItemTitle}>{Strings.TOTAL_PRICE}</Text>
        <Text style={styles.infoItemValue}>
          {Utils.displayPrice(
            order.totalPrice - order.rewardUse - order.promotionDiscount,
            global?.state?.region,
            KRWPerUSD,
          )}
        </Text>
      </View>
    </View>
  );
}

function Revenue({ order, viewMode, KRWPerUSD }) {
  const global = useContext(Context);

  if (order.statusCode !== Constants.ORDER_STATUS_CODE.PURCHASE_COMPLETED || viewMode === 'buyer') {
    return <View />;
  }

  return (
    <View>
      <Text style={styles.infoTitle}>{Strings.REVENUE_SETTLEMENT}</Text>
      <View style={styles.infoItemContainer}>
        <Text style={styles.infoItemTitle}>
          {Strings.PLATFORM_COMMISSION}({order.platformFeeRate * 100}%)
        </Text>
        <Text style={styles.infoItemValue}>
          -{Utils.displayPrice(order.platformFeeAmount, global?.state?.region, KRWPerUSD)}
        </Text>
      </View>
      <View style={styles.infoItemContainer}>
        <Text style={styles.infoItemTitle}>
          {Strings.PAYMENT_COMMISSION}({(order.payment.paymentCommissionRate * 100).toFixed(1)}%)
        </Text>
        <Text style={styles.infoItemValue}>
          -
          {Utils.displayPrice(
            order.payment.paymentCommissionAmount,
            global?.state?.region,
            KRWPerUSD,
          )}
        </Text>
      </View>
      <View style={styles.infoItemContainer}>
        <Text style={styles.infoItemTitle}>{Strings.REVENUE}</Text>
        <Text style={[styles.infoItemValue, { color: Constants.COLOR_RED }]}>
          {Utils.displayPrice(order.revenue, global?.state?.region, KRWPerUSD)}
        </Text>
      </View>
    </View>
  );
}

function CopyOrderDetail({ order }) {
  return (
    <TouchableOpacity
      onPress={() => {
        let content = '';
        content = content + `${Strings.ORDER_DETAIL}\n`;
        content = content + `${Strings.ORDER_DATE} : ${formatDate(order.paidAt)}\n`;
        content = content + `${Strings.ORDER_NO} : ${order.orderId}\n`;

        content = content + `\n${Strings.ORDERED_PRODUCT_DETAIL}\n`;
        order.cartItems.forEach((item) => {
          content = content + `  ${item.product.title}\n`;
          content = content + `  - ${Strings.ORDER_QUANTITY} : ${item.number}\n`;
          item.options.lists.forEach((listItem) => {
            content = content + `  - ${listItem.name} : ${listItem.selectedItemName}\n`;
          });
          item.options.checks.forEach((listItem) => {
            content = content + `  - ${Strings.ADDITIONAL_PRODUCT} : ${listItem.name}\n`;
          });
        });
        content = content + `\n${Strings.ORDERER_INFO}\n`;
        content = content + `${Strings.ORDERER_NAME} : ${order.buyerName}\n`;
        content = content + `${Strings.PHONE} : ${order.buyerPhone}\n`;
        content = content + `${Strings.EMAIL} : ${order.buyerEmail}\n`;
        content = content + `${Strings.MEMO} : ${order.memo ? order.memo : ''}\n`;
        content = content + `\n${Strings.SHIPPING_INFO}\n`;
        content = content + `${Strings.RECEIVER_NAME} : ${order.receiverName}\n`;
        content = content + `${Strings.PHONE} : ${order.receiverPhone}\n`;
        content = content + `${Strings.ADDRESS} : ${order.address}\n`;
        Clipboard.setString(content);
        toastRef.show(Strings.COMPLETE_COPY_ORDER);
      }}
    >
      <Text
        style={{
          marginRight: 10,
          color: Constants.COLOR_POINT_BLUE,
          fontSize: 16,
        }}
      >
        {Strings.COPY_ORDER}
      </Text>
    </TouchableOpacity>
  );
}

export default class OrderPageScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      order: null,
      viewMode: this.props.route.params?.buyerId ? 'buyer' : 'seller',
    };
  }

  componentDidMount() {
    const { navigation } = this.props;

    navigation.setOptions({
      title: Strings.ORDER_DETAIL,
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
      headerLeft: () => HeaderLeftBackButton({ navigation }),
    });

    const { orderId, buyerId = null, sellerId = null } = this.props.route.params;
    APIprovider.getOrder(orderId, buyerId, sellerId)
      .then(this.getOrderCallback.bind(this))
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_TO_LOAD_DATA,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
    // if (buyerId) {
    //   this.setState({ viewMode: 'buyer' });
    // } else if (sellerId) {
    //   this.setState({ viewMode: 'seller' });
    // }
  }

  getOrderCallback(data) {
    this.props.navigation.setOptions({
      headerRight: () => CopyOrderDetail({ order: data }),
    });

    this.setState({
      order: data,
    });
  }

  render() {
    const { navigation } = this.props;
    const { order, viewMode } = this.state;
    const { KRWPerUSD } = this.props.route.params;

    if (!order) {
      return <View />;
    }

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={{ padding: 20 }}>
          <OrderDate order={order} />
          <OrderNo order={order} />
          <OrderProduct
            order={order}
            navigation={navigation}
            viewMode={viewMode}
            KRWPerUSD={KRWPerUSD}
          />
          <Orderer order={order} />
          <Receiver order={order} />
          <Payment order={order} KRWPerUSD={KRWPerUSD} />
          <Revenue order={order} viewMode={viewMode} KRWPerUSD={KRWPerUSD} />
          <View style={{ height: 60 }} />
        </ScrollView>
        <Toast
          ref={(ref) => {
            toastRef = ref;
          }}
          fadeInDuration={100}
          fadeOutDuration={1900}
          position={'bottom'}
          style={{
            backgroundColor: Constants.TIER_COLORS.ARTISAN,
            borderRadius: 20,
            paddingHorizontal: 20,
            bottom: getStatusBarHeight(),
          }}
          opacity={0.9}
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
  topItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topItemTitle: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 15,
    width: 90,
  },
  topItemValue: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 15,
    fontWeight: 'bold',
  },
  infoTitle: {
    color: 'black',
    fontSize: 15,
    marginTop: 40,
    marginBottom: 10,
  },
  infoItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  infoItemTitle: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 13,
    width: 120,
  },
  infoItemValue: {
    flex: 1,
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
  },
});
