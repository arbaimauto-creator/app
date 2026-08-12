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
import { Card, Chips, Badge } from '../../Components/UI';
import { getSeedings, upsertSeeding, SEEDING_STATUS } from '../../api/seedings';
import { getCreatorProfile } from '../../api/creators';
import { logEvent, toGBand } from '../../api/common/analytics';

// 계획서 TSK-007: 신청→승인→[FGI 설문]→UGC 업로드.
// 리포트 1·2섹션(종합점수·구매의향 %·가격 반응)의 데이터 원천 — 업로드 전에 반드시 작성.
// D27 고도화: 추천 의향 추가, 가격 상한(간이 PSM), 경쟁 제품 앵커, 사용 일수·프로필 스냅샷
// (세그먼트 집계용), 정성 최소 길이. 첫인상 설문(수령 직후)은 FirstImpression이 담당.
const QUANT = [
  { key: 'purchaseIntent', label: () => Strings.FGI_PURCHASE_INTENT },
  { key: 'priceFairness', label: () => Strings.FGI_PRICE_FAIRNESS },
  { key: 'competitiveness', label: () => Strings.FGI_COMPETITIVENESS },
  { key: 'recommend', label: () => Strings.FGI_RECOMMEND },
];

const MIN_TEXT_LEN = 20; // 장·단점 최소 글자 수 — 성의 없는 응답 방지 (리포트 인용 가능 수준)

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
  const [usageDays, setUsageDays] = useState(null);

  // 설문 퍼널: fgi_start → fgi_submit (이탈률 = FGI 마찰 측정, 응답 내용은 보내지 않음)
  React.useEffect(() => {
    logEvent('fgi_start', { campaign_id: campaign.id });
    // 사용 일수 = 수령 확인 기준 — 응답의 시점 맥락 (첫인상 vs 2주 사용 후를 구분하는 축)
    getSeedings().then((all) => {
      const receivedAt = all[campaign.id]?.receivedAt;
      if (receivedAt) {
        setUsageDays(Math.max(0, Math.round((Date.now() - new Date(receivedAt)) / 86400000)));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [fairPrice, setFairPrice] = useState('');
  const [priceCeiling, setPriceCeiling] = useState('');
  const [competitorName, setCompetitorName] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  // 캠페인별 커스텀 질문 — 문자열(주관식) 또는 {q, type:'choice', options} (D27)
  const extraQuestions = (
    Array.isArray(campaign.fgiExtraQuestions) ? campaign.fgiExtraQuestions : []
  ).map((q) => (typeof q === 'string' ? { q, type: 'text' } : q));
  const [extraAnswers, setExtraAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = React.useRef(false);

  const complete =
    QUANT.every((q) => scores[q.key]) &&
    fairPrice.trim() &&
    competitorName.trim() &&
    pros.trim() &&
    cons.trim() &&
    extraQuestions.every((q) => (extraAnswers[q.q] || '').trim());

  const onSubmit = async () => {
    if (submitLockRef.current) {
      return;
    }
    if (!complete) {
      Alert.alert(Strings.FGI_INCOMPLETE);
      return;
    }
    // 응답 품질 최소선 — 한 단어 답변은 리포트 재료가 안 된다
    if (pros.trim().length < MIN_TEXT_LEN || cons.trim().length < MIN_TEXT_LEN) {
      Alert.alert(Strings.FGI_MIN_TEXT(MIN_TEXT_LEN));
      return;
    }
    submitLockRef.current = true;
    setIsSubmitting(true);
    try {
      const seedings = await getSeedings();
      if (seedings[campaign.id]?.status !== SEEDING_STATUS.RECEIVED) {
        throw new Error('invalid_seeding_status');
      }
      // 세그먼트 집계용 프로필 스냅샷 — 제출 시점 값 고정 (이후 프로필 변경과 무관하게 보존)
      const profile = await getCreatorProfile();
      await upsertSeeding(campaign.id, {
      fgiSurvey: {
        ...scores,
        fairPriceUsd: Number(fairPrice) || fairPrice.trim(),
        priceCeilingUsd: priceCeiling.trim() ? Number(priceCeiling) || priceCeiling.trim() : null,
        competitorName: competitorName.trim(),
        pros: pros.trim(),
        cons: cons.trim(),
        extraAnswers,
        usageDays,
        profileSnapshot: profile
          ? {
              country: profile.country,
              gBand: toGBand(profile.gScore ?? 50),
              skinType: profile.skinType,
              ageBand: profile.ageBand,
              followerBand: profile.followerBand,
            }
          : null,
        submittedAt: new Date().toISOString(),
      },
      });
      logEvent('fgi_submit', {
        campaign_id: campaign.id,
        extra_count: extraQuestions.length,
        usage_days: usageDays ?? -1,
      });
      Alert.alert(Strings.FGI_DONE_TITLE, Strings.FGI_DONE_BODY, [
        {
          text: Strings.UPLOAD_REVIEW_CTA,
          onPress: () => navigation.replace('ReviewLinkSubmit', { campaignId: campaign.id }),
        },
      ], { cancelable: false });
    } catch (e) {
      submitLockRef.current = false;
      setIsSubmitting(false);
      Alert.alert(Strings.RETRY_GUIDELINES);
    }
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
          {usageDays != null ? (
            <Badge tone="amber" text={Strings.FGI_DAYS_USED(usageDays)} style={styles.daysBadge} />
          ) : null}

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
            {/* 간이 PSM 상한 — 적정가와 함께 수용 가격 범위를 만든다 (선택) */}
            <Text style={[styles.label, styles.labelGap]}>{Strings.FGI_PRICE_CEILING}</Text>
            <TextInput
              style={styles.input}
              placeholder="USD"
              placeholderTextColor={T.COLORS.GREY}
              keyboardType="numeric"
              value={priceCeiling}
              onChangeText={setPriceCeiling}
            />
          </Card>

          {/* 경쟁 비교 앵커 — competitiveness 점수의 기준점을 명시화 */}
          <Card style={styles.block}>
            <Text style={styles.label}>{Strings.FGI_COMPETITOR}</Text>
            <TextInput
              style={styles.input}
              placeholder={Strings.FGI_COMPETITOR_PH}
              placeholderTextColor={T.COLORS.GREY}
              value={competitorName}
              onChangeText={setCompetitorName}
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

          {extraQuestions.map((item) => (
            <Card key={item.q} style={styles.block}>
              <Text style={styles.label}>{item.q}</Text>
              {item.type === 'choice' && Array.isArray(item.options) ? (
                <Chips
                  items={item.options.map((o) => ({ key: o, label: o }))}
                  selected={extraAnswers[item.q] || null}
                  onSelect={(k) => setExtraAnswers({ ...extraAnswers, [item.q]: k })}
                  style={styles.choiceRow}
                />
              ) : (
                <TextInput
                  style={[styles.input, styles.multiline]}
                  multiline
                  placeholder={Strings.FGI_TEXT_PLACEHOLDER}
                  placeholderTextColor={T.COLORS.GREY}
                  value={extraAnswers[item.q] || ''}
                  onChangeText={(v) => setExtraAnswers({ ...extraAnswers, [item.q]: v })}
                />
              )}
            </Card>
          ))}

          <Text style={styles.honesty}>{Strings.APPLY_HONESTY_NOTE}</Text>

          <TouchableOpacity
            style={[styles.submit, (!complete || isSubmitting) && styles.submitDisabled]}
            onPress={onSubmit}
            disabled={isSubmitting}
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
  daysBadge: { alignSelf: 'flex-start', marginTop: 6 },
  labelGap: { marginTop: 14 },
  choiceRow: { justifyContent: 'flex-start', marginTop: 4 },
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
