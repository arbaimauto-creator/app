import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import Strings from '../../Components/Strings';
import T from '../../Components/Constants/DesignTokens';
import { Badge, Btn, Card, GlassOrbs, NoteBox } from '../../Components/UI';
import { fetchCampaigns, selectCampaigns, selectMyApplications } from '../../slices/campaign';
import { getCreatorProfile } from '../../api/creators';
import { getOffers, respondToOffer } from '../../api/offers';
import {
  getSeedings,
  upsertSeeding,
  setSeedingStatus,
  isActiveSeeding,
  ACTIVE_STATUSES,
  SEEDING_STATUS,
} from '../../api/seedings';
import { personalizedPoints, concurrentLimit, CURATED_MIN_G } from './points';
import { logEvent } from '../../api/common/analytics';
import FEATURES from '../../Components/Constants/Features';
import { closedReason, estimatedMinutes, isFgiEnabled, uploadDays } from '../../api/campaignMeta';

const { COLORS, TYPE } = T;

// v2 §4-1: 신청 유형 2종(applyMode — ops 정합 I1: track은 'SEEDING' 고정 예약어).
// Curated 미달은 숨기지 말고 잠가서 보여준다.
function CampaignCard({ campaign, applied, gScore, completedCount, onPress }) {
  const reason = closedReason(campaign);
  const closed = reason != null;
  const isCurated = campaign.applyMode === 'curated';
  const curatedUnlocked = gScore >= CURATED_MIN_G || completedCount >= 2;
  const locked = isCurated && !curatedUnlocked;
  const deadline = campaign.deadline ? campaign.deadline.slice(5, 10).replace('-', '/') : '';
  const points = personalizedPoints(campaign.basePoints ?? campaign.rewardPoint, gScore);
  const bonus = points - (campaign.basePoints ?? campaign.rewardPoint);

  // 시안: 상태가 카드 맨 위에 온다. 내가 신청한 건지 마감된 건지를
  // 목록에서 훑을 때 바로 보여야 한다 (예전엔 하단 포인트 자리에 있었다).
  const trackBadge = applied
    ? { tone: 'curated', text: Strings.CAMPAIGN_APPLIED }
    : closed
      ? {
          tone: 'curated',
          text:
            reason === 'deadline' ? Strings.CAMPAIGN_CLOSED_DEADLINE : Strings.CAMPAIGN_CLOSED_FULL,
        }
      : isCurated
        ? { tone: 'curated', text: locked ? '🔒 Curated' : 'Curated' }
        : { tone: 'open', text: `Open · ${Strings.CAMPAIGN_FIRST_COME(campaign.remaining)}` };
  // 포인트는 아직 신청할 수 있을 때만 의미가 있다
  const pointBadge =
    closed || applied ? null : { tone: locked ? 'curated' : 'amber', text: `+${points}P` };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={closed}
      accessibilityRole="button"
      accessibilityLabel={`${campaign.brand}, ${campaign.title}`}
      accessibilityState={{ disabled: closed }}
    >
      <Card style={styles.card}>
        <View style={styles.rowBetween}>
          <Badge tone={trackBadge.tone} text={trackBadge.text} />
          <Text style={styles.xs}>{Strings.CAMPAIGN_DEADLINE(deadline)}</Text>
        </View>
        <View style={styles.midRow}>
          <FastImage source={{ uri: campaign.thumbnailUrl }} style={styles.thumb} />
          <View style={styles.midBody}>
            <Text style={styles.brand}>{campaign.brand}</Text>
            <Text style={styles.title} numberOfLines={2}>
              {campaign.title}
            </Text>
            <Text style={styles.xs} numberOfLines={1}>
              {Strings.CAMPAIGN_REMAINING(campaign.remaining ?? 0)} ·{' '}
              {(campaign.countries || []).join(' · ')}
            </Text>
          </View>
        </View>
        {/* 기획서 §5.1 카드 정보: 소요시간 · 게시 기한 · 설문 여부를 상세 진입 전에 보여준다 */}
        <View style={styles.pointRow}>
          {pointBadge ? <Badge tone={pointBadge.tone} text={pointBadge.text} /> : null}
          {pointBadge && bonus > 0 ? <Text style={styles.bonusText}>+{bonus}P</Text> : null}
          <Badge tone="curated" text={Strings.CAMPAIGN_CARD_TIME(estimatedMinutes(campaign))} />
          <Badge tone="curated" text={Strings.CAMPAIGN_CARD_UPLOAD_DAYS(uploadDays(campaign))} />
          {isFgiEnabled(campaign) ? (
            <Badge tone="curated" text={Strings.CAMPAIGN_CARD_FGI} />
          ) : null}
        </View>
        {locked ? (
          <NoteBox
            tone="amber"
            style={styles.lockNote}
            text={Strings.CURATED_LOCKED_HINT(CURATED_MIN_G)}
          />
        ) : null}
      </Card>
    </TouchableOpacity>
  );
}

// 제안형 시딩 카드 (D25 · I11) — ops 아웃바운드 매칭이 이 계정을 선정했을 때만 노출.
// 수락 = applied 스킵하고 approved로 즉시 시작. 거절/만료는 G-스코어 무영향.
function OfferCard({ offer, gScore, onAccept, onDecline }) {
  const { campaign } = offer;
  const points = personalizedPoints(campaign.basePoints ?? campaign.rewardPoint, gScore);
  const daysLeft = Math.max(0, Math.ceil((Date.parse(offer.expiresAt) - Date.now()) / 86400000));

  return (
    <Card style={styles.offerCard}>
      <View style={styles.rowBetween}>
        <Badge tone="amber" text={Strings.OFFER_BADGE} />
        <Text style={styles.xs}>{Strings.OFFER_DDAY(daysLeft)}</Text>
      </View>
      <View style={styles.midRow}>
        <FastImage source={{ uri: campaign.thumbnailUrl }} style={styles.thumb} />
        <View style={styles.midBody}>
          <Text style={styles.brand}>{campaign.brand}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {campaign.title}
          </Text>
          <Text style={styles.xs}>+{points}P</Text>
        </View>
      </View>
      <View style={styles.offerBtnRow}>
        <TouchableOpacity style={styles.offerDecline} onPress={onDecline}>
          <Text style={styles.offerDeclineText}>{Strings.OFFER_DECLINE}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.offerAccept} onPress={onAccept}>
          <Text style={styles.offerAcceptText}>{Strings.OFFER_ACCEPT}</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

export default function TryScreen({ navigation }) {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectCampaigns);
  const applications = useSelector(selectMyApplications);
  const loading = useSelector((s) => s.campaign.loading);
  const loadError = useSelector((s) => s.campaign.error);
  const offerLockRef = useRef(false);
  const [gScore, setGScore] = useState(50);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingOffers, setPendingOffers] = useState([]);
  const [savedSeedings, setSavedSeedings] = useState({});

  const refreshOffers = useCallback(() => {
    getOffers()
      .then((offers) => {
        const pending = offers.filter((o) => o.status === 'pending');
        setPendingOffers(pending);
        if (pending.length) {
          logEvent('offer_view', { count: pending.length });
        }
      })
      .catch(() => setPendingOffers([]));
  }, []);

  // 수락 = 서약 확인 → 동시 한도 검사 → approved로 즉시 시작 (D25: applied 스킵)
  const onAcceptOffer = (offer) => {
    Alert.alert(
      Strings.OFFER_ACCEPT_CONFIRM_TITLE,
      Strings.OFFER_ACCEPT_CONFIRM_BODY(Strings.APPLY_PLEDGE),
      [
        { text: Strings.CANCEL, style: 'cancel' },
        {
          text: Strings.OFFER_ACCEPT_CONFIRM_OK,
          onPress: async () => {
            if (offerLockRef.current) {
              return;
            }
            offerLockRef.current = true;
            try {
              // 한도 초과 유저에겐 ops가 제안을 보류하지만(I11) mock에선 클라이언트가 이중 방어
              const seedings = await getSeedings();
              // 이미 신청·진행 중인 캠페인의 제안을 수락하면 승인 없이 approved로 승격된다 — 차단
              if (isActiveSeeding(seedings[offer.campaignId])) {
                Alert.alert(Strings.OFFER_ALREADY_ACTIVE);
                return;
              }
              const activeStatuses = ACTIVE_STATUSES;
              // mock 모드에선 현재 캠페인 목록에 없는 잔여 시딩은 한도에서 제외 (CampaignDetail과 동일 기준)
              const knownCampaignIds = new Set(campaigns.map((c) => c.id));
              knownCampaignIds.add(offer.campaignId);
              const activeCount = Object.values(seedings).filter(
                (s) =>
                  activeStatuses.includes(s.status) &&
                  (FEATURES.LIVE_OPS_API || knownCampaignIds.has(s.campaignId)),
              ).length;
              const limit = concurrentLimit(gScore, completedCount);
              if (activeCount >= limit) {
                logEvent('apply_limit_blocked', { limit, source: 'offer' });
                Alert.alert(Strings.CONCURRENT_LIMIT_ALERT(limit));
                return;
              }
              // 로컬 시딩을 먼저 쓰고 응답을 기록한다 — 응답만 남고 시딩이 없는 반쪽 상태 방지
              await upsertSeeding(offer.campaignId, {
                pledgeChecked: true,
                offerId: offer.id,
                brandId: offer.campaign?.brandId,
              });
              await setSeedingStatus(offer.campaignId, SEEDING_STATUS.APPROVED);
              await respondToOffer(offer.id, 'accepted');
              logEvent('offer_accept', { campaign_id: offer.campaignId });
              // ops 반영은 respondToOffer가 담당 (POST /offers → Match CONFIRMED).
              // 여기서 opsApply를 또 부르면 Match가 중복 생성된다.
              refreshOffers();
              navigation.navigate('ApplyDone', {
                campaignId: offer.campaignId,
                campaignTitle: offer.campaign.title,
                applyMode: offer.campaign.applyMode,
                usedCount: activeCount + 1,
                limit,
                autoConfirmed: true,
              });
            } catch (e) {
              Alert.alert(Strings.RETRY_GUIDELINES);
            } finally {
              offerLockRef.current = false;
            }
          },
        },
      ],
    );
  };

  // 거절 — 사유 1탭은 선택 항목 (매칭 학습 재료, G-스코어 무영향)
  const onDeclineOffer = (offer) => {
    const decline = async (reason) => {
      try {
        await respondToOffer(offer.id, 'declined', reason);
        logEvent('offer_decline', { campaign_id: offer.campaignId, reason });
      } catch (e) {
        Alert.alert(Strings.RETRY_GUIDELINES);
      }
      refreshOffers();
    };
    Alert.alert(Strings.OFFER_DECLINE_TITLE, Strings.OFFER_DECLINE_BODY, [
      { text: Strings.OFFER_REASON_PRODUCT, onPress: () => decline('product_fit') },
      { text: Strings.OFFER_REASON_SCHEDULE, onPress: () => decline('schedule') },
      { text: Strings.OFFER_REASON_SKIP, onPress: () => decline(null) },
    ]);
  };

  useEffect(() => {
    dispatch(fetchCampaigns());
  }, [dispatch]);

  useEffect(() => {
    if (campaigns.length) {
      logEvent('try_view', {
        open_count: campaigns.filter((c) => c.applyMode !== 'curated').length,
        curated_count: campaigns.filter((c) => c.applyMode === 'curated').length,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns.length]);

  // 완주/평가로 G-스코어가 바뀔 수 있으므로 포커스마다 갱신
  useFocusEffect(
    useCallback(() => {
      getCreatorProfile()
        .then((profile) => {
          if (profile) {
            setGScore(profile.gScore ?? 50);
            setCompletedCount(profile.completedCount ?? 0);
          }
        })
        .catch(() => {});
      getSeedings()
        .then(setSavedSeedings)
        .catch(() => {});
      refreshOffers();
    }, [refreshOffers]),
  );

  // Open 캠페인 최상단 고정 (v2 §3-④)
  const sorted = [...campaigns].sort((a, b) => {
    const aOpen = a.applyMode !== 'curated' ? 0 : 1;
    const bOpen = b.applyMode !== 'curated' ? 0 : 1;
    return aOpen - bOpen;
  });

  return (
    <SafeAreaView style={styles.container}>
      <GlassOrbs />
      <View style={styles.headerRow}>
        <Text style={styles.header}>{Strings.TRY_TAB}</Text>
        <Badge tone="amber" text={`G${gScore}`} />
      </View>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => dispatch(fetchCampaigns())} />
        }
        ListHeaderComponent={
          pendingOffers.length ? (
            <View style={styles.offerSection}>
              <Text style={styles.offerSectionTitle}>{Strings.OFFER_SECTION_TITLE}</Text>
              {pendingOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  gScore={gScore}
                  onAccept={() => onAcceptOffer(offer)}
                  onDecline={() => onDeclineOffer(offer)}
                />
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? null : loadError ? (
            <View style={styles.errorWrap}>
              <Text style={styles.empty}>{Strings.CAMPAIGNS_LOAD_ERROR}</Text>
              <Btn
                variant="ghost"
                small
                title={Strings.RETRY}
                onPress={() => dispatch(fetchCampaigns())}
              />
            </View>
          ) : (
            <Text style={styles.empty}>{Strings.NO_CAMPAIGNS}</Text>
          )
        }
        renderItem={({ item }) => (
          <CampaignCard
            campaign={item}
            applied={applications[item.id] != null || isActiveSeeding(savedSeedings[item.id])}
            gScore={gScore}
            completedCount={completedCount}
            onPress={() => navigation.navigate('CampaignDetail', { campaign: item })}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  errorWrap: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  container: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: { ...TYPE.H_TITLE },
  listContent: { padding: 16 },
  card: { marginBottom: 11 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xs: { ...TYPE.XS },
  midRow: { flexDirection: 'row', alignItems: 'center', marginTop: 9 },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: COLORS.TRACK,
  },
  midBody: { flex: 1, marginLeft: 11 },
  brand: { ...TYPE.XS, marginBottom: 1 },
  title: { ...TYPE.CARD_TITLE },
  pointRow: { flexDirection: 'row', alignItems: 'center', marginTop: 9, gap: 6, flexWrap: 'wrap' },
  bonusText: { ...TYPE.XS, fontFamily: T.FONT.ExtraBold, color: COLORS.GREEN },
  lockNote: { marginTop: 9 },
  empty: { ...TYPE.SUB, textAlign: 'center', marginTop: 60 },
  offerSection: { marginBottom: 14 },
  offerSectionTitle: { ...TYPE.CARD_TITLE, fontSize: 15, marginBottom: 9 },
  offerCard: { marginBottom: 11, borderWidth: 1.5, borderColor: COLORS.AMBER },
  offerBtnRow: { flexDirection: 'row', gap: 8, marginTop: 11 },
  offerDecline: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.LINE,
    borderRadius: T.RADIUS.BTN,
    paddingVertical: 11,
    alignItems: 'center',
  },
  offerDeclineText: { ...TYPE.SUB, fontFamily: T.FONT.SemiBold },
  offerAccept: {
    flex: 2,
    backgroundColor: COLORS.AMBER,
    borderRadius: T.RADIUS.BTN,
    paddingVertical: 11,
    alignItems: 'center',
  },
  offerAcceptText: { ...TYPE.BTN, fontSize: 13.5 },
});
