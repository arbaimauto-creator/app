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
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import { fetchCampaigns, selectCampaigns } from '../../slices/campaign';
import {
  fetchCampaignReviews,
  fetchCountryStats,
  fetchWeeklyFinding,
  fetchFgiStats,
} from '../../api/reviews';
import { getEvaluations } from '../../api/evaluations';

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

  const bestCountry = [...stats].sort(
    (a, b) => b.uploaded / b.quota - a.uploaded / a.quota,
  )[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={styles.header}>
          {Strings.BRAND_DASH_TITLE}
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

        {/* ① 요약 카드 4장 */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalUploads}</Text>
            <Text style={styles.summaryLabel}>{Strings.BRAND_SUM_UPLOADS}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalReach.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>{Strings.BRAND_SUM_REACH}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{avgScore}</Text>
            <Text style={styles.summaryLabel}>{Strings.BRAND_SUM_SCORE}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{countryCount}</Text>
            <Text style={styles.summaryLabel}>{Strings.BRAND_SUM_COUNTRIES}</Text>
          </View>
        </View>
        <Text style={styles.manualNote}>{Strings.BRAND_METRICS_MANUAL_NOTE}</Text>

        {/* FGI 정량 결과 (계획서 시트4 §1·2: 게이지 + 구매의향 % + 3항목 평균 + 적정가) */}
        {fgi ? (
          <>
            <Text style={styles.section}>{Strings.BRAND_FGI_SECTION}</Text>
            <View style={styles.fgiRow}>
              <View style={styles.gaugeCard}>
                <View style={styles.gaugeCircle}>
                  <Text style={styles.gaugeValue}>{fgi.overallScore}</Text>
                  <Text style={styles.gaugeMax}>/100</Text>
                </View>
                <Text style={styles.gaugeLabel}>{Strings.BRAND_GAUGE_LABEL}</Text>
              </View>
              <View style={styles.intentCard}>
                <Text style={styles.intentValue}>{fgi.purchaseIntentRate}%</Text>
                <Text style={styles.gaugeLabel}>{Strings.BRAND_INTENT_LABEL}</Text>
                <Text style={styles.fairPrice}>fair price ${fgi.fairPriceUsdMedian} · n={fgi.responses}</Text>
              </View>
            </View>
            <View style={styles.quantBox}>
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
                    <View style={[styles.quantFill, { width: `${(fgi.quant[k] / 5) * 100}%` }]} />
                  </View>
                  <Text style={styles.quantVal}>{fgi.quant[k].toFixed(1)}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* ② 위클리 발견 카드 */}
        {finding ? (
          <View style={styles.findingCard}>
            <Text style={styles.findingLabel}>{Strings.BRAND_WEEKLY_FINDING}</Text>
            <Text style={styles.findingText}>{finding}</Text>
          </View>
        ) : null}

        {/* ③ 국가 스코어보드 */}
        <Text style={styles.section}>{Strings.BRAND_COUNTRY_BOARD}</Text>
        <View style={styles.board}>
          <View style={styles.boardHead}>
            <Text style={[styles.boardHeadCell, { flex: 1.2 }]}>{Strings.BRAND_COL_COUNTRY}</Text>
            <Text style={[styles.boardHeadCell, { flex: 2.2 }]}>{Strings.BRAND_COL_FULFILL}</Text>
            <Text style={styles.boardHeadCell}>{Strings.BRAND_COL_SCORE}</Text>
            <Text style={styles.boardHeadCell}>{Strings.BRAND_COL_DAYS}</Text>
          </View>
          {stats.map((row) => (
            <View key={row.country} style={styles.boardRow}>
              <Text style={[styles.boardCell, { flex: 1.2, fontWeight: '700' }]}>
                {row.country}
              </Text>
              <View style={{ flex: 2.2, justifyContent: 'center', paddingRight: 10 }}>
                <View style={styles.barTrack}>
                  <View
                    style={[styles.barFill, { width: `${(row.uploaded / row.quota) * 100}%` }]}
                  />
                </View>
                <Text style={styles.barLabel}>
                  {row.uploaded}/{row.quota}
                </Text>
              </View>
              <Text style={styles.boardCell}>{row.avgScore}</Text>
              <Text style={styles.boardCell}>{row.avgDaysToUpload}d</Text>
            </View>
          ))}
        </View>

        {/* UGC 갤러리 (계획서 시트4 §4: 미디어 모아보기 + 크리에이터 프로필 + HD 요청) */}
        {reviews.length > 0 ? (
          <>
            <Text style={styles.section}>{Strings.BRAND_GALLERY_SECTION}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {reviews.map((r) => (
                <View key={r.id} style={styles.galleryCard}>
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
                </View>
              ))}
            </ScrollView>
          </>
        ) : null}

        {/* ④ 2차 CTA */}
        {bestCountry ? (
          <TouchableOpacity
            style={styles.ctaCard}
            onPress={() => {
              // 세일즈 리드 이벤트 (1단계: 로컬 기록)
              Preference.set('phase2InterestAt', new Date().toISOString());
              Alert.alert(Strings.BRAND_PHASE2_THANKS);
            }}
          >
            <Text style={styles.ctaTitle}>
              {Strings.BRAND_PHASE2_CTA(
                bestCountry.country,
                Math.round((bestCountry.uploaded / bestCountry.quota) * 100),
              )}
            </Text>
            <Text style={styles.ctaArrow}>→</Text>
          </TouchableOpacity>
        ) : null}

        {/* 리포트 배너 */}
        <TouchableOpacity
          style={styles.reportBanner}
          onPress={() => Alert.alert(Strings.BRAND_REPORT_PENDING)}
        >
          <Text style={styles.reportText}>{Strings.BRAND_REPORT_DOWNLOAD}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Constants.COLOR_BACKGROUND_DARK },
  header: {
    fontSize: 22,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    color: Constants.TIER_COLORS.ARTISAN,
  },
  campChip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    backgroundColor: '#fff',
    maxWidth: 220,
  },
  campChipOn: { backgroundColor: Constants.COLOR_MAIN, borderColor: Constants.COLOR_MAIN },
  campChipText: { fontSize: 12.5, color: '#26231d' },
  campChipTextOn: { fontWeight: '800' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 8 },
  summaryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexGrow: 1,
  },
  summaryValue: { fontSize: 22, fontWeight: '900', color: '#26231d' },
  summaryLabel: { fontSize: 11.5, color: '#8a857b', marginTop: 2 },
  manualNote: { fontSize: 10.5, color: Constants.TIER_COLORS.STRIVER, marginTop: 6 },
  findingCard: {
    marginTop: 14,
    backgroundColor: '#26231d',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Constants.COLOR_MAIN,
  },
  findingLabel: { fontSize: 11, fontWeight: '800', color: Constants.COLOR_MAIN, letterSpacing: 1 },
  findingText: { fontSize: 14, color: '#f4f1ea', marginTop: 6, lineHeight: 21 },
  section: {
    fontSize: 15,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    color: Constants.TIER_COLORS.ARTISAN,
    marginTop: 20,
    marginBottom: 8,
  },
  board: { backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  boardHead: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: Constants.COLOR_MAIN, paddingBottom: 6 },
  boardHeadCell: { flex: 1, fontSize: 11, fontWeight: '700', color: '#8a857b' },
  boardRow: { flexDirection: 'row', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#f0eee9', alignItems: 'center' },
  boardCell: { flex: 1, fontSize: 13, color: '#26231d' },
  barTrack: { height: 8, borderRadius: 5, backgroundColor: '#efede8', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Constants.COLOR_MAIN, borderRadius: 5 },
  barLabel: { fontSize: 10, color: '#8a857b', marginTop: 2 },
  ctaCard: {
    marginTop: 16,
    backgroundColor: Constants.COLOR_MAIN,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaTitle: { flex: 1, fontSize: 14.5, fontWeight: '800', color: '#16130d', lineHeight: 21 },
  ctaArrow: { fontSize: 20, fontWeight: '900', color: '#16130d', marginLeft: 8 },
  reportBanner: {
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: Constants.COLOR_MAIN,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  reportText: { fontSize: 13.5, fontWeight: '700', color: Constants.TIER_COLORS.ARTISAN },
  fgiRow: { flexDirection: 'row', gap: 8 },
  gaugeCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  gaugeCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 7,
    borderColor: Constants.COLOR_MAIN,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  gaugeValue: { fontSize: 26, fontWeight: '900', color: '#26231d' },
  gaugeMax: { fontSize: 12, color: '#8a857b', marginTop: 8 },
  gaugeLabel: { fontSize: 11.5, color: '#8a857b', marginTop: 8 },
  intentCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intentValue: { fontSize: 34, fontWeight: '900', color: '#1c7c31' },
  fairPrice: { fontSize: 11, color: '#8a857b', marginTop: 6 },
  quantBox: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginTop: 8 },
  quantRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  quantLabel: { flex: 1.6, fontSize: 11.5, color: '#5c574d', marginRight: 8 },
  quantTrack: { flex: 1, height: 8, borderRadius: 5, backgroundColor: '#efede8', overflow: 'hidden' },
  quantFill: { height: '100%', backgroundColor: Constants.COLOR_MAIN },
  quantVal: {
    width: 32,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
    color: '#26231d',
  },
  galleryCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
  },
  galleryThumb: { width: '100%', height: 120, borderRadius: 8, backgroundColor: '#eee' },
  galleryName: { fontSize: 12.5, fontWeight: '700', color: '#26231d', marginTop: 6 },
  galleryMeta: { fontSize: 10.5, color: '#8a857b', marginTop: 2 },
  hdBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Constants.COLOR_MAIN,
    borderRadius: 7,
    paddingVertical: 6,
    alignItems: 'center',
  },
  hdBtnText: { fontSize: 10.5, fontWeight: '700', color: '#7a5200' },
});
