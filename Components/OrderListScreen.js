import React from 'react';
import { Alert, Dimensions, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import APIprovider from './APIprovider';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import OrderListItemView from './OrderListItemView';
import Strings from './Strings';
import { moderateScale } from './utils/scailing';

const initialLayout = { width: Dimensions.get('window').width };

const VIEW_MODE_SELLER = 'seller';
const VIEW_MODE_BUYER = 'buyer';

export default class OrderListScreen extends React.Component {
  constructor(props) {
    super(props);

    const { orderStatusCode = 0, mode, sellerId = null, buyerId = null } = this.props.route.params;
    this.state = {
      orderStatusCode: orderStatusCode,
      mode: mode,
      sellerId: sellerId,
      buyerId: buyerId,
      totalOrderCount: this.props.route.params.totalVideoCount,
      orderList: [],
      isRefreshing: false,
    };
  }

  componentDidMount() {
    const { orderStatusCode = 0 } = this.props.route.params;
    const { navigation } = this.props;

    let headerTitle = '';
    switch (orderStatusCode) {
      case Constants.ORDER_STATUS_CODE.NOT_ACCEPTED:
        headerTitle = Strings.NEW_ORDERS;
        break;
      case Constants.ORDER_STATUS_CODE.PREPARING:
        headerTitle = Strings.PREPARING_SHIPPING;
        break;
      case Constants.ORDER_STATUS_CODE.SHIPPING:
        headerTitle = Strings.SHIPPING;
        break;
      case Constants.ORDER_STATUS_CODE.SHIPMENT_COMPLETED:
        headerTitle = Strings.SHIPMENT_COMPLETED;
        break;
      case Constants.ORDER_STATUS_CODE.PURCHASE_COMPLETED:
        headerTitle = Strings.PURCHASE_COMPLETED;
        break;
      case Constants.ORDER_STATUS_CODE.SELLER_CANCEL_REQUEST:
        headerTitle = Strings.SELLER_CANCEL_REQUEST;
        break;
      case Constants.ORDER_STATUS_CODE.BUYER_CANCEL_REQUEST:
        headerTitle = Strings.BUYER_CANCEL_REQUEST;
        break;
      case Constants.ORDER_STATUS_CODE.CANCEL_FINISHED:
        headerTitle = Strings.CANCEL_FINISHED;
        break;
      case Constants.ORDER_STATUS_CODE.REFUND_PENDING:
        headerTitle = Strings.REFUND_PENDING;
        break;
    }

    this.props.navigation.setOptions({
      title: headerTitle,
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
      headerLeft: () => HeaderLeftBackButton({ navigation }),
    });

    APIprovider.getOrderList(this.state.orderStatusCode, this.state.buyerId, this.state.sellerId)
      .then(this.getOrderListCallback.bind(this))
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_TO_LOAD_ORDERS,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  }

  getOrderListCallback(data) {
    this.setState({
      orderList: data,
    });
  }

  onOrderListRefreshed(data) {
    this.setState({
      orderList: data,
      isRefreshing: false,
    });
  }

  onOrderListReachedEnd(data) {
    this.setState({
      orderList: [...this.state.orderList, ...data],
      isRefreshing: false,
    });
  }

  onOrderAction(code, order) {
    const { orderList } = this.state;
    for (let i = 0; i < orderList.length; i++) {
      if (orderList[i].orderId === order.orderId) {
        this.setState({
          orderList: [...orderList.slice(0, i), ...orderList.slice(i + 1, orderList.length)],
        });
        break;
      }
    }
  }

  render() {
    if (this.state.orderList.length === 0) {
      let noItemMessage = '';
      if (this.props.mode === 'cart') {
        noItemMessage = Strings.NO_ITEM_CART;
      } else {
        noItemMessage = Strings.NO_ITEM_ORDER;
      }

      return (
        <View style={styles.emptyMessageContainer}>
          <Text style={styles.emptyMessage}>{noItemMessage}</Text>
        </View>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <Animated.FlatList
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          data={this.state.orderList}
          renderItem={({ item, index }) => (
            <OrderListItemView
              key={item._id + index}
              navigation={this.props.navigation}
              data={item}
              mode={this.state.mode}
              onOrderAction={this.onOrderAction.bind(this)}
            />
          )}
          keyExtractor={(item) => item._id} //item.videoId}
          onEndReached={({ distanceFromEnd }) => {
            if (
              distanceFromEnd > 0 &&
              this.state.orderList.length >= 10 &&
              !this.state.isRefreshing
            ) {
              this.setState({ isRefreshing: true });
              APIprovider.getOrderList(
                this.state.orderStatusCode,
                this.state.buyerId,
                this.state.sellerId,
                this.state.orderList[this.state.orderList.length - 1].createdAt,
              )
                .then(this.onOrderListReachedEnd.bind(this))
                .catch((err) => {
                  Alert.alert(
                    Strings.FAILED_TO_LOAD_ORDERS,
                    err.errorMsg ? err.errorMsg : '',
                    [{ text: Strings.OK }],
                    { cancelable: true },
                  );
                  this.setState({ isRefreshing: false });
                });
            }
          }}
          onEndReachedThreshold={0.5}
          onRefresh={() => {
            this.setState({ isRefreshing: true });
            APIprovider.getOrderList(
              this.state.orderStatusCode,
              this.state.buyerId,
              this.state.sellerId,
            )
              .then(this.onOrderListRefreshed.bind(this))
              .catch((err) => {
                Alert.alert(
                  Strings.FAILED_TO_LOAD_ORDERS,
                  err.errorMsg ? err.errorMsg : '',
                  [{ text: Strings.OK }],
                  { cancelable: true },
                );
              });
          }}
          refreshing={this.state.isRefreshing}
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
  emptyMessageContainer: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  emptyMessage: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 18,
  },
});
