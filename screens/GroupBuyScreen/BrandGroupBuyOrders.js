// 브랜드 공동구매 주문 명단 · 발송 처리 (2026-09-30)
// 마감 판정으로 결제가 끝나면(CONFIRMED) 받는 분 명단(이름·연락처·주소·옵션·수량·금액)이 열린다.
// 브랜드가 직접 택배를 보내고 택배사 + 송장번호를 넣으면 구매자 앱에서 배송 조회가 된다.
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import FEATURES from '../../Components/Constants/Features';
import { Btn, Card, Chips, NoteBox } from '../../Components/UI';
import {
  courierName,
  couriersFor,
  isValidTrackingNumber,
  normalizeTrackingNumber,
} from '../../Components/utils/couriers';
import {
  GB_STATE,
  cancelBrandGroupBuy,
  listBrandGroupBuyOrders,
  listBrandGroupBuys,
  ordersToCsv,
  setShipment,
  simulateClose,
} from '../../api/groupBuys';
import {
  Failure,
  Field,
  Frame,
  OrderBadge,
  StateBadge,
  dateLabel,
  money,
  s,
  useFocusLoad,
} from './common';
import { gbCopy, lang } from './strings';

function ShipmentEditor({ order, country, onSaved }) {
  const c = gbCopy();
  const [open, setOpen] = useState(!order.shipment);
  const [courier, setCourier] = useState(order.shipment?.courier || null);
  const [number, setNumber] = useState(order.shipment?.trackingNumber || '');
  const [busy, setBusy] = useState(false);

  // 저장 직후에는 목록을 다시 불러오는 중이라 order.shipment가 아직 비어 있다 — 방금 저장한 값을 보여준다
  const shown =
    order.shipment ||
    (courier && normalizeTrackingNumber(number)
      ? { courier, trackingNumber: normalizeTrackingNumber(number) }
      : null);

  if (!open && shown) {
    return (
      <View style={s.between}>
        <Text style={s.body}>
          {c.trackNo(courierName(shown.courier, lang()), shown.trackingNumber)}
        </Text>
        <Text style={s.link} accessibilityRole="button" onPress={() => setOpen(true)}>
          {c.editShipment}
        </Text>
      </View>
    );
  }

  const save = async () => {
    if (
      !courier ||
      (courier !== 'OTHER' && !isValidTrackingNumber(number)) ||
      !normalizeTrackingNumber(number)
    ) {
      Alert.alert(c.shipmentError);
      return;
    }
    setBusy(true);
    try {
      await setShipment(order.id, courier, number);
      setOpen(false);
      onSaved();
    } catch (e) {
      Alert.alert(c.error.generic);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <Text style={s.label}>{c.courier}</Text>
      <Chips
        items={couriersFor(country).map((x) => ({
          key: x.code,
          label: lang() === 'ko' ? x.ko : x.en,
        }))}
        selected={courier}
        onSelect={setCourier}
      />
      <Field
        label={c.trackingNumber}
        value={number}
        onChangeText={setNumber}
        autoCapitalize="characters"
        autoCorrect={false}
        keyboardType="default"
      />
      <Btn small title={c.saveShipment} onPress={save} loading={busy} />
    </View>
  );
}

async function exportCsv(gb, orders) {
  const path = `${RNFS.CachesDirectoryPath}/groupbuy-${gb.code}.csv`;
  await RNFS.writeFile(path, ordersToCsv(orders), 'utf8');
  await Share.open({
    url: `file://${path}`,
    type: 'text/csv',
    filename: `groupbuy-${gb.code}`,
    failOnCancel: false,
  });
}

export default function BrandGroupBuyOrdersScreen({ navigation, route }) {
  const c = gbCopy();
  const code = route.params?.code;
  const { data, loading, error, reload } = useFocusLoad(async () => {
    const [list, orders] = await Promise.all([listBrandGroupBuys(), listBrandGroupBuyOrders(code)]);
    return { gb: list.find((x) => x.code === code) || null, ...orders };
  }, code);
  const [busy, setBusy] = useState(false);

  const gb = data?.gb;
  if (!gb) {
    return (
      <Frame navigation={navigation} title={c.orders} onRefresh={reload} refreshing={loading}>
        {!loading ? (
          <Failure text={error === 'network' ? c.loadError : c.notFound} retry={reload} />
        ) : null}
      </Frame>
    );
  }

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      Alert.alert(c.error.generic);
    } finally {
      setBusy(false);
      reload();
    }
  };
  const cancellable = [GB_STATE.PENDING_HOST, GB_STATE.SCHEDULED, GB_STATE.OPEN].includes(gb.state);

  return (
    <Frame navigation={navigation} title={c.orders} onRefresh={reload} refreshing={loading}>
      <View style={{ gap: 6 }}>
        <View style={s.between}>
          <Text style={[s.h1, { flex: 1 }]}>{gb.title}</Text>
          <StateBadge state={gb.state} />
        </View>
        <Text style={s.sub}>
          @{gb.host.handle} · {money(gb.price, gb.currency)} · {dateLabel(gb.startsAt)} ~{' '}
          {dateLabel(gb.endsAt)}
        </Text>
        <Text style={s.strong}>{c.summary(data.summary)}</Text>
      </View>

      {!data.released ? <NoteBox text={c.ordersLocked} /> : null}

      {FEATURES.GROUP_BUY_MOCK && gb.state === GB_STATE.OPEN ? (
        <Btn
          small
          variant="ghost"
          title={c.simulateClose}
          disabled={busy}
          onPress={() => run(() => simulateClose(gb.code))}
        />
      ) : null}

      {data.released && data.orders.length ? (
        <Btn
          small
          title={c.exportCsv}
          onPress={() => exportCsv(gb, data.orders).catch(() => Alert.alert(c.error.generic))}
        />
      ) : null}

      {data.orders.map((o) => (
        <Card key={o.id} style={{ padding: 14, gap: 8 }}>
          <View style={s.between}>
            <Text style={s.h2}>{o.recipient.name}</Text>
            <OrderBadge state={o.state} />
          </View>
          <Text style={s.body}>{o.recipient.phone}</Text>
          <Text style={s.body}>
            ({o.recipient.postalCode}) {o.recipient.address1} {o.recipient.address2}
          </Text>
          {o.recipient.memo ? <Text style={s.sub}>“{o.recipient.memo}”</Text> : null}
          <Text style={s.strong}>
            {o.option ? `${o.option} · ` : ''}
            {o.quantity} · {money(o.total, o.currency)}
          </Text>
          <ShipmentEditor order={o} country={gb.country} onSaved={reload} />
        </Card>
      ))}

      {cancellable ? (
        <Btn
          small
          variant="ghost"
          title={c.cancelGb}
          disabled={busy}
          onPress={() =>
            Alert.alert(c.cancelGbConfirm, '', [
              { text: c.no, style: 'cancel' },
              { text: c.yes, onPress: () => run(() => cancelBrandGroupBuy(gb.code)) },
            ])
          }
        />
      ) : null}
    </Frame>
  );
}
