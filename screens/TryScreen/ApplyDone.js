// 신청 완료 (시안 화면 11) — 신청 직후 타임라인 안내.
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { prefSetSafe } from '../../api/prefSafe';
import T from '../../Components/Constants/DesignTokens';
import { Card, Btn, NoteBox } from '../../Components/UI';
import Strings from '../../Components/Strings';

const { COLORS, FONT, TYPE } = T;

export default function ApplyDone({ navigation, route }) {
  const { campaignId, campaignTitle, applyMode, usedCount, limit, autoConfirmed, uploadDays } =
    route.params || {};

  const openActivity = async () => {
    // 중첩 params({screen, params}) 전달은 커스텀 탭 내비게이터와 조합 시 무한
    // 재디스패치를 일으킨다(ActivityScreen 참조) — Preference 핸드오프로 대체.
    // 저장소가 무응답이어도 CTA가 죽은 버튼이 되면 안 된다 — 타임아웃 레이스 + 항상 이동
    if (autoConfirmed) {
      try {
        await prefSetSafe('pendingAddressFor', campaignId);
      } catch (e) {
        // 핸드오프 실패 시 Activity 카드의 주소 CTA로 이어진다
      }
    }
    navigation.navigate('MainBottom', { screen: 'Activity' });
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
        <Text style={styles.headerTitle}>{Strings.APPLYDONE_TITLE}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>🙌</Text>
          <Text style={styles.title}>
            {autoConfirmed ? Strings.APPLYDONE_HERO_CONFIRMED : Strings.APPLYDONE_HERO}
          </Text>
          <Text style={styles.sub}>
            {campaignTitle} ·{' '}
            {Strings.APPLYDONE_TRACK(applyMode === 'curated' ? 'Curated' : 'Open')}
          </Text>
        </View>

        {/* 시안 09: 진행 단계를 세로 타임라인으로. 지금 어디까지 왔고 다음에 무엇이
            일어나는지를 점·선으로 보여준다. 첫 단계만 완료(앰버), 나머지는 예정. */}
        <Card>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>{Strings.APPLYDONE_PROGRESS}</Text>
            <Text style={styles.progressValue}>
              {usedCount} / {limit}
            </Text>
          </View>
          <View style={styles.divider} />
          {[
            { label: Strings.APPLY_STEP_SENT, done: true },
            {
              label: autoConfirmed
                ? Strings.APPLYDONE_AUTO_CONFIRM_NOTE
                : Strings.APPLY_STEP_REVIEW,
              done: autoConfirmed,
            },
            { label: Strings.APPLY_STEP_SHIP, done: false },
            { label: Strings.APPLY_STEP_POST(uploadDays || 14), done: false },
          ].map((step, i, arr) => (
            <View key={step.label} style={styles.stepRow}>
              <View style={styles.stepRail}>
                <View style={[styles.stepDot, step.done && styles.stepDotDone]} />
                {i < arr.length - 1 ? <View style={styles.stepLine} /> : null}
              </View>
              <Text style={[styles.stepLabel, step.done && styles.stepLabelDone]}>
                {step.label}
              </Text>
            </View>
          ))}
        </Card>

        <Text style={styles.etaNote}>{Strings.REWARD_ETA_NOTE}</Text>

        <NoteBox tone="amber">
          <Text style={styles.noteText}>
            {Strings.APPLYDONE_LIMIT_PRE}
            <Text style={styles.noteBold}>{Strings.APPLYDONE_LIMIT_COUNT(limit)}</Text>
            {Strings.APPLYDONE_LIMIT_MID}
            <Text style={styles.noteBold}>{Strings.APPLYDONE_LIMIT_COUNT(usedCount)}</Text>
            {Strings.APPLYDONE_LIMIT_POST}
          </Text>
        </NoteBox>

        <Btn
          title={autoConfirmed ? Strings.APPLYDONE_ADDRESS_CTA : Strings.APPLYDONE_ACTIVITY_CTA}
          onPress={openActivity}
        />
        <Btn
          variant="ghost"
          title={Strings.APPLYDONE_MORE_CTA}
          onPress={() => navigation.goBack()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  etaNote: { ...TYPE.XS, textAlign: 'center', marginVertical: 4 },
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
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: {
    fontFamily: FONT.Bold,
    fontSize: 11,
    letterSpacing: 0.6,
    color: COLORS.GREY,
    textTransform: 'uppercase',
  },
  progressValue: { fontFamily: FONT.ExtraBold, fontSize: 15, color: COLORS.INK },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepRail: { width: 18, alignItems: 'center' },
  stepDot: {
    width: 9,
    height: 9,
    borderRadius: 9,
    marginTop: 5,
    backgroundColor: COLORS.TRACK,
  },
  stepDotDone: { backgroundColor: COLORS.AMBER },
  // 점과 점을 잇는 세로선 — 마지막 단계에는 붙이지 않는다
  stepLine: { width: 1.5, flex: 1, minHeight: 18, backgroundColor: COLORS.LINE, marginTop: 2 },
  stepLabel: {
    flex: 1,
    marginLeft: 9,
    paddingBottom: 12,
    fontFamily: FONT.Regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.GREY,
  },
  stepLabelDone: { fontFamily: FONT.Bold, color: COLORS.INK },
  hero: { alignItems: 'center', paddingVertical: 18, gap: 6 },
  emoji: { fontSize: 34 },
  title: { fontFamily: FONT.Black, fontSize: 19, color: COLORS.INK },
  sub: { fontFamily: FONT.Regular, fontSize: 13, color: COLORS.GREY, textAlign: 'center' },
  divider: { height: 1, backgroundColor: COLORS.LINE, marginVertical: 10 },
  xs: { ...TYPE.XS, flex: 1 },
  noteText: { fontFamily: FONT.Regular, fontSize: 11, lineHeight: 16.5, color: COLORS.AMBER_DEEP },
  noteBold: { fontFamily: FONT.Bold },
});
