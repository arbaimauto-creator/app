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
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import { fetchCampaigns, selectCampaigns } from '../../slices/campaign';
import { fetchCampaignReviews } from '../../api/reviews';
import { getEvaluations, saveEvaluation, TRIAGE, SKIP_REASONS } from '../../api/evaluations';

// v2 §5-2: 1차 트리아지(👍👌👎) → 👍 후보에만 정량 4항목 + 재협업 Y/N + 코멘트.
const RUBRIC = [
  { key: 'authenticity', label: () => Strings.RUBRIC_AUTHENTICITY },
  { key: 'delivery', label: () => Strings.RUBRIC_DELIVERY },
  { key: 'quality', label: () => Strings.RUBRIC_QUALITY },
  { key: 'marketSignal', label: () => Strings.RUBRIC_MARKET_SIGNAL },
];

function Stars({ value, onChange }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} style={{ padding: 3 }}>
          <Text style={[styles.star, n <= (value || 0) && styles.starOn]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function BrandReview() {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectCampaigns);
  const [campaignId, setCampaignId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [evaluations, setEvaluations] = useState({});
  const [expanded, setExpanded] = useState(null); // reviewId — 루브릭 열림
  const [draft, setDraft] = useState({}); // { [reviewId]: {scores, rebook, comment} }

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
          },
        })),
        { cancelable: true },
      );
      return;
    }
    const all = await saveEvaluation(reviewId, { triage });
    setEvaluations({ ...all });
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
    setExpanded(null);
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
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <FastImage source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.reviewer}>@{item.reviewer}</Text>
            <Text style={styles.meta}>
              {item.country} · {item.format} · {item.views7d?.toLocaleString()} views
            </Text>
            {ev?.scores ? (
              <Text style={styles.doneTag}>
                {Strings.RUBRIC_SAVED} · {ev.rebook ? Strings.REBOOK_YES : Strings.REBOOK_NO}
              </Text>
            ) : null}
          </View>
        </View>

        {/* 1차 트리아지 */}
        <View style={styles.triageRow}>
          {[
            { t: TRIAGE.PICK, icon: '👍', label: Strings.TRIAGE_PICK },
            { t: TRIAGE.OK, icon: '👌', label: Strings.TRIAGE_OK },
            { t: TRIAGE.SKIP, icon: '👎', label: Strings.TRIAGE_SKIP },
          ].map(({ t, icon, label }) => (
            <TouchableOpacity
              key={t}
              style={[styles.triageBtn, ev?.triage === t && styles.triageBtnOn]}
              onPress={() => onTriage(item.id, t)}
            >
              <Text style={styles.triageIcon}>{icon}</Text>
              <Text style={styles.triageLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 2차 루브릭 — 👍 후보에만 */}
        {isPick && (isOpen || !ev?.scores) ? (
          <View style={styles.rubricBox}>
            {RUBRIC.map((r) => (
              <View key={r.key} style={styles.rubricRow}>
                <Text style={styles.rubricLabel}>{r.label()}</Text>
                <Stars
                  value={(d.scores || {})[r.key] ?? ev?.scores?.[r.key]}
                  onChange={(v) => setScore(item.id, r.key, v)}
                />
              </View>
            ))}
            <View style={styles.rubricRow}>
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
              placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              value={d.comment ?? ev?.comment ?? ''}
              onChangeText={(v) =>
                setDraft((prev) => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), comment: v } }))
              }
            />
            <TouchableOpacity style={styles.saveBtn} onPress={() => onSaveRubric(item.id)}>
              <Text style={styles.saveBtnText}>{Strings.RUBRIC_SAVE}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{Strings.BRAND_REVIEW_TITLE}</Text>
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${reviews.length ? (evaluatedCount / reviews.length) * 100 : 0}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {evaluatedCount}/{reviews.length}
        </Text>
      </View>
      <Text style={styles.progressHint}>{Strings.RUBRIC_20_ENOUGH}</Text>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        renderItem={renderReview}
        ListEmptyComponent={<Text style={styles.empty}>{Strings.NO_CAMPAIGNS}</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Constants.COLOR_BACKGROUND_DARK },
  header: {
    fontSize: 22,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    color: Constants.TIER_COLORS.ARTISAN,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 10 },
  progressTrack: { flex: 1, height: 8, borderRadius: 5, backgroundColor: '#e8e5df', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Constants.COLOR_MAIN },
  progressText: { marginLeft: 10, fontSize: 12.5, fontWeight: '700', color: Constants.TIER_COLORS.ARTISAN },
  progressHint: { paddingHorizontal: 16, marginTop: 4, fontSize: 11.5, color: Constants.TIER_COLORS.STRIVER },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 54, height: 54, borderRadius: 9, backgroundColor: '#eee' },
  reviewer: { fontSize: 14.5, fontWeight: '700', color: '#26231d' },
  meta: { fontSize: 12, color: '#8a857b', marginTop: 2 },
  doneTag: { fontSize: 11.5, color: '#1c7c31', fontWeight: '700', marginTop: 3 },
  triageRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  triageBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e4e1da',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#faf9f7',
  },
  triageBtnOn: { borderColor: Constants.COLOR_MAIN, backgroundColor: '#fff3d6' },
  triageIcon: { fontSize: 17 },
  triageLabel: { fontSize: 10.5, color: '#5c574d', marginTop: 2 },
  rubricBox: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f0eee9', paddingTop: 10 },
  rubricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rubricLabel: { fontSize: 13, color: '#26231d' },
  star: { fontSize: 20, color: '#ddd9d0' },
  starOn: { color: '#f5a300' },
  rebookBtn: {
    width: 38,
    height: 30,
    borderWidth: 1,
    borderColor: '#e4e1da',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  rebookBtnOn: { backgroundColor: Constants.COLOR_MAIN, borderColor: Constants.COLOR_MAIN },
  rebookText: { fontSize: 13, fontWeight: '800', color: '#8a857b' },
  rebookTextOn: { color: '#16130d' },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e4e1da',
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontSize: 13,
    marginTop: 4,
    color: '#26231d',
  },
  saveBtn: {
    marginTop: 10,
    backgroundColor: Constants.COLOR_MAIN,
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 13.5, fontWeight: '800', color: '#16130d' },
  empty: { textAlign: 'center', marginTop: 40, color: Constants.TIER_COLORS.STRIVER },
});
