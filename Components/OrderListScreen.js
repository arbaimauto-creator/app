// 주문 내역 (2026-09-16) — 구매자 관점. 서버 GET /orders(결제 후 전체)를 기존 주문 카드(OrderListItemView, myorder 모드)로 그린다.
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import APIprovider from './APIprovider';
import Codes from './Constants/Codes';
import T from './Constants/DesignTokens';
import OrderListItemView from './OrderListItemView';
import Strings from './Strings';

const { COLORS, FONT } = T;
const PAGE = 18;

export default class OrderListScreen extends React.Component {
  state = { orders: [], loading: true, refreshing: false, done: false };

  componentDidMount() {
    this.load();
  }

  load = async (refreshing = false) => {
    this.setState(refreshing ? { refreshing: true } : { loading: true });
    const res = await APIprovider.getOrderList(
      Codes.ORDER_STATUS_CODE.AFTER_PAY,
      APIprovider.requesterId,
      undefined,
      '',
      PAGE,
    ).catch((e) => e);
    const orders = Array.isArray(res) ? res : Array.isArray(res?.orderList) ? res.orderList : [];
    if (!Array.isArray(res) && APIprovider.isFailure(res)) {
      Alert.alert(Strings.ORDERS_LOAD_FAILED, res?.errorMsg || '', [{ text: Strings.OK }]);
    }
    this.setState({ orders, loading: false, refreshing: false, done: orders.length < PAGE });
  };

  loadMore = async () => {
    const { orders, done, refreshing, loading } = this.state;
    if (done || refreshing || loading || orders.length === 0) {
      return;
    }
    const res = await APIprovider.getOrderList(
      Codes.ORDER_STATUS_CODE.AFTER_PAY,
      APIprovider.requesterId,
      undefined,
      orders.length,
      PAGE,
    ).catch(() => null);
    const more = Array.isArray(res) ? res : Array.isArray(res?.orderList) ? res.orderList : [];
    this.setState((prev) => ({ orders: [...prev.orders, ...more], done: more.length < PAGE }));
  };

  render() {
    const { orders, loading, refreshing } = this.state;

    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.AMBER} />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.orderId || item._id)}
          renderItem={({ item }) => (
            <OrderListItemView
              navigation={this.props.navigation}
              data={item}
              mode="myorder"
              style={styles.item}
              onOrderAction={() => this.load(true)}
            />
          )}
          onEndReached={this.loadMore}
          onEndReachedThreshold={0.4}
          contentContainerStyle={orders.length === 0 ? styles.center : styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => this.load(true)}
              tintColor={COLORS.AMBER}
              colors={[COLORS.AMBER]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>{Strings.ORDERS_EMPTY}</Text>
              <Text style={styles.emptyDesc}>{Strings.ORDERS_EMPTY_DESC}</Text>
            </View>
          }
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  center: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.BG,
  },
  list: { padding: 16, paddingBottom: 32 },
  item: { marginBottom: 10 },
  empty: { alignItems: 'center', gap: 6, padding: 24 },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontFamily: FONT.Bold, fontSize: 15, color: COLORS.INK },
  emptyDesc: { fontFamily: FONT.Regular, fontSize: 12.5, color: COLORS.GREY, textAlign: 'center' },
});
