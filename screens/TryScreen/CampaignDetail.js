import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import Preference from 'react-native-default-preference';
import Strings from '../../Components/Strings';
import FEATURES from '../../Components/Constants/Features';
import T from '../../Components/Constants/DesignTokens';
import { Card, Badge } from '../../Components/UI';
import { applyToCampaign, selectMyApplications } from '../../slices/campaign';
import { isGuestUser, LogoutAlert } from '../../Components/utils';
import { getCreatorProfile } from '../../api/creators';
import { getSeedings, upsertSeeding, setSeedingStatus, SEEDING_STATUS } from '../../api/seedings';
import { personalizedPoints, concurrentLimit, canAutoConfirm } from './points';
import { CURATED_MIN_G } from './points';
import { logEvent } from '../../api/common/analytics';
import { opsApply } from '../../api/opsBridge';

const { COLORS, RADIUS, TYPE } = T;

export default function CampaignDetail({ route, navigation }) {
  const { campaign } = route.params;
  const dispatch = useDispatch();
  const applications = useSelector(selectMyApplications);
  const [hasSavedSeeding, setHasSavedSeeding] = useState(false);
  const applied = applications[campaign.id] != null || hasSavedSeeding;

  // v2 §3-④: 업로드 서약 체크박스 1개 + 한 줄 어필(선택)
  const [pledged, setPledged] = useState(false);
  const [appeal, setAppeal] = useState('');
  const [gScore, setGScore] = useState(50);
  const [completedCount, setCompletedCount] = useState(0);
  const submitLockRef = useRef(false);

  useEffect(() => {
    // 이벤트 맵: 카드→상세 전환 (신청 퍼널 2단계)
    logEvent('campaign_open', { campaign_id: campaign.id, apply_mode: campaign.applyMode });
    getCreatorProfile().then((p) => {
      if (p?.gScore != null) {
        setGScore(p.gScore);
      }
      setCompletedCount(p?.completedCount ?? 0);
    });
    getSeedings().then((seedings) => setHasSavedSeeding(seedings[campaign.id] != null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const points = personalizedPoints(campaign.basePoints ?? campaign.rewardPoint, gScore);
  const isCurated = campaign.applyMode === 'curated';
  const curatedUnlocked = gScore >= CURATED_MIN_G || completedCount >= 2;

  // 게스트는 신청/업로드 불가 — 로그인 유도 (다른 업로드 진입점과 동일 정책)
  // __DEV__ / TEST_GUEST_ENTRY: 개발·테스트 배포에서는 소셜 로그인 없이 전체 루프를
  // 확인해야 하므로 가드를 통과시킨다 (스토어 배포 시 TEST_GUEST_ENTRY=false로 원복)
  const guardGuest = async () => {
    if (__DEV__ || FEATURES.TEST_GUEST_ENTRY) {
      return false;
    }
    const userId = await Preference.get('userId');
    if (isGuestUser(userId)) {
      LogoutAlert({ route, navigation });
      return true;
    }
    return false;
  };

  const onApply = async () => {
    if (submitLockRef.current || applied) {
      return;
    }
    submitLockRef.current = true;
    try {
    if (await guardGuest()) {
      return;
    }
    if (!pledged) {
      Alert.alert(Strings.APPLY_PLEDGE_REQUIRED);
      return;
    }
    const profile = await getCreatorProfile();
    if (isCurated && (profile?.gScore ?? 50) < CURATED_MIN_G && (profile?.completedCount ?? 0) < 2) {
      Alert.alert(Strings.CURATED_LOCKED_HINT(CURATED_MIN_G));
      return;
    }
    // 동시 진행 한도 (v2 §4-1): 이력 0회 1건 / G50~79 2건 / G80+ 3건
    const seedings = await getSeedings();
    if (seedings[campaign.id]) {
      setHasSavedSeeding(true);
      return;
    }
    const activeStatuses = [
      SEEDING_STATUS.APPLIED,
      SEEDING_STATUS.APPROVED,
      SEEDING_STATUS.SHIPPED,
      SEEDING_STATUS.RECEIVED,
      SEEDING_STATUS.REVIEWING,
    ];
    const activeCount = Object.values(seedings).filter((s) =>
      activeStatuses.includes(s.status),
    ).length;
    const limit = concurrentLimit(profile?.gScore ?? 50, profile?.completedCount ?? 0);
    if (activeCount >= limit) {
      logEvent('apply_limit_blocked', { limit });
      Alert.alert(Strings.CONCURRENT_LIMIT_ALERT(limit));
      return;
    }
    const userId = await Preference.get('userId');
    const action = await dispatch(applyToCampaign({ campaignId: campaign.id, userId }));
    // thunk 실패 시 완료 알럿을 띄우지 않는다
    if (action?.error) {
      Alert.alert(Strings.RETRY_GUIDELINES);
      return;
    }
    // 시딩 인스턴스 생성 (상태머신 시작점)
    await upsertSeeding(campaign.id, { pledgeChecked: true, appealText: appeal.trim() });
    await setSeedingStatus(campaign.id, SEEDING_STATUS.APPLIED);
    // D24: Open 캠페인은 기준 충족 시 자동 확정 (서버 연동 시 ops가 동일 기준으로 판정)
    const autoConfirmed = !isCurated && canAutoConfirm(profile);
    if (autoConfirmed) {
      await setSeedingStatus(campaign.id, SEEDING_STATUS.APPROVED);
    }
    setHasSavedSeeding(true);
    // 이벤트 맵: 신청 퍼널 완성점 — appeal은 길이만 (PII 금지)
    logEvent('apply_submit', {
      campaign_id: campaign.id,
      apply_mode: campaign.applyMode,
      appeal_len: appeal.trim().length,
      auto_confirmed: autoConfirmed,
    });
    // Phase 1.5 2단계: ops Match 미러링 (실패해도 로컬 진행 무영향)
    opsApply({ campaign, appealText: appeal.trim(), autoConfirmed });
    // 신청 완료 전용 화면(시안)으로 이동 — 신청 후 활성 시딩 수 = 기존 카운트 + 1
    navigation.navigate('ApplyDone', {
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      applyMode: campaign.applyMode,
      usedCount: activeCount + 1,
      limit,
      autoConfirmed,
    });
    } catch (e) {
      Alert.alert(Strings.RETRY_GUIDELINES);
    } finally {
      submitLockRef.current = false;
    }
  };

  const openActivity = () => navigation.navigate('MainBottom', { screen: 'Activity' });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <FastImage source={{ uri: campaign.thumbnailUrl }} style={styles.hero} />
        <View style={styles.body}>
          {/* 조건·기한·잔여 수량 상단 고정 카드 */}
          <Card style={styles.topCard}>
            <View style={styles.badgeRow}>
              <Badge tone={isCurated ? 'curated' : 'open'} text={isCurated ? 'Curated' : 'Open'} />
              <Badge tone="amber" text={`+${points}P`} style={styles.pointBadge} />
              <View style={styles.grow} />
              <Text style={styles.xs}>{Strings.CAMPAIGN_REMAINING(campaign.remaining)}</Text>
            </View>
            <Text style={styles.brand}>{campaign.brand}</Text>
            <Text style={styles.title}>{campaign.title}</Text>
            <Text style={styles.meta}>
              {(campaign.countries || []).join(' · ')} ·{' '}
              <Text style={styles.pointsEmph}>+{points}P</Text>
            </Text>
            <Text style={styles.approvalNote}>{Strings.APPLY_AVG_APPROVAL}</Text>
          </Card>

          {/* 시안: "What you commit to" — 신청 전에 무엇을 받고 무엇을 해야 하는지
              네 칸으로 먼저 못박는다. 가이드 문장보다 이게 앞에 와야 한다. */}
          <Card style={styles.commitCard}>
            <Text style={styles.commitTitle}>{Strings.CAMPAIGN_COMMIT_TITLE}</Text>
            <View style={styles.commitGrid}>
              <View style={styles.commitCell}>
                <Text style={styles.commitLabel}>{Strings.CAMPAIGN_COMMIT_RECEIVE}</Text>
                <Text style={styles.commitValue}>{Strings.CAMPAIGN_COMMIT_FREE}</Text>
              </View>
              <View style={styles.commitCell}>
                <Text style={styles.commitLabel}>{Strings.CAMPAIGN_COMMIT_DEADLINE}</Text>
                <Text style={styles.commitValue}>
                  {Strings.CAMPAIGN_COMMIT_DAYS(campaign.postWithinDays ?? 14)}
                </Text>
              </View>
              <View style={styles.commitCell}>
                <Text style={styles.commitLabel}>{Strings.CAMPAIGN_COMMIT_PLATFORM}</Text>
                <Text style={styles.commitValue}>{Strings.CAMPAIGN_COMMIT_PLATFORM_VALUE}</Text>
              </View>
              <View style={styles.commitCell}>
                <Text style={styles.commitLabel}>{Strings.CAMPAIGN_COMMIT_SHIPS}</Text>
                <Text style={styles.commitValue} numberOfLines={1}>
                  {(campaign.countries || []).join(' / ') || '—'}
                </Text>
              </View>
            </View>
          </Card>

          {Array.isArray(campaign.contentGuide) && campaign.contentGuide.length > 0 ? (
            <Card style={styles.guideCard}>
              {/* 시안처럼 번호를 매긴다 — 순서가 곧 촬영 순서다 */}
              {campaign.contentGuide.map((g, i) => (
                <View key={g} style={styles.guideRow}>
                  <Text style={styles.guideNum}>{i + 1}</Text>
                  <Text style={styles.guideItem}>{g}</Text>
                </View>
              ))}
            </Card>
          ) : null}

          {!applied ? (
            <>
              <TextInput
                style={styles.appealInput}
                placeholder={Strings.APPLY_APPEAL_PLACEHOLDER}
                placeholderTextColor={COLORS.GREY}
                maxLength={100}
                value={appeal}
                onChangeText={setAppeal}
              />
              <TouchableOpacity style={styles.pledgeRow} onPress={() => setPledged(!pledged)}>
                <View style={[styles.checkbox, pledged && styles.checkboxOn]}>
                  {pledged ? <Text style={styles.checkboxMark}>✓</Text> : null}
                </View>
                <Text style={styles.pledgeText}>{Strings.APPLY_PLEDGE}</Text>
              </TouchableOpacity>
              <Text style={styles.honestyNote}>{Strings.APPLY_HONESTY_NOTE}</Text>
              {isCurated && !curatedUnlocked ? (
                <Text style={styles.lockedNote}>{Strings.CURATED_LOCKED_HINT(CURATED_MIN_G)}</Text>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        {applied ? (
          <TouchableOpacity style={[styles.cta, styles.ctaSecondary]} onPress={openActivity}>
            <Text style={[styles.ctaText, styles.ctaTextSecondary]}>
              {Strings.APPLYDONE_ACTIVITY_CTA}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.cta, (!pledged || (isCurated && !curatedUnlocked)) && styles.ctaDisabled]}
            onPress={onApply}
          >
            <Text style={styles.ctaText}>{Strings.CAMPAIGN_APPLY}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  hero: { width: '100%', height: 220, backgroundColor: COLORS.TRACK },
  body: { padding: 16 },
  topCard: { marginBottom: 10 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  pointBadge: { marginLeft: 6 },
  grow: { flex: 1 },
  xs: { ...TYPE.XS },
  brand: { ...TYPE.XS },
  title: { ...TYPE.CARD_TITLE, fontSize: 16, marginTop: 2, marginBottom: 4 },
  meta: { ...TYPE.SUB },
  pointsEmph: { fontFamily: T.FONT.ExtraBold, color: COLORS.AMBER_DEEP },
  approvalNote: {
    ...TYPE.XS,
    fontFamily: T.FONT.SemiBold,
    color: COLORS.GREEN,
    marginTop: 6,
  },
  commitCard: { marginBottom: 10 },
  commitTitle: {
    ...TYPE.LABEL,
    fontSize: 11,
    letterSpacing: 0.6,
    color: COLORS.GREY,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  commitGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  commitCell: { width: '50%', paddingVertical: 7, paddingRight: 8 },
  commitLabel: { ...TYPE.XS, marginBottom: 3 },
  commitValue: { ...TYPE.CARD_TITLE, fontSize: 13.5 },
  guideCard: { marginBottom: 10 },
  guideRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 3 },
  guideNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.AMBER_SOFT,
    color: COLORS.AMBER_DEEP,
    fontFamily: T.FONT.ExtraBold,
    fontSize: 10.5,
    textAlign: 'center',
    lineHeight: 18,
    marginRight: 9,
    overflow: 'hidden',
  },
  guideItem: { ...TYPE.BODY, lineHeight: 21, flex: 1 },
  appealInput: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.LINE,
    borderRadius: RADIUS.FIELD,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontFamily: T.FONT.Regular,
    fontSize: 13,
    backgroundColor: COLORS.SURFACE,
    color: COLORS.INK,
  },
  pledgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.SURFACE,
  },
  checkboxOn: { backgroundColor: COLORS.AMBER, borderColor: COLORS.AMBER },
  checkboxMark: { fontSize: 11, fontFamily: T.FONT.ExtraBold, color: COLORS.SURFACE },
  pledgeText: { flex: 1, ...TYPE.BODY, fontSize: 12.5, lineHeight: 19 },
  honestyNote: { ...TYPE.XS, marginTop: 10, lineHeight: 16.5 },
  lockedNote: { ...TYPE.XS, marginTop: 10, color: COLORS.AMBER_DEEP, lineHeight: 16.5 },
  ctaDisabled: { opacity: 0.45 },
  footer: { padding: 16, backgroundColor: COLORS.BG },
  cta: {
    backgroundColor: COLORS.AMBER,
    borderRadius: RADIUS.BTN,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaSecondary: { backgroundColor: COLORS.INK },
  ctaText: { ...TYPE.BTN, fontSize: 14.5 },
  ctaTextSecondary: { color: '#FFFFFF' },
});
