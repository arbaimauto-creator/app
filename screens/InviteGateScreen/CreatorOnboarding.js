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
const FOLLOWER_BANDS = [
  { key: 'nano', label: '< 10K' },
  { key: 'micro', label: '10K–100K' },
  { key: 'mid', label: '100K–1M' },
  { key: 'macro', label: '1M+' },
];
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
  const [handle, setHandle] = useState('');
  const [followerBand, setFollowerBand] = useState(null);
  const [ageBand, setAgeBand] = useState(null);
  const [gender, setGender] = useState(null);
  const [category, setCategory] = useState('beauty');
  const [skinType, setSkinType] = useState(null);

  const canFinish = handle.trim().length > 1 && followerBand && ageBand && gender;

  const goTo = (idx) => {
    setPage(idx);
    scrollRef.current?.scrollTo({ x: idx * width, animated: true });
  };

  const onFinish = async () => {
    const country = await Preference.get('creatorCountry');
    await saveCreatorProfile({
      country,
      primaryPlatform: platform,
      handleUrl: handle.trim(),
      followerBand,
      ageBand,
      gender,
      contentCategories: [category],
      skinType,
      onboardedAt: new Date().toISOString(),
    });
    // 온보딩 완료 보상 +50P (mock: 로컬 표시용)
    await Preference.set('onboardingBonusGranted', 'true');
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

            <Text style={styles.label}>{Strings.PROFILE_HANDLE}</Text>
            <TextInput
              style={styles.input}
              placeholder="@your_handle"
              placeholderTextColor={COLORS.GREY}
              autoCapitalize="none"
              autoCorrect={false}
              value={handle}
              onChangeText={setHandle}
            />

            <Text style={styles.label}>{Strings.PROFILE_FOLLOWERS}</Text>
            <Chips items={FOLLOWER_BANDS} selected={followerBand} onSelect={setFollowerBand} />

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
