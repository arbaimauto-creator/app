// 미션 진행 상황 (2026-09-17) — 검수 중(REVIEWING)·FGI 제출 상태를 보여주는 세부 화면이
// 없어 활동 카드 배지로만 끝나던 것을 타임라인으로 보여준다. 데이터는 기기 시딩 기록.
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import T from '../../Components/Constants/DesignTokens';
import { Card, NoteBox } from '../../Components/UI';
import Strings from '../../Components/Strings';
import { getSeedings, SEEDING_STATUS } from '../../api/seedings';
import { isFgiEnabled } from '../../api/campaignMeta';
import { selectCampaigns } from '../../slices/campaign';

const { COLORS, FONT, TYPE } = T;

const fmt = (value) => {
  if (!value) {
    return null;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

export default function MissionStatusScreen({ navigation, route }) {
  const { campaignId } = route.params || {};
  const campaigns = useSelector(selectCampaigns);
  const campaign = campaigns.find((c) => c.id === campaignId);
  const [seeding, setSeeding] = useState(null);

  useEffect(() => {
    getSeedings()
      .then((all) => setSeeding(all[campaignId] || null))
      .catch(() => {});
  }, [campaignId]);

  const s = seeding || {};
  const fgi = campaign ? isFgiEnabled(campaign) : !!(s.fgiSurvey || s.fgiSelection);
  const done = s.status === SEEDING_STATUS.DONE;
  const steps = [
    { label: Strings.MS_STEP_APPLIED, at: s.appliedAt, done: !!s.appliedAt },
    { label: Strings.MS_STEP_APPROVED, at: s.approvedAt, done: !!s.approvedAt },
    { label: Strings.MS_STEP_SHIPPED, at: s.shippedAt, done: !!s.shippedAt },
    { label: Strings.MS_STEP_RECEIVED, at: s.receivedAt, done: !!s.receivedAt },
    s.firstImpression
      ? {
          label: Strings.MS_STEP_FI,
          at: s.firstImpression.submittedAt,
          done: true,
        }
      : null,
    fgi
      ? {
          label: Strings.MS_STEP_FGI,
          at: s.fgiSurvey?.submittedAt,
          done: !!s.fgiSurvey,
        }
      : null,
    fgi && s.fgiAttendedAt
      ? { label: Strings.MS_STEP_FGI_ATTEND, at: s.fgiAttendedAt, done: true }
      : null,
    { label: Strings.MS_STEP_UPLOADED, at: s.uploadedAt, done: !!s.uploadedAt },
    {
      label: Strings.MS_STEP_REVIEWING,
      at: null,
      done: done,
      current: s.status === SEEDING_STATUS.REVIEWING,
    },
    { label: Strings.MS_STEP_DONE, at: null, done: done && s.pointsGranted != null },
  ].filter(Boolean);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{Strings.MS_TITLE}</Text>
        </View>
        {campaign ? <Text style={styles.campaign}>{campaign.title}</Text> : null}

        <Card style={styles.card}>
          {steps.map((step, i) => (
            <View key={step.label} style={[styles.step, i > 0 && styles.stepGap]}>
              <View
                style={[
                  styles.dot,
                  step.done && styles.dotDone,
                  step.current && styles.dotCurrent,
                ]}
              />
              <View style={styles.stepBody}>
                <Text
                  style={[
                    styles.stepLabel,
                    step.done && styles.stepLabelDone,
                    step.current && styles.stepLabelCurrent,
                  ]}
                >
                  {step.label}
                </Text>
                <Text style={styles.stepDate}>
                  {step.current ? Strings.MS_IN_PROGRESS : fmt(step.at) || (step.done ? '' : Strings.MS_PENDING)}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {s.status === SEEDING_STATUS.REVIEWING ? (
          <NoteBox tone="amber" text={Strings.MS_REVIEWING_NOTE} style={styles.note} />
        ) : null}
        {fgi && s.fgiSurvey ? (
          <NoteBox tone="curated" text={Strings.MS_FGI_RESULT_NOTE} style={styles.note} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  scroll: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { fontFamily: FONT.Bold, fontSize: 26, color: COLORS.INK, lineHeight: 28 },
  headerTitle: { fontFamily: FONT.ExtraBold, fontSize: 18, color: COLORS.INK },
  campaign: { ...TYPE.XS, marginTop: 4 },
  card: { marginTop: 12 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepGap: { marginTop: 12 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 3,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    backgroundColor: COLORS.SURFACE,
  },
  dotDone: { backgroundColor: COLORS.AMBER, borderColor: COLORS.AMBER },
  dotCurrent: { borderColor: COLORS.AMBER_DEEP, backgroundColor: COLORS.AMBER_SOFT },
  stepBody: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  stepLabel: { fontFamily: FONT.Regular, fontSize: 12.5, color: COLORS.GREY },
  stepLabelDone: { fontFamily: FONT.Bold, color: COLORS.INK },
  stepLabelCurrent: { fontFamily: FONT.Bold, color: COLORS.AMBER_DEEP },
  stepDate: { ...TYPE.XS },
  note: { marginTop: 12 },
});
