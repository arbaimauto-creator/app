import React, { useRef, useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import Preference from 'react-native-default-preference';
import T from '../../Components/Constants/DesignTokens';
import Strings from '../../Components/Strings';
import { Badge, Btn, Card, Chips } from '../../Components/UI';
import { saveCreatorProfile } from '../../api/creators';
import { CHANNELS, FOLLOWER_BANDS, normalizeHandle } from '../../api/channels';
import { opsSyncProfile } from '../../api/opsBridge';

const { COLORS, FONT, RADIUS } = T;

// v2 §7-1 온보딩 4장 + §6 creator 프로필 폼 (밴드형 인구통계·피부타입).
// 4장 구성: 자격 → 구조 → 검증 루프 → 프로필 입력(첫 행동 전 단계)
const { width } = Dimensions.get('window');

const PAGES = [
  { key: 'invited', title: Strings.ONBOARD_1_TITLE, body: Strings.ONBOARD_1_BODY },
  { key: 'shipped', title: Strings.ONBOARD_2_TITLE, body: Strings.ONBOARD_2_BODY },
  { key: 'graded', title: Strings.ONBOARD_3_TITLE, body: Strings.ONBOARD_3_BODY },
];

const PLATFORMS = ['instagram', 'tiktok', 'youtube'];
const AGE_BANDS = ['18-24', '25-34', '35-44', '45+'];
const GENDERS = [
  { key: 'female', label: Strings.GENDER_FEMALE },
  { key: 'male', label: Strings.GENDER_MALE },
  { key: 'none', label: Strings.GENDER_NO_ANSWER },
];
const CATEGORIES = ['beauty', 'lifestyle', 'fashion', 'food', 'fitness'];
const SKIN_TYPES = [
  { key: 'dry', label: Strings.SKIN_DRY },
  { key: 'oily', label: Strings.SKIN_OILY },
  { key: 'combination', label: Strings.SKIN_COMBINATION },
  { key: 'sensitive', label: Strings.SKIN_SENSITIVE },
];

const PLATFORM_ITEMS = PLATFORMS.map((p) => ({ key: p, label: p }));
const AGE_ITEMS = AGE_BANDS.map((a) => ({ key: a, label: a }));
const CATEGORY_ITEMS = CATEGORIES.map((c) => ({ key: c, label: c }));

export default function CreatorOnboarding({ navigation }) {
  const scrollRef = useRef(null);
  const [page, setPage] = useState(0);

  const [platform, setPlatform] = useState('instagram');
  // D29: 3채널 수집 — 주력 채널만 필수, 나머지는 선택 (매칭 커버리지 ↑, 마찰은 최소)
  const [channels, setChannels] = useState({
    instagram: { handle: '', followerBand: null },
    tiktok: { handle: '', followerBand: null },
    youtube: { handle: '', followerBand: null },
  });
  const [ageBand, setAgeBand] = useState(null);
  const [gender, setGender] = useState(null);
  const [category, setCategory] = useState('beauty');
  const [skinType, setSkinType] = useState(null);

  const setChannel = (key, patch) =>
    setChannels((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const primary = channels[platform];
  const canFinish =
    normalizeHandle(primary.handle).length > 1 && primary.followerBand && ageBand && gender;

  const goTo = (idx) => {
    setPage(idx);
    scrollRef.current?.scrollTo({ x: idx * width, animated: true });
  };

  const onFinish = async () => {
    const country = await Preference.get('creatorCountry');
    // 핸들은 정규화해 저장 (URL 붙여넣기 → 순수 핸들)
    const normalized = {};
    CHANNELS.forEach(({ key }) => {
      normalized[key] = {
        handle: normalizeHandle(channels[key].handle),
        followerBand: channels[key].followerBand ?? null,
      };
    });
    const profile = {
      country,
      primaryPlatform: platform,
      channels: normalized,
      // 하위 호환: 기존 화면들이 참조하는 단일 핸들·밴드는 주력 채널 값으로 유지
      handleUrl: normalized[platform].handle,
      followerBand: normalized[platform].followerBand,
      ageBand,
      gender,
      contentCategories: [category],
      skinType,
      onboardedAt: new Date().toISOString(),
    };
    await saveCreatorProfile(profile);
    // 온보딩 완료 보상 +50P (mock: 로컬 표시용)
    await Preference.set('onboardingBonusGranted', 'true');
    // D29: ops 골든 레코드에 채널·인구통계 동기화 (실패해도 로컬 진행 무영향)
    opsSyncProfile(profile);
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainBottom' }] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
      >
        {PAGES.map((p, idx) => (
          <View key={p.key} style={[styles.page, { width }]}>
            <View style={styles.pageBody}>
              <Card style={styles.copyCard}>
                <Badge text={`${idx + 1} / 4`} tone="amber" style={styles.copyBadge} />
                <Text style={styles.pageTitle}>{p.title}</Text>
                <View style={styles.divline} />
                <Text style={styles.pageText}>{p.body}</Text>
              </Card>
            </View>
            <Btn title={Strings.ONBOARD_NEXT} onPress={() => goTo(idx + 1)} style={styles.next} />
          </View>
        ))}

        <View style={[styles.page, { width }]}>
          <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent}>
            <Text style={styles.formTitle}>{Strings.ONBOARD_PROFILE_TITLE}</Text>
            <Text style={styles.formSub}>{Strings.ONBOARD_PROFILE_BODY}</Text>

            <Text style={styles.label}>{Strings.PROFILE_PLATFORM}</Text>
            <Chips items={PLATFORM_ITEMS} selected={platform} onSelect={setPlatform} />

            {/* D29: 3채널 — 주력만 필수, 나머지는 선택 (더 많은 캠페인에 매칭) */}
            <Text style={styles.channelsHint}>{Strings.PROFILE_CHANNELS_HINT}</Text>
            {CHANNELS.map(({ key, label }) => (
              <View key={key} style={styles.channelBlock}>
                <View style={styles.channelHead}>
                  <Text style={styles.channelName}>{label}</Text>
                  <Text style={styles.channelTag}>
                    {key === platform ? Strings.PROFILE_CH_PRIMARY : Strings.PROFILE_CH_OPTIONAL}
                  </Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={Strings.PROFILE_HANDLE_PH}
                  placeholderTextColor={COLORS.GREY}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={channels[key].handle}
                  onChangeText={(v) => setChannel(key, { handle: v })}
                />
                {channels[key].handle.trim() ? (
                  <Chips
                    items={FOLLOWER_BANDS}
                    selected={channels[key].followerBand}
                    onSelect={(b) => setChannel(key, { followerBand: b })}
                    style={styles.channelBands}
                  />
                ) : null}
              </View>
            ))}

            <Text style={styles.label}>{Strings.PROFILE_AGE}</Text>
            <Chips items={AGE_ITEMS} selected={ageBand} onSelect={setAgeBand} />

            <Text style={styles.label}>{Strings.PROFILE_GENDER}</Text>
            <Chips items={GENDERS} selected={gender} onSelect={setGender} />

            <Text style={styles.label}>{Strings.PROFILE_CATEGORY}</Text>
            <Chips items={CATEGORY_ITEMS} selected={category} onSelect={setCategory} />

            <Text style={styles.label}>{Strings.PROFILE_SKIN}</Text>
            <Chips items={SKIN_TYPES} selected={skinType} onSelect={setSkinType} />
          </ScrollView>

          <Btn
            title={Strings.ONBOARD_FINISH}
            onPress={onFinish}
            disabled={!canFinish}
            style={styles.next}
          />
        </View>
      </ScrollView>

      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, page === i && styles.dotOn]} />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  page: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  pageBody: { flex: 1, justifyContent: 'center' },
  copyCard: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  copyBadge: { alignSelf: 'center', marginBottom: 14 },
  pageTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: FONT.ExtraBold,
    color: COLORS.INK,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  divline: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: COLORS.LINE,
    marginVertical: 14,
  },
  pageText: {
    ...T.TYPE.SUB,
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'center',
  },
  next: { marginBottom: 30, marginTop: 16, paddingVertical: 14 },
  formScroll: { flex: 1 },
  formContent: { paddingBottom: 30 },
  formTitle: {
    ...T.TYPE.H_TITLE,
    lineHeight: 27,
  },
  formSub: { ...T.TYPE.SUB, marginTop: 6 },
  label: { ...T.TYPE.LABEL, marginTop: 18, marginBottom: 8 },
  channelsHint: { ...T.TYPE.XS, marginTop: 16, lineHeight: 16 },
  channelBlock: { marginTop: 12 },
  channelHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  channelName: { fontFamily: FONT.Bold, fontSize: 13, color: COLORS.INK, flex: 1 },
  channelTag: { ...T.TYPE.XS, fontFamily: FONT.SemiBold },
  channelBands: { marginTop: 8, justifyContent: 'flex-start' },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    borderRadius: RADIUS.FIELD,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: FONT.SemiBold,
    color: COLORS.INK,
    backgroundColor: COLORS.SURFACE,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', paddingBottom: 16 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D8D5CF',
    marginHorizontal: 4,
  },
  dotOn: { backgroundColor: COLORS.AMBER, width: 18 },
});
