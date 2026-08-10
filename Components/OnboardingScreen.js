import { CommonActions } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Preference from 'react-native-default-preference';
import SplashScreen from 'react-native-splash-screen';
import { SafeAreaView } from 'react-native';
import Constants from './Constants';
import Strings from './Strings';

// 첫 실행 온보딩 — 퍼널(초대→신청→배송→설문·업로드→평가·보상)을 이해시키는 5장.
// 구형 CDN 이미지 튜토리얼(홈 탭 조작법 안내)을 대체한다. 완료 처리(isOnboarded)는 기존과 동일.
const { width } = Dimensions.get('window');

const FUNNEL_STEPS = () => [
  { n: 1, icon: '✉️', title: Strings.OB_STEP1_T, body: Strings.OB_STEP1_B },
  { n: 2, icon: '🎁', title: Strings.OB_STEP2_T, body: Strings.OB_STEP2_B },
  { n: 3, icon: '✈️', title: Strings.OB_STEP3_T, body: Strings.OB_STEP3_B },
  { n: 4, icon: '🎬', title: Strings.OB_STEP4_T, body: Strings.OB_STEP4_B },
  { n: 5, icon: '🏆', title: Strings.OB_STEP5_T, body: Strings.OB_STEP5_B },
];

export default function OnboardingScreen({ navigation }) {
  const scrollRef = useRef(null);
  const [page, setPage] = useState(0);
  const PAGE_COUNT = 5;

  useEffect(() => {
    SplashScreen.hide();
  }, []);

  const finish = () => {
    Preference.set('isOnboarded', 'true');
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: 'Main' }],
      }),
    );
  };

  const goTo = (idx) => {
    if (idx >= PAGE_COUNT) {
      finish();
      return;
    }
    setPage(idx);
    scrollRef.current?.scrollTo({ x: idx * width, animated: true });
  };

  const Page = ({ children }) => <View style={[styles.page, { width }]}>{children}</View>;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={finish}>
        <Text style={styles.skipText}>{Strings.SKIP}</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setPage(Math.round(e.nativeEvent.contentOffset.x / width))
        }
      >
        {/* 1. 환영 — greyd가 뭐 하는 곳인지 */}
        <Page>
          <View style={styles.center}>
            <Image
              source={require('../Resources/img/icGreydSplashSymbol126.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>{Strings.OB_WELCOME_T}</Text>
            <Text style={styles.body}>{Strings.OB_WELCOME_B}</Text>
          </View>
        </Page>

        {/* 2. 퍼널 전체 그림 — 5단계 */}
        <Page>
          <Text style={styles.pageHeading}>{Strings.OB_FUNNEL_T}</Text>
          <Text style={styles.pageSub}>{Strings.OB_FUNNEL_B}</Text>
          <View style={{ marginTop: 18 }}>
            {FUNNEL_STEPS().map((s) => (
              <View key={s.n} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{s.n}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>
                    {s.icon} {s.title}
                  </Text>
                  <Text style={styles.stepBody}>{s.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </Page>

        {/* 3. 솔직함 원칙 */}
        <Page>
          <View style={styles.center}>
            <Text style={styles.bigEmoji}>🤍</Text>
            <Text style={styles.title}>{Strings.OB_HONEST_T}</Text>
            <Text style={styles.body}>{Strings.OB_HONEST_B}</Text>
            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>{Strings.OB_HONEST_QUOTE}</Text>
            </View>
          </View>
        </Page>

        {/* 4. 성장 — G-스코어와 보상 */}
        <Page>
          <View style={styles.center}>
            <Text style={styles.bigEmoji}>📈</Text>
            <Text style={styles.title}>{Strings.OB_GROW_T}</Text>
            <Text style={styles.body}>{Strings.OB_GROW_B}</Text>
            <View style={styles.growList}>
              <Text style={styles.growItem}>{Strings.OB_GROW_1}</Text>
              <Text style={styles.growItem}>{Strings.OB_GROW_2}</Text>
              <Text style={styles.growItem}>{Strings.OB_GROW_3}</Text>
            </View>
          </View>
        </Page>

        {/* 5. 시작 — 코드 안내 */}
        <Page>
          <View style={styles.center}>
            <Text style={styles.bigEmoji}>🔑</Text>
            <Text style={styles.title}>{Strings.OB_READY_T}</Text>
            <Text style={styles.body}>{Strings.OB_READY_B}</Text>
          </View>
        </Page>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {Array.from({ length: PAGE_COUNT }).map((_, i) => (
            <View key={i} style={[styles.dot, page === i && styles.dotOn]} />
          ))}
        </View>
        <TouchableOpacity style={styles.next} onPress={() => goTo(page + 1)}>
          <Text style={styles.nextText}>
            {page === PAGE_COUNT - 1 ? Strings.START : Strings.ONBOARD_NEXT}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Constants.COLOR_BACKGROUND_DARK },
  skip: { position: 'absolute', top: 18, right: 22, zIndex: 10, padding: 8 },
  skipText: { fontSize: 14, color: Constants.TIER_COLORS.STRIVER },
  page: { flex: 1, paddingHorizontal: 28, paddingTop: 70, paddingBottom: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
  logo: { width: 64, height: 64, marginBottom: 20 },
  bigEmoji: { fontSize: 44, marginBottom: 16 },
  title: {
    fontSize: 26,
    lineHeight: 36,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    color: Constants.TIER_COLORS.ARTISAN,
  },
  body: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 24,
    color: Constants.TIER_COLORS.STRIVER,
  },
  pageHeading: {
    fontSize: 24,
    lineHeight: 33,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    color: Constants.TIER_COLORS.ARTISAN,
  },
  pageSub: { marginTop: 8, fontSize: 14, lineHeight: 21, color: Constants.TIER_COLORS.STRIVER },
  stepRow: { flexDirection: 'row', marginBottom: 16 },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 14,
    backgroundColor: Constants.COLOR_MAIN,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumText: { fontSize: 13, fontWeight: '900', color: '#16130d' },
  stepTitle: { fontSize: 15.5, fontWeight: '700', color: Constants.TIER_COLORS.ARTISAN },
  stepBody: { fontSize: 13, lineHeight: 19, color: Constants.TIER_COLORS.STRIVER, marginTop: 3 },
  quoteBox: {
    marginTop: 20,
    backgroundColor: '#26231d',
    borderLeftWidth: 4,
    borderLeftColor: Constants.COLOR_MAIN,
    borderRadius: 10,
    padding: 16,
  },
  quoteText: { fontSize: 14, lineHeight: 22, color: '#f4f1ea' },
  growList: { marginTop: 18 },
  growItem: {
    fontSize: 14.5,
    lineHeight: 26,
    color: Constants.TIER_COLORS.ARTISAN,
  },
  footer: { paddingHorizontal: 28, paddingBottom: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 14 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#d8d5cf', marginHorizontal: 4 },
  dotOn: { backgroundColor: Constants.COLOR_MAIN, width: 18 },
  next: {
    backgroundColor: Constants.COLOR_MAIN,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  nextText: { fontSize: 16, fontWeight: '800', color: '#16130d' },
});
