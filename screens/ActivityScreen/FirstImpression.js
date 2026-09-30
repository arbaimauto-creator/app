// D27: 첫인상 30초 설문 — 수령 확인 직후 1회. FGI를 종단 조사로 만드는 첫 번째 터치.
// (개봉·첫 사용 반응은 2주 뒤 본 설문 시점엔 이미 소실되는 데이터라 이 시점에만 잡을 수 있다)
// 스킵 가능 — 마찰 최소 원칙. 본 설문(FgiSurvey)과 달리 업로드 필수 조건이 아니다.
import React, { useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Strings from '../../Components/Strings';
import T from '../../Components/Constants/DesignTokens';
import { Card, Btn, EmptyIcon } from '../../Components/UI';
import { upsertSeeding } from '../../api/seedings';
import { logEvent } from '../../api/common/analytics';

const ITEMS = [
  { key: 'unboxing', label: () => Strings.FI_UNBOXING },
  { key: 'firstUse', label: () => Strings.FI_FIRST_USE },
];

function Scale({ value, onChange }) {
  return (
    <View style={styles.scaleRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          style={[styles.scaleDot, n <= (value || 0) && styles.scaleDotOn]}
          onPress={() => onChange(n)}
        >
          <Text style={[styles.scaleNum, n <= (value || 0) && styles.scaleNumOn]}>{n}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function FirstImpression({ route, navigation }) {
  const { campaign } = route.params;
  const [scores, setScores] = useState({});
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const complete = ITEMS.every((q) => scores[q.key]);

  const onSubmit = async () => {
    if (!complete || submitLockRef.current) {
      return;
    }
    submitLockRef.current = true;
    setIsSubmitting(true);
    try {
      await upsertSeeding(campaign.id, {
        firstImpression: {
          ...scores,
          note: note.trim() || null,
          submittedAt: new Date().toISOString(),
        },
      });
      logEvent('fi_submit', { campaign_id: campaign.id, has_note: note.trim().length > 0 });
      // 업로드로 바로 이어주기 (2026-09-17) — 이전엔 goBack만 해서 활동 탭에서 다시 찾아야 했다
      Alert.alert(Strings.FI_DONE_TITLE, Strings.FI_DONE_BODY, [
        { text: Strings.REGULAR_PROMPT_LATER, style: 'cancel', onPress: () => navigation.goBack() },
        {
          text: Strings.UPLOAD_REVIEW_CTA,
          onPress: () => navigation.replace('ReviewLinkSubmit', { campaignId: campaign.id }),
        },
      ]);
    } catch (e) {
      submitLockRef.current = false;
      setIsSubmitting(false);
      Alert.alert(Strings.RETRY_GUIDELINES);
    }
  };

  const onSkip = () => {
    if (submitLockRef.current) {
      return;
    }
    logEvent('fi_skip', { campaign_id: campaign.id });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <EmptyIcon name="package-variant-closed" size={30} />
        <Text style={styles.title}>{Strings.FI_TITLE}</Text>
        <Text style={styles.sub}>{Strings.FI_SUB(campaign.brand)}</Text>

        {ITEMS.map((q) => (
          <Card key={q.key} style={styles.block}>
            <Text style={styles.label}>{q.label()}</Text>
            <Scale value={scores[q.key]} onChange={(v) => setScores({ ...scores, [q.key]: v })} />
          </Card>
        ))}

        <Card style={styles.block}>
          <Text style={styles.label}>{Strings.FI_NOTE_LABEL}</Text>
          <TextInput
            style={styles.input}
            placeholder={Strings.FI_NOTE_PH}
            placeholderTextColor={T.COLORS.GREY}
            maxLength={120}
            value={note}
            onChangeText={setNote}
          />
        </Card>

        <Btn
          title={Strings.FI_SUBMIT}
          onPress={onSubmit}
          disabled={!complete || isSubmitting}
          style={styles.submit}
        />
        <TouchableOpacity onPress={onSkip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.skip}>{Strings.FI_SKIP}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.COLORS.BG, paddingTop: T.TOP_INSET },
  scroll: { padding: 20, paddingTop: 30 },
  emoji: { fontSize: 30, textAlign: 'center' },
  title: {
    fontFamily: T.FONT.ExtraBold,
    fontSize: 19,
    color: T.COLORS.INK,
    textAlign: 'center',
    marginTop: 8,
  },
  sub: { ...T.TYPE.SUB, textAlign: 'center', marginTop: 6, marginBottom: 8 },
  block: { marginTop: 12 },
  label: {
    fontSize: 12.5,
    fontFamily: T.FONT.SemiBold,
    color: T.COLORS.INK,
    marginBottom: 9,
  },
  scaleRow: { flexDirection: 'row', gap: 8 },
  scaleDot: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.COLORS.LINE,
    backgroundColor: T.COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleDotOn: { backgroundColor: T.COLORS.AMBER, borderColor: T.COLORS.AMBER },
  scaleNum: { fontFamily: T.FONT.Bold, fontSize: 13, color: T.COLORS.GREY },
  scaleNumOn: { color: T.COLORS.ON_AMBER },
  input: {
    borderWidth: 1,
    borderColor: T.COLORS.LINE,
    borderRadius: T.RADIUS.FIELD,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontFamily: T.FONT.Regular,
    fontSize: 13,
    backgroundColor: T.COLORS.SURFACE,
    color: T.COLORS.INK,
  },
  submit: { marginTop: 18 },
  skip: { ...T.TYPE.SUB, textAlign: 'center', marginTop: 14 },
});
