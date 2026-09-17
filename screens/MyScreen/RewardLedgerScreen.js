// 보상 내역 (기획서 §5.4 · §7 P2 "보상 정보 구조 통합").
// 마이 탭의 포인트 카드에는 원장 요약만 남기고, 5상태 필터·변경 사유·일시·캠페인 이동은 이 화면이 맡는다.
// 레거시 리뷰 리워드(R, 통화 단위) 화면(RewardList)은 삭제하지 않고 하단 행으로 연결한다(기능 보존 원칙).
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Preference from 'react-native-default-preference';
import T from '../../Components/Constants/DesignTokens';
import FEATURES from '../../Components/Constants/Features';
import Strings from '../../Components/Strings';
import { Badge, Card, Chips } from '../../Components/UI';
import { selectCampaigns } from '../../slices/campaign';
import { getSeedings } from '../../api/seedings';
import { getCreatorProfile } from '../../api/creators';
import { buildRewardLedger, ledgerTotals, REWARD_STATE } from '../../api/rewards';
import {
  REWARD_STATE_ORDER,
  rewardPointsText,
  rewardReasonLabel,
  rewardStateLabel,
  rewardTone,
} from '../../api/statusModel';

const { COLORS, FONT, TYPE } = T;

function fmtDate(iso) {
  if (!iso) {
    return '';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

export default function RewardLedgerScreen({ navigation }) {
  const campaigns = useSelector(selectCampaigns);
  const [seedings, setSeedings] = useState({});
  const [profile, setProfile] = useState(null);
  const [bonus, setBonus] = useState(false);
  const [filter, setFilter] = useState('all');

  useFocusEffect(
    useCallback(() => {
      getSeedings()
        .then(setSeedings)
        .catch(() => {});
      getCreatorProfile()
        .then(setProfile)
        .catch(() => setProfile(null));
      Preference.get('onboardingBonusGranted')
        .then((v) => setBonus(v === 'true'))
        .catch(() => {});
      StatusBar.setBarStyle('dark-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(COLORS.BG);
      }
    }, []),
  );

  const ledger = buildRewardLedger(seedings, campaigns, profile, { onboardingBonus: bonus });
  const totals = ledgerTotals(ledger);
  const shown = filter === 'all' ? ledger : ledger.filter((e) => e.state === filter);
  const byId = Object.fromEntries((campaigns || []).map((c) => [c.id, c]));
  const chips = [
    { key: 'all', label: Strings.REWARD_FILTER_ALL },
    ...REWARD_STATE_ORDER.map((s) => ({ key: s, label: rewardStateLabel(s) })),
  ];

  const openCampaign = (entry) => {
    const campaign = byId[entry.campaignId];
    if (campaign) {
      navigation.navigate('CampaignDetailRoot', { campaign });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={Strings.BACK}
        >
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={TYPE.H_TITLE}>{Strings.REWARD_LEDGER_TITLE}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <View style={styles.row}>
            <View>
              <Text style={styles.xs}>{Strings.MY_REWARD_EXPECTED_SUM(totals.expected)}</Text>
              <Text style={styles.sum}>{Strings.MY_REWARD_CONFIRMED_SUM(totals.confirmed)}</Text>
            </View>
            <Badge tone="amber" text={Strings.REWARD_LEDGER_TOTAL_PENDING(totals.pendingCount)} />
          </View>
          <Text style={[styles.xs, styles.mt6]}>{Strings.REWARD_LEDGER_INTRO}</Text>
        </Card>

        <Chips items={chips} selected={filter} onSelect={setFilter} style={styles.chips} />

        {shown.length === 0 ? (
          <Card>
            <Text style={styles.xs}>
              {ledger.length === 0 ? Strings.MY_REWARD_EMPTY : Strings.REWARD_LEDGER_EMPTY_FILTER}
            </Text>
          </Card>
        ) : (
          shown.map((e) => {
            const tappable = !!byId[e.campaignId];
            // 지급 완료 상세 (2026-09-17) — 배지로 끝나지 않게 금액·적립처를 보여준다
            const onRowPress = () => {
              if (e.state === REWARD_STATE.PAID) {
                Alert.alert(
                  rewardStateLabel(e.state),
                  Strings.REWARD_PAID_DETAIL(Number(e.points || 0).toLocaleString()),
                  tappable
                    ? [
                        { text: Strings.OK, style: 'cancel' },
                        { text: Strings.ACT_FEEDBACK_VIEW_ALL, onPress: () => openCampaign(e) },
                      ]
                    : [{ text: Strings.OK }],
                );
                return;
              }
              if (tappable) {
                openCampaign(e);
              }
            };
            return (
              <TouchableOpacity
                key={`${e.campaignId}:${e.state}:${e.at || ''}`}
                activeOpacity={tappable || e.state === REWARD_STATE.PAID ? 0.7 : 1}
                onPress={onRowPress}
                accessibilityRole={tappable ? 'button' : 'text'}
                accessibilityLabel={`${e.title || Strings.REWARD_REASON_onboarding} ${rewardStateLabel(e.state)} ${rewardPointsText(e)}`}
              >
                <Card>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title} numberOfLines={1}>
                        {e.title || Strings.REWARD_REASON_onboarding}
                      </Text>
                      <Text style={[styles.xs, styles.mt4]}>
                        {[fmtDate(e.at), e.title ? rewardReasonLabel(e.reason) : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                    <View style={styles.right}>
                      <Badge tone={rewardTone(e.state)} text={rewardStateLabel(e.state)} />
                      <Text style={styles.points}>{rewardPointsText(e)}</Text>
                    </View>
                    {tappable ? <Text style={styles.chev}>›</Text> : null}
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}

        {/* 레거시 리뷰 리워드(R) — 커머스 플래그와 무관하게 데이터 열람 경로는 남긴다 */}
        {FEATURES.COMMERCE ? (
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('RewardList')}>
            <Card>
              <View style={styles.row}>
                <Text style={styles.title}>{Strings.REWARD_LEDGER_LEGACY_ROW}</Text>
                <Text style={styles.chev}>›</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  back: { fontFamily: FONT.Bold, fontSize: 26, color: COLORS.INK, lineHeight: 28 },
  scroll: { padding: 16, paddingBottom: 32, gap: 9 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  right: { alignItems: 'flex-end', gap: 4 },
  xs: { ...TYPE.XS },
  mt4: { marginTop: 4 },
  mt6: { marginTop: 6 },
  sum: { fontFamily: FONT.ExtraBold, fontSize: 18, color: COLORS.AMBER_DEEP, marginTop: 2 },
  chips: { marginVertical: 2 },
  title: { fontFamily: FONT.Bold, fontSize: 13, color: COLORS.INK },
  points: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.INK },
  chev: { fontFamily: FONT.Bold, fontSize: 16, color: COLORS.GREY },
});
