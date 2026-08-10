import React, { useRef, useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import Preference from 'react-native-default-preference';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import { saveCreatorProfile } from '../../api/creators';

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

function Chip({ label, on, onPress }) {
  return (
    <TouchableOpacity style={[styles.chip, on && styles.chipOn]} onPress={onPress}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

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
              <Text style={styles.pageTitle}>{p.title}</Text>
              <Text style={styles.pageText}>{p.body}</Text>
            </View>
            <TouchableOpacity style={styles.next} onPress={() => goTo(idx + 1)}>
              <Text style={styles.nextText}>{Strings.ONBOARD_NEXT}</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={[styles.page, { width }]}>
          <ScrollView style={styles.formScroll} contentContainerStyle={{ paddingBottom: 30 }}>
            <Text style={styles.pageTitle}>{Strings.ONBOARD_PROFILE_TITLE}</Text>
            <Text style={styles.pageText}>{Strings.ONBOARD_PROFILE_BODY}</Text>

            <Text style={styles.label}>{Strings.PROFILE_PLATFORM}</Text>
            <View style={styles.chipRow}>
              {PLATFORMS.map((p) => (
                <Chip key={p} label={p} on={platform === p} onPress={() => setPlatform(p)} />
              ))}
            </View>

            <Text style={styles.label}>{Strings.PROFILE_HANDLE}</Text>
            <TextInput
              style={styles.input}
              placeholder="@your_handle"
              placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              autoCapitalize="none"
              autoCorrect={false}
              value={handle}
              onChangeText={setHandle}
            />

            <Text style={styles.label}>{Strings.PROFILE_FOLLOWERS}</Text>
            <View style={styles.chipRow}>
              {FOLLOWER_BANDS.map((b) => (
                <Chip
                  key={b.key}
                  label={b.label}
                  on={followerBand === b.key}
                  onPress={() => setFollowerBand(b.key)}
                />
              ))}
            </View>

            <Text style={styles.label}>{Strings.PROFILE_AGE}</Text>
            <View style={styles.chipRow}>
              {AGE_BANDS.map((a) => (
                <Chip key={a} label={a} on={ageBand === a} onPress={() => setAgeBand(a)} />
              ))}
            </View>

            <Text style={styles.label}>{Strings.PROFILE_GENDER}</Text>
            <View style={styles.chipRow}>
              {GENDERS.map((g) => (
                <Chip
                  key={g.key}
                  label={g.label}
                  on={gender === g.key}
                  onPress={() => setGender(g.key)}
                />
              ))}
            </View>

            <Text style={styles.label}>{Strings.PROFILE_CATEGORY}</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((c) => (
                <Chip key={c} label={c} on={category === c} onPress={() => setCategory(c)} />
              ))}
            </View>

            <Text style={styles.label}>{Strings.PROFILE_SKIN}</Text>
            <View style={styles.chipRow}>
              {SKIN_TYPES.map((s) => (
                <Chip
                  key={s.key}
                  label={s.label}
                  on={skinType === s.key}
                  onPress={() => setSkinType(s.key)}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.next, !canFinish && styles.nextDisabled]}
              disabled={!canFinish}
              onPress={onFinish}
            >
              <Text style={styles.nextText}>{Strings.ONBOARD_FINISH}</Text>
            </TouchableOpacity>
          </ScrollView>
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
  container: { flex: 1, backgroundColor: Constants.COLOR_BACKGROUND_DARK },
  page: { flex: 1, paddingHorizontal: 28, paddingTop: 40 },
  pageBody: { flex: 1, justifyContent: 'center' },
  pageTitle: {
    fontSize: 26,
    lineHeight: 36,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    color: Constants.TIER_COLORS.ARTISAN,
  },
  pageText: { marginTop: 14, fontSize: 15, lineHeight: 24, color: Constants.TIER_COLORS.STRIVER },
  next: {
    backgroundColor: Constants.COLOR_MAIN,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 34,
    marginTop: 20,
  },
  nextDisabled: { opacity: 0.4 },
  nextText: { fontSize: 16, fontWeight: '800', color: '#16130d' },
  formScroll: { flex: 1 },
  label: { marginTop: 18, marginBottom: 8, fontSize: 13, color: Constants.TIER_COLORS.STRIVER },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Constants.TIER_COLORS.ARTISAN,
    backgroundColor: '#fff',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  chipOn: { backgroundColor: Constants.COLOR_MAIN, borderColor: Constants.COLOR_MAIN },
  chipText: { fontSize: 13.5, color: Constants.TIER_COLORS.ARTISAN },
  chipTextOn: { fontWeight: '800', color: '#16130d' },
  dots: { flexDirection: 'row', justifyContent: 'center', paddingBottom: 16 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#d8d5cf',
    marginHorizontal: 4,
  },
  dotOn: { backgroundColor: Constants.COLOR_MAIN },
});
