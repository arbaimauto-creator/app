// 완주 보상 (시안 화면 16+17) — 포인트·브랜드 피드백·G-스코어·추천 코드 해제.
import React, { useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import T from '../../Components/Constants/DesignTokens';
import { Card, Btn, Badge, ProgressBar, NoteBox, EmptyIcon } from '../../Components/UI';
import Strings from '../../Components/Strings';
import FEATURES from '../../Components/Constants/Features';
import { referralCodesFor } from '../../api/referral';
import { CURATED_MIN_G } from '../TryScreen/points';
import { logEvent } from '../../api/common/analytics';

const { COLORS, FONT, TYPE } = T;

export default function MissionDone({ navigation, route }) {
  const { pointsGranted, basePoints, multiplier, gBefore, gAfter, brandName, handleUrl } =
    route.params || {};
  const codes = referralCodesFor({ handleUrl });

  useEffect(() => {
    // 이벤트 맵: 루프 완료 — 북극성 분자
    logEvent('done_view', {
      points: pointsGranted ?? 0,
      quality_bonus: (multiplier ?? 1) > 1,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onShareCode = (code) => {
    logEvent('referral_share_open', {});
    Share.share({
      message: Strings.DONE_SHARE_MESSAGE(code),
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{Strings.DONE_TITLE}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <EmptyIcon name="party-popper" size={30} />
          {pointsGranted != null ? (
            <>
              <Text style={styles.points}>+{pointsGranted}P</Text>
              <Text style={styles.xs}>{Strings.DONE_POINTS_FORMULA(basePoints, multiplier)}</Text>
            </>
          ) : (
            <>
              <Text style={styles.xs}>{Strings.DONE_POINTS_PENDING}</Text>
              <Text style={styles.xs}>{Strings.REWARD_ETA_NOTE}</Text>
            </>
          )}
          <Text style={[styles.xs, styles.honesty]}>{Strings.APPLY_HONESTY_NOTE}</Text>
        </View>

        <Card>
          <View style={styles.rowStart}>
            <Badge tone="amber" text={Strings.DONE_BRAND_FEEDBACK} />
            <Text style={styles.xs}>{Strings.DONE_BRAND_VIEWED(brandName)}</Text>
          </View>
          {/* 브랜드 평가는 서버 연동 전 — 가짜 별점·문구 대신 대기 안내 */}
          <Text style={styles.feedback}>{Strings.DONE_BRAND_PENDING}</Text>
        </Card>

        <Card>
          <Text style={styles.gTitle}>
            G{gBefore} → G{gAfter}
          </Text>
          <ProgressBar ratio={gAfter / CURATED_MIN_G} style={styles.mt8} />
          <Text style={[styles.xs, styles.mt6]}>{Strings.DONE_G_PROGRESS(CURATED_MIN_G)}</Text>
        </Card>

        {/* 추천 코드 3장 — REFERRAL 플래그로 노출 제어 (기능 보존, 플래그 한 줄로 복원) */}
        {FEATURES.REFERRAL ? (
          <Card>
            <Text style={styles.cardTitle}>{Strings.DONE_CODES_UNLOCKED}</Text>
            <Text style={[styles.xs, styles.mt4]}>Invited by {handleUrl}</Text>
            <View style={styles.codeRow}>
              {codes.map((code) => (
                <TouchableOpacity
                  key={code}
                  style={styles.codeBox}
                  activeOpacity={0.7}
                  onPress={() => onShareCode(code)}
                >
                  <Text style={styles.codeText}>{code}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        ) : null}

        <NoteBox tone="amber" text={Strings.DONE_CASHOUT_NOTE} />

        <Btn title={Strings.OK} onPress={() => navigation.goBack()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  back: { fontFamily: FONT.Bold, fontSize: 26, color: COLORS.INK, lineHeight: 28 },
  headerTitle: { fontFamily: FONT.ExtraBold, fontSize: 18, color: COLORS.INK },
  scroll: { padding: 16, paddingTop: 4, paddingBottom: 32, gap: 9 },
  hero: { alignItems: 'center', paddingVertical: 16, gap: 5 },
  emoji: { fontSize: 38 },
  points: { fontFamily: FONT.Black, fontSize: 24, color: COLORS.INK },
  xs: { ...TYPE.XS },
  honesty: { color: COLORS.AMBER_DEEP, textAlign: 'center' },
  rowStart: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mt8: { marginTop: 8 },
  mt6: { marginTop: 6 },
  mt4: { marginTop: 4 },
  feedback: {
    fontFamily: FONT.Regular,
    fontSize: 13,
    color: COLORS.INK,
    lineHeight: 19,
    marginTop: 9,
  },
  gTitle: { fontFamily: FONT.Bold, fontSize: 13, color: COLORS.INK },
  cardTitle: { ...TYPE.CARD_TITLE },
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
});
