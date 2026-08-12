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
import { useSelector } from 'react-redux';
import Preference from 'react-native-default-preference';
import T from '../../Components/Constants/DesignTokens';
import FEATURES from '../../Components/Constants/Features';
import { Card, ProgressBar } from '../../Components/UI';
import Strings from '../../Components/Strings';
import { getCreatorProfile } from '../../api/creators';
import { referralCodesFor } from '../../api/referral';
import { concurrentLimit, CURATED_MIN_G } from '../TryScreen/points';

const { COLORS, FONT, TYPE } = T;

export default function MyScreen({ navigation }) {
  const totalReward = useSelector((s) => s.user.totalReward);
  const [profile, setProfile] = useState(null);
  const [bonusPoints, setBonusPoints] = useState(0);

  const reload = useCallback(() => {
    getCreatorProfile().then(setProfile);
    // 온보딩 완료 보상 +50P (v2 §3-③) — mock: 로컬 합산
    Preference.get('onboardingBonusGranted').then((v) => setBonusPoints(v === 'true' ? 50 : 0));
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
  const points = (totalReward ?? 0) + (profile?.rewardPoints ?? 0) + bonusPoints;
  const codes = referralCodesFor(profile);
  const handle = profile?.handleUrl || '@greyd';
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
        <Card style={styles.profileCard}>
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
          <ProgressBar ratio={gScore / CURATED_MIN_G} style={styles.progress} />
          <Text style={styles.xs}>{Strings.MY_NEXT_UNLOCK(CURATED_MIN_G)}</Text>
          <View style={styles.statRow}>
            <Text style={styles.xs}>{Strings.MY_COMPLETED_COUNT(completedCount)}</Text>
            <Text style={[styles.xs, strikes === 0 && { color: COLORS.GREEN }]}>
              Strike {strikes}
            </Text>
            <Text style={styles.xs}>{Strings.MY_CONCURRENT_LIMIT(limit)}</Text>
          </View>
        </Card>

        {/* 포인트 카드 */}
        <Card>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>{Strings.MY_POINTS}</Text>
            <Text style={styles.pointValue}>{points.toLocaleString()}P</Text>
          </View>
          <Text style={[styles.xs, styles.mt4]}>{Strings.POINT_CASHOUT_NOTE}</Text>
        </Card>

        {/* 추천 코드 카드 — D6: 첫 루프 완주 시 3장 발급 (완주 전엔 잠금 힌트) */}
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
            <Text style={[styles.xs, styles.mt4]}>{Strings.MY_REFERRAL_LOCKED_HINT}</Text>
          )}
        </Card>

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
  safe: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  scroll: { padding: 16, paddingBottom: 32, gap: 9 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gear: { width: 22, height: 22, tintColor: COLORS.INK },
  profileCard: { alignItems: 'center', paddingVertical: 18 },
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
    fontFamily: FONT.ExtraBold,
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
  rowTitle: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.INK },
  pointValue: { fontFamily: FONT.ExtraBold, fontSize: 14, color: COLORS.AMBER_DEEP },
  mt4: { marginTop: 4 },
  codeRow: { flexDirection: 'row', gap: 7, marginTop: 10 },
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
