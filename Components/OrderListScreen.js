// 주문 내역 (2026-09-16) — 구매자 관점. 서버 GET /orders(결제 후 전체)를 기존 주문 카드(OrderListItemView, myorder 모드)로 그린다.
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import APIprovider from './APIprovider';
import Codes from './Constants/Codes';
import T from './Constants/DesignTokens';
import OrderListItemView from './OrderListItemView';
import Strings from './Strings';
import { EmptyIcon } from './UI';

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
              <EmptyIcon name="package-variant-closed" />
              <Text style={styles.emptyTitle}>{Strings.ORDERS_EMPTY}</Text>
              <Text style={styles.emptyDesc}>{Strings.ORDERS_EMPTY_DESC}</Text>
              {/* 예시 주문 (2026-09-17) — 실제 주문 전에도 상세까지의 흐름을 보여준다 */}
              <TouchableOpacity
                style={styles.mockCard}
                activeOpacity={0.8}
                onPress={() => this.props.navigation.push('OrderPage', { mock: true })}
              >
                <View style={styles.mockRow}>
                  <Text style={styles.mockTitle}>수분 앰플 30ml 외 1건</Text>
                  <Text style={styles.mockBadge}>{Strings.MOCK_EXAMPLE_BADGE}</Text>
                </View>
                <Text style={styles.emptyDesc}>{Strings.MOCK_ORDER_NOTE}</Text>
              </TouchableOpacity>
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
  mockCard: {
    alignSelf: 'stretch',
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    borderStyle: 'dashed',
    backgroundColor: COLORS.SURFACE,
    gap: 4,
  },
  mockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mockTitle: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.INK },
  mockBadge: { fontFamily: FONT.Bold, fontSize: 10.5, color: COLORS.AMBER_DEEP },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontFamily: FONT.Bold, fontSize: 15, color: COLORS.INK },
  emptyDesc: { fontFamily: FONT.Regular, fontSize: 12.5, color: COLORS.GREY, textAlign: 'center' },
});
