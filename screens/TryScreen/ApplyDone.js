// 신청 완료 (시안 화면 11) — 신청 직후 타임라인 안내.
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import T from '../../Components/Constants/DesignTokens';
import { Card, Btn, NoteBox } from '../../Components/UI';
import Strings from '../../Components/Strings';

const { COLORS, FONT, TYPE } = T;

export default function ApplyDone({ navigation, route }) {
  const { campaignId, campaignTitle, applyMode, usedCount, limit, autoConfirmed } =
    route.params || {};

  const openActivity = () => {
    navigation.navigate('MainBottom', {
      screen: 'Activity',
      params: {
        screen: 'ActivityHome',
        params: autoConfirmed ? { openAddressFor: campaignId } : undefined,
      },
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
            { label: Strings.APPLY_STEP_POST(14), done: false },
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
