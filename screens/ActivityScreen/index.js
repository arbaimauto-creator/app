import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
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
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import { fetchCampaigns, selectCampaigns } from '../../slices/campaign';
import {
  getSeedings,
  setSeedingStatus,
  upsertSeeding,
  SEEDING_STATUS,
} from '../../api/seedings';
import { getCreatorProfile, saveCreatorProfile } from '../../api/creators';
import { personalizedPoints, G_DELTA, GRACE_MULTIPLIER } from '../TryScreen/points';
import { daysLeft, isInGrace, isNoShowDue, EXTENSION_DAYS } from './missionLogic';
import AddressModal from './AddressModal';

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

export default function ActivityScreen({ navigation }) {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectCampaigns);
  const totalReward = useSelector((s) => s.user.totalReward);
  const [seedings, setSeedings] = useState({});
  const [profile, setProfile] = useState(null);
  const [addressFor, setAddressFor] = useState(null); // campaignId | null
  const [localPoints, setLocalPoints] = useState(0);

  const reload = useCallback(() => {
    getSeedings().then(setSeedings);
    getCreatorProfile().then(setProfile);
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

  const gScore = profile?.gScore ?? 50;

  const onReceive = async (campaignId) => {
    await setSeedingStatus(campaignId, SEEDING_STATUS.RECEIVED);
    reload();
  };

  const onExtend = async (seeding) => {
    if (seeding.extensionUsed) {
      return;
    }
    await upsertSeeding(seeding.campaignId, { extensionUsed: true });
    Alert.alert(Strings.EXTENSION_GRANTED(EXTENSION_DAYS));
    reload();
  };

  const onUpload = (campaignId) => {
    navigation.navigate('AddingNewVideo', { campaignId });
  };

  const onSubmitAddress = async (address) => {
    await upsertSeeding(addressFor, { address });
    setAddressFor(null);
    reload();
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
      <View style={styles.mission}>
        <View style={styles.missionHeader}>
          <Text style={styles.missionTitle} numberOfLines={1}>
            {campaign.title}
          </Text>
          <TouchableOpacity onLongPress={() => devAdvance(seeding)}>
            <Text
              style={[
                styles.missionStatus,
                seeding.status === SEEDING_STATUS.NO_SHOW && styles.statusDanger,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        </View>

        {seeding.status === SEEDING_STATUS.APPROVED && !seeding.address ? (
          <TouchableOpacity style={styles.actionBtn} onPress={() => setAddressFor(seeding.campaignId)}>
            <Text style={styles.actionBtnText}>{Strings.ADDRESS_CTA}</Text>
          </TouchableOpacity>
        ) : null}
        {seeding.status === SEEDING_STATUS.APPROVED && seeding.address ? (
          <Text style={styles.subInfo}>{Strings.ADDRESS_SAVED}</Text>
        ) : null}

        {seeding.status === SEEDING_STATUS.SHIPPED ? (
          <>
            {seeding.trackingNo ? (
              <Text style={styles.subInfo}>
                {Strings.TRACKING_NO}: {seeding.trackingNo}
              </Text>
            ) : null}
            <TouchableOpacity style={styles.actionBtn} onPress={() => onReceive(seeding.campaignId)}>
              <Text style={styles.actionBtnText}>{Strings.RECEIVED_CTA}</Text>
            </TouchableOpacity>
            <Text style={styles.subInfo}>{Strings.AUTO_RECEIVE_NOTE}</Text>
          </>
        ) : null}

        {seeding.status === SEEDING_STATUS.RECEIVED ? (
          <>
            <Text
              style={[
                styles.dday,
                (left != null && left <= 3) || grace ? styles.ddayDanger : null,
              ]}
            >
              {grace
                ? Strings.GRACE_NOTE
                : noShowDue
                ? Strings.CAMPAIGN_STATUS_NO_SHOW
                : Strings.DDAY_LEFT(left)}
            </Text>
            <View style={styles.rowBtns}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rowBtn]}
                onPress={() => onUpload(seeding.campaignId)}
              >
                <Text style={styles.actionBtnText}>{Strings.UPLOAD_REVIEW_CTA}</Text>
              </TouchableOpacity>
              {!seeding.extensionUsed && left != null && left <= 3 && !grace ? (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rowBtn, styles.extendBtn]}
                  onPress={() => onExtend(seeding)}
                >
                  <Text style={styles.extendBtnText}>{Strings.EXTEND_CTA(EXTENSION_DAYS)}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </>
        ) : null}

        {seeding.status === SEEDING_STATUS.DONE ? (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackStars}>★★★★★</Text>
            <Text style={styles.feedbackText}>{Strings.BRAND_FEEDBACK_MOCK(campaign.brand)}</Text>
          </View>
        ) : null}

        {seeding.status === SEEDING_STATUS.NO_SHOW ? (
          <Text style={styles.strikeWarn}>{Strings.STRIKE_WARNING}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{Strings.ACTIVITY_TAB}</Text>

      <View style={styles.pointCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pointLabel}>Point</Text>
          <Text style={styles.pointValue}>{(totalReward ?? 0) + localPoints}P</Text>
          <Text style={styles.pointNote}>{Strings.POINT_CASHOUT_NOTE}</Text>
        </View>
        <View style={styles.gBox}>
          <Text style={styles.gLabel}>G-Score</Text>
          <Text style={styles.gValue}>G{gScore}</Text>
          <View style={styles.gBarTrack}>
            <View
              style={[
                styles.gBarFill,
                { width: `${Math.min(100, Math.max(4, ((gScore - 50) / 10) * 100))}%` },
              ]}
            />
          </View>
          <Text style={styles.gNext}>
            {gScore < 60 ? Strings.G_NEXT_UNLOCK(60 - gScore) : Strings.G_UNLOCKED}
          </Text>
        </View>
      </View>

      {/* v2 §7-4 (D6): 첫 검증 루프 완료 시 추천 코드 3장 */}
      {FEATURES.REFERRAL && (profile?.completedCount ?? 0) >= 1 ? (
        <View style={styles.referralCard}>
          <Text style={styles.referralTitle}>{Strings.REFERRAL_TITLE}</Text>
          <View style={styles.referralCodes}>
            {['CREW26', 'CREW27', 'CREW28'].map((code) => (
              <TouchableOpacity
                key={code}
                style={styles.referralCode}
                onPress={() =>
                  Share.share({ message: Strings.REFERRAL_SHARE_MESSAGE(code) }).catch(() => {})
                }
              >
                <Text style={styles.referralCodeText}>{code}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.referralNote}>{Strings.REFERRAL_NOTE}</Text>
        </View>
      ) : null}

      <Text style={styles.section}>{Strings.MY_MISSIONS}</Text>
      <FlatList
        data={missions}
        keyExtractor={(item) => item.campaignId}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListEmptyComponent={<Text style={styles.empty}>{Strings.NO_CAMPAIGNS}</Text>}
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
  container: { flex: 1, backgroundColor: Constants.COLOR_BACKGROUND_DARK },
  header: {
    fontSize: 24,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    color: Constants.TIER_COLORS.ARTISAN,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  pointCard: {
    margin: 16,
    padding: 18,
    borderRadius: 14,
    backgroundColor: Constants.COLOR_MAIN,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointLabel: { fontSize: 12, fontWeight: '700', color: '#16130d', opacity: 0.7 },
  pointValue: { fontSize: 28, fontWeight: '900', color: '#16130d' },
  pointNote: { fontSize: 10.5, color: '#16130d', opacity: 0.65, marginTop: 4 },
  gBox: { width: 130, marginLeft: 12 },
  gLabel: { fontSize: 11, fontWeight: '700', color: '#16130d', opacity: 0.7 },
  gValue: { fontSize: 20, fontWeight: '900', color: '#16130d' },
  gBarTrack: {
    height: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(22,19,13,0.25)',
    marginTop: 6,
    overflow: 'hidden',
  },
  gBarFill: { height: '100%', backgroundColor: '#16130d', borderRadius: 4 },
  gNext: { fontSize: 10, color: '#16130d', opacity: 0.75, marginTop: 4 },
  section: {
    fontSize: 16,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    color: Constants.TIER_COLORS.ARTISAN,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  mission: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  missionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  missionTitle: { flex: 1, fontSize: 14, marginRight: 10, color: '#26231d' },
  missionStatus: { fontSize: 12, fontWeight: '700', color: '#c47b00' },
  statusDanger: { color: '#d33' },
  subInfo: { fontSize: 12, color: '#8a857b', marginTop: 8 },
  actionBtn: {
    marginTop: 10,
    backgroundColor: Constants.COLOR_MAIN,
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 13.5, fontWeight: '800', color: '#16130d' },
  rowBtns: { flexDirection: 'row', gap: 8 },
  rowBtn: { flex: 1 },
  extendBtn: { backgroundColor: '#efede8' },
  extendBtnText: { fontSize: 13, fontWeight: '700', color: '#26231d' },
  dday: { marginTop: 10, fontSize: 13, fontWeight: '800', color: '#1c7c31' },
  ddayDanger: { color: '#d33' },
  feedbackCard: {
    marginTop: 10,
    backgroundColor: '#faf6ea',
    borderRadius: 10,
    padding: 12,
  },
  feedbackStars: { color: '#c47b00', fontSize: 13, letterSpacing: 2 },
  feedbackText: { fontSize: 12.5, color: '#5c574d', marginTop: 4, lineHeight: 18 },
  strikeWarn: { marginTop: 10, fontSize: 12.5, color: '#d33', lineHeight: 18 },
  empty: { textAlign: 'center', marginTop: 40, color: Constants.TIER_COLORS.STRIVER },
  referralCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#26231d',
    borderRadius: 12,
    padding: 14,
  },
  referralTitle: { fontSize: 13.5, fontWeight: '800', color: Constants.COLOR_MAIN },
  referralCodes: { flexDirection: 'row', marginTop: 10, gap: 8 },
  referralCode: {
    flex: 1,
    borderWidth: 1,
    borderColor: Constants.COLOR_MAIN,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  referralCodeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f4f1ea',
    letterSpacing: 2,
  },
  referralNote: { fontSize: 11, color: '#a39d90', marginTop: 8 },
});
