import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FEATURES from '../../Components/Constants/Features';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Preference from 'react-native-default-preference';
import T from '../../Components/Constants/DesignTokens';
import { Card, Btn, Badge, StatusPill, ProgressBar, NoteBox } from '../../Components/UI';
import Strings from '../../Components/Strings';
import { fetchCampaigns, selectCampaigns } from '../../slices/campaign';
import { getSeedings, setSeedingStatus, upsertSeeding, SEEDING_STATUS } from '../../api/seedings';
import { logEvent } from '../../api/common/analytics';
import { getCreatorProfile, saveCreatorProfile } from '../../api/creators';
import { referralCodesFor } from '../../api/referral';
import {
  personalizedPoints,
  gradeMultiplier,
  G_DELTA,
  GRACE_MULTIPLIER,
} from '../TryScreen/points';
import { daysLeft, isInGrace, isNoShowDue, EXTENSION_DAYS } from './missionLogic';
import AddressModal from './AddressModal';
import { scheduleUploadReminders, cancelUploadReminders } from './reminders';

const { COLORS, RADIUS, FONT, TYPE } = T;

const STATUS_LABEL = () => ({
  [SEEDING_STATUS.APPLIED]: Strings.CAMPAIGN_STATUS_APPLIED,
  [SEEDING_STATUS.APPROVED]: Strings.CAMPAIGN_STATUS_APPROVED,
  [SEEDING_STATUS.SHIPPED]: Strings.CAMPAIGN_STATUS_SHIPPED,
  [SEEDING_STATUS.RECEIVED]: Strings.CAMPAIGN_STATUS_RECEIVED,
  [SEEDING_STATUS.REVIEWING]: Strings.CAMPAIGN_STATUS_REVIEWING,
  [SEEDING_STATUS.DONE]: Strings.CAMPAIGN_STATUS_DONE,
  [SEEDING_STATUS.CANCELLED]: Strings.CAMPAIGN_STATUS_CANCELLED,
  [SEEDING_STATUS.NO_SHOW]: Strings.CAMPAIGN_STATUS_NO_SHOW,
});

// 운영 수동 전이(승인·발송)를 에뮬레이터에서 확인하기 위한 개발 전용 시뮬 버튼
const DEV_NEXT = {
  [SEEDING_STATUS.APPLIED]: SEEDING_STATUS.APPROVED,
  [SEEDING_STATUS.SHIPPED]: null, // 수령은 사용자 버튼
  [SEEDING_STATUS.REVIEWING]: SEEDING_STATUS.DONE,
};

// 시안 24: 진행/완료 세그먼트 분류 기준
const ONGOING_STATUSES = [
  SEEDING_STATUS.APPLIED,
  SEEDING_STATUS.APPROVED,
  SEEDING_STATUS.SHIPPED,
  SEEDING_STATUS.RECEIVED,
  SEEDING_STATUS.REVIEWING,
];

export default function ActivityScreen({ navigation }) {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectCampaigns);
  const totalReward = useSelector((s) => s.user.totalReward);
  const [seedings, setSeedings] = useState({});
  const [profile, setProfile] = useState(null);
  const [addressFor, setAddressFor] = useState(null); // campaignId | null
  const [localPoints, setLocalPoints] = useState(0);
  const [tab, setTab] = useState('ongoing'); // 시안 24: 'ongoing' | 'done'

  const [bonusPoints, setBonusPoints] = useState(0);

  const reload = useCallback(() => {
    getSeedings().then(setSeedings);
    getCreatorProfile().then(setProfile);
    // 온보딩 완료 보상 +50P (v2 §3-③) — mock: 로컬 합산
    Preference.get('onboardingBonusGranted').then((v) => setBonusPoints(v === 'true' ? 50 : 0));
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (campaigns.length === 0) {
        dispatch(fetchCampaigns());
      }
      reload();
      // 마운트 시 1회 + 포커스마다
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reload]),
  );

  const campaignById = Object.fromEntries(campaigns.map((c) => [c.id, c]));
  const missions = Object.values(seedings)
    .filter((s) => campaignById[s.campaignId])
    .sort((a, b) => (b.appliedAt || '').localeCompare(a.appliedAt || ''));
  const ongoingMissions = missions.filter((s) => ONGOING_STATUSES.includes(s.status));
  const doneMissions = missions.filter((s) => !ONGOING_STATUSES.includes(s.status));
  const shownMissions = tab === 'ongoing' ? ongoingMissions : doneMissions;

  const gScore = profile?.gScore ?? 50;
  const points = (totalReward ?? 0) + localPoints + bonusPoints;

  const onReceive = async (campaignId) => {
    const prev = seedings[campaignId];
    const all = await setSeedingStatus(campaignId, SEEDING_STATUS.RECEIVED);
    // 수령 확인 = 리마인더 시퀀스 시작 (D+7/D-3/D-1/마감/유예)
    const s = all[campaignId];
    // 이벤트 맵: 북극성 분모 — 배송 리드타임 분포의 원천
    logEvent('received_confirm', {
      campaign_id: campaignId,
      days_since_shipped: prev?.shippedAt
        ? Math.round((Date.now() - new Date(prev.shippedAt).getTime()) / 86400000)
        : -1,
    });
    scheduleUploadReminders(campaignId, campaignById[campaignId]?.title || '', s.receivedAt, false);
    // 시안 22: 알림 가치가 가장 높은 순간(리마인더 시작 직후)에만 권한 컨텍스트 프롬프트 (Android 13+, 1회)
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const shown = await Preference.get('notifPromptShown');
      if (shown !== 'true') {
        Alert.alert(Strings.ACT_NOTIF_TITLE, Strings.ACT_NOTIF_BODY, [
          {
            text: Strings.ACT_NOTIF_LATER,
            style: 'cancel',
            onPress: () => logEvent('noti_permission_prompt', { result: 'later' }),
          },
          {
            text: Strings.ACT_NOTIF_ALLOW,
            onPress: () => {
              logEvent('noti_permission_prompt', { result: 'allow' });
              PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
            },
          },
        ]);
        await Preference.set('notifPromptShown', 'true');
      }
    }
    reload();
  };

  // 시안 23: 발송 전(applied/approved) 무페널티 취소
  const onCancel = (campaignId) => {
    Alert.alert(Strings.ACT_CANCEL_TITLE, Strings.ACT_CANCEL_BODY, [
      { text: Strings.ACT_CANCEL_KEEP, style: 'cancel' },
      {
        text: Strings.ACT_CANCEL_CONFIRM,
        style: 'destructive',
        onPress: async () => {
          logEvent('cancel_confirm', {
            campaign_id: campaignId,
            status_at_cancel: seedings[campaignId]?.status || 'unknown',
          });
          await setSeedingStatus(campaignId, SEEDING_STATUS.CANCELLED);
          reload();
        },
      },
    ]);
  };

  const onExtend = async (seeding) => {
    if (seeding.extensionUsed) {
      return;
    }
    logEvent('extension_use', { campaign_id: seeding.campaignId });
    await upsertSeeding(seeding.campaignId, { extensionUsed: true });
    // 연장된 마감 기준으로 리마인더 재스케줄
    scheduleUploadReminders(
      seeding.campaignId,
      campaignById[seeding.campaignId]?.title || '',
      seeding.receivedAt,
      true,
    );
    Alert.alert(Strings.EXTENSION_GRANTED(EXTENSION_DAYS));
    reload();
  };

  const onUpload = (campaignId) => {
    // FGI 설문(구매의향·가격·경쟁력 + 정성)이 업로드보다 먼저다 — 리포트 데이터 원천
    const seeding = seedings[campaignId];
    const campaign = campaignById[campaignId];
    if (!seeding?.fgiSurvey && campaign) {
      navigation.navigate('FgiSurvey', { campaign });
      return;
    }
    navigation.navigate('ReviewLinkSubmit', { campaignId });
  };

  const onSubmitAddress = async (address) => {
    await upsertSeeding(addressFor, { address });
    setAddressFor(null);
    reload();
  };

  // 시안 16: 완주 리포트 화면 이동 params (devAdvance 전이 직후·완료 카드 재진입 공용)
  const openMissionDone = (seeding, campaign, gBefore, gAfter) => {
    const grace = isInGrace(seeding);
    const base = personalizedPoints(campaign?.basePoints ?? 0, gBefore);
    const granted = Math.round(base * (grace ? GRACE_MULTIPLIER : 1));
    navigation.navigate('MissionDone', {
      pointsGranted: granted,
      basePoints: campaign?.basePoints ?? 0,
      multiplier: gradeMultiplier(gBefore),
      gBefore,
      gAfter,
      brandName: campaign?.brand,
      handleUrl: profile?.handleUrl,
    });
  };

  // 개발용 운영 시뮬: 다음 상태로 전이 + done 시 보상/G-스코어 반영
  const devAdvance = async (seeding) => {
    if (!__DEV__) {
      return;
    }
    const next =
      seeding.status === SEEDING_STATUS.RECEIVED
        ? SEEDING_STATUS.REVIEWING
        : DEV_NEXT[seeding.status];
    if (!next) {
      return;
    }
    await setSeedingStatus(seeding.campaignId, next);
    if (next === SEEDING_STATUS.REVIEWING) {
      cancelUploadReminders(seeding.campaignId);
    }
    if (next === SEEDING_STATUS.DONE) {
      const campaign = campaignById[seeding.campaignId];
      const grace = isInGrace(seeding);
      const base = personalizedPoints(campaign?.basePoints ?? 0, gScore);
      const granted = Math.round(base * (grace ? GRACE_MULTIPLIER : 1));
      setLocalPoints((p) => p + granted);
      const nextProfile = {
        ...(profile || {}),
        gScore: gScore + (grace ? G_DELTA.GRACE_COMPLETE : G_DELTA.COMPLETE),
        completedCount: (profile?.completedCount ?? 0) + 1,
      };
      await saveCreatorProfile(nextProfile);
      // 시안 16: 완주 보상 리포트로 즉시 연결
      openMissionDone(seeding, campaign, gScore, nextProfile.gScore);
    }
    reload();
  };

  const renderMission = ({ item: seeding }) => {
    const campaign = campaignById[seeding.campaignId];
    const left = daysLeft(seeding);
    const grace = isInGrace(seeding);
    const noShowDue = isNoShowDue(seeding);
    const label = STATUS_LABEL()[seeding.status] || seeding.status;

    return (
      <Card
        style={[
          styles.mission,
          seeding.status === SEEDING_STATUS.CANCELLED && styles.cancelledCard,
        ]}
      >
        <View style={styles.missionHeader}>
          <Text style={styles.missionTitle} numberOfLines={1}>
            {campaign.title}
          </Text>
          <TouchableOpacity onLongPress={() => devAdvance(seeding)}>
            <StatusPill status={seeding.status} label={label} />
          </TouchableOpacity>
        </View>

        {seeding.status === SEEDING_STATUS.APPROVED && !seeding.address ? (
          <Btn
            title={Strings.ADDRESS_CTA}
            onPress={() => setAddressFor(seeding.campaignId)}
            style={styles.actionGap}
          />
        ) : null}
        {seeding.status === SEEDING_STATUS.APPROVED && seeding.address ? (
          <Text style={styles.subInfo}>{Strings.ADDRESS_SAVED}</Text>
        ) : null}

        {/* 시안 23: 발송 전에는 무페널티 취소 가능 */}
        {seeding.status === SEEDING_STATUS.APPLIED || seeding.status === SEEDING_STATUS.APPROVED ? (
          <Btn
            variant="ghost"
            small
            title={Strings.CANCEL}
            onPress={() => onCancel(seeding.campaignId)}
            style={styles.cancelBtn}
          />
        ) : null}

        {seeding.status === SEEDING_STATUS.SHIPPED ? (
          <>
            {seeding.trackingNo ? (
              <Text style={styles.subInfo}>
                {Strings.TRACKING_NO}: {seeding.trackingNo}
              </Text>
            ) : null}
            <Btn
              title={Strings.RECEIVED_CTA}
              onPress={() => onReceive(seeding.campaignId)}
              style={styles.actionGap}
            />
            <Text style={styles.subInfo}>{Strings.AUTO_RECEIVE_NOTE}</Text>
          </>
        ) : null}

        {seeding.status === SEEDING_STATUS.RECEIVED ? (
          <>
            {grace ? (
              <NoteBox tone="amber" text={Strings.GRACE_NOTE} style={styles.actionGap} />
            ) : (
              <Text
                style={[
                  styles.dday,
                  (left != null && left <= 3) || noShowDue ? styles.ddayDanger : null,
                ]}
              >
                {noShowDue ? Strings.CAMPAIGN_STATUS_NO_SHOW : Strings.DDAY_LEFT(left)}
              </Text>
            )}
            <View style={styles.rowBtns}>
              <Btn
                title={Strings.UPLOAD_REVIEW_CTA}
                onPress={() => onUpload(seeding.campaignId)}
                style={styles.rowBtn}
              />
              {!seeding.extensionUsed && left != null && left <= 3 && !grace ? (
                <Btn
                  variant="ghost"
                  title={Strings.EXTEND_CTA(EXTENSION_DAYS)}
                  onPress={() => onExtend(seeding)}
                  style={styles.rowBtn}
                />
              ) : null}
            </View>
          </>
        ) : null}

        {seeding.status === SEEDING_STATUS.DONE ? (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackStars}>★★★★☆</Text>
            <Text style={styles.feedbackText}>{Strings.BRAND_FEEDBACK_MOCK(campaign.brand)}</Text>
            <Btn
              variant="ghost"
              small
              title={Strings.ACT_FEEDBACK_VIEW_ALL}
              onPress={() => openMissionDone(seeding, campaign, gScore, gScore)}
              style={styles.actionGap}
            />
          </View>
        ) : null}

        {seeding.status === SEEDING_STATUS.CANCELLED ? (
          <Text style={styles.cancelledNote}>{Strings.ACT_CANCELLED_NOTE}</Text>
        ) : null}

        {seeding.status === SEEDING_STATUS.NO_SHOW ? (
          <NoteBox tone="red" text={Strings.STRIKE_WARNING} style={styles.actionGap} />
        ) : null}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>{Strings.ACTIVITY_TAB}</Text>
        <Badge tone="amber" text={`${points}P`} />
      </View>

      {/* 시안 24: 진행/완료 세그먼트 */}
      <View style={styles.segWrap}>
        {[
          ['ongoing', Strings.ACT_SEG_ONGOING(ongoingMissions.length)],
          ['done', Strings.ACT_SEG_DONE(doneMissions.length)],
        ].map(([key, segLabel]) => (
          <TouchableOpacity
            key={key}
            style={[styles.segCell, tab === key && styles.segCellOn]}
            onPress={() => setTab(key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.segText, tab === key && styles.segTextOn]}>{segLabel}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.topRow}>
        <Card style={styles.topCard}>
          <Text style={styles.topLabel}>G-Score</Text>
          <Text style={styles.gValue}>G{gScore}</Text>
          <ProgressBar
            ratio={Math.min(100, Math.max(4, ((gScore - 50) / 10) * 100)) / 100}
            style={styles.gBar}
          />
          <Text style={styles.topNote}>
            {gScore < 60 ? Strings.G_NEXT_UNLOCK(60 - gScore) : Strings.G_UNLOCKED}
          </Text>
        </Card>
        <Card style={styles.topCard}>
          <Text style={styles.topLabel}>Point</Text>
          <Text style={styles.pointValue}>{points}P</Text>
          <Text style={styles.topNote}>{Strings.POINT_CASHOUT_NOTE}</Text>
        </Card>
      </View>

      {/* v2 §7-4 (D6): 첫 검증 루프 완료 시 추천 코드 3장 — 발급자 핸들 각인 */}
      {FEATURES.REFERRAL && (profile?.completedCount ?? 0) >= 1 ? (
        <Card style={styles.referralCard}>
          <Text style={styles.referralTitle}>{Strings.REFERRAL_TITLE}</Text>
          <View style={styles.referralCodes}>
            {referralCodesFor(profile).map((code) => (
              <TouchableOpacity
                key={code}
                style={styles.referralCode}
                activeOpacity={0.7}
                onPress={() =>
                  Share.share({
                    message: Strings.REFERRAL_SHARE_MESSAGE_NAMED(
                      code,
                      profile?.handleUrl || 'greyd',
                    ),
                  }).catch(() => {})
                }
              >
                <Text style={styles.referralCodeText}>{code}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.referralNote}>
            {Strings.REFERRAL_INVITED_BY(profile?.handleUrl || '')} · {Strings.REFERRAL_NOTE}
          </Text>
        </Card>
      ) : null}

      <Text style={styles.section}>{Strings.MY_MISSIONS}</Text>
      <FlatList
        data={shownMissions}
        keyExtractor={(item) => item.campaignId}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>{Strings.NO_CAMPAIGNS}</Text>
          </View>
        }
        renderItem={renderMission}
      />

      <AddressModal
        visible={addressFor != null}
        onClose={() => setAddressFor(null)}
        onSubmit={onSubmitAddress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: { ...TYPE.H_TITLE },

  // 시안 24: 진행/완료 세그먼트
  segWrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    borderRadius: 9,
    overflow: 'hidden',
  },
  segCell: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  segCellOn: { backgroundColor: COLORS.INK },
  segText: { fontFamily: FONT.Bold, fontSize: 11.5, color: COLORS.GREY },
  segTextOn: { color: COLORS.SURFACE },

  // 상단 G-스코어 · 포인트 카드
  topRow: { flexDirection: 'row', gap: 10, margin: 16 },
  topCard: { flex: 1 },
  topLabel: { fontFamily: FONT.Bold, fontSize: 11, color: COLORS.GREY },
  gValue: { fontFamily: FONT.ExtraBold, fontSize: 30, color: COLORS.INK, letterSpacing: -0.4 },
  gBar: { marginTop: 7 },
  topNote: { ...TYPE.XS, marginTop: 6 },
  pointValue: {
    fontFamily: FONT.ExtraBold,
    fontSize: 30,
    color: COLORS.AMBER_DEEP,
    letterSpacing: -0.4,
  },

  section: {
    fontFamily: FONT.Bold,
    fontSize: 14,
    color: COLORS.INK,
    letterSpacing: -0.1,
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  // 진행 카드
  mission: { marginBottom: 10 },
  missionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  missionTitle: { ...TYPE.CARD_TITLE, flex: 1, marginRight: 10 },
  subInfo: { ...TYPE.SUB, marginTop: 8 },
  actionGap: { marginTop: 10 },
  rowBtns: { flexDirection: 'row', gap: 8, marginTop: 10 },
  rowBtn: { flex: 1 },
  dday: {
    marginTop: 10,
    fontFamily: FONT.ExtraBold,
    fontSize: 13,
    color: COLORS.GREEN,
    fontVariant: ['tabular-nums'],
  },
  ddayDanger: { color: COLORS.RED },
  feedbackCard: {
    marginTop: 10,
    backgroundColor: COLORS.AMBER_FAINT,
    borderRadius: RADIUS.FIELD,
    padding: 12,
  },
  feedbackStars: { color: COLORS.AMBER, fontSize: 13, letterSpacing: 2 },
  cancelBtn: { marginTop: 10, alignSelf: 'flex-start' },
  cancelledCard: { opacity: 0.75 },
  cancelledNote: { ...TYPE.XS, marginTop: 8 },
  feedbackText: { ...TYPE.SUB, fontSize: 12.5, color: COLORS.INK, marginTop: 4, lineHeight: 18 },

  // 빈 상태
  emptyWrap: { alignItems: 'center', marginTop: 40, gap: 8 },
  emptyEmoji: { fontSize: 34 },
  emptyTitle: { fontFamily: FONT.Bold, fontSize: 14.5, color: COLORS.INK },

  // 추천 코드 카드
  referralCard: { marginHorizontal: 16, marginBottom: 14 },
  referralTitle: { ...TYPE.CARD_TITLE, fontSize: 13.5 },
  referralCodes: { flexDirection: 'row', marginTop: 10, gap: 8 },
  referralCode: {
    flex: 1,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.AMBER,
    borderRadius: 9,
    backgroundColor: COLORS.AMBER_FAINT,
    paddingVertical: 8,
    alignItems: 'center',
  },
  referralCodeText: {
    fontFamily: FONT.ExtraBold,
    fontSize: 13,
    color: COLORS.AMBER_DEEP,
    letterSpacing: 2,
  },
  referralNote: { ...TYPE.XS, marginTop: 8 },
});
