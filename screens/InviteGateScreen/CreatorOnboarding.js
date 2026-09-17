import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { CommonActions } from '@react-navigation/native';
import Preference from 'react-native-default-preference';
import T from '../../Components/Constants/DesignTokens';
import Strings from '../../Components/Strings';
import { Badge, Btn, Card, Chips } from '../../Components/UI';
import { COUNTRIES, getCreatorProfile, saveCreatorProfile } from '../../api/creators';
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
const COUNTRY_ITEMS = COUNTRIES.map((c) => ({ key: c, label: c }));

export default function CreatorOnboarding({ navigation }) {
  const scrollRef = useRef(null);
  const submitLockRef = useRef(false);
  const [page, setPage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

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
  // 활동 국가: 게이트를 거쳤으면 이미 저장돼 있고, 게이트가 꺼진 빌드에선 여기서 받는다.
  // null = 아직 로드 전, '' = 저장된 값 없음(선택 UI 노출)
  const [storedCountry, setStoredCountry] = useState(null);
  const [country, setCountry] = useState(null);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  // 기획서 §5.4 "프로필 완성하기" 재진입: 저장된 프로필이 있으면 채워서 시작 (빈 폼부터 다시 쓰게 하지 않는다)
  useEffect(() => {
    let alive = true;
    getCreatorProfile()
      .then((p) => {
        if (!alive || !p) {
          return;
        }
        if (p.primaryPlatform) {
          setPlatform(p.primaryPlatform);
        }
        if (p.channels) {
          setChannels((prev) => ({ ...prev, ...p.channels }));
        }
        if (p.ageBand) {
          setAgeBand(p.ageBand);
        }
        if (p.gender) {
          setGender(p.gender);
        }
        if (p.contentCategories?.[0]) {
          setCategory(p.contentCategories[0]);
        }
        if (p.skinType) {
          setSkinType(p.skinType);
        }
        if (p.onboardedAt) {
          setTimeout(() => goTo(PAGES.length), 50); // 이미 온보딩을 마친 사용자는 폼으로 바로
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    Preference.get('creatorCountry')
      .then((c) => alive && setStoredCountry(c || ''))
      .catch(() => alive && setStoredCountry(''));
    return () => {
      alive = false;
    };
  }, []);
  const needsCountry = storedCountry === '';

  const setChannel = (key, patch) =>
    setChannels((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const primary = channels[platform];
  // 2026-09-17: SNS 핸들·팔로워 밴드는 선택 입력으로 완화 — 인구통계·국가만 필수
  const canFinish = ageBand && gender && storedCountry !== null && (!needsCountry || country);

  const goTo = (idx) => {
    setPage(idx);
    scrollRef.current?.scrollTo({ x: idx * width, animated: true });
  };

  const onFinish = async () => {
    if (!canFinish || submitLockRef.current) {
      return;
    }
    submitLockRef.current = true;
    setIsSaving(true);
    setSaveError('');
    try {
      const resolvedCountry = needsCountry ? country : storedCountry;
      if (!resolvedCountry) {
        throw new Error('country_missing');
      }
      if (needsCountry) {
        await Preference.set('creatorCountry', resolvedCountry);
      }
      // 핸들은 정규화해 저장 (URL 붙여넣기 → 순수 핸들)
      const normalized = {};
      CHANNELS.forEach(({ key }) => {
        normalized[key] = {
          handle: normalizeHandle(channels[key].handle),
          followerBand: channels[key].followerBand ?? null,
        };
      });
      const profile = {
        country: resolvedCountry,
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
      // 온보딩 완료 보상 +50P (mock: 로컬 표시용). 동일 키라 재시도해도 중복 지급되지 않는다.
      await Preference.set('onboardingBonusGranted', 'true');
      // D29: ops 골든 레코드 동기화는 로컬 완료를 막지 않는다.
      opsSyncProfile(profile);
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainBottom' }] }));
    } catch (e) {
      submitLockRef.current = false;
      setIsSaving(false);
      setSaveError(Strings.ONBOARD_SAVE_ERROR);
    }
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

            {needsCountry ? (
              <>
                <Text style={styles.label}>{Strings.INVITE_COUNTRY_LABEL}</Text>
                <Chips items={COUNTRY_ITEMS} selected={country} onSelect={setCountry} />
                {/* 전세계 국가 검색 (2026-09-17) — 자주 쓰는 8개 밖은 검색 모달로 */}
                <TouchableOpacity
                  style={styles.countrySearch}
                  onPress={() => setCountryPickerOpen(true)}
                  accessibilityRole="button"
                >
                  <Text style={styles.countrySearchText}>
                    {country && !COUNTRIES.includes(country)
                      ? `${Strings.ONB_COUNTRY_SEARCH} · ${country} ✓`
                      : `${Strings.ONB_COUNTRY_SEARCH} ›`}
                  </Text>
                </TouchableOpacity>
                {countryPickerOpen ? (
                  <CountryPicker
                    visible
                    withFilter
                    withFlag
                    withEmoji
                    withCountryNameButton={false}
                    countryCode={country || 'KR'}
                    onSelect={(c) => {
                      setCountry(c.cca2);
                      setCountryPickerOpen(false);
                    }}
                    onClose={() => setCountryPickerOpen(false)}
                    renderFlagButton={() => null}
                  />
                ) : null}
              </>
            ) : null}

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

          {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
          {isSaving ? (
            <View style={styles.savingButton}>
              <ActivityIndicator color={COLORS.ON_AMBER} />
            </View>
          ) : (
            <Btn
              title={Strings.ONBOARD_FINISH}
              onPress={onFinish}
              disabled={!canFinish}
              style={styles.next}
            />
          )}
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
  saveError: {
    color: COLORS.RED,
    fontFamily: FONT.SemiBold,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
    textAlign: 'center',
  },
  savingButton: {
    alignItems: 'center',
    backgroundColor: COLORS.AMBER,
    borderRadius: RADIUS.BTN,
    justifyContent: 'center',
    marginBottom: 30,
    marginTop: 16,
    paddingVertical: 14,
  },
  formScroll: { flex: 1 },
  formContent: { paddingBottom: 30 },
  formTitle: {
    ...T.TYPE.H_TITLE,
    lineHeight: 27,
  },
  formSub: { ...T.TYPE.SUB, marginTop: 6 },
  label: { ...T.TYPE.LABEL, marginTop: 18, marginBottom: 8 },
  countrySearch: { marginTop: 8, minHeight: 36, justifyContent: 'center' },
  countrySearchText: { fontFamily: FONT.Bold, fontSize: 12, color: COLORS.AMBER_DEEP },
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
