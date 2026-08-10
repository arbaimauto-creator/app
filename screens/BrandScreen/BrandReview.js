import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import T from '../../Components/Constants/DesignTokens';
import { Card, Btn, ProgressBar } from '../../Components/UI';
import Strings from '../../Components/Strings';
import { fetchCampaigns, selectCampaigns } from '../../slices/campaign';
import { fetchCampaignReviews } from '../../api/reviews';
import { getEvaluations, saveEvaluation, TRIAGE, SKIP_REASONS } from '../../api/evaluations';

const { COLORS, FONT } = T;

// v2 §5-2: 1차 트리아지(👍👌👎) → 👍 후보에만 정량 4항목 + 재협업 Y/N + 코멘트.
const RUBRIC = [
  { key: 'authenticity', label: () => Strings.RUBRIC_AUTHENTICITY },
  { key: 'delivery', label: () => Strings.RUBRIC_DELIVERY },
  { key: 'quality', label: () => Strings.RUBRIC_QUALITY },
  { key: 'marketSignal', label: () => Strings.RUBRIC_MARKET_SIGNAL },
];

const FLAGS = { US: '🇺🇸', JP: '🇯🇵', KR: '🇰🇷', ID: '🇮🇩', TH: '🇹🇭', VN: '🇻🇳' };

// 5점 dots — 기존 Stars를 dots로 교체 (저장 로직은 동일)
function Dots({ value, onChange }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} style={{ padding: 4 }}>
          <View style={[styles.dot, n <= (value || 0) && styles.dotOn]} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function BrandReview({ navigation }) {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectCampaigns);
  const [campaignId, setCampaignId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [evaluations, setEvaluations] = useState({});
  const [expanded, setExpanded] = useState(null); // reviewId — 루브릭 열림
  const [draft, setDraft] = useState({}); // { [reviewId]: {scores, rebook, comment} }
  // 시안 6b: 세션 트리아지 카운트 + 요약 뷰 이후 '남은 후보 마저 평가' 모드
  const [session, setSession] = useState({ pick: 0, ok: 0, skip: 0 });
  const [rubricQueue, setRubricQueue] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (campaigns.length === 0) {
        dispatch(fetchCampaigns());
      }
      const id = campaignId || campaigns[0]?.id;
      if (id) {
        setCampaignId(id);
        fetchCampaignReviews(id).then(setReviews);
        getEvaluations().then(setEvaluations);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaigns, campaignId]),
  );

  const evaluatedCount = reviews.filter((r) => evaluations[r.id]?.triage).length;
  const allTriaged = reviews.length > 0 && evaluatedCount === reviews.length;
  const pendingPicks = reviews.filter(
    (r) => evaluations[r.id]?.triage === TRIAGE.PICK && !evaluations[r.id]?.scores,
  );
  const scoredCount = reviews.filter((r) => evaluations[r.id]?.scores).length;
  const sessionTotal = session.pick + session.ok + session.skip;
  const showSummary = allTriaged && !(rubricQueue && pendingPicks.length > 0);

  const bumpSession = (triage) => setSession((prev) => ({ ...prev, [triage]: prev[triage] + 1 }));

  const onTriage = async (reviewId, triage) => {
    if (triage === TRIAGE.SKIP) {
      Alert.alert(
        Strings.SKIP_REASON_TITLE,
        '',
        SKIP_REASONS.map((reason) => ({
          text: Strings[`SKIP_${reason.toUpperCase()}`],
          onPress: async () => {
            const all = await saveEvaluation(reviewId, { triage, skipReason: reason });
            setEvaluations({ ...all });
            bumpSession(triage);
          },
        })),
        { cancelable: true },
      );
      return;
    }
    const all = await saveEvaluation(reviewId, { triage });
    setEvaluations({ ...all });
    bumpSession(triage);
    if (triage === TRIAGE.PICK) {
      setExpanded(reviewId);
    }
  };

  const onSaveRubric = async (reviewId) => {
    const d = draft[reviewId] || {};
    const scores = d.scores || {};
    if (RUBRIC.some((r) => !scores[r.key])) {
      Alert.alert(Strings.RUBRIC_INCOMPLETE);
      return;
    }
    if (d.rebook == null) {
      Alert.alert(Strings.REBOOK_REQUIRED);
      return;
    }
    const all = await saveEvaluation(reviewId, {
      scores,
      rebook: d.rebook,
      comment: (d.comment || '').trim(),
    });
    setEvaluations({ ...all });
    // '저장하고 다음 후보' — 다음 미채점 후보를 자동으로 연다
    const next = reviews.find(
      (r) => r.id !== reviewId && all[r.id]?.triage === TRIAGE.PICK && !all[r.id]?.scores,
    );
    setExpanded(next ? next.id : null);
  };

  const setScore = (reviewId, key, value) => {
    setDraft((prev) => ({
      ...prev,
      [reviewId]: {
        ...(prev[reviewId] || {}),
        scores: { ...((prev[reviewId] || {}).scores || {}), [key]: value },
      },
    }));
  };

  const renderReview = ({ item }) => {
    const ev = evaluations[item.id];
    const isPick = ev?.triage === TRIAGE.PICK;
    const isOpen = expanded === item.id;
    const d = draft[item.id] || {};

    return (
      <Card style={styles.card}>
        {/* 썸네일 */}
        <FastImage source={{ uri: item.thumbnailUrl }} style={styles.thumb} />

        <View style={styles.cardBody}>
          <View style={styles.handleRow}>
            <Text style={styles.reviewer}>
              @{item.reviewer} · {FLAGS[item.country] || item.country}
            </Text>
            <Text style={styles.formatTag}>{item.format}</Text>
          </View>
          <Text style={styles.meta}>
            {item.country} · {item.views7d?.toLocaleString()} views
          </Text>
          {ev?.scores ? (
            <Text style={styles.doneTag}>
              {Strings.RUBRIC_SAVED} · {ev.rebook ? Strings.REBOOK_YES : Strings.REBOOK_NO}
            </Text>
          ) : null}

          {/* 1차 트리아지 */}
          <View style={styles.triageRow}>
            {[
              {
                t: TRIAGE.PICK,
                icon: '👍',
                label: Strings.TRIAGE_PICK,
                on: styles.triagePickOn,
                onText: styles.triagePickTextOn,
              },
              {
                t: TRIAGE.OK,
                icon: '👌',
                label: Strings.TRIAGE_OK,
                on: styles.triageOkOn,
                onText: styles.triageOkTextOn,
              },
              {
                t: TRIAGE.SKIP,
                icon: '👎',
                label: Strings.TRIAGE_SKIP,
                on: styles.triageSkipOn,
                onText: styles.triageSkipTextOn,
              },
            ].map(({ t, icon, label, on, onText }) => (
              <TouchableOpacity
                key={t}
                style={[styles.triageBtn, ev?.triage === t && on]}
                onPress={() => onTriage(item.id, t)}
              >
                <Text style={styles.triageIcon}>{icon}</Text>
                <Text style={[styles.triageLabel, ev?.triage === t && onText]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.triageHint}>{Strings.BRAND_TRIAGE_HINT}</Text>

          {/* 2차 루브릭 — 👍 후보에만 */}
          {isPick && (isOpen || !ev?.scores) ? (
            <View style={styles.rubricBox}>
              {RUBRIC.map((r) => (
                <View key={r.key}>
                  <View style={styles.rubricRow}>
                    <Text style={styles.rubricLabel}>{r.label()}</Text>
                    <Dots
                      value={(d.scores || {})[r.key] ?? ev?.scores?.[r.key]}
                      onChange={(v) => setScore(item.id, r.key, v)}
                    />
                  </View>
                  {r.key === 'quality' ? (
                    <Text style={styles.bonusHint}>{Strings.BRAND_BONUS_HINT}</Text>
                  ) : null}
                </View>
              ))}
              <View style={[styles.rubricRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.rubricLabel}>{Strings.REBOOK_LABEL}</Text>
                <View style={{ flexDirection: 'row' }}>
                  {[true, false].map((v) => (
                    <TouchableOpacity
                      key={String(v)}
                      style={[
                        styles.rebookBtn,
                        (d.rebook ?? ev?.rebook) === v && styles.rebookBtnOn,
                      ]}
                      onPress={() =>
                        setDraft((prev) => ({
                          ...prev,
                          [item.id]: { ...(prev[item.id] || {}), rebook: v },
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.rebookText,
                          (d.rebook ?? ev?.rebook) === v && styles.rebookTextOn,
                        ]}
                      >
                        {v ? 'Y' : 'N'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TextInput
                style={styles.commentInput}
                placeholder={Strings.RUBRIC_COMMENT_PLACEHOLDER}
                placeholderTextColor={COLORS.GREY}
                value={d.comment ?? ev?.comment ?? ''}
                onChangeText={(v) =>
                  setDraft((prev) => ({
                    ...prev,
                    [item.id]: { ...(prev[item.id] || {}), comment: v },
                  }))
                }
              />
              <Btn
                title={Strings.BRAND_SAVE_NEXT}
                onPress={() => onSaveRubric(item.id)}
                style={{ marginTop: 10 }}
              />
            </View>
          ) : null}
        </View>
      </Card>
    );
  };

  // 시안 6b: 세션 요약 뷰 — 트리아지 큐 소진 시
  if (showSummary) {
    const doneCount = sessionTotal > 0 ? sessionTotal : evaluatedCount;
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.summaryWrap}>
          <Text style={styles.summaryEmoji}>✅</Text>
          <Text style={styles.summaryTitle}>{Strings.BRAND_SESSION_DONE(doneCount)}</Text>
          <Text style={styles.summaryCounts}>
            {Strings.BRAND_SESSION_COUNTS(session.pick, session.ok, session.skip)}
          </Text>

          <Card style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>{Strings.BRAND_RUBRIC_PROGRESS}</Text>
            <Text style={styles.summaryCardMeta}>
              {Strings.BRAND_RUBRIC_COUNT(scoredCount, reviews.length)}
            </Text>
            <ProgressBar
              ratio={reviews.length ? scoredCount / reviews.length : 0}
              style={{ marginTop: 8 }}
            />
            <Text style={styles.summaryCardHint}>{Strings.RUBRIC_20_ENOUGH}</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>{Strings.BRAND_FEEDBACK_FORWARD}</Text>
            <Text style={styles.summaryCardHint}>{Strings.BRAND_SLA_NOTE}</Text>
          </Card>

          {pendingPicks.length > 0 ? (
            <Btn
              title={Strings.BRAND_RUBRIC_REMAINING(pendingPicks.length)}
              onPress={() => setRubricQueue(true)}
              style={{ alignSelf: 'stretch', marginTop: 18 }}
            />
          ) : null}
          <Btn
            variant="ghost"
            title={Strings.BRAND_TO_DASHBOARD}
            onPress={() => navigation.navigate('BrandDashboard')}
            style={{ alignSelf: 'stretch', marginTop: 8 }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const listData = rubricQueue ? pendingPicks : reviews;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>{Strings.BRAND_REVIEW_TITLE}</Text>
        <Text style={styles.headerCount}>
          {evaluatedCount} / {reviews.length}
        </Text>
      </View>
      <ProgressBar
        ratio={reviews.length ? evaluatedCount / reviews.length : 0}
        style={{ marginHorizontal: 16, marginTop: 8 }}
      />
      <Text style={styles.progressHint}>{Strings.RUBRIC_20_ENOUGH}</Text>
      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        renderItem={renderReview}
        ListEmptyComponent={<Text style={styles.empty}>{Strings.NO_CAMPAIGNS}</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: { fontFamily: FONT.ExtraBold, fontSize: 17, color: COLORS.INK, letterSpacing: -0.2 },
  headerCount: {
    fontFamily: FONT.Bold,
    fontSize: 10.5,
    color: COLORS.GREY,
    fontVariant: ['tabular-nums'],
  },
  progressHint: {
    paddingHorizontal: 16,
    marginTop: 5,
    fontFamily: FONT.Regular,
    fontSize: 10.5,
    color: COLORS.GREY,
  },

  card: { paddingVertical: 0, paddingHorizontal: 0, marginBottom: 12, overflow: 'hidden' },
  thumb: {
    width: '100%',
    height: 230,
    borderTopLeftRadius: T.RADIUS.CARD,
    borderTopRightRadius: T.RADIUS.CARD,
    backgroundColor: COLORS.LINE,
  },
  cardBody: { paddingVertical: 11, paddingHorizontal: 13 },
  handleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewer: { fontFamily: FONT.Bold, fontSize: 13.5, color: COLORS.INK },
  formatTag: { fontFamily: FONT.Regular, fontSize: 10.5, color: COLORS.GREY },
  meta: { fontFamily: FONT.Regular, fontSize: 10.5, color: COLORS.GREY, marginTop: 2 },
  doneTag: { fontFamily: FONT.Bold, fontSize: 11, color: COLORS.GREEN, marginTop: 3 },

  triageRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  triageBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    borderRadius: 11,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
  },
  triagePickOn: { borderColor: COLORS.GREEN, backgroundColor: COLORS.GREEN_SOFT },
  triagePickTextOn: { color: COLORS.GREEN },
  triageOkOn: { borderColor: COLORS.AMBER, backgroundColor: COLORS.AMBER_SOFT },
  triageOkTextOn: { color: COLORS.AMBER_DEEP },
  triageSkipOn: { borderColor: COLORS.RED, backgroundColor: COLORS.RED_SOFT },
  triageSkipTextOn: { color: COLORS.RED },
  triageIcon: { fontSize: 19 },
  triageLabel: { fontFamily: FONT.Bold, fontSize: 11, color: COLORS.GREY, marginTop: 2 },
  triageHint: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: FONT.Regular,
    fontSize: 10.5,
    color: COLORS.GREY,
  },

  rubricBox: { marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.LINE, paddingTop: 10 },
  rubricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.LINE,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 11,
    marginBottom: 6,
  },
  rubricLabel: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.INK },
  dot: { width: 15, height: 15, borderRadius: 8, backgroundColor: COLORS.TRACK },
  dotOn: { backgroundColor: COLORS.AMBER },
  bonusHint: {
    fontFamily: FONT.Regular,
    fontSize: 10.5,
    color: COLORS.AMBER_DEEP,
    marginTop: -2,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  rebookBtn: {
    width: 96,
    height: 32,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    backgroundColor: COLORS.SURFACE,
  },
  rebookBtnOn: { backgroundColor: COLORS.DARK, borderColor: COLORS.DARK },
  rebookText: { fontFamily: FONT.ExtraBold, fontSize: 13, color: COLORS.GREY },
  rebookTextOn: { color: '#FFFFFF' },
  commentInput: {
    borderWidth: 1,
    borderColor: COLORS.LINE,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontFamily: FONT.Regular,
    fontSize: 13,
    marginTop: 4,
    color: COLORS.INK,
  },
  empty: { textAlign: 'center', marginTop: 40, fontFamily: FONT.Regular, color: COLORS.GREY },

  // 세션 요약 (시안 6b)
  summaryWrap: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  summaryEmoji: { fontSize: 34 },
  summaryTitle: {
    fontFamily: FONT.Black,
    fontSize: 20,
    color: COLORS.INK,
    marginTop: 12,
    letterSpacing: -0.2,
  },
  summaryCounts: { fontFamily: FONT.Regular, fontSize: 11.5, color: COLORS.GREY, marginTop: 6 },
  summaryCard: { alignSelf: 'stretch', marginTop: 12 },
  summaryCardLabel: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.INK },
  summaryCardMeta: {
    fontFamily: FONT.Regular,
    fontSize: 10.5,
    color: COLORS.GREY,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  summaryCardHint: { fontFamily: FONT.Regular, fontSize: 10.5, color: COLORS.GREY, marginTop: 7 },
});
