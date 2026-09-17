// 주문 상세 (2026-09-17) — 주문 내역·수익 내역이 push하던 'OrderPage'가 미등록·미구현이라
// 탭해도 아무 일도 없던 단절 수리. 서버 주문이 없거나 실패하면 "(예시)" 데이터로 흐름을 보여준다.
import React from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import APIprovider from './APIprovider';
import T from './Constants/DesignTokens';
import { Badge, Card, GlassOrbs } from './UI';
import Strings from './Strings';

const { COLORS, FONT, TYPE } = T;

// 서버가 닫혀 있어도 화면 흐름을 보여주기 위한 예시 주문 (isMock — 실제 주문 아님)
export const MOCK_ORDER = {
  isMock: true,
  orderId: 'example-0001',
  statusLabel: null, // Strings는 렌더 시점에 읽는다 (언어 전환 대응)
  createdAt: '2026-09-01',
  cartItems: [
    { _id: 'm1', title: '수분 앰플 30ml', quantity: 1, price: 32000 },
    { _id: 'm2', title: '진정 크림 50ml', quantity: 2, price: 24000 },
  ],
  shipping: { name: '그레이', address: '서울특별시 어딘가 123, 45동 678호' },
  total: 80000,
};

export default class OrderPageScreen extends React.Component {
  state = { order: null, loading: true, mock: false };

  componentDidMount() {
    const { orderId, sellerId, mock } = this.props.route.params || {};
    if (mock || !orderId) {
      this.setState({ order: MOCK_ORDER, mock: true, loading: false });
      return;
    }
    APIprovider.getOrder(orderId, APIprovider.requesterId, sellerId)
      .then((res) => {
        if (APIprovider.isFailure(res) || !res?.orderId) {
          this.setState({ order: MOCK_ORDER, mock: true, loading: false });
          return;
        }
        this.setState({ order: this.normalize(res), loading: false });
      })
      .catch(() => this.setState({ order: MOCK_ORDER, mock: true, loading: false }));
  }

  // 서버 주문을 화면 모델로 — 필드가 비어도 죽지 않게 방어적으로 읽는다
  normalize(res) {
    const items = Array.isArray(res.cartItems) ? res.cartItems : [];
    return {
      isMock: false,
      orderId: res.orderId,
      createdAt: res.createdAt ? String(res.createdAt).slice(0, 10) : '',
      cartItems: items.map((it, i) => ({
        _id: it._id || String(i),
        title: it.titleByCountry || it.title || it.product?.title || '',
        quantity: Number(it.quantity) || 1,
        price: Number(it.discountPrice ?? it.price) || 0,
        thumbnailUrl: it.thumbnailUrl || it.product?.thumbnailUrl,
      })),
      shipping: {
        name: res.shipping?.name || res.buyerName || '',
        address: [res.shipping?.address, res.shipping?.addressDetail].filter(Boolean).join(', '),
      },
      total:
        Number(res.totalPrice) ||
        items.reduce((sum, it) => sum + (Number(it.discountPrice ?? it.price) || 0) * (Number(it.quantity) || 1), 0),
      statusCode: res.statusCode,
    };
  }

  render() {
    const { order, loading, mock } = this.state;
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.AMBER} />
        </View>
      );
    }
    return (
      <SafeAreaView style={styles.safe}>
      <GlassOrbs />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => this.props.navigation.goBack()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.back}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{Strings.ORDER_PAGE_TITLE}</Text>
            {mock ? <Badge tone="amber" text={Strings.MOCK_EXAMPLE_BADGE} /> : null}
          </View>
          {mock ? <Text style={styles.mockNote}>{Strings.MOCK_ORDER_NOTE}</Text> : null}

          <Card style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>{Strings.ORDER_PAGE_NUMBER}</Text>
              <Text style={styles.value}>{order.orderId}</Text>
            </View>
            {order.createdAt ? (
              <View style={styles.row}>
                <Text style={styles.label}>{Strings.ORDER_PAGE_DATE}</Text>
                <Text style={styles.value}>{order.createdAt}</Text>
              </View>
            ) : null}
          </Card>

          <Card style={styles.card}>
            {order.cartItems.map((item, idx) => (
              <View key={item._id} style={[styles.itemRow, idx > 0 && styles.itemDivider]}>
                {item.thumbnailUrl ? (
                  <FastImage source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]} />
                )}
                <View style={styles.itemBody}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.xs}>
                    {Strings.ORDER_PAGE_QTY(item.quantity)} · {item.price.toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
            <View style={[styles.row, styles.totalRow]}>
              <Text style={styles.label}>{Strings.ORDER_PAGE_TOTAL}</Text>
              <Text style={styles.total}>{order.total.toLocaleString()}</Text>
            </View>
          </Card>

          {order.shipping?.address ? (
            <Card style={styles.card}>
              <Text style={styles.label}>{Strings.ORDER_PAGE_SHIPPING}</Text>
              <Text style={[styles.value, styles.mt4]}>{order.shipping.name}</Text>
              <Text style={styles.xs}>{order.shipping.address}</Text>
            </Card>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.BG },
  scroll: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { fontFamily: FONT.Bold, fontSize: 26, color: COLORS.INK, lineHeight: 28 },
  headerTitle: { fontFamily: FONT.ExtraBold, fontSize: 18, color: COLORS.INK, flex: 1 },
  mockNote: { ...TYPE.XS, marginTop: 6 },
  card: { marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  label: { fontFamily: FONT.Bold, fontSize: 12, color: COLORS.GREY },
  value: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.INK },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  itemDivider: { borderTopWidth: 1, borderTopColor: COLORS.LINE },
  thumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: COLORS.TRACK },
  thumbEmpty: { borderWidth: 1, borderColor: COLORS.LINE },
  itemBody: { flex: 1, minWidth: 0 },
  itemTitle: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.INK },
  xs: { ...TYPE.XS, marginTop: 2 },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.LINE, paddingTop: 10, marginTop: 8 },
  total: { fontFamily: T.LATIN.ExtraBold, fontSize: 15, color: COLORS.AMBER_DEEP },
  mt4: { marginTop: 4 },
});
