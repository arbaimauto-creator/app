// 홈 첫 화면 (기획서 §5.1): 추천 캠페인 · 진행 중 참여 · 보상 현황을 우선순위대로.
// 로그인 후 3초 안에 "무엇을 하면 되는지"가 보여야 한다 — 할 일 → 신청 가능 → 보상 순.
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import T from '../../Components/Constants/DesignTokens';
import Strings from '../../Components/Strings';
import { Badge, GlowCard, StatusPill } from '../../Components/UI';
import { getCreatorProfile } from '../../api/creators';
import { getSeedings } from '../../api/seedings';
import { seedingStatusLabel } from '../../api/statusModel';
import { getHiddenCampaigns, hideCampaign } from '../../api/hiddenCampaigns';
import { rankCampaigns, buildTodoItems, REASON } from '../../api/recommend';
import { estimatedMinutes, isFgiEnabled } from '../../api/campaignMeta';
import { personalizedPoints, CURATED_MIN_G } from '../TryScreen/points';
import { logEvent } from '../../api/common/analytics';

const { COLORS, FONT, RADIUS, TYPE } = T;

export function reasonLabel(reason, campaign, profile) {
  switch (reason) {
    case REASON.COUNTRY:
      return Strings.REC_REASON_COUNTRY(profile?.country || '');
    case REASON.DEADLINE:
      return Strings.REC_REASON_DEADLINE;
    case REASON.UNLOCKED:
      return Strings.REC_REASON_UNLOCKED;
    case REASON.BRAND_AGAIN:
      return Strings.REC_REASON_BRAND_AGAIN(campaign?.brand || '');
    case REASON.FIRST:
      return Strings.REC_REASON_FIRST;
    case REASON.POINTS:
      return Strings.REC_REASON_POINTS;
    default:
      return null;
  }
}

function todoLine(item) {
  switch (item.action) {
    case 'address':
      return Strings.HOME_TODO_ADDRESS;
    case 'receive':
      return Strings.HOME_TODO_RECEIVE;
    case 'upload':
      return item.dayLeft != null
        ? Strings.HOME_TODO_UPLOAD(item.dayLeft)
        : Strings.UPLOAD_REVIEW_CTA;
    case 'wait_brand':
      return Strings.HOME_TODO_WAIT_BRAND;
    default:
      return Strings.HOME_TODO_WAIT;
  }
}

export default function HomeHero({ navigation, campaigns }) {
  const [profile, setProfile] = useState(null);
  const [seedings, setSeedings] = useState({});
  const [hidden, setHidden] = useState([]);
  const [bonusPoints, setBonusPoints] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getCreatorProfile()
        .then((p) => alive && setProfile(p))
        .catch(() => {});
      getSeedings()
        .then((s) => alive && setSeedings(s))
        .catch(() => {});
      getHiddenCampaigns()
        .then((h) => alive && setHidden(h))
        .catch(() => {});
      require('../../api/prefSafe')
        .prefGetSafe('onboardingBonusGranted')
        .then((v) => alive && setBonusPoints(v === 'true' ? 50 : 0))
        .catch(() => {});
      return () => {
        alive = false;
      };
    }, []),
  );

  const gScore = profile?.gScore ?? 50;
  const points = (profile?.rewardPoints ?? 0) + bonusPoints;
  const todos = buildTodoItems(seedings, campaigns);
  const ranked = rankCampaigns(campaigns, { profile, seedings, hidden }).slice(0, 6);
  const pendingCount = Object.values(seedings).filter(
    (s) => s.status === 'reviewing' || (s.status === 'done' && s.pointsGranted == null),
  ).length;

  const openActivity = () => navigation.navigate('Activity');
  const openMy = () => navigation.navigate('Profile');
  const openDetail = (campaign) => {
    logEvent('home_campaign_open', { campaign_id: campaign.id });
    navigation.navigate('CampaignDetailRoot', { campaign });
  };
  const openSwipe = (index = 0) => {
    logEvent('home_swipe_open', {});
    navigation.navigate('CampaignSwipe', { initialIndex: index });
  };
  const onHide = (campaign) => {
    setHidden((h) => [...h, campaign.id]);
    hideCampaign(campaign.id).catch(() => {});
    logEvent('campaign_hide', { campaign_id: campaign.id });
  };

  return (
    <View style={styles.wrap}>
      {/* 1. 진행 중 참여 — 행동이 필요한 순서대로 */}
      {todos.length ? (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{Strings.HOME_TODO_TITLE(todos.length)}</Text>
            <TouchableOpacity
              onPress={openActivity}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={Strings.HOME_SEE_ACTIVITY}
            >
              <Text style={styles.sectionLink}>{Strings.HOME_SEE_ACTIVITY}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}
          >
            {todos.slice(0, 5).map((item) => (
              <TouchableOpacity
                key={item.campaignId}
                style={[styles.todoCard, item.order <= 2 && styles.todoCardUrgent]}
                onPress={openActivity}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${todoLine(item)}`}
              >
                <View style={styles.todoTop}>
                  <StatusPill status={item.status} label={seedingStatusLabel(item.status)} />
                  {item.dayLeft != null ? (
                    <Text style={[styles.todoDday, item.dayLeft <= 3 && styles.todoDdayDanger]}>
                      {item.dayLeft > 0 ? `D-${item.dayLeft}` : 'D-DAY'}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.todoTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.todoAction}>{todoLine(item)} ›</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* 2. 지금 신청 가능 — 추천 사유와 관심 없음 */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{Strings.HOME_APPLY_NOW}</Text>
          <TouchableOpacity
            onPress={() => openSwipe(0)}
            style={styles.swipeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={Strings.HOME_SWIPE_ALL}
          >
            <MaterialCommunityIcons name="gesture-swipe-vertical" size={14} color="#FFFFFF" />
            <Text style={styles.swipeButtonText}>{Strings.HOME_SWIPE_ALL}</Text>
          </TouchableOpacity>
        </View>
        {ranked.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}
          >
            {ranked.map(({ campaign, reasons }, index) => {
              const pts = personalizedPoints(campaign.basePoints ?? campaign.rewardPoint, gScore);
              const reason = reasonLabel(reasons[0], campaign, profile);
              return (
                <View key={campaign.id} style={styles.campaignCard}>
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => openDetail(campaign)}
                    accessibilityRole="button"
                    accessibilityLabel={`${campaign.brand}, ${campaign.title}, +${pts}P`}
                  >
                    <FastImage source={{ uri: campaign.thumbnailUrl }} style={styles.campaignImage}>
                      {reason ? (
                        <View style={styles.reasonChip}>
                          <MaterialCommunityIcons
                            name="lightbulb-on-outline"
                            size={11}
                            color={COLORS.AMBER_DEEP}
                          />
                          <Text style={styles.reasonText} numberOfLines={1}>
                            {reason}
                          </Text>
                        </View>
                      ) : null}
                    </FastImage>
                    <Text style={styles.campaignBrand}>{campaign.brand}</Text>
                    <Text style={styles.campaignTitle} numberOfLines={2}>
                      {campaign.title}
                    </Text>
                    <View style={styles.badgeRow}>
                      <Badge tone="amber" text={`+${pts}P`} />
                      <Badge
                        tone="curated"
                        text={Strings.CAMPAIGN_CARD_TIME(estimatedMinutes(campaign))}
                      />
                      {isFgiEnabled(campaign) ? (
                        <Badge tone="curated" text={Strings.CAMPAIGN_CARD_FGI} />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.detailButton}
                      onPress={() => openDetail(campaign)}
                      accessibilityRole="button"
                      accessibilityLabel={Strings.HOME_CARD_DETAIL}
                    >
                      <Text style={styles.detailButtonText}>{Strings.HOME_CARD_DETAIL}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.hideButton}
                      onPress={() => onHide(campaign)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={Strings.HOME_NOT_INTERESTED}
                    >
                      <Text style={styles.hideButtonText}>{Strings.HOME_NOT_INTERESTED}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{Strings.HOME_APPLY_EMPTY}</Text>
          </View>
        )}
      </View>

      {/* 3. 보상 현황 — 포인트 · G · 확정 대기 */}
      <TouchableOpacity
        style={styles.rewardTile}
        onPress={openMy}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={`${Strings.HOME_REWARD_TITLE}, ${points}P, G${gScore}`}
      >
        {/* 2026-09-16 컨셉: 포인트·G 요약은 아래에서 앰버 빛이 번지는 카드 */}
        <GlowCard style={styles.rewardGlow} glow={0.45}>
          <View style={styles.rewardRowInner}>
            <View style={styles.rewardCol}>
              <Text style={styles.rewardLabel}>{Strings.HOME_REWARD_POINTS}</Text>
              <Text style={styles.rewardValue}>{points}P</Text>
              {pendingCount > 0 ? (
                <Text style={styles.rewardSub}>{Strings.HOME_REWARD_PENDING(pendingCount)}</Text>
              ) : (
                <Text style={styles.rewardSub}>{Strings.HOME_REWARD_NO_PENDING}</Text>
              )}
            </View>
            <View style={styles.rewardDivider} />
            <View style={styles.rewardCol}>
              <Text style={styles.rewardLabel}>G-Score</Text>
              <Text style={styles.rewardValue}>G{gScore}</Text>
              <Text style={styles.rewardSub}>
                {gScore < CURATED_MIN_G
                  ? Strings.G_NEXT_UNLOCK(CURATED_MIN_G - gScore)
                  : Strings.G_UNLOCKED}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.GREY} />
          </View>
        </GlowCard>
      </TouchableOpacity>
    </View>
  );
}

const CARD_W = 236;

const styles = StyleSheet.create({
  wrap: { paddingTop: 4 },
  section: { marginBottom: 14 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
    minHeight: 32,
  },
  sectionTitle: {
    fontFamily: FONT.ExtraBold,
    fontSize: 16,
    color: COLORS.INK,
    letterSpacing: -0.2,
  },
  sectionLink: {
    fontFamily: FONT.Bold,
    fontSize: 12,
    color: COLORS.AMBER_DEEP,
    paddingVertical: 6,
  },
  rail: { paddingHorizontal: 16, gap: 10 },

  todoCard: {
    width: 200,
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.CARD,
    padding: 12,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
  },
  todoCardUrgent: { borderColor: COLORS.AMBER },
  todoTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  todoDday: { fontFamily: FONT.Bold, fontSize: 12, color: COLORS.GREY },
  todoDdayDanger: { color: COLORS.RED },
  todoTitle: { ...TYPE.CARD_TITLE, marginTop: 8, minHeight: 36 },
  todoAction: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.AMBER_DEEP, marginTop: 8 },

  swipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.INK,
    borderRadius: RADIUS.PILL,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 34,
  },
  swipeButtonText: { fontFamily: FONT.Bold, fontSize: 12, color: '#FFFFFF' },
  campaignCard: {
    width: CARD_W,
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.CARD,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.LINE,
  },
  campaignImage: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.TRACK,
    justifyContent: 'flex-end',
  },
  reasonChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    margin: 8,
    backgroundColor: COLORS.AMBER_SOFT,
    borderRadius: RADIUS.PILL,
    paddingVertical: 4,
    paddingHorizontal: 8,
    maxWidth: CARD_W - 16,
  },
  reasonText: { fontFamily: FONT.Bold, fontSize: 11, color: COLORS.AMBER_DEEP },
  campaignBrand: { ...TYPE.XS, marginTop: 10, marginHorizontal: 12 },
  campaignTitle: { ...TYPE.CARD_TITLE, marginHorizontal: 12, marginTop: 2, minHeight: 36 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginHorizontal: 12, marginTop: 8 },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  detailButton: {
    backgroundColor: COLORS.AMBER,
    borderRadius: RADIUS.BTN_SM,
    paddingVertical: 9,
    paddingHorizontal: 14,
    minHeight: 36,
    justifyContent: 'center',
  },
  detailButtonText: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.ON_AMBER },
  hideButton: { paddingVertical: 8, paddingHorizontal: 6, minHeight: 36, justifyContent: 'center' },
  hideButtonText: { fontFamily: FONT.Medium, fontSize: 12, color: COLORS.GREY },
  emptyCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.CARD,
    padding: 16,
  },
  emptyText: { ...TYPE.BODY, color: COLORS.GREY },

  rewardTile: { marginHorizontal: 16, marginBottom: 14 },
  rewardGlow: { paddingVertical: 14, paddingHorizontal: 16 },
  rewardRowInner: { flexDirection: 'row', alignItems: 'center' },
  rewardCol: { flex: 1 },
  rewardDivider: { width: 1, height: 40, backgroundColor: COLORS.LINE, marginHorizontal: 12 },
  rewardLabel: { ...TYPE.LABEL, color: COLORS.GREY },
  rewardValue: {
    fontFamily: T.LATIN.ExtraBold,
    fontSize: 24,
    color: COLORS.INK,
    marginTop: 2,
    letterSpacing: -0.4,
  },
  rewardSub: { ...TYPE.XS, marginTop: 2 },
});
