import React from 'react';
import { Alert, Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import APIprovider from './APIprovider';
import OrderListItemView from './OrderListItemView';
import Strings from './Strings';
import Constants from './Constants';

const initialLayout = { width: Dimensions.get('window').width };

const VIEW_MODE_SELLER = 'seller';
const VIEW_MODE_BUYER = 'buyer';

export default class OrderListView extends React.Component {
  constructor(props) {
    super(props);

    const { orderStatusCode = 0, sellerId = null, buyerId = null, totalOrderCount } = this.props;
    this.state = {
      orderStatusCode: orderStatusCode,
      sellerId: sellerId,
      buyerId: buyerId,
      totalOrderCount: totalOrderCount,
      orderList: [],
      isRefreshing: false,
    };
    this.isRequestingGetOrderList = false;
  }

  componentDidMount() {
    if (this.isRequestingGetOrderList === false) {
      this.getOrderList();
      this.isRequestingGetOrderList = true;
    }
  }

  getOrderList() {
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
    this.isRequestingGetOrderList = false;
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

  onOrderAction(actionCode, order) {
    const { mode } = this.props;
    const { orderList } = this.state;
    for (let i = 0; i < orderList.length; i++) {
      if (orderList[i].orderId === order.orderId) {
        if (mode === 'cart' || mode === 'mystore') {
          this.setState({
            orderList: [...orderList.slice(0, i), ...orderList.slice(i + 1, orderList.length)],
          });
          break;
        } else if (mode === 'myorder') {
          let newOrderList = this.state.orderList;
          newOrderList[i] = order;
          this.setState({
            orderList: newOrderList,
          });
        }
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
      <Animated.FlatList
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        data={this.state.orderList}
        renderItem={({ item, index }) => (
          <View>
            <OrderListItemView
              key={item._id + index}
              navigation={this.props.navigation}
              data={item}
              onOrderAction={this.onOrderAction.bind(this)}
              mode={this.props.mode}
              style={{ marginHorizontal: 20, marginTop: 20 }}
              KRWPerUSD={this.props.KRWPerUSD}
              getOrderList={this.getOrderList.bind(this)}
            />
            {index === this.state.orderList.length - 1 && <View style={{ marginBottom: 20 }} />}
          </View>
        )}
        keyExtractor={(item) => item._id}
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
              });
          }
        }}
        onEndReachedThreshold={0.5}
        onRefresh={() => {
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
    );
  }
}

const styles = StyleSheet.create({
  emptyMessageContainer: {
    flex: 1,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  emptyMessage: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 18,
  },
});
