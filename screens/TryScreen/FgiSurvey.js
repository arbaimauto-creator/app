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
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import { upsertSeeding } from '../../api/seedings';

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
    Alert.alert(Strings.FGI_DONE_TITLE, Strings.FGI_DONE_BODY, [
      {
        text: Strings.UPLOAD_REVIEW_CTA,
        onPress: () => navigation.replace('AddingNewVideo', { campaignId: campaign.id }),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <Text style={styles.title}>{Strings.FGI_TITLE}</Text>
          <Text style={styles.subtitle}>{Strings.FGI_SUBTITLE(campaign.brand)}</Text>

          {QUANT.map((q) => (
            <View key={q.key} style={styles.block}>
              <Text style={styles.label}>{q.label()}</Text>
              <Scale value={scores[q.key]} onChange={(v) => setScores({ ...scores, [q.key]: v })} />
            </View>
          ))}

          <View style={styles.block}>
            <Text style={styles.label}>{Strings.FGI_FAIR_PRICE}</Text>
            <TextInput
              style={styles.input}
              placeholder="USD"
              placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              keyboardType="numeric"
              value={fairPrice}
              onChangeText={setFairPrice}
            />
          </View>

          <View style={styles.block}>
            <Text style={styles.label}>{Strings.FGI_PROS}</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              multiline
              placeholder={Strings.FGI_TEXT_PLACEHOLDER}
              placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              value={pros}
              onChangeText={setPros}
            />
          </View>

          <View style={styles.block}>
            <Text style={styles.label}>{Strings.FGI_CONS}</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              multiline
              placeholder={Strings.FGI_TEXT_PLACEHOLDER}
              placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              value={cons}
              onChangeText={setCons}
            />
          </View>

          {extraQuestions.map((q) => (
            <View key={q} style={styles.block}>
              <Text style={styles.label}>{q}</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                multiline
                placeholder={Strings.FGI_TEXT_PLACEHOLDER}
                placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                value={extraAnswers[q] || ''}
                onChangeText={(v) => setExtraAnswers({ ...extraAnswers, [q]: v })}
              />
            </View>
          ))}

          <Text style={styles.honesty}>{Strings.APPLY_HONESTY_NOTE}</Text>

          <TouchableOpacity
            style={[styles.submit, !complete && styles.submitDisabled]}
            onPress={onSubmit}
          >
            <Text style={styles.submitText}>{Strings.FGI_SUBMIT}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Constants.COLOR_BACKGROUND_DARK },
  title: {
    fontSize: 22,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    color: Constants.TIER_COLORS.ARTISAN,
  },
  subtitle: { fontSize: 13.5, color: Constants.TIER_COLORS.STRIVER, marginTop: 6 },
  block: { marginTop: 22 },
  label: { fontSize: 14.5, color: Constants.TIER_COLORS.ARTISAN, marginBottom: 10 },
  scaleRow: { flexDirection: 'row', gap: 8 },
  scaleDot: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleDotOn: { backgroundColor: Constants.COLOR_MAIN, borderColor: Constants.COLOR_MAIN },
  scaleNum: { fontSize: 15, fontWeight: '700', color: '#b7b2a8' },
  scaleNumOn: { color: '#16130d' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 14.5,
    backgroundColor: '#fff',
    color: Constants.TIER_COLORS.ARTISAN,
  },
  multiline: { minHeight: 84, textAlignVertical: 'top' },
  honesty: { fontSize: 12, color: Constants.TIER_COLORS.STRIVER, marginTop: 18, lineHeight: 18 },
  submit: {
    marginTop: 16,
    backgroundColor: Constants.COLOR_MAIN,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.45 },
  submitText: { fontSize: 16, fontWeight: '800', color: '#16130d' },
});
