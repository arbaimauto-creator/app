// 공동구매 상세 = 쇼핑몰형 페이지 (2026-09-30)
// 구성: 대표 이미지 · 가격/할인 · 진행률/마감 · 호스트 카드(한마디) · 호스트 영상 · 브랜드 상세페이지 · 안내 · 하단 참여 버튼
// 진입: 홈 공동구매 레일, 내 공동구매, 딥링크 greyd://groupbuy/gb-xxxx (라우트 'GroupBuy', params.code)
import React, { useEffect, useState } from 'react';
import { ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Btn, Card, GlowCard, NoteBox, ProgressBar } from '../../Components/UI';
import { trackEvent } from '../../api/experiments';
import {
  GB_STATE,
  canOrder,
  discountPercent,
  fillRatio,
  getGroupBuy,
  isGroupBuyCode,
  remainingQuantity,
  timeLeft,
} from '../../api/groupBuys';
import { rememberTrackingCode } from '../../Components/utils/tracking';
import {
  Failure,
  Frame,
  OrderBadge,
  Price,
  ProductPlaceholder,
  StateBadge,
  dateLabel,
  money,
  s,
  useFocusLoad,
} from './common';
import { gbCopy } from './strings';

// 상세페이지 이미지는 세로로 긴 경우가 많다 — 원본 비율대로 높이를 맞춘다
function DetailImage({ uri }) {
  const [ratio, setRatio] = useState(1);
  return (
    <FastImage
      source={{ uri }}
      style={{ width: '100%', aspectRatio: ratio }}
      resizeMode="contain"
      onLoad={(e) => {
        const { width, height } = e.nativeEvent || {};
        if (width > 0 && height > 0) {
          setRatio(width / height);
        }
      }}
    />
  );
}

export function HostCard({ gb }) {
  const c = gbCopy();
  const initial = (gb.host.name || gb.host.handle || '?').slice(0, 1).toUpperCase();
  return (
    <Card style={{ padding: 14, gap: 10 }}>
      <View style={s.row}>
        <View style={s.avatar}>
          {gb.host.avatarUrl ? (
            <FastImage source={{ uri: gb.host.avatarUrl }} style={{ width: 40, height: 40 }} />
          ) : (
            <Text style={s.avatarText}>{initial}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.strong}>@{gb.host.handle}</Text>
          <Text style={s.sub}>{c.hostSays}</Text>
        </View>
      </View>
      {gb.host.note ? <Text style={s.body}>“{gb.host.note}”</Text> : null}
    </Card>
  );
}

export function VideoRail({ videos, onOpen, renderAction }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10 }}
    >
      {videos.map((v) => (
        <View key={v.videoId} style={{ width: 104, gap: 4 }}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={v.caption || v.videoId}
            onPress={() => onOpen && onOpen(v)}
            style={s.thumb}
          >
            {v.thumbnailUrl ? (
              <FastImage source={{ uri: v.thumbnailUrl }} style={{ width: 104, height: 150 }} />
            ) : (
              <Text style={s.thumbIcon}>▶</Text>
            )}
          </TouchableOpacity>
          {v.caption ? (
            <Text style={s.sub} numberOfLines={2}>
              {v.caption}
            </Text>
          ) : null}
          {renderAction ? renderAction(v) : null}
        </View>
      ))}
    </ScrollView>
  );
}

export function shareGroupBuy(gb) {
  const url = `https://greyd.app/groupbuy/${gb.code}`;
  trackEvent('groupbuy.share', {});
  return Share.share({ message: gbCopy().shareMessage(gb.title, url), url }).catch(() => {});
}

export default function GroupBuyDetailScreen({ navigation, route }) {
  const c = gbCopy();
  const code = route.params?.code;
  const valid = isGroupBuyCode(code);
  const [now, setNow] = useState(Date.now());
  const {
    data: gb,
    loading,
    error,
    reload,
  } = useFocusLoad(() => (valid ? getGroupBuy(code) : Promise.resolve(null)), code);

  useEffect(() => {
    if (valid) {
      // 이 화면으로 들어온 것 자체가 귀속 시작 — 링크 밖(알림 등)에서 왔어도 기억한다
      rememberTrackingCode(code).catch(() => {});
      trackEvent('groupbuy.view', {});
    }
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [code, valid]);

  if (!gb) {
    return (
      <Frame navigation={navigation} title={c.eyebrow} onRefresh={reload} refreshing={loading}>
        {!loading ? (
          <Failure
            text={error === 'network' ? c.loadError : c.notFound}
            retry={error === 'network' ? reload : null}
          />
        ) : null}
      </Frame>
    );
  }

  const ratio = fillRatio(gb);
  const off = discountPercent(gb);
  const open = canOrder(gb, now);
  const upcoming =
    gb.state === GB_STATE.SCHEDULED ||
    (gb.state === GB_STATE.OPEN && gb.startsAt && new Date(gb.startsAt).getTime() > now);
  const left = timeLeft(upcoming ? gb.startsAt : gb.endsAt, now);
  const soldOut = gb.state === GB_STATE.OPEN && remainingQuantity(gb) <= 0;

  let cta = null;
  if (open) {
    cta = (
      <Btn
        title={gb.myOrders.some((o) => o.state === 'RESERVED') ? c.ctaMore : c.ctaJoin}
        onPress={() => {
          trackEvent('groupbuy.join_tap', {});
          navigation.navigate('GroupBuyOrder', { code: gb.code });
        }}
      />
    );
  } else if (upcoming) {
    cta = <Btn title={c.ctaSoon} disabled onPress={() => {}} />;
  } else if (soldOut) {
    cta = <Btn title={c.ctaSoldOut} disabled onPress={() => {}} />;
  } else if (gb.state === GB_STATE.OPEN || gb.state === GB_STATE.CLOSED) {
    cta = <Btn title={c.ctaClosed} disabled onPress={() => {}} />;
  }

  return (
    <Frame
      navigation={navigation}
      title={c.eyebrow}
      onRefresh={reload}
      refreshing={loading}
      footer={cta}
    >
      {gb.product.imageUrl ? (
        <FastImage source={{ uri: gb.product.imageUrl }} style={s.hero} resizeMode="cover" />
      ) : (
        <ProductPlaceholder style={s.hero} size={56} />
      )}

      <View style={{ gap: 6 }}>
        <View style={s.between}>
          <Text style={s.eyebrow}>{gb.brand.name.toUpperCase()}</Text>
          <StateBadge state={gb.state} />
        </View>
        <Text style={s.h1}>{gb.title}</Text>
        <Text style={s.sub}>{gb.product.name}</Text>
      </View>

      <GlowCard glow={0.4} contentStyle={{ gap: 8 }}>
        {off > 0 ? (
          <Text style={s.strike}>
            {c.listPrice} {money(gb.product.listPrice, gb.currency)}
          </Text>
        ) : null}
        <View style={s.row}>
          {off > 0 ? <Text style={s.off}>{c.off(off)}</Text> : null}
          <Price style={s.price} amount={gb.price} currency={gb.currency} />
        </View>
        <Text style={s.sub}>
          {gb.shippingFee > 0
            ? `${c.shippingFee} ${money(gb.shippingFee, gb.currency)}`
            : c.freeShipping}
        </Text>
        {ratio != null ? <ProgressBar ratio={ratio} /> : null}
        <View style={s.between}>
          <Text style={s.sub}>
            {ratio != null
              ? c.progress(gb.reservedQuantity, gb.minQuantity)
              : c.noMin(gb.reservedQuantity)}
          </Text>
          {left && (open || upcoming) ? (
            <Text style={s.strong}>{upcoming ? c.startsIn(left) : c.left(left)}</Text>
          ) : null}
        </View>
      </GlowCard>

      {gb.state === GB_STATE.FAILED ? <NoteBox tone="red" text={c.failedNote} /> : null}
      {gb.state === GB_STATE.CANCELLED ? <NoteBox tone="red" text={c.cancelledNote} /> : null}

      {gb.myOrders.length ? (
        <Card style={{ padding: 14, gap: 8 }}>
          <Text style={s.h2}>{c.myOrders}</Text>
          {gb.myOrders.map((o) => (
            <View key={o.id} style={s.between}>
              <Text style={s.body}>
                {o.option ? `${o.option} · ` : ''}
                {o.quantity} · {money(o.total, o.currency)}
              </Text>
              <OrderBadge state={o.state} />
            </View>
          ))}
          <TouchableOpacity onPress={() => navigation.navigate('MyGroupBuys')}>
            <Text style={s.link}>{c.myTitle} ›</Text>
          </TouchableOpacity>
        </Card>
      ) : null}

      <HostCard gb={gb} />

      {gb.videos.length ? (
        <View style={{ gap: 8 }}>
          <Text style={s.h2}>{c.hostVideos}</Text>
          <VideoRail
            videos={gb.videos}
            onOpen={(v) => navigation.navigate('VideoPage', { videoId: v.videoId })}
          />
        </View>
      ) : null}

      <NoteBox text={c.howItWorks(gb.minQuantity)} />

      <View style={{ gap: 8 }}>
        <Text style={s.h2}>{c.detail}</Text>
        {gb.product.description ? <Text style={s.body}>{gb.product.description}</Text> : null}
        {gb.detailImages.length ? (
          gb.detailImages.map((uri) => <DetailImage key={uri} uri={uri} />)
        ) : !gb.product.description ? (
          <Text style={s.sub}>{c.noDetail}</Text>
        ) : null}
      </View>

      <Card style={{ padding: 14, gap: 6 }}>
        <Text style={s.sub}>{c.country(gb.country)}</Text>
        <Text style={s.sub}>{c.perUser(gb.perUserMax)}</Text>
        {gb.shipBy ? <Text style={s.sub}>{c.shipBy(dateLabel(gb.shipBy, false))}</Text> : null}
        <Text style={s.sub}>{c.seller(gb.brand.name)}</Text>
        <Text style={s.sub}>{c.disclosure}</Text>
      </Card>

      <Btn variant="ghost" small title={c.share} onPress={() => shareGroupBuy(gb)} />
    </Frame>
  );
}
