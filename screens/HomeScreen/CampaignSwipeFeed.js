// 세로형 슬라이딩 탐색 (기획서 §5.1): 한 화면에 한 캠페인 카드, 위아래 스와이프.
// 완료 기준: 스크롤 위치 유지(재진입 시 같은 카드), 중복 로딩 없음(redux 목록 한 번만 사용),
// 카드에 브랜드·제목·소요시간·보상·마감·참여 조건·FGI 여부가 모두 보인다.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import T from '../../Components/Constants/DesignTokens';
import Strings from '../../Components/Strings';
import { Badge, Btn } from '../../Components/UI';
import { fetchCampaigns, selectCampaigns } from '../../slices/campaign';
import { getCreatorProfile } from '../../api/creators';
import { getSeedings } from '../../api/seedings';
import { getHiddenCampaigns, hideCampaign, unhideCampaign } from '../../api/hiddenCampaigns';
import { rankCampaigns } from '../../api/recommend';
import { EXPERIMENTS, trackExposure, variantFor } from '../../api/experiments';
import { estimatedMinutes, isFgiEnabled, uploadDays, daysToDeadline } from '../../api/campaignMeta';
import { personalizedPoints, CURATED_MIN_G } from '../TryScreen/points';
import { logEvent } from '../../api/common/analytics';
import { reasonLabel } from './HomeHero';

const { COLORS, FONT, RADIUS, TYPE } = T;

// 재진입 시 같은 카드로 돌아오기 위한 모듈 메모리 (앱 프로세스 동안 유지)
let lastIndex = 0;

export default function CampaignSwipeFeed({ navigation, route }) {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectCampaigns);
  const loading = useSelector((s) => s.campaign.loading);
  const { height, width } = useWindowDimensions();
  const [profile, setProfile] = useState(null);
  const [seedings, setSeedings] = useState({});
  const [hidden, setHidden] = useState([]);
  const [index, setIndex] = useState(route.params?.initialIndex ?? lastIndex);
  const [undo, setUndo] = useState(null); // 방금 숨긴 캠페인 — 되돌리기
  const listRef = useRef(null);

  useEffect(() => {
    getCreatorProfile()
      .then(setProfile)
      .catch(() => {});
    getSeedings()
      .then(setSeedings)
      .catch(() => {});
    getHiddenCampaigns()
      .then(setHidden)
      .catch(() => {});
    if (campaigns.length === 0) {
      dispatch(fetchCampaigns());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gScore = profile?.gScore ?? 50;
  const completedCount = profile?.completedCount ?? 0;

  // P4 A/B(2026-09-16): 개인화 정렬 vs 최신순. 서버 실험이 없으면 개인화(기본). 노출은 한 번만 기록.
  const [rankingVariant, setRankingVariant] = useState(EXPERIMENTS.HOME_RANKING.variants[0]);
  useEffect(() => {
    let alive = true;
    variantFor(EXPERIMENTS.HOME_RANKING).then((v) => {
      if (alive) {
        setRankingVariant(v);
        trackExposure(EXPERIMENTS.HOME_RANKING, v);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const ranked = useMemo(() => {
    const personalized = rankCampaigns(campaigns, { profile, seedings, hidden });
    if (rankingVariant !== 'latest') {
      return personalized;
    }
    // 최신순: 추천 이유·점수는 유지하되 마감이 먼 순(=최근 개설)으로. 숨김·종료 필터는 개인화 결과를 재사용
    return [...personalized].sort((a, b) => {
      const da = a.deadline ? new Date(a.deadline).getTime() : 0;
      const db = b.deadline ? new Date(b.deadline).getTime() : 0;
      return db - da;
    });
  }, [campaigns, profile, seedings, hidden, rankingVariant]);

  // 헤더(56) 제외 전체 높이를 카드 한 장에 준다
  const HEADER_H = 56;
  const itemHeight = Math.max(420, height - HEADER_H - T.TOP_INSET);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length) {
      const i = viewableItems[0].index ?? 0;
      lastIndex = i;
      setIndex(i);
    }
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const openDetail = (campaign) => {
    logEvent('swipe_campaign_open', { campaign_id: campaign.id, index });
    navigation.navigate('CampaignDetailRoot', { campaign });
  };
  const onHide = (campaign) => {
    setHidden((h) => [...h, campaign.id]);
    setUndo(campaign);
    hideCampaign(campaign.id).catch(() => {});
    logEvent('campaign_hide', { campaign_id: campaign.id, source: 'swipe' });
  };
  const onUndo = () => {
    if (!undo) {
      return;
    }
    const id = undo.id;
    setHidden((h) => h.filter((x) => x !== id));
    unhideCampaign(id).catch(() => {});
    setUndo(null);
  };

  const renderItem = useCallback(
    ({ item, index: i }) => {
      const { campaign, reasons } = item;
      const pts = personalizedPoints(campaign.basePoints ?? campaign.rewardPoint, gScore);
      const isCurated = campaign.applyMode === 'curated';
      const locked = isCurated && !(gScore >= CURATED_MIN_G || completedCount >= 2);
      const left = daysToDeadline(campaign);
      const reason = reasonLabel(reasons[0], campaign, profile);
      const countries = (campaign.countries || []).join(' · ');
      return (
        <View style={[styles.page, { height: itemHeight, width }]}>
          <View style={styles.card}>
            <FastImage source={{ uri: campaign.thumbnailUrl }} style={styles.image}>
              <View style={styles.imageTop}>
                <Badge
                  tone={isCurated ? 'curated' : 'open'}
                  text={isCurated ? (locked ? '🔒 Curated' : 'Curated') : 'Open'}
                />
                <Text style={styles.counter}>
                  {i + 1} / {ranked.length}
                </Text>
              </View>
              {reason ? (
                <View style={styles.reasonChip}>
                  <MaterialCommunityIcons
                    name="lightbulb-on-outline"
                    size={12}
                    color={COLORS.AMBER_DEEP}
                  />
                  <Text style={styles.reasonText}>{reason}</Text>
                </View>
              ) : null}
            </FastImage>
            <View style={styles.body}>
              <Text style={styles.brand}>{campaign.brand}</Text>
              <Text style={styles.title} numberOfLines={3}>
                {campaign.title}
              </Text>
              <View style={styles.badgeRow}>
                <Badge tone="amber" text={`+${pts}P`} />
                <Badge
                  tone="curated"
                  text={Strings.CAMPAIGN_CARD_TIME(estimatedMinutes(campaign))}
                />
                <Badge
                  tone="curated"
                  text={Strings.CAMPAIGN_CARD_UPLOAD_DAYS(uploadDays(campaign))}
                />
                <Badge
                  tone={isFgiEnabled(campaign) ? 'curated' : 'open'}
                  text={isFgiEnabled(campaign) ? Strings.DETAIL_FGI_ON : Strings.DETAIL_FGI_OFF}
                />
              </View>
              <View style={styles.factRow}>
                <MaterialCommunityIcons name="calendar-clock" size={15} color={COLORS.GREY} />
                <Text style={styles.fact}>
                  {left != null ? Strings.SWIPE_DEADLINE(left) : Strings.SWIPE_NO_DEADLINE}
                  {' · '}
                  {Strings.CAMPAIGN_REMAINING(campaign.remaining ?? 0)}
                </Text>
              </View>
              <View style={styles.factRow}>
                <MaterialCommunityIcons name="truck-outline" size={15} color={COLORS.GREY} />
                <Text style={styles.fact}>{Strings.SWIPE_CONDITIONS(countries || '—')}</Text>
              </View>
              {locked ? (
                <Text style={styles.lockedNote}>{Strings.CURATED_LOCKED_HINT(CURATED_MIN_G)}</Text>
              ) : null}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.hide}
                onPress={() => onHide(campaign)}
                accessibilityRole="button"
                accessibilityLabel={Strings.HOME_NOT_INTERESTED}
              >
                <MaterialCommunityIcons name="eye-off-outline" size={16} color={COLORS.GREY} />
                <Text style={styles.hideText}>{Strings.HOME_NOT_INTERESTED}</Text>
              </TouchableOpacity>
              <Btn
                title={Strings.SWIPE_DETAIL_CTA}
                onPress={() => openDetail(campaign)}
                style={styles.detail}
              />
            </View>
          </View>
          {i < ranked.length - 1 ? (
            <View style={styles.hint}>
              <MaterialCommunityIcons name="chevron-double-up" size={16} color={COLORS.GREY} />
              <Text style={styles.hintText}>{Strings.SWIPE_HINT}</Text>
            </View>
          ) : null}
        </View>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gScore, completedCount, itemHeight, width, ranked.length, profile],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={Strings.BACK}
          style={styles.backButton}
        >
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{Strings.SWIPE_TITLE}</Text>
        <View style={{ flex: 1 }} />
        {undo ? (
          <TouchableOpacity
            onPress={onUndo}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
          >
            <Text style={styles.undo}>{Strings.SWIPE_UNDO_HIDE}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {ranked.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{Strings.SWIPE_EMPTY}</Text>
          {hidden.length ? (
            <Btn
              variant="ghost"
              small
              title={Strings.SWIPE_SHOW_HIDDEN(hidden.length)}
              onPress={() => {
                setHidden([]);
                hidden.forEach((id) => unhideCampaign(id).catch(() => {}));
              }}
            />
          ) : null}
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={ranked}
          keyExtractor={(item) => item.campaign.id}
          renderItem={renderItem}
          pagingEnabled
          snapToInterval={itemHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          initialScrollIndex={Math.min(index, ranked.length - 1)}
          getItemLayout={(_, i) => ({ length: itemHeight, offset: itemHeight * i, index: i })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => dispatch(fetchCampaigns())} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  back: { fontFamily: FONT.Bold, fontSize: 28, color: COLORS.INK, lineHeight: 30 },
  headerTitle: { ...TYPE.H_TITLE },
  undo: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.AMBER_DEEP, paddingVertical: 8 },
  page: { paddingHorizontal: 16, paddingBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.SHEET,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.LINE,
  },
  image: { height: '40%', backgroundColor: COLORS.TRACK, justifyContent: 'space-between' },
  imageTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  counter: {
    fontFamily: FONT.Bold,
    fontSize: 12,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: RADIUS.PILL,
    paddingVertical: 4,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  reasonChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    margin: 12,
    backgroundColor: COLORS.AMBER_SOFT,
    borderRadius: RADIUS.PILL,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  reasonText: { fontFamily: FONT.Bold, fontSize: 12, color: COLORS.AMBER_DEEP },
  body: { flex: 1, padding: 16 },
  brand: { ...TYPE.SUB, fontSize: 12.5 },
  title: {
    fontFamily: FONT.ExtraBold,
    fontSize: 20,
    color: COLORS.INK,
    lineHeight: 26,
    marginTop: 4,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  factRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  fact: { ...TYPE.BODY, color: COLORS.DARK, flex: 1 },
  lockedNote: { ...TYPE.XS, color: COLORS.AMBER_DEEP, marginTop: 8 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.LINE,
    gap: 10,
  },
  hide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 44,
  },
  hideText: { fontFamily: FONT.Medium, fontSize: 12.5, color: COLORS.GREY },
  detail: { flex: 1 },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 6,
  },
  hintText: { ...TYPE.XS },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  emptyTitle: { ...TYPE.BODY, color: COLORS.GREY, textAlign: 'center' },
});
