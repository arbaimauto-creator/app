import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { Card } from '../../Components/UI';
import { upsertSeeding } from '../../api/seedings';
import { logEvent } from '../../api/common/analytics';

// 계획서 TSK-007: 신청→승인→[FGI 설문]→UGC 업로드.
// 리포트 1·2섹션(종합점수·구매의향 %·가격 반응)의 데이터 원천 — 업로드 전에 반드시 작성.
const QUANT = [
  { key: 'purchaseIntent', label: () => Strings.FGI_PURCHASE_INTENT },
  { key: 'priceFairness', label: () => Strings.FGI_PRICE_FAIRNESS },
  { key: 'competitiveness', label: () => Strings.FGI_COMPETITIVENESS },
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

export default function FgiSurvey({ route, navigation }) {
  const { campaign } = route.params;
  const [scores, setScores] = useState({});

  // 설문 퍼널: fgi_start → fgi_submit (이탈률 = FGI 마찰 측정, 응답 내용은 보내지 않음)
  React.useEffect(() => {
    logEvent('fgi_start', { campaign_id: campaign.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [fairPrice, setFairPrice] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  // 캠페인별 커스텀 질문 (Admin에서 설정 — 브랜드가 진짜 궁금한 것)
  const extraQuestions = Array.isArray(campaign.fgiExtraQuestions)
    ? campaign.fgiExtraQuestions
    : [];
  const [extraAnswers, setExtraAnswers] = useState({});

  const complete =
    QUANT.every((q) => scores[q.key]) &&
    fairPrice.trim() &&
    pros.trim() &&
    cons.trim() &&
    extraQuestions.every((q) => (extraAnswers[q] || '').trim());

  const onSubmit = async () => {
    if (!complete) {
      Alert.alert(Strings.FGI_INCOMPLETE);
      return;
    }
    await upsertSeeding(campaign.id, {
      fgiSurvey: {
        ...scores,
        fairPriceUsd: Number(fairPrice) || fairPrice.trim(),
        pros: pros.trim(),
        cons: cons.trim(),
        extraAnswers,
        submittedAt: new Date().toISOString(),
      },
    });
    logEvent('fgi_submit', {
      campaign_id: campaign.id,
      extra_count: extraQuestions.length,
    });
    Alert.alert(Strings.FGI_DONE_TITLE, Strings.FGI_DONE_BODY, [
      {
        text: Strings.UPLOAD_REVIEW_CTA,
        onPress: () => navigation.replace('ReviewLinkSubmit', { campaignId: campaign.id }),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backGlyph}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{Strings.FGI_TITLE}</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Text style={styles.subtitle}>{Strings.FGI_SUBTITLE(campaign.brand)}</Text>

          {QUANT.map((q) => (
            <Card key={q.key} style={styles.block}>
              <Text style={styles.label}>{q.label()}</Text>
              <Scale value={scores[q.key]} onChange={(v) => setScores({ ...scores, [q.key]: v })} />
            </Card>
          ))}

          <Card style={styles.block}>
            <Text style={styles.label}>{Strings.FGI_FAIR_PRICE}</Text>
            <TextInput
              style={styles.input}
              placeholder="USD"
              placeholderTextColor={T.COLORS.GREY}
              keyboardType="numeric"
              value={fairPrice}
              onChangeText={setFairPrice}
            />
          </Card>

          <Card style={styles.block}>
            <Text style={styles.label}>{Strings.FGI_PROS}</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              multiline
              placeholder={Strings.FGI_TEXT_PLACEHOLDER}
              placeholderTextColor={T.COLORS.GREY}
              value={pros}
              onChangeText={setPros}
            />
          </Card>

          <Card style={styles.block}>
            <Text style={styles.label}>{Strings.FGI_CONS}</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              multiline
              placeholder={Strings.FGI_TEXT_PLACEHOLDER}
              placeholderTextColor={T.COLORS.GREY}
              value={cons}
              onChangeText={setCons}
            />
          </Card>

          {extraQuestions.map((q) => (
            <Card key={q} style={styles.block}>
              <Text style={styles.label}>{q}</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                multiline
                placeholder={Strings.FGI_TEXT_PLACEHOLDER}
                placeholderTextColor={T.COLORS.GREY}
                value={extraAnswers[q] || ''}
                onChangeText={(v) => setExtraAnswers({ ...extraAnswers, [q]: v })}
              />
            </Card>
          ))}

          <Text style={styles.honesty}>{Strings.APPLY_HONESTY_NOTE}</Text>

          <TouchableOpacity
            style={[styles.submit, !complete && styles.submitDisabled]}
            onPress={onSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitText}>{Strings.FGI_SUBMIT}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.COLORS.BG, paddingTop: T.TOP_INSET },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: { marginRight: 10 },
  backGlyph: {
    fontSize: 26,
    lineHeight: 28,
    color: T.COLORS.INK,
    fontFamily: T.FONT.Regular,
  },
  headerTitle: { fontSize: 17, fontFamily: T.FONT.ExtraBold, color: T.COLORS.INK },
  subtitle: { ...T.TYPE.SUB, marginBottom: 2 },
  block: { marginTop: 12 },
  label: {
    fontSize: 12.5,
    fontFamily: T.FONT.Bold,
    color: T.COLORS.INK,
    marginBottom: 10,
  },
  scaleRow: { flexDirection: 'row', gap: 8 },
  scaleDot: {
    flex: 1,
    height: 34,
    maxWidth: 34,
    borderRadius: 17,
    backgroundColor: T.COLORS.TRACK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleDotOn: { backgroundColor: T.COLORS.AMBER },
  scaleNum: { fontSize: 13, fontFamily: T.FONT.Bold, color: T.COLORS.GREY },
  scaleNumOn: { color: T.COLORS.ON_AMBER },
  input: {
    borderWidth: 1.5,
    borderColor: T.COLORS.LINE,
    borderRadius: T.RADIUS.FIELD,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 13.5,
    fontFamily: T.FONT.Regular,
    backgroundColor: T.COLORS.SURFACE,
    color: T.COLORS.INK,
  },
  multiline: { minHeight: 84, textAlignVertical: 'top' },
  honesty: { ...T.TYPE.XS, marginTop: 16, lineHeight: 16 },
  submit: {
    marginTop: 14,
    backgroundColor: T.COLORS.AMBER,
    borderRadius: T.RADIUS.BTN,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.45 },
  submitText: { ...T.TYPE.BTN, fontSize: 14.5 },
});
