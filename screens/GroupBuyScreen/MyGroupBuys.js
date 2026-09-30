// 내 공동구매 (2026-09-30) — 탭 두 개: 참여한 공동구매(주문·결제 상태·배송 조회) / 내가 여는 공동구매(호스트)
import React, { useState } from 'react';
import { Alert, Linking, Text, TouchableOpacity, View } from 'react-native';
import { Badge, Card } from '../../Components/UI';
import { courierName, trackingUrl } from '../../Components/utils/couriers';
import {
  GB_STATE,
  ORDER_STATE,
  cancelGroupBuyOrder,
  listHostedGroupBuys,
  listMyGroupBuyOrders,
} from '../../api/groupBuys';
import {
  Failure,
  Frame,
  OrderBadge,
  StateBadge,
  dateLabel,
  money,
  s,
  useFocusLoad,
} from './common';
import { gbCopy, lang } from './strings';

function OrderCard({ order, navigation, onChanged }) {
  const c = gbCopy();
  const url = order.shipment
    ? trackingUrl(order.shipment.courier, order.shipment.trackingNumber)
    : null;
  const cancellable = [ORDER_STATE.BILLING_PENDING, ORDER_STATE.RESERVED].includes(order.state);

  const cancel = () =>
    Alert.alert(c.cancelConfirm, '', [
      { text: c.no, style: 'cancel' },
      {
        text: c.yes,
        onPress: async () => {
          try {
            await cancelGroupBuyOrder(order.id);
            Alert.alert(c.cancelDone);
          } catch (e) {
            Alert.alert(c.error.generic);
          }
          onChanged();
        },
      },
    ]);

  return (
    <Card style={{ padding: 14, gap: 8 }}>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() =>
          order.groupBuyCode && navigation.navigate('GroupBuy', { code: order.groupBuyCode })
        }
      >
        <View style={s.between}>
          <Text style={[s.h2, { flex: 1 }]} numberOfLines={1}>
            {order.groupBuyTitle}
          </Text>
          <OrderBadge state={order.state} />
        </View>
      </TouchableOpacity>
      <Text style={s.sub}>
        {order.option ? `${order.option} · ` : ''}
        {order.quantity} · {money(order.total, order.currency)}
      </Text>
      {order.state === ORDER_STATE.RESERVED && order.chargeAt ? (
        <Text style={s.sub}>{c.chargeAt(dateLabel(order.chargeAt))}</Text>
      ) : null}
      {order.state === ORDER_STATE.PAYMENT_FAILED ? (
        <Text style={[s.sub, { color: '#E53400' }]}>
          {c.failure[order.failureReason] ? `${c.failure[order.failureReason]} · ` : ''}
          {c.paymentFailedNote}
        </Text>
      ) : null}
      {order.shipment ? (
        <View style={s.between}>
          <Text style={s.body}>
            {c.trackNo(courierName(order.shipment.courier, lang()), order.shipment.trackingNumber)}
          </Text>
          {url ? (
            <Text
              style={s.link}
              accessibilityRole="link"
              onPress={() => Linking.openURL(url).catch(() => {})}
            >
              {c.track} ↗
            </Text>
          ) : null}
        </View>
      ) : null}
      {cancellable ? (
        <Text style={[s.link, { color: '#8A857B' }]} accessibilityRole="button" onPress={cancel}>
          {c.cancelJoin}
        </Text>
      ) : null}
    </Card>
  );
}

function HostedCard({ gb, navigation }) {
  const c = gbCopy();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.8}
      onPress={() => navigation.navigate('HostGroupBuy', { code: gb.code })}
    >
      <Card style={{ padding: 14, gap: 6 }}>
        <View style={s.between}>
          <Text style={[s.h2, { flex: 1 }]} numberOfLines={1}>
            {gb.title}
          </Text>
          <StateBadge state={gb.state} />
        </View>
        <Text style={s.sub}>
          {gb.brand.name} · {money(gb.price, gb.currency)} · {dateLabel(gb.startsAt, false)}~
          {dateLabel(gb.endsAt, false)}
        </Text>
        {gb.state === GB_STATE.PENDING_HOST ? (
          <Badge tone="amber" text={c.invite(gb.brand.name)} />
        ) : (
          <Text style={s.sub}>{c.stats(gb.reservedQuantity, gb.orderCount)}</Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

export default function MyGroupBuysScreen({ navigation, route }) {
  const c = gbCopy();
  const [tab, setTab] = useState(route.params?.tab === 'hosting' ? 'hosting' : 'joined');
  const { data, loading, error, reload } = useFocusLoad(async () => {
    const [orders, hosted] = await Promise.all([
      listMyGroupBuyOrders(),
      listHostedGroupBuys().catch(() => []),
    ]);
    return { orders, hosted };
  });

  const tabs = [
    ['joined', c.tabJoined],
    ['hosting', c.tabHosting],
  ];

  return (
    <Frame navigation={navigation} title={c.myTitle} onRefresh={reload} refreshing={loading}>
      <View style={[s.row, { gap: 6 }]}>
        {tabs.map(([key, label]) => (
          <TouchableOpacity
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === key }}
            onPress={() => setTab(key)}
            style={[s.tab, tab === key && s.tabOn]}
          >
            <Text style={[s.tabText, tab === key && s.tabTextOn]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && !data ? <Failure retry={reload} /> : null}
      {data && tab === 'joined' ? (
        data.orders.length ? (
          data.orders.map((o) => (
            <OrderCard key={o.id} order={o} navigation={navigation} onChanged={reload} />
          ))
        ) : (
          <Text style={[s.sub, { textAlign: 'center', paddingVertical: 24 }]}>{c.emptyJoined}</Text>
        )
      ) : null}
      {data && tab === 'hosting' ? (
        data.hosted.length ? (
          data.hosted.map((gb) => <HostedCard key={gb.code} gb={gb} navigation={navigation} />)
        ) : (
          <Text style={[s.sub, { textAlign: 'center', paddingVertical: 24 }]}>
            {c.emptyHosting}
          </Text>
        )
      ) : null}
    </Frame>
  );
}
