// 공동구매 상세 = 쇼핑몰형 페이지 (2026-09-30, v2)
// 구성: 이미지 갤러리 · 가격(공동구매가·할인·절약액) · 실시간 카운트다운 · 목표 진행률 · 참여자/최근 참여
//   → 고정 탭(상세정보 / 호스트 / 구매 안내) → 상세(브랜드 상세페이지, 접기) · 호스트(한마디·영상)
//   · 구매 안내(4단계 · 배송 · 교환/반품 · 판매자 · FAQ) → 하단 바(가격 + 참여하기 → 옵션 시트)
// 진입: 홈 공동구매 레일, 내 공동구매, 딥링크 greyd://groupbuy/gb-xxxx (라우트 'GroupBuy', params.code)
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import T from '../../Components/Constants/DesignTokens';
import { Btn, Card, GlowCard, NoteBox, ProgressBar } from '../../Components/UI';
import { trackEvent } from '../../api/experiments';
import {
  GB_STATE,
  canOrder,
  discountPercent,
  fillRatio,
  getGroupBuy,
  isGroupBuyCode,
  myActiveQuantity,
  relativeMinutes,
  remainingQuantity,
  timeLeft,
  toGoal,
  watchGroupBuy,
} from '../../api/groupBuys';
import { rememberTrackingCode } from '../../Components/utils/tracking';
import OptionSheet from './OptionSheet';
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
import { gbCopy } from './strings';

const { COLORS, FONT, RADIUS } = T;
const DETAIL_PREVIEW = 1; // 접힌 상태에서 보여줄 상세 이미지 수

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

// 이미지 갤러리 — 가로 페이징 + "1 / 4"
export function Gallery({ images, width }) {
  const [index, setIndex] = useState(0);
  if (!images.length) {
    return (
      <View style={[styles.galleryItem, { width, height: width }, styles.galleryEmpty]}>
        <Text style={{ fontSize: 48 }}>🛍️</Text>
      </View>
    );
  }
  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / Math.max(1, width)))
        }
        style={{ width, borderRadius: RADIUS.CARD - 6 }}
      >
        {images.map((uri) => (
          <FastImage
            key={uri}
            source={{ uri }}
            style={[styles.galleryItem, { width, height: width }]}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
      {images.length > 1 ? (
        <View style={styles.galleryCounter} accessibilityLabel={`${index + 1}/${images.length}`}>
          <Text style={styles.galleryCounterText}>
            {index + 1} / {images.length}
          </Text>
        </View>
      ) : null}
    </View>
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
            ) : null}
            <View style={styles.playBadge}>
              <MaterialCommunityIcons name="play" size={18} color="#FFFFFF" />
            </View>
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

function Accordion({ title, children, initiallyOpen = false }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View style={styles.accordion}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={styles.accordionHead}
      >
        <Text style={[s.strong, { flex: 1 }]}>{title}</Text>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.GREY}
        />
      </TouchableOpacity>
      {open ? <View style={{ paddingBottom: 12, gap: 6 }}>{children}</View> : null}
    </View>
  );
}

// 초 단위 시계 — 이 컴포넌트만 매초 다시 그린다(페이지 전체는 그대로)
function LiveClock({ target, label, style }) {
  const c = gbCopy();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const left = timeLeft(target, now);
  if (!left) {
    return null;
  }
  return (
    <View style={[styles.clock, style]}>
      <MaterialCommunityIcons name="clock-outline" size={15} color={COLORS.AMBER_DEEP} />
      <Text style={styles.clockLabel}>{label}</Text>
      <Text style={styles.clockValue}>{c.clock(left)}</Text>
    </View>
  );
}

export default function GroupBuyDetailScreen({ navigation, route }) {
  const c = gbCopy();
  const code = route.params?.code;
  const valid = isGroupBuyCode(code);
  const [sheet, setSheet] = useState(false);
  const [tab, setTab] = useState('detail');
  const [expanded, setExpanded] = useState(false);
  const [watchBusy, setWatchBusy] = useState(false);
  const scrollRef = useRef(null);
  const anchors = useRef({});
  const galleryWidth = Dimensions.get('window').width - 32;
  const {
    data: gb,
    setData,
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
  }, [code, valid]);

  // 시작·마감 시각이 지나면 버튼 상태가 바뀌도록 그 순간에 한 번 다시 그린다(24시간 안의 경계만)
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!gb) {
      return undefined;
    }
    const t = Date.now();
    const next = [gb.startsAt, gb.endsAt]
      .map((iso) => (iso ? new Date(iso).getTime() - t : NaN))
      .filter((d) => d > 0 && d < 86400000)
      .sort((a, b) => a - b)[0];
    if (!next) {
      return undefined;
    }
    const timer = setTimeout(() => setTick((x) => x + 1), next + 500);
    return () => clearTimeout(timer);
  }, [gb]);

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

  const now = Date.now();
  const ratio = fillRatio(gb);
  const off = discountPercent(gb);
  const open = canOrder(gb, now);
  const upcoming =
    gb.state === GB_STATE.SCHEDULED ||
    (gb.state === GB_STATE.OPEN && gb.startsAt && new Date(gb.startsAt).getTime() > now);
  const soldOut = gb.state === GB_STATE.OPEN && remainingQuantity(gb) <= 0;
  const goal = toGoal(gb);
  const saved = off > 0 ? gb.product.listPrice - gb.price : 0;
  const detailImages = expanded ? gb.detailImages : gb.detailImages.slice(0, DETAIL_PREVIEW);

  const jump = (key) => {
    setTab(key);
    const y = anchors.current[key];
    if (y != null && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, y - 56), animated: true });
    }
  };
  // 스크롤 위치에 따라 탭 표시를 맞춘다
  const onScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y + 80;
    const order = ['detail', 'host', 'guide'];
    let current = 'detail';
    for (const key of order) {
      if (anchors.current[key] != null && y >= anchors.current[key]) {
        current = key;
      }
    }
    if (current !== tab) {
      setTab(current);
    }
  };
  const anchor = (key) => (e) => {
    anchors.current[key] = e.nativeEvent.layout.y;
  };

  const toggleWatch = async () => {
    setWatchBusy(true);
    try {
      await watchGroupBuy(gb.code, !gb.watching);
      setData({ ...gb, watching: !gb.watching });
      if (!gb.watching) {
        Alert.alert(c.notifyDone);
      }
      trackEvent('groupbuy.watch', { on: !gb.watching });
    } catch (e) {
      Alert.alert(c.error.generic);
    } finally {
      setWatchBusy(false);
    }
  };

  const limitReached = myActiveQuantity(gb) >= gb.perUserMax;
  let cta;
  if (open && limitReached) {
    cta = <Btn style={{ flex: 1 }} title={c.ctaLimit(gb.perUserMax)} disabled onPress={() => {}} />;
  } else if (open) {
    cta = (
      <Btn
        style={{ flex: 1 }}
        title={gb.myOrders.some((o) => o.state === 'RESERVED') ? c.ctaMore : c.ctaJoin}
        onPress={() => {
          trackEvent('groupbuy.join_tap', {});
          setSheet(true);
        }}
      />
    );
  } else if (upcoming) {
    cta = (
      <Btn
        style={{ flex: 1 }}
        variant={gb.watching ? 'ghost' : 'primary'}
        title={gb.watching ? c.notifyOn : c.notify}
        loading={watchBusy}
        onPress={toggleWatch}
      />
    );
  } else if (soldOut) {
    cta = <Btn style={{ flex: 1 }} title={c.ctaSoldOut} disabled onPress={() => {}} />;
  } else if (gb.state === GB_STATE.OPEN || gb.state === GB_STATE.CLOSED) {
    cta = <Btn style={{ flex: 1 }} title={c.ctaClosed} disabled onPress={() => {}} />;
  }

  const footer = cta ? (
    <View style={styles.footerRow}>
      <View style={styles.footerPrice}>
        {off > 0 ? <Text style={styles.footerOff}>{off}%</Text> : null}
        <Text style={styles.footerAmount}>{money(gb.price, gb.currency)}</Text>
      </View>
      {cta}
    </View>
  ) : null;

  const shareButton = (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={c.share}
      onPress={() => shareGroupBuy(gb)}
      style={s.backBtn}
    >
      <MaterialCommunityIcons name="share-variant-outline" size={21} color={COLORS.INK} />
    </TouchableOpacity>
  );

  const tabs = ['detail', 'host', 'guide'];

  return (
    <>
      <Frame
        navigation={navigation}
        title={c.eyebrow}
        onRefresh={reload}
        refreshing={loading}
        footer={footer}
        scrollRef={scrollRef}
        right={shareButton}
        stickyIndex={1}
        onScroll={onScroll}
      >
        {/* 0: 상단 — 갤러리·가격·카운트다운·참여 현황 (null이 오면 고정 탭 인덱스가 밀린다) */}
        <View style={{ gap: 12 }}>
          <Gallery images={gb.product.images} width={galleryWidth} />

          <View style={{ gap: 6 }}>
            <View style={s.between}>
              <Text style={s.eyebrow}>{gb.brand.name}</Text>
              <StateBadge state={gb.state} />
            </View>
            <Text style={s.h1}>{gb.title}</Text>
            <Text style={s.sub}>
              {gb.product.name} · @{gb.host.handle}
            </Text>
          </View>

          <GlowCard glow={0.4} contentStyle={{ gap: 8 }}>
            <Text style={styles.priceLabel}>{c.groupPrice}</Text>
            <View style={[s.row, { alignItems: 'flex-end' }]}>
              {off > 0 ? <Text style={s.off}>{c.off(off)}</Text> : null}
              <Text style={s.price}>{money(gb.price, gb.currency)}</Text>
              {off > 0 ? (
                <Text style={[s.strike, { marginBottom: 4 }]}>
                  {money(gb.product.listPrice, gb.currency)}
                </Text>
              ) : null}
            </View>
            {saved > 0 ? (
              <Text style={styles.saveText}>{c.save(money(saved, gb.currency))}</Text>
            ) : null}
            <Text style={s.sub}>
              {gb.shippingFee > 0
                ? `${c.shippingFee} ${money(gb.shippingFee, gb.currency)}`
                : c.freeShipping}
              {gb.shipBy ? ` · ${c.shipBy(dateLabel(gb.shipBy, false))}` : ''}
            </Text>
          </GlowCard>

          <Card style={{ padding: 14, gap: 10 }}>
            {open || upcoming ? (
              <LiveClock
                target={upcoming ? gb.startsAt : gb.endsAt}
                label={upcoming ? c.startsInLabel : c.endsIn}
              />
            ) : null}
            {ratio != null ? <ProgressBar ratio={ratio} height={8} /> : null}
            <View style={s.between}>
              <Text style={s.strong}>
                {goal == null
                  ? c.noMin(gb.reservedQuantity)
                  : goal > 0
                    ? c.goalLeft(goal)
                    : c.goalReached}
              </Text>
              {ratio != null ? (
                <Text style={s.sub}>{c.progress(gb.reservedQuantity, gb.minQuantity)}</Text>
              ) : null}
            </View>
            {gb.orderCount > 0 ? (
              <View style={styles.buyers}>
                <View style={styles.avatarStack}>
                  {gb.recentBuyers.slice(0, 4).map((b, i) => (
                    <View
                      key={`${b.name}-${i}`}
                      style={[styles.miniAvatar, { marginLeft: i ? -8 : 0 }]}
                    >
                      <Text style={styles.miniAvatarText}>{b.name.slice(0, 1)}</Text>
                    </View>
                  ))}
                </View>
                <Text style={s.strong}>{c.buyers(gb.orderCount)}</Text>
              </View>
            ) : null}
            {gb.recentBuyers.slice(0, 3).map((b, i) => {
              const min = relativeMinutes(b.at, now);
              return (
                <Text key={`r-${i}`} style={s.sub}>
                  · {c.recent(b.name, b.quantity, min == null ? 0 : min)}
                </Text>
              );
            })}
          </Card>

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
        </View>

        {/* 1: 고정 탭 */}
        <View style={styles.tabBar}>
          {tabs.map((key) => (
            <TouchableOpacity
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === key }}
              onPress={() => jump(key)}
              style={[styles.tab, tab === key && styles.tabOn]}
            >
              <Text style={[styles.tabText, tab === key && styles.tabTextOn]}>{c.tabs[key]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 상세정보 */}
        <View onLayout={anchor('detail')} style={{ gap: 10 }}>
          <Text style={s.h2}>{c.detail}</Text>
          {gb.product.description ? <Text style={s.body}>{gb.product.description}</Text> : null}
          {detailImages.map((uri) => (
            <DetailImage key={uri} uri={uri} />
          ))}
          {gb.detailImages.length > DETAIL_PREVIEW ? (
            <Btn
              variant="ghost"
              small
              title={expanded ? c.lessDetail : c.moreDetail}
              onPress={() => setExpanded((v) => !v)}
            />
          ) : null}
          {!gb.detailImages.length && !gb.product.description ? (
            <Text style={s.sub}>{c.noDetail}</Text>
          ) : null}
        </View>

        {/* 호스트 */}
        <View onLayout={anchor('host')} style={{ gap: 10 }}>
          <Text style={s.h2}>{c.tabs.host}</Text>
          <HostCard gb={gb} />
          {gb.videos.length ? (
            <View style={{ gap: 8 }}>
              <Text style={s.strong}>{c.hostVideos}</Text>
              <VideoRail
                videos={gb.videos}
                onOpen={(v) => navigation.navigate('VideoPage', { videoId: v.videoId })}
              />
            </View>
          ) : null}
        </View>

        {/* 구매 안내 */}
        <View onLayout={anchor('guide')} style={{ gap: 10 }}>
          <Text style={s.h2}>{c.tabs.guide}</Text>
          <Card style={{ padding: 14, gap: 12 }}>
            {c.steps.map(([title, body], i) => (
              <View key={title} style={styles.step}>
                <View style={styles.stepDot}>
                  <Text style={styles.stepNum}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.strong}>{title}</Text>
                  <Text style={s.sub}>{body}</Text>
                </View>
              </View>
            ))}
            {gb.minQuantity ? <Text style={s.sub}>{c.howItWorks(gb.minQuantity)}</Text> : null}
          </Card>

          <Card style={{ paddingVertical: 4, paddingHorizontal: 14 }}>
            <Accordion title={c.shippingTitle}>
              <Text style={s.body}>{c.country(gb.country)}</Text>
              {gb.shipBy ? (
                <Text style={s.body}>{c.shipBy(dateLabel(gb.shipBy, false))}</Text>
              ) : null}
              {gb.notices.shipping ? <Text style={s.sub}>{gb.notices.shipping}</Text> : null}
            </Accordion>
            <Accordion title={c.returnsTitle}>
              <Text style={s.sub}>{gb.notices.returns || c.cancelNote}</Text>
            </Accordion>
            <Accordion title={c.sellerTitle}>
              <Text style={s.sub}>{c.seller(gb.brand.name)}</Text>
              <Text style={s.sub}>{c.disclosure}</Text>
            </Accordion>
          </Card>

          <Text style={s.h2}>{c.faqTitle}</Text>
          <Card style={{ paddingVertical: 4, paddingHorizontal: 14 }}>
            {c.faq.map(([q, a]) => (
              <Accordion key={q} title={q}>
                <Text style={s.sub}>{a}</Text>
              </Accordion>
            ))}
          </Card>
        </View>
      </Frame>

      <OptionSheet
        gb={gb}
        visible={sheet}
        onClose={() => setSheet(false)}
        onConfirm={({ option, quantity }) => {
          setSheet(false);
          navigation.navigate('GroupBuyOrder', { code: gb.code, option, quantity });
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  galleryItem: { backgroundColor: COLORS.LINE },
  galleryEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.CARD - 6,
  },
  galleryCounter: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  galleryCounterText: { fontFamily: FONT.Medium, fontSize: 11, color: '#FFFFFF' },
  priceLabel: { fontFamily: FONT.Bold, fontSize: 12, color: COLORS.AMBER_DEEP },
  saveText: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.RED },
  clock: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clockLabel: { fontFamily: FONT.Medium, fontSize: 12.5, color: COLORS.AMBER_DEEP },
  clockValue: {
    fontFamily: T.LATIN.Bold,
    fontSize: 16,
    color: COLORS.INK,
    fontVariant: ['tabular-nums'],
  },
  buyers: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarStack: { flexDirection: 'row' },
  miniAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.AMBER_SOFT,
    borderWidth: 2,
    borderColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: { fontFamily: FONT.Bold, fontSize: 11, color: COLORS.AMBER_DEEP },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.BG,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.LINE,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabOn: { borderBottomColor: COLORS.INK },
  tabText: { fontFamily: FONT.Medium, fontSize: 13.5, color: COLORS.GREY },
  tabTextOn: { fontFamily: FONT.Bold, color: COLORS.INK },
  accordion: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.LINE },
  accordionHead: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 8 },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.AMBER_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { fontFamily: FONT.Bold, fontSize: 12, color: COLORS.AMBER_DEEP },
  playBadge: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  footerPrice: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  footerOff: { fontFamily: FONT.Bold, fontSize: 15, color: COLORS.RED },
  footerAmount: { fontFamily: T.LATIN.Bold, fontSize: 18, color: COLORS.INK },
});
