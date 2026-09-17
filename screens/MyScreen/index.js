// 마이 탭 (시안 화면 18) — 프로필·G-스코어·포인트·추천 코드·설정 진입점.
import React, { useCallback, useState } from 'react';
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Preference from 'react-native-default-preference';
import T from '../../Components/Constants/DesignTokens';
import FEATURES from '../../Components/Constants/Features';
import { Card, GlowCard, ProgressBar } from '../../Components/UI';
import Strings from '../../Components/Strings';
import { getCreatorProfile } from '../../api/creators';
import { referralCodesFor } from '../../api/referral';
import { concurrentLimit, CURATED_MIN_G } from '../TryScreen/points';
import { Linking } from 'react-native';
import { useSelector } from 'react-redux';
import { Badge, Btn } from '../../Components/UI';
import { selectCampaigns } from '../../slices/campaign';
import { getSeedings } from '../../api/seedings';
import { profileCompleteness, trustComponents } from '../../api/trust';
import { buildRewardLedger, ledgerTotals } from '../../api/rewards';
import {
  gProgressRatio,
  rewardPointsText,
  rewardReasonLabel,
  rewardStateLabel,
  rewardTone,
} from '../../api/statusModel';
import {
  buildActivityNotifications,
  countUnread,
  getActivityNotiReadAt,
} from '../../api/activityNotifications';

// 마이 탭 포인트 카드에는 최근 N건만 — 전체·필터·사유는 보상 내역 화면(RewardLedger)
const LEDGER_PREVIEW = 3;

const { COLORS, FONT, TYPE } = T;

export default function MyScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [seedings, setSeedings] = useState({});
  const [notiReadAt, setNotiReadAt] = useState(null);
  const campaigns = useSelector(selectCampaigns);

  const reload = useCallback(() => {
    getCreatorProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
    getSeedings()
      .then(setSeedings)
      .catch(() => {});
    getActivityNotiReadAt()
      .then(setNotiReadAt)
      .catch(() => {});
    // 온보딩 완료 보상 +50P (v2 §3-③) — mock: 로컬 합산
    Preference.get('onboardingBonusGranted')
      .then((v) => setBonusPoints(v === 'true' ? 50 : 0))
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
      // 밝은 배경 화면이므로 상태바 글자는 항상 어둡게. 탭 리스너가 놓치는 진입
      // 경로(딥링크·푸시)에서도 시계·배터리가 흰색으로 보이지 않게 한다.
      StatusBar.setBarStyle('dark-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(COLORS.BG);
      }
    }, [reload]),
  );

  const gScore = profile?.gScore ?? 50;
  const strikes = profile?.strikes ?? 0;
  const completedCount = profile?.completedCount ?? 0;
  const limit = concurrentLimit(gScore, completedCount);
  // 포인트(P)와 레거시 리워드(R, 통화)는 단위가 다르다 — P에는 rewardPoints만 합산한다.
  const points = (profile?.rewardPoints ?? 0) + bonusPoints;
  const codes = referralCodesFor(profile);
  const handle = profile?.handleUrl || '@greyd';
  // 기획서 §5.4 파생값 — 완성도·신뢰 구성요소·보상 원장
  const completeness = profileCompleteness(profile);
  const trust = trustComponents(profile, seedings);
  const ledger = buildRewardLedger(seedings, campaigns, profile, {
    onboardingBonus: bonusPoints > 0,
  });
  const totals = ledgerTotals(ledger);
  const unreadNoti = countUnread(buildActivityNotifications(seedings, campaigns), notiReadAt);
  const openAppeal = () =>
    Linking.openURL(
      `mailto:hello@greyd.app?subject=${encodeURIComponent(Strings.MY_TRUST_APPEAL_SUBJECT)}&body=${encodeURIComponent(handle)}`,
    ).catch(() => {});
  const meta = [profile?.country, profile?.contentCategories?.[0], profile?.followerBand]
    .filter(Boolean)
    .join(' · ');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 헤더 행 */}
        <View style={styles.headerRow}>
          <Text style={TYPE.H_TITLE}>{Strings.MY_TITLE}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('GreydSettings')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Image
              source={require('../../Resources/img/icHeaderSetting24.png')}
              style={styles.gear}
            />
          </TouchableOpacity>
        </View>

        {/* 프로필 카드 */}
        {/* 2026-09-16 컨셉: 큰 수치 카드는 아래에서 앰버 빛이 번진다 */}
        <GlowCard style={styles.profileCard} contentStyle={styles.profileInner} glow={0.55}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {handle
                .replace(/[^a-zA-Z0-9가-힣]/g, '')
                .charAt(0)
                .toUpperCase() || 'G'}
            </Text>
          </View>
          <Text style={styles.handle}>{handle}</Text>
          {meta ? <Text style={styles.xs}>{meta}</Text> : null}
          <Text style={styles.gScore}>G{gScore}</Text>
          {/* Activity 탭과 동일 기준: G50→G60 구간을 0~100%로, 해제 후엔 해제 문구 */}
          <ProgressBar ratio={gProgressRatio(gScore)} style={styles.progress} />
          <Text style={styles.xs}>
            {gScore < CURATED_MIN_G ? Strings.MY_NEXT_UNLOCK(CURATED_MIN_G) : Strings.G_UNLOCKED}
          </Text>
          <View style={styles.statRow}>
            <Text style={styles.xs}>{Strings.MY_COMPLETED_COUNT(completedCount)}</Text>
            <Text style={[styles.xs, strikes === 0 && { color: COLORS.GREEN }]}>
              Strike {strikes}
            </Text>
            <Text style={styles.xs}>{Strings.MY_CONCURRENT_LIMIT(limit)}</Text>
          </View>
        </GlowCard>

        {/* 기획서 §5.4 프로필 완성도 — 어떤 정보가 추천·선정에 쓰이는지 설명 */}
        <Card>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>{Strings.MY_PROFILE_COMPLETE(completeness.percent)}</Text>
            {completeness.missing.length ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('CreatorOnboarding')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
              >
                <Text style={styles.link}>{Strings.MY_PROFILE_EDIT}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <ProgressBar ratio={completeness.percent / 100} style={styles.mt8} />
          <Text style={[styles.xs, styles.mt6]}>{Strings.MY_PROFILE_USED_FOR}</Text>
          {completeness.missing.length ? (
            <View style={styles.chipRow}>
              <Text style={styles.xs}>{Strings.MY_PROFILE_MISSING}</Text>
              {completeness.missing.map((k) => (
                <Badge key={k} tone="amber" text={Strings[`FIELD_${k}`] || k} />
              ))}
            </View>
          ) : null}
        </Card>

        {/* 기획서 §5.4 신뢰 구성요소 — 점수 대신 구성요소 + 이의제기 경로 */}
        <Card>
          <Text style={styles.rowTitle}>{Strings.MY_TRUST_TITLE}</Text>
          <Text style={[styles.xs, styles.mt4]}>{Strings.MY_TRUST_HOW}</Text>
          {[
            [Strings.MY_TRUST_COMPLETED, String(trust.completed)],
            [
              Strings.MY_TRUST_ONTIME,
              trust.onTimeRate == null ? Strings.MY_TRUST_ONTIME_NONE : `${trust.onTimeRate}%`,
            ],
            [Strings.MY_TRUST_STRIKES, String(trust.strikes)],
            [Strings.MY_TRUST_GRACE, String(trust.graceUsed)],
            [Strings.MY_TRUST_SURVEYS, String(trust.surveys)],
          ].map(([label, value]) => (
            <View key={label} style={[styles.row, styles.mt8]}>
              <Text style={styles.body}>{label}</Text>
              <Text style={styles.bodyStrong}>{value}</Text>
            </View>
          ))}
          {/* 본인확인 (2026-09-16, §5.4) — 미완료면 여기서 바로 시작한다 */}
          {[0].map(() => (
            <TouchableOpacity
              key="identity"
              style={[styles.row, styles.mt8]}
              disabled={trust.identityVerified}
              onPress={() => navigation.navigate('IdentityVerify', { onDone: reload })}
              accessibilityRole="button"
            >
              <Text style={styles.body}>{Strings.MY_TRUST_IDENTITY}</Text>
              <Text
                style={[styles.bodyStrong, !trust.identityVerified && { color: COLORS.AMBER_DEEP }]}
              >
                {trust.identityVerified
                  ? Strings.MY_TRUST_VERIFIED
                  : `${Strings.MY_TRUST_VERIFY_CTA} ›`}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={openAppeal}
            style={styles.appeal}
            accessibilityRole="link"
            accessibilityLabel={Strings.MY_TRUST_APPEAL}
          >
            <Text style={styles.link}>{Strings.MY_TRUST_APPEAL}</Text>
          </TouchableOpacity>
        </Card>

        {/* 포인트 카드 + 보상 상태 원장 (예정·검수 중·확정·지급·취소, 사유 포함) */}
        <Card>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>{Strings.MY_POINTS}</Text>
            <Text style={styles.pointValue}>{points.toLocaleString()}P</Text>
          </View>
          <Text style={[styles.xs, styles.mt4]}>{Strings.POINT_CASHOUT_NOTE}</Text>
          <View style={[styles.row, styles.mt8]}>
            <Text style={styles.rowTitle}>{Strings.MY_REWARD_HISTORY}</Text>
            <Text style={styles.xs}>
              {Strings.MY_REWARD_EXPECTED_SUM(totals.expected)} ·{' '}
              {Strings.MY_REWARD_CONFIRMED_SUM(totals.confirmed)}
            </Text>
          </View>
          {ledger.length === 0 ? (
            <Text style={[styles.xs, styles.mt6]}>{Strings.MY_REWARD_EMPTY}</Text>
          ) : (
            ledger.slice(0, LEDGER_PREVIEW).map((e) => (
              <View key={`${e.campaignId}:${e.state}`} style={styles.ledgerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.body} numberOfLines={1}>
                    {e.title || Strings.REWARD_REASON_onboarding}
                  </Text>
                  {e.title ? <Text style={styles.xs}>{rewardReasonLabel(e.reason)}</Text> : null}
                </View>
                <View style={styles.ledgerRight}>
                  <Badge tone={rewardTone(e.state)} text={rewardStateLabel(e.state)} />
                  <Text style={styles.ledgerPoints}>{rewardPointsText(e)}</Text>
                </View>
              </View>
            ))
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('RewardLedger')}
            style={styles.appeal}
            accessibilityRole="button"
            accessibilityLabel={Strings.REWARD_LEDGER_TITLE}
          >
            <Text style={styles.link}>{Strings.MY_REWARD_VIEW_ALL}</Text>
          </TouchableOpacity>
        </Card>

        {/* 알림(P2) — 캠페인 활동 알림이 알림함에 합쳐진다. 새 알림 수는 마지막 열람 시각 기준 */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Notification')}>
          <Card>
            <View style={styles.row}>
              <Text style={styles.rowTitle}>{Strings.MY_NOTI_ROW}</Text>
              <View style={styles.rowRight}>
                {unreadNoti > 0 ? (
                  <Badge tone="amber" text={Strings.MY_NOTI_UNREAD(unreadNoti)} />
                ) : (
                  <Text style={styles.xs}>{Strings.MY_NOTI_UNREAD(0)}</Text>
                )}
                <Text style={styles.chev}>›</Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        {/* 팔로워/팔로잉 — 새 마이 탭 개편에서 진입 경로가 유실됐던 것 복구 (2026-09-17 피드백) */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('FollowList')}>
          <Card>
            <View style={styles.row}>
              <Text style={styles.rowTitle}>
                {Strings.FOLLOWERS} · {Strings.FOLLOWING}
              </Text>
              <Text style={styles.chev}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>

        {/* 추천 코드 카드 — D6: 첫 루프 완주 시 3장 발급 (완주 전엔 잠금 힌트) */}
        {FEATURES.REFERRAL ? (
          <Card>
            <View style={styles.row}>
              <Text style={styles.rowTitle}>{Strings.MY_REFERRAL_CODES}</Text>
              <Text style={styles.xs}>
                {completedCount > 0 ? Strings.MY_REFERRAL_CODES_COUNT : '🔒'}
              </Text>
            </View>
            {completedCount > 0 ? (
              <View style={styles.codeRow}>
                {codes.map((code) => (
                  <TouchableOpacity
                    key={code}
                    style={styles.codeBox}
                    onPress={() =>
                      Share.share({
                        message: Strings.REFERRAL_SHARE_MESSAGE_NAMED(code, handle),
                      }).catch(() => {})
                    }
                  >
                    <Text style={styles.codeText}>{code}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <>
                {/* 시안: 잠겨 있어도 코드 칸을 빈 상태로 보여준다. 문장만 있으면
                  무엇이 열리는지 그려지지 않는다. */}
                <View style={styles.codeRow}>
                  {[0, 1, 2].map((i) => (
                    <View key={i} style={[styles.codeBox, styles.codeBoxLocked]}>
                      <Text style={styles.codeDot}>•</Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.xs, styles.mt4]}>{Strings.MY_REFERRAL_LOCKED_HINT}</Text>
              </>
            )}
          </Card>
        ) : null}

        {/* 내 레퍼런스 — 저장해 둔 리뷰 보관함. 여기서 바로 "참고해서 올리기"로 이어진다. */}
        {FEATURES.REFERENCE_ARCHIVE ? (
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('BookmarkList')}>
            <Card>
              <View style={styles.row}>
                <Text style={styles.rowTitle}>{Strings.REF_MY_REFERENCES}</Text>
                <Text style={styles.chev}>›</Text>
              </View>
              <Text style={[styles.xs, styles.mt4]}>{Strings.REF_MY_REFERENCES_DESC}</Text>
            </Card>
          </TouchableOpacity>
        ) : null}

        {/* 장바구니·주문 내역 (2026-09-16) — COMMERCE 플래그가 켜져야 노출 */}
        {FEATURES.COMMERCE ? (
          <>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Cart')}>
              <Card>
                <View style={styles.row}>
                  <Text style={styles.rowTitle}>{Strings.MY_CART_ROW}</Text>
                  <Text style={styles.chev}>›</Text>
                </View>
              </Card>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('OrderList')}>
              <Card>
                <View style={styles.row}>
                  <Text style={styles.rowTitle}>{Strings.MY_ORDERS_ROW}</Text>
                  <Text style={styles.chev}>›</Text>
                </View>
              </Card>
            </TouchableOpacity>
          </>
        ) : null}

        {/* 행 카드 3개 */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('AddressBook')}>
          <Card>
            <View style={styles.row}>
              <Text style={styles.rowTitle}>{Strings.ADDR_MANAGE_TITLE}</Text>
              <Text style={styles.chev}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('AboutGreyd')}>
          <Card>
            <View style={styles.row}>
              <Text style={styles.rowTitle}>{Strings.MY_ABOUT_ROW}</Text>
              <Text style={styles.xs}>ARBAIM INC. ›</Text>
            </View>
          </Card>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('GreydSettings')}>
          <Card>
            <View style={styles.row}>
              <Text style={styles.rowTitle}>{Strings.SET_TITLE}</Text>
              <Text style={styles.chev}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mt6: { marginTop: 6 },
  mt8: { marginTop: 8 },
  body: { ...TYPE.BODY },
  bodyStrong: { ...TYPE.BODY, fontFamily: FONT.Bold },
  link: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.AMBER_DEEP, paddingVertical: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 8 },
  appeal: { marginTop: 10, minHeight: 36, justifyContent: 'center' },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.LINE,
    marginTop: 8,
  },
  ledgerRight: { alignItems: 'flex-end', gap: 4 },
  ledgerPoints: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.INK },
  safe: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  scroll: { padding: 16, paddingBottom: 32, gap: 9 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gear: { width: 22, height: 22, tintColor: COLORS.INK },
  profileCard: { paddingVertical: 18 },
  profileInner: { alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.AMBER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  avatarText: { fontFamily: FONT.ExtraBold, fontSize: 17, color: COLORS.ON_AMBER },
  handle: { fontFamily: FONT.Bold, fontSize: 14, color: COLORS.INK, marginBottom: 2 },
  xs: { ...TYPE.XS },
  gScore: {
    fontFamily: T.LATIN.ExtraBold,
    fontSize: 30,
    color: COLORS.INK,
    marginTop: 10,
    marginBottom: 6,
  },
  progress: { alignSelf: 'stretch', marginBottom: 5 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.LINE,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.INK },
  pointValue: { fontFamily: T.LATIN.ExtraBold, fontSize: 14, color: COLORS.AMBER_DEEP },
  mt4: { marginTop: 4 },
  codeRow: { flexDirection: 'row', gap: 7, marginTop: 10 },
  codeBoxLocked: {
    borderColor: COLORS.LINE,
    borderStyle: 'solid',
    backgroundColor: COLORS.BG,
  },
  codeDot: { fontFamily: FONT.Bold, fontSize: 15, color: COLORS.GREY },
  codeBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.AMBER,
    borderStyle: 'dashed',
    borderRadius: 9,
    backgroundColor: COLORS.AMBER_FAINT,
    paddingVertical: 9,
    alignItems: 'center',
  },
  codeText: { fontFamily: FONT.ExtraBold, fontSize: 11.5, color: COLORS.AMBER_DEEP },
  chev: { fontFamily: FONT.Bold, fontSize: 16, color: COLORS.GREY },
});
