import React, { useCallback, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import Preference from 'react-native-default-preference';
import T from '../../Components/Constants/DesignTokens';
import { Card, Btn, StatusPill, NoteBox } from '../../Components/UI';
import Strings from '../../Components/Strings';
import { fetchCampaigns, selectCampaigns } from '../../slices/campaign';
import {
  fetchCampaignReviews,
  fetchCountryStats,
  fetchWeeklyFinding,
  fetchFgiStats,
} from '../../api/reviews';
import { getEvaluations } from '../../api/evaluations';

const { COLORS, FONT } = T;

// v2 §5-3: 브랜드 대시보드 — 임원 보고 순서.
// ① 요약 카드 4장 ② 위클리 발견 ③ 국가 스코어보드 ④ 2차 CTA (+ 리포트 배너)
export default function BrandDashboard() {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectCampaigns);
  const [brandName, setBrandName] = useState('');
  const [campaignId, setCampaignId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState([]);
  const [finding, setFinding] = useState(null);
  const [evaluations, setEvaluations] = useState({});
  const [fgi, setFgi] = useState(null);

  useFocusEffect(
    useCallback(() => {
      Preference.get('inviteBrandName').then((v) => setBrandName(v || ''));
      if (campaigns.length === 0) {
        dispatch(fetchCampaigns());
      }
      const id = campaignId || campaigns[0]?.id;
      if (id) {
        setCampaignId(id);
        fetchCampaignReviews(id).then(setReviews);
        fetchCountryStats(id).then(setStats);
        fetchWeeklyFinding(id).then(setFinding);
        fetchFgiStats(id).then(setFgi);
        getEvaluations().then(setEvaluations);
      }
      // 포커스마다 갱신
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaigns, campaignId]),
  );

  const totalUploads = reviews.length;
  const totalReach = reviews.reduce((sum, r) => sum + (r.views7d || 0), 0);
  const scored = Object.values(evaluations).filter((e) => e.scores);
  const avgScore = scored.length
    ? (
        scored.reduce(
          (sum, e) =>
            sum +
            (e.scores.authenticity + e.scores.delivery + e.scores.quality + e.scores.marketSignal) /
              4,
          0,
        ) / scored.length
      ).toFixed(1)
    : '—';
  const countryCount = new Set(reviews.map((r) => r.country)).size;

  const bestCountry = [...stats].sort((a, b) => b.uploaded / b.quota - a.uploaded / a.quota)[0];

  const currentCampaign = campaigns.find((c) => c.id === campaignId);
  const isEmpty = totalUploads === 0;

  const kpis = [
    { label: Strings.BRAND_SUM_UPLOADS, value: String(totalUploads) },
    { label: Strings.BRAND_SUM_REACH, value: totalReach.toLocaleString() },
    { label: Strings.BRAND_SUM_SCORE, value: String(avgScore) },
    { label: Strings.BRAND_SUM_COUNTRIES, value: String(countryCount) },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={styles.header}>
          {currentCampaign?.title || Strings.BRAND_DASH_TITLE}
          {brandName ? ` · ${brandName}` : ''}
        </Text>

        {/* 캠페인 선택 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {campaigns.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.campChip, campaignId === c.id && styles.campChipOn]}
              onPress={() => setCampaignId(c.id)}
            >
              <Text
                style={[styles.campChipText, campaignId === c.id && styles.campChipTextOn]}
                numberOfLines={1}
              >
                {c.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isEmpty ? (
          /* 빈 상태 — 배송·제작 기간 (시안: 대시보드 빈 상태) */
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🚚</Text>
            <Text style={styles.emptyTitle}>{Strings.BRAND_EMPTY_TITLE}</Text>
            <Text style={styles.emptyBody}>{Strings.BRAND_EMPTY_BODY}</Text>
            <View style={styles.emptyPillRow}>
              <StatusPill status="approved" label={Strings.BRAND_EMPTY_PILL_APPROVED} />
              <StatusPill status="shipped" label={Strings.BRAND_EMPTY_PILL_SHIPPED} />
              <StatusPill status="received" label={Strings.BRAND_EMPTY_PILL_RECEIVED} />
            </View>
            <NoteBox
              tone="amber"
              text={Strings.BRAND_EMPTY_NOTE}
              style={{ marginTop: 18, alignSelf: 'stretch' }}
            />
          </View>
        ) : (
          <>
            {/* ① 요약 카드 4장 (2×2) */}
            <View style={styles.summaryGrid}>
              {kpis.map((k) => (
                <Card key={k.label} style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>{k.label}</Text>
                  <Text style={styles.summaryValue}>{k.value}</Text>
                </Card>
              ))}
            </View>
            <Text style={styles.manualNote}>{Strings.BRAND_METRICS_MANUAL_NOTE}</Text>

            {/* FGI 정량 결과 (계획서 시트4 §1·2: 게이지 + 구매의향 % + 3항목 평균 + 적정가) */}
            {fgi ? (
              <>
                <Text style={styles.section}>{Strings.BRAND_FGI_SECTION}</Text>
                <View style={styles.fgiRow}>
                  <Card style={styles.gaugeCard}>
                    <View style={styles.gaugeCircle}>
                      <Text style={styles.gaugeValue}>{fgi.overallScore}</Text>
                      <Text style={styles.gaugeMax}>/100</Text>
                    </View>
                    <Text style={styles.gaugeLabel}>{Strings.BRAND_GAUGE_LABEL}</Text>
                  </Card>
                  <Card style={styles.intentCard}>
                    <Text style={styles.intentValue}>{fgi.purchaseIntentRate}%</Text>
                    <Text style={styles.gaugeLabel}>{Strings.BRAND_INTENT_LABEL}</Text>
                    <Text style={styles.fairPrice}>
                      fair price ${fgi.fairPriceUsdMedian} · n={fgi.responses}
                    </Text>
                  </Card>
                </View>
                <Card style={{ marginTop: 8 }}>
                  {[
                    { k: 'purchaseIntent', label: Strings.FGI_PURCHASE_INTENT },
                    { k: 'priceFairness', label: Strings.FGI_PRICE_FAIRNESS },
                    { k: 'competitiveness', label: Strings.FGI_COMPETITIVENESS },
                  ].map(({ k, label }) => (
                    <View key={k} style={styles.quantRow}>
                      <Text style={styles.quantLabel} numberOfLines={1}>
                        {label}
                      </Text>
                      <View style={styles.quantTrack}>
                        <View
                          style={[styles.quantFill, { width: `${(fgi.quant[k] / 5) * 100}%` }]}
                        />
                      </View>
                      <Text style={styles.quantVal}>{fgi.quant[k].toFixed(1)}</Text>
                    </View>
                  ))}
                </Card>
              </>
            ) : null}

            {/* ② 위클리 발견 카드 */}
            {finding ? (
              <Card style={styles.findingCard}>
                <Text style={styles.findingLabel}>{Strings.BRAND_FINDING_LABEL}</Text>
                <Text style={styles.findingText}>{finding}</Text>
              </Card>
            ) : null}

            {/* ③ 국가 스코어보드 */}
            <Text style={styles.section}>{Strings.BRAND_COUNTRY_BOARD}</Text>
            <Card>
              <View style={styles.boardHead}>
                <Text style={[styles.boardHeadCell, { flex: 1.2 }]}>
                  {Strings.BRAND_COL_COUNTRY}
                </Text>
                <Text style={[styles.boardHeadCell, { flex: 2.2 }]}>
                  {Strings.BRAND_COL_FULFILL}
                </Text>
                <Text style={styles.boardHeadCell}>{Strings.BRAND_COL_SCORE}</Text>
                <Text style={styles.boardHeadCell}>{Strings.BRAND_SUM_REACH}</Text>
              </View>
              {stats.map((row) => (
                <View key={row.country} style={styles.boardRow}>
                  <Text style={[styles.boardCell, styles.boardCellBold, { flex: 1.2 }]}>
                    {row.country}
                  </Text>
                  <View style={{ flex: 2.2, justifyContent: 'center', paddingRight: 10 }}>
                    <View style={styles.barWrap}>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${Math.min(100, (row.uploaded / row.quota) * 100)}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.barPct}>
                        {Math.round((row.uploaded / row.quota) * 100)}%
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.boardCell}>{row.avgScore}</Text>
                  <Text style={styles.boardCell}>{row.avgViews?.toLocaleString()}</Text>
                </View>
              ))}
            </Card>

            {/* UGC 갤러리 (계획서 시트4 §4: 미디어 모아보기 + 크리에이터 프로필 + HD 요청) */}
            {reviews.length > 0 ? (
              <>
                <Text style={styles.section}>{Strings.BRAND_GALLERY_SECTION}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {reviews.map((r) => (
                    <Card key={r.id} style={styles.galleryCard}>
                      <FastImage source={{ uri: r.thumbnailUrl }} style={styles.galleryThumb} />
                      <Text style={styles.galleryName} numberOfLines={1}>
                        @{r.reviewer}
                      </Text>
                      <Text style={styles.galleryMeta}>
                        {r.country} · {r.views7d?.toLocaleString()} views
                      </Text>
                      <TouchableOpacity
                        style={styles.hdBtn}
                        onPress={() => Alert.alert(Strings.BRAND_HD_PENDING)}
                      >
                        <Text style={styles.hdBtnText}>{Strings.BRAND_HD_DOWNLOAD}</Text>
                      </TouchableOpacity>
                    </Card>
                  ))}
                </ScrollView>
              </>
            ) : null}

            {/* ④ 2차 CTA */}
            {bestCountry ? (
              <Btn
                title={Strings.BRAND_PHASE2_CTA(
                  bestCountry.country,
                  Math.round((bestCountry.uploaded / bestCountry.quota) * 100),
                )}
                onPress={() => {
                  // 세일즈 리드 이벤트 (1단계: 로컬 기록)
                  Preference.set('phase2InterestAt', new Date().toISOString());
                  Alert.alert(Strings.BRAND_PHASE2_THANKS);
                }}
                style={{ marginTop: 16 }}
              />
            ) : null}

            {/* 리포트 배너 */}
            <Btn
              variant="ghost"
              title={Strings.BRAND_REPORT_DOWNLOAD}
              onPress={() => Alert.alert(Strings.BRAND_REPORT_PENDING)}
              style={{ marginTop: 10 }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  header: {
    fontFamily: FONT.ExtraBold,
    fontSize: 17,
    color: COLORS.INK,
    letterSpacing: -0.2,
  },
  campChip: {
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    backgroundColor: COLORS.SURFACE,
    maxWidth: 220,
  },
  campChipOn: { backgroundColor: COLORS.AMBER_SOFT, borderColor: COLORS.AMBER },
  campChipText: { fontFamily: FONT.SemiBold, fontSize: 12, color: COLORS.GREY },
  campChipTextOn: { color: COLORS.AMBER_DEEP },

  // 빈 상태
  emptyWrap: { alignItems: 'center', marginTop: 46, paddingHorizontal: 4 },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { fontFamily: FONT.Bold, fontSize: 14, color: COLORS.INK, marginTop: 12 },
  emptyBody: {
    fontFamily: FONT.Regular,
    fontSize: 11.5,
    lineHeight: 18,
    color: COLORS.GREY,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyPillRow: { flexDirection: 'row', gap: 6, marginTop: 14 },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 8 },
  summaryCard: {
    width: '48%',
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  summaryLabel: { ...T.TYPE.XS },
  summaryValue: {
    fontFamily: FONT.ExtraBold,
    fontSize: 20,
    color: COLORS.INK,
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  manualNote: { fontFamily: FONT.Regular, fontSize: 10.5, color: COLORS.GREY, marginTop: 6 },

  findingCard: {
    marginTop: 14,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.AMBER,
  },
  findingLabel: {
    fontFamily: FONT.Bold,
    fontSize: 10.5,
    color: COLORS.AMBER_DEEP,
    letterSpacing: 0.3,
  },
  findingText: {
    fontFamily: FONT.Regular,
    fontSize: 12.5,
    color: COLORS.INK,
    marginTop: 6,
    lineHeight: 19,
  },

  section: {
    fontFamily: FONT.Bold,
    fontSize: 14,
    color: COLORS.INK,
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  boardHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LINE,
    paddingBottom: 6,
  },
  boardHeadCell: { flex: 1, fontFamily: FONT.Regular, fontSize: 10.5, color: COLORS.GREY },
  boardRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LINE,
    alignItems: 'center',
  },
  boardCell: {
    flex: 1,
    fontFamily: FONT.Regular,
    fontSize: 12.5,
    color: COLORS.INK,
    fontVariant: ['tabular-nums'],
  },
  boardCellBold: { fontFamily: FONT.Bold },
  barWrap: { flexDirection: 'row', alignItems: 'center' },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 4,
    backgroundColor: COLORS.TRACK,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: COLORS.AMBER, borderRadius: 4 },
  barPct: {
    marginLeft: 6,
    fontFamily: FONT.Bold,
    fontSize: 10.5,
    color: COLORS.AMBER_DEEP,
    fontVariant: ['tabular-nums'],
  },

  fgiRow: { flexDirection: 'row', gap: 8 },
  gaugeCard: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  gaugeCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 7,
    borderColor: COLORS.AMBER,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  gaugeValue: { fontFamily: FONT.ExtraBold, fontSize: 25, color: COLORS.INK },
  gaugeMax: { fontFamily: FONT.Regular, fontSize: 11.5, color: COLORS.GREY, marginTop: 8 },
  gaugeLabel: { fontFamily: FONT.Regular, fontSize: 11.5, color: COLORS.GREY, marginTop: 8 },
  intentCard: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  intentValue: { fontFamily: FONT.ExtraBold, fontSize: 32, color: COLORS.GREEN },
  fairPrice: { fontFamily: FONT.Regular, fontSize: 10.5, color: COLORS.GREY, marginTop: 6 },
  quantRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  quantLabel: {
    flex: 1.6,
    fontFamily: FONT.Regular,
    fontSize: 11.5,
    color: COLORS.GREY,
    marginRight: 8,
  },
  quantTrack: {
    flex: 1,
    height: 7,
    borderRadius: 5,
    backgroundColor: COLORS.TRACK,
    overflow: 'hidden',
  },
  quantFill: { height: '100%', backgroundColor: COLORS.AMBER },
  quantVal: {
    width: 32,
    textAlign: 'right',
    fontFamily: FONT.Bold,
    fontSize: 12,
    color: COLORS.INK,
    fontVariant: ['tabular-nums'],
  },

  galleryCard: { width: 140, paddingVertical: 10, paddingHorizontal: 10, marginRight: 10 },
  galleryThumb: { width: '100%', height: 120, borderRadius: 8, backgroundColor: COLORS.LINE },
  galleryName: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.INK, marginTop: 6 },
  galleryMeta: { fontFamily: FONT.Regular, fontSize: 10.5, color: COLORS.GREY, marginTop: 2 },
  hdBtn: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    borderRadius: 7,
    paddingVertical: 6,
    alignItems: 'center',
  },
  hdBtnText: { fontFamily: FONT.Bold, fontSize: 10.5, color: COLORS.AMBER_DEEP },
});
