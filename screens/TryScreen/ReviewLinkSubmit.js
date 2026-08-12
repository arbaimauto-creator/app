// 시안 15 · 리뷰 업로드 — SNS에 이미 올린 리뷰의 링크를 제출한다 (§6 review 스키마).
// platform_url + format 4종 수집 → reviewing 전환 + uploadedAt 기록 + 리마인더 취소.
// 피드용 영상 업로드(AddingNewVideo)와는 별개의 미션 전용 플로우.
import React, { useEffect, useRef, useState } from 'react';
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
import { useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import Clipboard from '@react-native-clipboard/clipboard';
import Strings from '../../Components/Strings';
import T from '../../Components/Constants/DesignTokens';
import { Card, Btn, Badge, Chips } from '../../Components/UI';
import { selectCampaigns } from '../../slices/campaign';
import { getSeedings, upsertSeeding, setSeedingStatus, SEEDING_STATUS } from '../../api/seedings';
import { daysLeft } from '../ActivityScreen/missionLogic';
import { cancelUploadReminders } from '../ActivityScreen/reminders';
import { opsUpload } from '../../api/opsBridge';
import { logEvent } from '../../api/common/analytics';

const { COLORS, RADIUS, FONT, TYPE } = T;

const FORMATS = [
  { key: 'short', label: () => Strings.REVIEW_SUBMIT_FORMAT_SHORT },
  { key: 'long', label: () => Strings.REVIEW_SUBMIT_FORMAT_LONG },
  { key: 'image', label: () => Strings.REVIEW_SUBMIT_FORMAT_IMAGE },
  { key: 'story', label: () => Strings.REVIEW_SUBMIT_FORMAT_STORY },
];

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];

// http(s) URL 형식 검증 — 스킴 생략 입력(instagram.com/…)은 https를 보정한다
function normalizeUrl(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) {
    return null;
  }
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return /^https?:\/\/[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(withScheme) ? withScheme : null;
}

function Checkbox({ checked, onToggle, label }) {
  return (
    <TouchableOpacity style={styles.checkRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.checkBox, checked && styles.checkBoxOn]}>
        {checked ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ReviewLinkSubmit({ route, navigation }) {
  const { campaignId } = route.params;
  const campaigns = useSelector(selectCampaigns);
  const campaign = campaigns.find((c) => c.id === campaignId);

  const [seeding, setSeeding] = useState(null);
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState(null);
  const [hashtagsCopied, setHashtagsCopied] = useState(false);
  const [pointsChecked, setPointsChecked] = useState(false);
  const [taggedBrand, setTaggedBrand] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  useEffect(() => {
    getSeedings().then((all) => setSeeding(all[campaignId] || null));
  }, [campaignId]);

  const left = daysLeft(seeding);
  const guide = Array.isArray(campaign?.contentGuide) ? campaign.contentGuide : [];
  const hashtags = [
    '#greyd',
    ...(campaign ? [`#${campaign.brand.replace(/\s+/g, '').toLowerCase()}`] : []),
    '#ad',
  ];

  const onCopyHashtags = () => {
    Clipboard.setString(hashtags.join(' '));
    setHashtagsCopied(true);
    Alert.alert(Strings.REVIEW_SUBMIT_COPIED);
  };

  const onSubmit = async () => {
    if (submitLockRef.current) {
      return;
    }
    const platformUrl = normalizeUrl(url);
    if (!platformUrl) {
      Alert.alert(Strings.REVIEW_SUBMIT_INVALID_URL);
      return;
    }
    if (!format || !pointsChecked) {
      Alert.alert(Strings.REVIEW_SUBMIT_INCOMPLETE);
      return;
    }
    submitLockRef.current = true;
    setIsSubmitting(true);
    try {
      const all = await getSeedings();
      const current = all[campaignId];
      if (current?.status !== SEEDING_STATUS.RECEIVED || !current?.fgiSurvey) {
        throw new Error('invalid_seeding_status');
      }
      await upsertSeeding(campaignId, {
        review: { platformUrl, format, hashtagsCopied, taggedBrand },
      });
      await setSeedingStatus(campaignId, SEEDING_STATUS.REVIEWING);
      try {
        cancelUploadReminders(campaignId);
      } catch (e) {
        // 리뷰 상태 저장이 정본이다. 로컬 알림 취소 실패가 제출을 되돌리지는 않는다.
      }
      logEvent('review_link_submit', { campaign_id: campaignId, format });
      // Phase 1.5: ops Content + POSTED 미러링 (수동 브리지 ③ 대체)
      opsUpload(campaignId, platformUrl, format);
      Alert.alert(Strings.REVIEW_SUBMIT_DONE_TITLE, Strings.REVIEW_SUBMIT_DONE_BODY, [
        {
          text: Strings.OK,
          onPress: () => navigation.navigate('MainBottom', { screen: 'Activity' }),
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
          <Text style={styles.headerTitle}>{Strings.REVIEW_SUBMIT_TITLE}</Text>
          <View style={{ flex: 1 }} />
          {left != null ? <Badge text={left > 0 ? `D-${left}` : 'D-DAY'} tone="red" /> : null}
        </View>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {campaign ? (
            <Card style={styles.campaignCard}>
              <View style={styles.campaignRow}>
                <FastImage source={{ uri: campaign.thumbnailUrl }} style={styles.thumb} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.campaignTitle} numberOfLines={1}>
                    {campaign.title}
                  </Text>
                  {guide.length > 0 ? (
                    <Text style={styles.campaignGuide} numberOfLines={2}>
                      {Strings.REVIEW_SUBMIT_MUST_MENTION(
                        guide.map((g, i) => `${CIRCLED[i] || '·'} ${g}`).join(' '),
                      )}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Card>
          ) : null}

          <Text style={styles.label}>{Strings.REVIEW_SUBMIT_LINK_LABEL}</Text>
          <TextInput
            style={styles.input}
            placeholder={Strings.REVIEW_SUBMIT_LINK_PLACEHOLDER}
            placeholderTextColor={COLORS.GREY}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            value={url}
            onChangeText={setUrl}
          />

          <Text style={styles.label}>{Strings.REVIEW_SUBMIT_FORMAT_LABEL}</Text>
          <View style={styles.seg}>
            {FORMATS.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.segCell, format === f.key && styles.segCellOn]}
                onPress={() => setFormat(f.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segText, format === f.key && styles.segTextOn]}>
                  {f.label()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{Strings.REVIEW_SUBMIT_HASHTAG_LABEL}</Text>
          <Chips
            items={[
              ...hashtags.map((h) => ({ key: h, label: h })),
              { key: '__copy', label: Strings.REVIEW_SUBMIT_COPY },
            ]}
            selected={hashtags}
            onSelect={(key) => {
              if (key === '__copy') {
                onCopyHashtags();
              }
            }}
          />

          <View style={styles.checks}>
            <Checkbox
              checked={pointsChecked}
              onToggle={() => setPointsChecked(!pointsChecked)}
              label={Strings.REVIEW_SUBMIT_CHECK_POINTS(guide.length || 1)}
            />
            <Checkbox
              checked={taggedBrand}
              onToggle={() => setTaggedBrand(!taggedBrand)}
              label={Strings.REVIEW_SUBMIT_CHECK_TAGGED}
            />
          </View>

          <Text style={styles.footnote}>{Strings.REVIEW_SUBMIT_FOOTNOTE}</Text>
          <Btn
            title={Strings.REVIEW_SUBMIT_CTA}
            onPress={onSubmit}
            disabled={isSubmitting}
            style={styles.submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
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
    color: COLORS.INK,
    fontFamily: FONT.Regular,
  },
  headerTitle: { fontSize: 17, fontFamily: FONT.ExtraBold, color: COLORS.INK },
  scroll: { padding: 16, paddingBottom: 40 },
  campaignCard: { paddingVertical: 10, paddingHorizontal: 12 },
  campaignRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.FIELD,
    backgroundColor: COLORS.TRACK,
  },
  campaignTitle: { fontSize: 12.5, fontFamily: FONT.Bold, color: COLORS.INK },
  campaignGuide: { ...TYPE.XS, marginTop: 3 },
  label: { ...TYPE.LABEL, marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    borderRadius: RADIUS.FIELD,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 13.5,
    fontFamily: FONT.Regular,
    backgroundColor: COLORS.SURFACE,
    color: COLORS.INK,
  },
  seg: {
    flexDirection: 'row',
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    borderRadius: RADIUS.FIELD,
    overflow: 'hidden',
  },
  segCell: { flex: 1, paddingVertical: 9, alignItems: 'center' },
  segCellOn: { backgroundColor: COLORS.DARK },
  segText: { fontSize: 12, fontFamily: FONT.Bold, color: COLORS.GREY },
  segTextOn: { color: '#FFFFFF' },
  checks: { marginTop: 18, gap: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  checkBox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: { backgroundColor: COLORS.AMBER, borderColor: COLORS.AMBER },
  checkMark: { fontSize: 11, lineHeight: 13, color: COLORS.ON_AMBER, fontFamily: FONT.Bold },
  checkLabel: { fontSize: 12.5, fontFamily: FONT.Regular, color: COLORS.INK, flex: 1 },
  footnote: { ...TYPE.XS, textAlign: 'center', marginTop: 22 },
  submit: { marginTop: 10 },
});
