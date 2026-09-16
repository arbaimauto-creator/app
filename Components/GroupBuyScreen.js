// 공동구매 (2026-09-16 P3) — docs/secondary-use-and-groupbuy-2026-09-16.md §4-B
// 링크 greyd://groupbuy/gb-xxxx 로 들어온다. 누구나 구매자다(작성자 본인 포함).
// 결제가 붙기 전(커머스 꺼짐·상품 미발행)에는 "참여 희망"만 남기고, 붙으면 주문서로 이어져 추적 코드가 주문에 실린다.
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { getCreatorProfile } from '../api/creators';
import { trackEvent } from '../api/experiments';
import { daysLeftUntil } from '../api/incentives';
import { canJoinGroupBuy, cancelGroupBuyJoin, getGroupBuy, joinGroupBuy } from '../api/tracking';
import FEATURES from './Constants/Features';
import T from './Constants/DesignTokens';
import Strings from './Strings';
import { Badge, Btn, Card, GlowCard, NoteBox, ProgressBar } from './UI';
import { isTrackingCode, rememberTrackingCode } from './utils/tracking';

const { COLORS, FONT, RADIUS } = T;

const money = (n, currency) =>
  currency === 'KRW' || !currency
    ? `${Number(n || 0).toLocaleString()}원`
    : `${currency} ${Number(n || 0).toLocaleString()}`;

// 진행률은 결제 수량 + 참여 희망 수량을 함께 본다 — 결제 전 단계에서도 열기가 보이도록
export function groupBuyFill(gb) {
  if (!gb || !gb.minQuantity) {
    return 0;
  }
  return Math.min(1, (gb.joinedQuantity + gb.intentQuantity) / gb.minQuantity);
}

const stateLabel = (state) =>
  ({
    OPEN: Strings.INC_GB_STATE_OPEN,
    REACHED: Strings.INC_GB_STATE_REACHED,
    FAILED: Strings.INC_GB_STATE_FAILED,
    SHIPPING: Strings.INC_GB_STATE_SHIPPING,
  })[state] || Strings.INC_GB_STATE_DONE;

export default class GroupBuyScreen extends React.Component {
  state = { gb: null, loading: true, refreshing: false, quantity: 1, busy: false, error: null };

  get code() {
    const code = this.props.route?.params?.code;
    return isTrackingCode(code) ? code : null;
  }

  componentDidMount() {
    if (this.code) {
      // 이 화면으로 들어온 것 자체가 귀속 시작 — 링크 밖(알림 등)에서 왔어도 기억한다
      rememberTrackingCode(this.code).catch(() => {});
    }
    this.load();
  }

  load = async (refreshing = false) => {
    if (!this.code) {
      this.setState({ loading: false, error: 'invalid' });
      return;
    }
    this.setState(refreshing ? { refreshing: true } : { loading: true });
    try {
      const gb = await getGroupBuy(this.code);
      this.setState({
        gb,
        loading: false,
        refreshing: false,
        error: gb ? null : 'notfound',
        quantity: gb?.myJoin?.quantity || this.state.quantity,
      });
    } catch (e) {
      this.setState({ loading: false, refreshing: false, error: e?.status === 404 ? 'notfound' : 'network' });
    }
  };

  setQuantity = (delta) => {
    this.setState((s) => ({ quantity: Math.max(1, Math.min(99, s.quantity + delta)) }));
  };

  onBuy = () => {
    const { gb, quantity } = this.state;
    trackEvent('groupbuy.buy_tap', { qty: quantity });
    this.props.navigation.navigate('OrderSheet', {
      product: {
        productId: gb.productRef,
        titleByCountry: gb.sellerProduct?.name || gb.title,
        thumbnailUrl: gb.sellerProduct?.imageUrl,
        price: gb.price,
        discountPrice: gb.price,
      },
      quantity,
      options: { lists: [], checks: [] },
      trackingCode: this.code,
      onPaid: () => this.load(true),
    });
  };

  onIntent = async () => {
    const { quantity } = this.state;
    this.setState({ busy: true });
    try {
      const profile = await getCreatorProfile().catch(() => null);
      await joinGroupBuy(this.code, quantity, profile?.country || null);
      trackEvent('groupbuy.join', { qty: quantity });
      await this.load(true);
      Alert.alert(Strings.GB_INTENT_DONE_TITLE, Strings.GB_INTENT_DONE_BODY, [{ text: Strings.OK }]);
    } catch (e) {
      const code = e?.body?.error;
      Alert.alert(code === 'closed' ? Strings.GB_CLOSED : Strings.GB_JOIN_FAILED, '', [
        { text: Strings.OK },
      ]);
    } finally {
      this.setState({ busy: false });
    }
  };

  onCancelIntent = () => {
    Alert.alert(Strings.GB_CANCEL_TITLE, '', [
      { text: Strings.CANCEL, style: 'cancel' },
      {
        text: Strings.OK,
        onPress: async () => {
          this.setState({ busy: true });
          try {
            await cancelGroupBuyJoin(this.code);
            await this.load(true);
          } catch (e) {
            Alert.alert(Strings.GB_JOIN_FAILED, '', [{ text: Strings.OK }]);
          } finally {
            this.setState({ busy: false });
          }
        },
      },
    ]);
  };

  renderError() {
    const { error } = this.state;
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🛍️</Text>
        <Text style={styles.emptyTitle}>
          {error === 'network' ? Strings.GB_LOAD_FAILED : Strings.GB_NOT_FOUND}
        </Text>
        {error === 'network' ? (
          <Btn small variant="ghost" title={Strings.FEED_RETRY} onPress={() => this.load()} />
        ) : null}
      </View>
    );
  }

  render() {
    const { gb, loading, refreshing, quantity, busy } = this.state;
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.AMBER} />
        </View>
      );
    }
    if (!gb) {
      return this.renderError();
    }

    const open = canJoinGroupBuy(gb);
    const left = daysLeftUntil(gb.endsAt);
    const canPay = FEATURES.COMMERCE && !!gb.productRef;
    const image = gb.sellerProduct?.imageUrl;

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => this.load(true)}
            tintColor={COLORS.AMBER}
            colors={[COLORS.AMBER]}
          />
        }
      >
        <Text style={styles.eyebrow}>
          {Strings.GB_EYEBROW} · {gb.brandName || gb.campaignName}
        </Text>
        <Text style={styles.title}>{gb.title}</Text>

        <GlowCard glow={0.4} contentStyle={styles.hero}>
          {image ? (
            <FastImage source={{ uri: image }} style={styles.image} resizeMode="cover" />
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{money(gb.price, gb.currency)}</Text>
            <Badge
              tone={gb.state === 'FAILED' ? 'red' : gb.state === 'OPEN' ? 'amber' : 'open'}
              text={stateLabel(gb.state)}
            />
          </View>
          <ProgressBar ratio={groupBuyFill(gb)} style={styles.progress} />
          <View style={styles.rowBetween}>
            <Text style={styles.meta}>
              {Strings.GB_PROGRESS(gb.joinedQuantity + gb.intentQuantity, gb.minQuantity)}
            </Text>
            {open && left != null ? (
              <Text style={styles.meta}>{Strings.INC_GB_DAYS_LEFT(left)}</Text>
            ) : null}
          </View>
          <Text style={styles.meta}>{Strings.INC_GB_COUNTRIES(gb.countries.join(', ') || '-')}</Text>
        </GlowCard>

        {gb.sellerProduct?.description ? (
          <Card style={styles.descCard}>
            <Text style={styles.desc}>{gb.sellerProduct.description}</Text>
          </Card>
        ) : null}

        <NoteBox text={Strings.GB_HOW_IT_WORKS(gb.minQuantity)} />

        {open ? (
          <Card style={styles.joinCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.qtyLabel}>{Strings.GB_QUANTITY}</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  onPress={() => this.setQuantity(-1)}
                  style={styles.stepBtn}
                  accessibilityLabel="minus"
                >
                  <Text style={styles.stepText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qty}>{quantity}</Text>
                <TouchableOpacity
                  onPress={() => this.setQuantity(1)}
                  style={styles.stepBtn}
                  accessibilityLabel="plus"
                >
                  <Text style={styles.stepText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.total}>{money(gb.price * quantity, gb.currency)}</Text>

            {canPay ? (
              <Btn title={Strings.GB_BUY} onPress={this.onBuy} loading={busy} />
            ) : gb.myJoin ? (
              <>
                <Badge tone="open" text={Strings.GB_INTENT_LEFT(gb.myJoin.quantity)} />
                <Btn
                  variant="ghost"
                  small
                  title={Strings.GB_INTENT_CANCEL}
                  onPress={this.onCancelIntent}
                  disabled={busy}
                />
              </>
            ) : (
              <>
                <Btn title={Strings.GB_INTENT} onPress={this.onIntent} loading={busy} />
                <Text style={styles.hint}>{Strings.GB_INTENT_HINT}</Text>
              </>
            )}
          </Card>
        ) : (
          <NoteBox tone="grey" text={gb.state === 'FAILED' ? Strings.GB_FAILED_NOTE : Strings.GB_CLOSED} />
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.BG,
    gap: 8,
    padding: 24,
  },
  eyebrow: { fontFamily: FONT.Bold, fontSize: 11, color: COLORS.AMBER_DEEP, letterSpacing: 0.4 },
  title: { fontFamily: FONT.ExtraBold, fontSize: 20, color: COLORS.INK, lineHeight: 27 },
  hero: { gap: 8 },
  image: { width: '100%', aspectRatio: 4 / 3, borderRadius: RADIUS.CARD - 6, backgroundColor: COLORS.LINE },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontFamily: T.LATIN.ExtraBold, fontSize: 22, color: COLORS.INK, letterSpacing: -0.4 },
  progress: { marginTop: 2 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  meta: { fontFamily: FONT.Regular, fontSize: 12, color: COLORS.GREY },
  descCard: { padding: 14 },
  desc: { fontFamily: FONT.Regular, fontSize: 13, lineHeight: 19, color: COLORS.INK },
  joinCard: { padding: 14, gap: 10 },
  qtyLabel: { fontFamily: FONT.Bold, fontSize: 13, color: COLORS.INK },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.LINE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.WHITE,
  },
  stepText: { fontFamily: T.LATIN.Bold, fontSize: 18, color: COLORS.INK, lineHeight: 22 },
  qty: { fontFamily: T.LATIN.ExtraBold, fontSize: 16, color: COLORS.INK, minWidth: 28, textAlign: 'center' },
  total: { fontFamily: T.LATIN.Bold, fontSize: 15, color: COLORS.AMBER_DEEP, textAlign: 'right' },
  hint: { fontFamily: FONT.Regular, fontSize: 11.5, lineHeight: 16, color: COLORS.GREY, textAlign: 'center' },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontFamily: FONT.Bold, fontSize: 15, color: COLORS.INK, textAlign: 'center' },
});
