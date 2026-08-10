// 완주 보상 (시안 화면 16+17) — 포인트·브랜드 피드백·G-스코어·추천 코드 해제.
import React from 'react';
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
import { Card, Btn, Badge, ProgressBar, NoteBox } from '../../Components/UI';
import Strings from '../../Components/Strings';
import { referralCodesFor } from '../../api/referral';
import { CURATED_MIN_G } from '../TryScreen/points';

const { COLORS, FONT, TYPE } = T;

export default function MissionDone({ navigation, route }) {
  const { pointsGranted, basePoints, multiplier, gBefore, gAfter, brandName, handleUrl } =
    route.params || {};
  const codes = referralCodesFor({ handleUrl });

  const onShareCode = (code) => {
    Share.share({
      message: `한국 브랜드가 리뷰를 직접 읽는 패널이야. 내 이름으로 초대할게. 코드: ${code} (유효 7일)`,
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
        <Text style={styles.headerTitle}>완주 보상</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.points}>+{pointsGranted}P</Text>
          <Text style={styles.xs}>
            기본 {basePoints}P × 품질 보너스 {multiplier}
          </Text>
          <Text style={[styles.xs, styles.honesty]}>{Strings.APPLY_HONESTY_NOTE}</Text>
        </View>

        <Card>
          <View style={styles.rowStart}>
            <Badge tone="amber" text="브랜드 피드백" />
            <Text style={styles.xs}>{brandName}이 3일 전 열람 ✓</Text>
          </View>
          <View style={[styles.rowStart, styles.mt8]}>
            <Text style={styles.stars}>★★★★☆</Text>
            <Text style={styles.xs}>콘텐츠 품질 4/5</Text>
          </View>
          <Text style={styles.feedback}>"{Strings.BRAND_FEEDBACK_MOCK(brandName)}"</Text>
        </Card>

        <Card>
          <Text style={styles.gTitle}>
            G{gBefore} → G{gAfter}
          </Text>
          <ProgressBar ratio={gAfter / CURATED_MIN_G} style={styles.mt8} />
          <Text style={[styles.xs, styles.mt6]}>
            완주 +3 · 다음 해제: G{CURATED_MIN_G} (Curated 신청)
          </Text>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>추천 코드 3장이 열렸어요</Text>
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

        <NoteBox tone="amber" text="포인트 현금 인출·제품 구매 — 2026 Q4 오픈 예정" />

        <Btn title="확인" onPress={() => navigation.goBack()} />
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
  stars: { fontFamily: FONT.Bold, fontSize: 13, color: COLORS.AMBER },
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
