// 공동구매 주문서 (2026-09-30) — 옵션·수량·받는 분·필수 동의 → 토스 빌링(카드 등록) 웹뷰
// 돈은 여기서 나가지 않는다. 카드만 등록(결제 예약)하고, 마감 판정 뒤 서버가 등록 카드로 결제한다.
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import FEATURES from '../../Components/Constants/Features';
import { Btn, Card, Chips } from '../../Components/UI';
import { getSavedAddress } from '../../api/address';
import { trackEvent } from '../../api/experiments';
import {
  completeMockBilling,
  createGroupBuyOrder,
  getGroupBuy,
  isBillingStartUrl,
  myActiveQuantity,
  orderTotal,
  remainingQuantity,
  validateOrderDraft,
} from '../../api/groupBuys';
import {
  CheckRow,
  Failure,
  Field,
  Frame,
  Stepper,
  dateLabel,
  money,
  requestId,
  s,
  useFocusLoad,
} from './common';
import { gbCopy } from './strings';

const SERVER_ERRORS = {
  closed: 'closed',
  sold_out: 'soldOut',
  per_user_max: 'perUserMax',
  agree_required: 'agree',
};

export default function GroupBuyOrderScreen({ navigation, route }) {
  const c = gbCopy();
  const code = route.params?.code;
  const { data: gb, loading, error, reload } = useFocusLoad(() => getGroupBuy(code), code);
  const [quantity, setQuantity] = useState(1);
  const [option, setOption] = useState(null);
  const [recipient, setRecipient] = useState({
    name: '',
    phone: '',
    postalCode: '',
    address1: '',
    address2: '',
    memo: '',
  });
  const [agreeCharge, setAgreeCharge] = useState(false);
  const [agreeThirdParty, setAgreeThirdParty] = useState(false);
  const [busy, setBusy] = useState(false);
  const request = useRef(null);

  useEffect(() => {
    if (gb?.options.length && !option) {
      setOption(gb.options[0]);
    }
  }, [gb, option]);

  const set = (key) => (value) => {
    request.current = null;
    setRecipient((r) => ({ ...r, [key]: value }));
  };

  const loadSaved = async () => {
    const saved = await getSavedAddress().catch(() => null);
    if (!saved) {
      return;
    }
    request.current = null;
    setRecipient((r) => ({
      ...r,
      name: saved.name || r.name,
      phone: saved.phone || r.phone,
      postalCode: saved.postalCode || r.postalCode,
      address1: [saved.state, saved.city, saved.line].filter(Boolean).join(' ') || r.address1,
    }));
  };

  if (!gb) {
    return (
      <Frame navigation={navigation} title={c.orderTitle} onRefresh={reload} refreshing={loading}>
        {!loading ? (
          <Failure text={error === 'network' ? c.loadError : c.notFound} retry={reload} />
        ) : null}
      </Frame>
    );
  }

  const maxQty = Math.max(1, Math.min(gb.perUserMax - myActiveQuantity(gb), remainingQuantity(gb)));
  const endLabel = dateLabel(gb.endsAt);

  const submit = async () => {
    const draft = { quantity, option, recipient, agreeCharge, agreeThirdParty };
    const invalid = validateOrderDraft(gb, draft);
    if (invalid) {
      Alert.alert(c.error[invalid] || c.error.generic);
      return;
    }
    // 같은 내용으로 다시 누르면 같은 요청 번호 — 네트워크가 애매하게 끊겨도 주문이 두 번 생기지 않는다
    if (!request.current) {
      request.current = requestId('gbo');
    }
    setBusy(true);
    try {
      const { order, billingUrl } = await createGroupBuyOrder(gb.code, draft, request.current);
      trackEvent('groupbuy.order', { qty: quantity });
      if (FEATURES.GROUP_BUY_MOCK) {
        await completeMockBilling(order.id);
        request.current = null;
        Alert.alert(c.joinedTitle, c.joinedBody(endLabel), [
          { text: c.yes, onPress: () => navigation.goBack() },
        ]);
        return;
      }
      if (!isBillingStartUrl(billingUrl)) {
        throw new Error('invalid billing url');
      }
      request.current = null;
      navigation.navigate('GroupBuyBilling', {
        url: billingUrl,
        orderId: order.id,
        code: gb.code,
        endsAt: gb.endsAt,
      });
    } catch (e) {
      const key = SERVER_ERRORS[e?.body?.error];
      if (key) {
        request.current = null;
      }
      Alert.alert(c.error[key] || c.error.generic);
    } finally {
      setBusy(false);
    }
  };

  const footer = (
    <>
      <View style={s.between}>
        <Text style={s.strong}>{c.total}</Text>
        <Text style={s.price}>{money(orderTotal(gb, quantity), gb.currency)}</Text>
      </View>
      <Text style={s.sub}>{c.chargeAt(endLabel)}</Text>
      <Btn
        title={FEATURES.GROUP_BUY_MOCK ? c.mockSubmit : c.submit}
        onPress={submit}
        loading={busy}
        disabled={!agreeCharge || !agreeThirdParty}
      />
    </>
  );

  return (
    <Frame navigation={navigation} title={c.orderTitle} footer={footer}>
      <Card style={{ padding: 14, gap: 4 }}>
        <Text style={s.h2}>{gb.title}</Text>
        <Text style={s.sub}>
          {gb.product.name} · {money(gb.price, gb.currency)}
        </Text>
      </Card>

      <Card style={{ padding: 14, gap: 12 }}>
        {gb.options.length ? (
          <View style={{ gap: 6 }}>
            <Text style={s.label}>{c.option}</Text>
            <Chips
              items={gb.options.map((o) => ({ key: o, label: o }))}
              selected={option}
              onSelect={(key) => {
                request.current = null;
                setOption(key);
              }}
            />
          </View>
        ) : null}
        <View style={s.between}>
          <Text style={s.label}>{c.quantity}</Text>
          <Stepper
            value={quantity}
            max={maxQty}
            onChange={(v) => {
              request.current = null;
              setQuantity(v);
            }}
          />
        </View>
        <Text style={s.sub}>{c.perUser(gb.perUserMax)}</Text>
      </Card>

      <Card style={{ padding: 14, gap: 10 }}>
        <View style={s.between}>
          <Text style={s.h2}>{c.recipient}</Text>
          <Text style={s.link} onPress={loadSaved} accessibilityRole="button">
            {c.useSaved}
          </Text>
        </View>
        <Field
          label={c.name}
          value={recipient.name}
          onChangeText={set('name')}
          autoComplete="name"
        />
        <Field
          label={c.phone}
          value={recipient.phone}
          onChangeText={set('phone')}
          keyboardType="phone-pad"
          autoComplete="tel"
        />
        <Field
          label={c.postalCode}
          value={recipient.postalCode}
          onChangeText={set('postalCode')}
          keyboardType="number-pad"
          autoComplete="postal-code"
        />
        <Field label={c.address1} value={recipient.address1} onChangeText={set('address1')} />
        <Field label={c.address2} value={recipient.address2} onChangeText={set('address2')} />
        <Field label={c.memo} value={recipient.memo} onChangeText={set('memo')} maxLength={100} />
      </Card>

      <Card style={{ padding: 14, gap: 6 }}>
        <CheckRow
          checked={agreeCharge}
          onToggle={() => setAgreeCharge((v) => !v)}
          text={c.agreeCharge(endLabel, gb.minQuantity)}
        />
        <CheckRow
          checked={agreeThirdParty}
          onToggle={() => setAgreeThirdParty((v) => !v)}
          text={c.agreeThirdParty(gb.brand.name)}
        />
        <Text style={s.sub}>{c.cancelNote}</Text>
      </Card>
    </Frame>
  );
}
