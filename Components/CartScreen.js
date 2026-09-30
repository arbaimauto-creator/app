// 장바구니 (2026-09-16) — 서버 GET /cart 목록. 항목마다 '주문서로'와 '삭제'.
// 결제는 주문서(OrderSheet)가 한 흐름으로 처리하므로 여기서는 담아둔 것을 보고 고르기만 한다.
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
import FastImage from 'react-native-fast-image';
import APIprovider from './APIprovider';
import T from './Constants/DesignTokens';
import Strings from './Strings';
import { Btn, Card, EmptyIcon } from './UI';
import utils from './utils';

const { COLORS, FONT, RADIUS } = T;

function itemTitle(product) {
  if (!product) {
    return '';
  }
  if (typeof product.title === 'string') {
    return product.titleByCountry || product.title;
  }
  return product.titleByCountry || product.title?.ko || product.title?.en || '';
}

export default class CartScreen extends React.Component {
  state = { items: [], loading: true, refreshing: false };

  componentDidMount() {
    this.load();
  }

  load = async (refreshing = false) => {
    this.setState(refreshing ? { refreshing: true } : { loading: true });
    const res = await APIprovider.getCartList().catch((e) => e);
    const items = Array.isArray(res) ? res : [];
    if (!Array.isArray(res) && APIprovider.isFailure(res)) {
      Alert.alert(Strings.CART_LOAD_FAILED, res?.errorMsg || '', [{ text: Strings.OK }]);
    }
    this.setState({ items, loading: false, refreshing: false });
  };

  remove = (item) => {
    const id = item.cartItemId || item._id;
    Alert.alert(Strings.CART_REMOVE, '', [
      { text: Strings.NO, style: 'cancel' },
      {
        text: Strings.YES,
        style: 'destructive',
        onPress: async () => {
          const res = await APIprovider.deleteCartItem(id).catch((e) => e);
          if (APIprovider.isFailure(res)) {
            Alert.alert(Strings.FAILED_TO_LOAD_DATA, res?.errorMsg || '', [{ text: Strings.OK }]);
            return;
          }
          this.setState((prev) => ({
            items: prev.items.filter((c) => (c.cartItemId || c._id) !== id),
          }));
        },
      },
    ]);
  };

  order = (item) => {
    const product = item.product || {};
    this.props.navigation.navigate('OrderSheet', {
      product: {
        productId: product.productId || product._id,
        titleByCountry: itemTitle(product),
        thumbnailUrl: product.thumbnailUrl,
        price: product.price,
        discountPrice: product.discountPrice,
      },
      quantity: item.number || 1,
      options: item.options || { lists: [], checks: [] },
      reviewerVideoId: item.reviewerVideoId,
      onPaid: () => this.load(),
    });
  };

  renderItem = ({ item }) => {
    const product = item.product || {};
    const price = product.discountPrice > 0 ? product.discountPrice : product.price || 0;
    return (
      <Card style={styles.item}>
        <View style={styles.row}>
          {product.thumbnailUrl ? (
            <FastImage source={{ uri: product.thumbnailUrl }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbEmpty]} />
          )}
          <View style={styles.text}>
            <Text style={styles.title} numberOfLines={2}>
              {itemTitle(product)}
            </Text>
            <Text style={styles.meta}>{Strings.ORDER_SHEET_QUANTITY(item.number || 1)}</Text>
            <Text style={styles.price}>
              {Strings.MONEY_AMOUNT_UNIT_WON(utils.numberWithCommas(price * (item.number || 1)))}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => this.remove(item)}
            style={styles.removeBtn}
            accessibilityRole="button"
            accessibilityLabel={Strings.CART_REMOVE}
          >
            <Text style={styles.removeText}>{Strings.CART_REMOVE}</Text>
          </TouchableOpacity>
          <Btn title={Strings.CART_BUY_NOW} small onPress={() => this.order(item)} />
        </View>
      </Card>
    );
  };

  render() {
    const { items, loading, refreshing } = this.state;

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
          data={items}
          keyExtractor={(item) => String(item.cartItemId || item._id)}
          renderItem={this.renderItem}
          contentContainerStyle={items.length === 0 ? styles.center : styles.list}
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
              <EmptyIcon name="cart-outline" />
              <Text style={styles.emptyTitle}>{Strings.CART_EMPTY}</Text>
              <Text style={styles.emptyDesc}>{Strings.CART_EMPTY_DESC}</Text>
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
  list: { padding: 16, gap: 10, paddingBottom: 32 },
  item: { padding: 12, gap: 10 },
  row: { flexDirection: 'row', gap: 12 },
  thumb: { width: 64, height: 64, borderRadius: RADIUS.BTN_SM, backgroundColor: COLORS.LINE },
  thumbEmpty: { backgroundColor: COLORS.TRACK },
  text: { flex: 1, gap: 3 },
  title: { fontFamily: FONT.Bold, fontSize: 13.5, color: COLORS.INK },
  meta: { fontFamily: FONT.Regular, fontSize: 11.5, color: COLORS.GREY },
  price: { fontFamily: T.LATIN.ExtraBold, fontSize: 15, color: COLORS.INK },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 },
  removeBtn: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 6 },
  removeText: { fontFamily: FONT.Medium, fontSize: 12, color: COLORS.GREY },
  empty: { alignItems: 'center', gap: 6, padding: 24 },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontFamily: FONT.Bold, fontSize: 15, color: COLORS.INK },
  emptyDesc: { fontFamily: FONT.Regular, fontSize: 12.5, color: COLORS.GREY, textAlign: 'center' },
});
