// 내 2차 활용 현황 (2026-09-16 P2·P3) — docs/secondary-use-and-groupbuy-2026-09-16.md
// 동의한 리뷰로 브랜드가 만든 소재, 거기서 나온 판매·인센티브, 공동구매 진행률을 본다. 작성자는 보기만 한다.
import React from 'react';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  EMPTY_INCENTIVES,
  daysLeftUntil,
  getMyIncentives,
  groupBuyProgress,
} from '../api/incentives';
import T from './Constants/DesignTokens';
import Strings from './Strings';
import { Badge, Card, GlowCard, ProgressBar } from './UI';

const { COLORS, FONT, RADIUS } = T;

const won = (n) => `${Number(n || 0).toLocaleString()}원`;

const assetKindLabel = (kind) =>
  ({
    AD_CREATIVE: Strings.INC_ASSET_KIND_AD_CREATIVE,
    PRODUCT_PAGE: Strings.INC_ASSET_KIND_PRODUCT_PAGE,
    SHORTFORM: Strings.INC_ASSET_KIND_SHORTFORM,
  })[kind] || Strings.INC_ASSET_KIND_OTHER;

const assetStateLabel = (state) =>
  ({ LIVE: Strings.INC_ASSET_STATE_LIVE, PAUSED: Strings.INC_ASSET_STATE_PAUSED })[state] ||
  Strings.INC_ASSET_STATE_ENDED;

const grantStateLabel = (state) =>
  ({ PENDING: Strings.INC_GRANT_STATE_PENDING, APPROVED: Strings.INC_GRANT_STATE_APPROVED })[
    state
  ] || Strings.INC_GRANT_STATE_PAID;

const gbStateLabel = (state) =>
  ({
    OPEN: Strings.INC_GB_STATE_OPEN,
    REACHED: Strings.INC_GB_STATE_REACHED,
    FAILED: Strings.INC_GB_STATE_FAILED,
    SHIPPING: Strings.INC_GB_STATE_SHIPPING,
  })[state] || Strings.INC_GB_STATE_DONE;

export default class SecondaryUseStatusScreen extends React.Component {
  state = { data: EMPTY_INCENTIVES, loading: true, refreshing: false };

  componentDidMount() {
    this.load();
  }

  load = async (refreshing = false) => {
    this.setState(refreshing ? { refreshing: true } : { loading: true });
    const data = await getMyIncentives();
    this.setState({ data, loading: false, refreshing: false });
  };

  render() {
    const { data, loading, refreshing } = this.state;
    const empty =
      data.assets.length === 0 && data.grants.length === 0 && data.groupBuys.length === 0;

    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.AMBER} />
        </View>
      );
    }

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
        <Text style={styles.title}>{Strings.INC_TITLE}</Text>

        <GlowCard glow={0.45} contentStyle={styles.totalsRow}>
          {[
            [Strings.INC_TOTALS_PENDING, data.totals.pending],
            [Strings.INC_TOTALS_APPROVED, data.totals.approved],
            [Strings.INC_TOTALS_PAID, data.totals.paid],
          ].map(([label, amount]) => (
            <View key={label} style={styles.totalCol}>
              <Text style={styles.totalLabel}>{label}</Text>
              <Text style={styles.totalValue}>{won(amount)}</Text>
            </View>
          ))}
        </GlowCard>

        {empty ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎬</Text>
            <Text style={styles.emptyTitle}>{Strings.INC_EMPTY}</Text>
            <Text style={styles.emptyDesc}>{Strings.INC_EMPTY_DESC}</Text>
          </View>
        ) : null}

        {data.groupBuys.length > 0 ? (
          <>
            <Text style={styles.section}>{Strings.INC_SECTION_GROUPBUY}</Text>
            {data.groupBuys.map((gb) => {
              const left = daysLeftUntil(gb.endsAt);
              return (
                <Card key={gb.id} style={styles.item}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {gb.title}
                    </Text>
                    <Badge
                      tone={gb.state === 'FAILED' ? 'red' : gb.state === 'OPEN' ? 'amber' : 'open'}
                      text={gbStateLabel(gb.state)}
                    />
                  </View>
                  <ProgressBar ratio={groupBuyProgress(gb)} style={styles.progress} />
                  <View style={styles.rowBetween}>
                    <Text style={styles.meta}>
                      {Strings.INC_GB_PROGRESS(gb.joinedQuantity, gb.minQuantity)}
                    </Text>
                    {gb.state === 'OPEN' && left != null ? (
                      <Text style={styles.meta}>{Strings.INC_GB_DAYS_LEFT(left)}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.meta}>
                    {Strings.INC_GB_COUNTRIES(gb.countries.join(', ') || '-')} · {won(gb.price)} ·{' '}
                    {Strings.INC_GRANT_RATE(gb.incentivePercent)}
                  </Text>
                </Card>
              );
            })}
          </>
        ) : null}

        {data.assets.length > 0 ? (
          <>
            <Text style={styles.section}>{Strings.INC_SECTION_ASSETS}</Text>
            {data.assets.map((a) => (
              <Card key={a.id} style={styles.item}>
                <View style={styles.rowBetween}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {a.title}
                  </Text>
                  <Badge
                    tone={a.state === 'LIVE' ? 'open' : 'curated'}
                    text={assetStateLabel(a.state)}
                  />
                </View>
                <Text style={styles.meta}>
                  {assetKindLabel(a.kind)} · {a.brandName}
                </Text>
                <Text style={styles.stat}>{Strings.INC_ASSET_STATS(a.orders, a.revenue)}</Text>
                {a.url ? (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(a.url).catch(() => {})}
                    accessibilityRole="link"
                  >
                    <Text style={styles.link} numberOfLines={1}>
                      {a.url}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </Card>
            ))}
          </>
        ) : null}

        {data.grants.length > 0 ? (
          <>
            <Text style={styles.section}>{Strings.INC_SECTION_GRANTS}</Text>
            <Card style={styles.item}>
              {data.grants.map((g, i) => (
                <View key={g.id} style={[styles.grantRow, i > 0 && styles.grantRowBorder]}>
                  <View style={styles.grantText}>
                    <Text style={styles.grantTitle}>
                      {g.kind === 'GROUP_BUY' ? Strings.INC_GRANT_GROUP : Strings.INC_GRANT_SALES}
                    </Text>
                    <Text style={styles.meta}>
                      {Strings.INC_GRANT_RATE(g.ratePercent)} · {grantStateLabel(g.state)}
                    </Text>
                  </View>
                  <Text style={styles.grantAmount}>+{won(g.amount)}</Text>
                </View>
              ))}
            </Card>
          </>
        ) : null}

        <Text style={styles.note}>{Strings.INC_NOTE}</Text>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  content: { padding: 16, paddingBottom: 32, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.BG },
  title: { fontFamily: FONT.ExtraBold, fontSize: 20, color: COLORS.INK },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalCol: { flex: 1, alignItems: 'center', gap: 4 },
  totalLabel: { fontFamily: FONT.Bold, fontSize: 11, color: COLORS.GREY },
  totalValue: {
    fontFamily: T.LATIN.ExtraBold,
    fontSize: 15,
    color: COLORS.INK,
    letterSpacing: -0.3,
  },
  section: { fontFamily: FONT.Bold, fontSize: 13, color: COLORS.INK, marginTop: 8 },
  item: { padding: 12, gap: 6 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: { flex: 1, fontFamily: FONT.Bold, fontSize: 13.5, color: COLORS.INK },
  meta: { fontFamily: FONT.Regular, fontSize: 11.5, color: COLORS.GREY },
  stat: { fontFamily: T.LATIN.Bold, fontSize: 13, color: COLORS.INK },
  link: { fontFamily: FONT.Regular, fontSize: 11.5, color: COLORS.AMBER_DEEP },
  progress: { marginTop: 4 },
  grantRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  grantRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.LINE },
  grantText: { flex: 1, gap: 2 },
  grantTitle: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.INK },
  grantAmount: { fontFamily: T.LATIN.ExtraBold, fontSize: 14, color: COLORS.AMBER_DEEP },
  empty: { alignItems: 'center', gap: 6, padding: 24 },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontFamily: FONT.Bold, fontSize: 15, color: COLORS.INK },
  emptyDesc: {
    fontFamily: FONT.Regular,
    fontSize: 12.5,
    color: COLORS.GREY,
    textAlign: 'center',
    lineHeight: 18,
  },
  note: {
    fontFamily: FONT.Regular,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.GREY,
    marginTop: 6,
  },
  unused: { borderRadius: RADIUS.CARD },
});
