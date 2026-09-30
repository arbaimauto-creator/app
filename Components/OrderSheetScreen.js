// 주문서 화면 (2026-09-16) — docs/commerce-and-seller-2026-09-16.md P1
// 흐름: 상품·수량·옵션 확인 → 배송지 입력 → [결제하기]
//   장바구니 항목 생성(POST /cart) → 주문 생성(POST /orders) → Stripe Checkout 세션 → Checkout 화면(웹뷰)
// 금액은 서버가 다시 계산한다. 이 화면의 숫자는 사용자에게 보여주기 위한 것이다.
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { getSavedAddress, saveSavedAddress } from '../api/address';
import APIprovider from './APIprovider';
import Constants from './Constants';
import T from './Constants/DesignTokens';
import Strings from './Strings';
import { Btn, Card } from './UI';
import utils from './utils';
import { clearTrackingCode, getActiveTrackingCode } from './utils/tracking';
import { trackEvent } from '../api/experiments';
import {
  buildOrderParams,
  isAddressComplete,
  itemTotal,
  missingAddressFields,
} from './utils/orderSheet';

const { COLORS, FONT, RADIUS } = T;

const ADDRESS_FIELDS = [
  { key: 'name', label: () => Strings.ADDRESS_NAME },
  { key: 'phone', label: () => Strings.ADDRESS_PHONE, keyboardType: 'phone-pad' },
  { key: 'line', label: () => Strings.ADDRESS_LINE },
  { key: 'city', label: () => Strings.ADDRESS_CITY },
  { key: 'state', label: () => Strings.ADDRESS_STATE },
  { key: 'postalCode', label: () => Strings.ADDRESS_POSTAL, keyboardType: 'number-pad' },
];

export default class OrderSheetScreen extends React.Component {
  state = {
    address: { name: '', line: '', city: '', state: '', postalCode: '', phone: '' },
    memo: '',
    isSubmitting: false,
  };

  async componentDidMount() {
    const saved = await getSavedAddress();
    if (saved) {
      this.setState((prev) => ({ address: { ...prev.address, ...saved } }));
    }
  }

  setField = (key, value) => {
    this.setState((prev) => ({ address: { ...prev.address, [key]: value } }));
  };

  get product() {
    return this.props.route.params?.product || {};
  }

  get quantity() {
    return Number(this.props.route.params?.quantity || 1);
  }

  get options() {
    return this.props.route.params?.options || { lists: [], checks: [] };
  }

  get displayTotal() {
    const price =
      this.product.discountPrice > 0 ? this.product.discountPrice : this.product.price || 0;
    return itemTotal({ price, quantity: this.quantity, options: this.options });
  }

  fail = (message) => {
    this.setState({ isSubmitting: false });
    Alert.alert(Strings.FAILED_TO_MAKE_ORDER, message || '', [{ text: Strings.OK }]);
  };

  onPressPay = async () => {
    const { address, memo } = this.state;

    if (!isAddressComplete(address)) {
      const missing = missingAddressFields(address).length;
      Alert.alert(Strings.INPUT_ADDRESS_TO_RECEIVE_PRODUCT, Strings.ORDER_SHEET_MISSING(missing), [
        { text: Strings.OK },
      ]);
      return;
    }

    this.setState({ isSubmitting: true });
    await saveSavedAddress(address);

    const productId = this.product.productId || this.product._id;

    const cartItem = await APIprovider.newCartItem(
      productId,
      this.quantity,
      this.options,
      this.props.route.params?.reviewerVideoId,
      Constants.CART_FROM.BUY,
    ).catch((e) => e);

    if (APIprovider.isFailure(cartItem)) {
      return this.fail(cartItem?.errorMsg);
    }

    // 추적 코드: 화면 파라미터(공동구매 화면에서 진입) > 딥링크로 들어온 뒤 7일 안의 코드
    const trackingCode =
      this.props.route.params?.trackingCode || (await getActiveTrackingCode().catch(() => null));

    const order = await APIprovider.newOrder(
      buildOrderParams({
        cartItemId: cartItem.cartItemId || cartItem._id,
        address,
        memo,
        buyer: this.props.route.params?.buyer || {},
        trackingCode,
      }),
    ).catch((e) => e);

    if (APIprovider.isFailure(order)) {
      return this.fail(order?.errorMsg);
    }

    const orderId = order.orderId || order._id;
    const session = await APIprovider.createStripeCheckoutSession(orderId).catch((e) => e);

    if (APIprovider.isFailure(session) || !session?.url) {
      return this.fail(Strings.CHECKOUT_FAILED_TO_START);
    }

    this.setState({ isSubmitting: false });
    this.props.navigation.navigate('Checkout', {
      checkoutUrl: session.url,
      orderId,
      // 단골 적중 (2026-09-17): 리뷰 출발 구매면 결제 성공 후 프롬프트에 쓴다
      hitContext: this.props.route.params?.hitContext,
      // 서버가 만든 복귀 주소. 이 주소로 돌아오면 결제 결과로 인정한다.
      returnBase: session.returnBase || 'https://api.greyd.app/orders/checkout',
      onPaid: (paidOrderId) => {
        // 귀속된 코드는 한 번만 — 다음 주문에 다시 붙지 않게 지운다
        if (trackingCode) {
          clearTrackingCode().catch(() => {});
        }
        trackEvent('order.paid', { attributed: !!trackingCode });
        if (this.props.route.params?.onPaid) {
          this.props.route.params.onPaid(paidOrderId);
        }
      },
    });
  };

  renderOptionLines() {
    const { lists = [], checks = [] } = this.options;
    const chosen = [
      ...lists.filter((o) => o.selectedItemName).map((o) => `${o.name}: ${o.selectedItemName}`),
      ...checks.filter((o) => o.isChecked !== false).map((o) => o.name),
    ];

    if (chosen.length === 0) {
      return null;
    }
    return <Text style={styles.optionText}>{chosen.join(' · ')}</Text>;
  }

  render() {
    const { address, memo, isSubmitting } = this.state;
    const product = this.product;

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>{Strings.ORDER_SHEET_PRODUCT}</Text>
          <Card style={styles.productCard}>
            {product.thumbnailUrl ? (
              <FastImage source={{ uri: product.thumbnailUrl }} style={styles.thumb} />
            ) : null}
            <View style={styles.productText}>
              <Text style={styles.productTitle} numberOfLines={2}>
                {product.titleByCountry || product.title || ''}
              </Text>
              {this.renderOptionLines()}
              <Text style={styles.quantity}>{Strings.ORDER_SHEET_QUANTITY(this.quantity)}</Text>
            </View>
          </Card>

          <Text style={styles.sectionTitle}>{Strings.SHIPPING_INFO}</Text>
          <Card style={styles.formCard}>
            {ADDRESS_FIELDS.map((field) => (
              <View key={field.key} style={styles.field}>
                <Text style={styles.fieldLabel}>{field.label()}</Text>
                <TextInput
                  style={styles.input}
                  value={address[field.key]}
                  onChangeText={(v) => this.setField(field.key, v)}
                  keyboardType={field.keyboardType}
                  placeholderTextColor={COLORS.GREY}
                  accessibilityLabel={field.label()}
                />
              </View>
            ))}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{Strings.MEMO}</Text>
              <TextInput
                style={styles.input}
                value={memo}
                onChangeText={(v) => this.setState({ memo: v })}
                placeholder={Strings.INPUT_MEMO}
                placeholderTextColor={COLORS.GREY}
                accessibilityLabel={Strings.MEMO}
              />
            </View>
          </Card>

          <Card style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{Strings.TOTAL_PRODUCT_PRICE}</Text>
              <Text style={styles.totalValue}>
                {Strings.MONEY_AMOUNT_UNIT_WON(utils.numberWithCommas(this.displayTotal))}
              </Text>
            </View>
            <Text style={styles.totalNote}>{Strings.ORDER_SHEET_SHIPPING_NOTE}</Text>
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          <Btn
            title={Strings.PAY}
            onPress={this.onPressPay}
            loading={isSubmitting}
            disabled={isSubmitting}
            accessibilityLabel={Strings.PAY}
          />
        </View>

        {isSubmitting ? (
          <View style={styles.overlay} pointerEvents="none">
            <ActivityIndicator size="large" color={COLORS.AMBER} />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  content: { padding: 16, paddingBottom: 32, gap: 10 },
  sectionTitle: { fontFamily: FONT.Bold, fontSize: 13, color: COLORS.INK, marginTop: 6 },
  productCard: { flexDirection: 'row', gap: 12, padding: 12 },
  thumb: { width: 64, height: 64, borderRadius: RADIUS.BTN_SM, backgroundColor: COLORS.LINE },
  productText: { flex: 1, gap: 4 },
  productTitle: { fontFamily: FONT.Bold, fontSize: 13.5, color: COLORS.INK },
  optionText: { fontFamily: FONT.Regular, fontSize: 11.5, color: COLORS.GREY },
  quantity: { fontFamily: FONT.Regular, fontSize: 11.5, color: COLORS.GREY },
  formCard: { padding: 12, gap: 10 },
  field: { gap: 4 },
  fieldLabel: { fontFamily: FONT.Medium, fontSize: 11.5, color: COLORS.GREY },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.LINE,
    borderRadius: RADIUS.FIELD,
    paddingHorizontal: 12,
    fontFamily: FONT.Regular,
    fontSize: 13,
    color: COLORS.INK,
    backgroundColor: COLORS.SURFACE,
  },
  totalCard: { padding: 14, gap: 6 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontFamily: FONT.Medium, fontSize: 12.5, color: COLORS.GREY },
  // 금액은 숫자뿐 — 세리프 라이닝 숫자 (2026-09-30)
  totalValue: { fontFamily: T.SERIF.Bold, fontSize: 21, color: COLORS.INK },
  totalNote: { fontFamily: FONT.Regular, fontSize: 11, color: COLORS.GREY },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'android' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.LINE,
    backgroundColor: COLORS.SURFACE,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(23, 23, 23, 0.2)',
  },
});
