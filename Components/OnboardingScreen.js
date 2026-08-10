import { CommonActions } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Preference from 'react-native-default-preference';
import SplashScreen from 'react-native-splash-screen';
import { SafeAreaView } from 'react-native';
import T from './Constants/DesignTokens';
import { Card, Btn, Badge } from './UI';
import Strings from './Strings';

// 첫 실행 온보딩 — 시안 §7-1 확정 4장(자격 → 구조 → 검증 루프 → 첫 행동).
// 각 장: 중앙 흰 카드(배지 + 헤드라인 + 구분선 + 영문 카피). 완료 처리(isOnboarded)는 기존과 동일.
const { COLORS, FONT } = T;
const { width } = Dimensions.get('window');

const PAGES = () => [
  {
    label: Strings.OB_1_LABEL,
    head: Strings.OB_1_HEAD,
    sub: Strings.OB_1_SUB,
    logo: true,
  },
  {
    label: Strings.OB_2_LABEL,
    head: Strings.OB_2_HEAD,
    note: Strings.OB_2_NOTE,
    sub: Strings.OB_2_SUB,
  },
  {
    label: Strings.OB_3_LABEL,
    head: Strings.OB_3_HEAD,
    sub: Strings.OB_3_SUB,
  },
  {
    label: Strings.OB_4_LABEL,
    head: Strings.OB_4_HEAD,
    spots: Strings.OB_4_SPOTS,
    sub: Strings.OB_4_SUB,
  },
];

export default function OnboardingScreen({ navigation }) {
  const scrollRef = useRef(null);
  const [page, setPage] = useState(0);
  const pages = PAGES();
  const PAGE_COUNT = pages.length;
  const isLast = page === PAGE_COUNT - 1;

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {pages.map((p, i) => (
          <View key={i} style={[styles.page, { width }]}>
            {p.logo && (
              <Text style={styles.logo}>
                greyd
                <Text style={styles.logoDot}>.</Text>
              </Text>
            )}
            <Card style={styles.card}>
              <Badge tone="amber" text={`${i + 1} / ${PAGE_COUNT} · ${p.label}`} />
              <Text style={styles.head}>{p.head}</Text>
              {p.note != null && <Text style={styles.note}>{p.note}</Text>}
              {p.spots != null && (
                <View style={styles.spots}>
                  <Text style={styles.spotsText}>{p.spots}</Text>
                </View>
              )}
              <View style={styles.divider} />
              <Text style={styles.sub}>{p.sub}</Text>
            </Card>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {pages.map((_, i) => (
            <View key={i} style={[styles.dot, page === i && styles.dotOn]} />
          ))}
        </View>
        <View style={styles.actions}>
          {!isLast && (
            <TouchableOpacity style={styles.skip} onPress={finish}>
              <Text style={styles.skipText}>{Strings.SKIP}</Text>
            </TouchableOpacity>
          )}
          <Btn
            title={isLast ? Strings.OB_CTA : Strings.ONBOARD_NEXT}
            onPress={() => goTo(page + 1)}
            style={isLast ? styles.btnFull : styles.btnNext}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  page: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    fontFamily: FONT.ExtraBold,
    fontSize: 26,
    color: COLORS.INK,
    textAlign: 'center',
    marginBottom: 22,
    letterSpacing: -0.5,
  },
  logoDot: { color: COLORS.AMBER },
  card: {
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  head: {
    marginTop: 16,
    fontFamily: FONT.ExtraBold,
    fontSize: 17,
    lineHeight: 24,
    color: COLORS.INK,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  note: {
    marginTop: 12,
    fontFamily: FONT.Regular,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.GREY,
    textAlign: 'center',
  },
  spots: {
    marginTop: 12,
    backgroundColor: COLORS.AMBER_SOFT,
    borderRadius: T.RADIUS.BADGE,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  spotsText: {
    fontFamily: FONT.ExtraBold,
    fontSize: 12,
    color: COLORS.AMBER_DEEP,
  },
  divider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: COLORS.LINE,
    marginTop: 16,
    marginBottom: 14,
  },
  sub: {
    fontFamily: FONT.Regular,
    fontSize: 10.5,
    lineHeight: 15,
    color: COLORS.GREY,
    textAlign: 'center',
  },
  footer: { paddingHorizontal: 24, paddingBottom: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 18 },
  dot: {
    width: 15,
    height: 15,
    borderRadius: 999,
    backgroundColor: COLORS.TRACK,
    marginHorizontal: 5,
  },
  dotOn: { backgroundColor: COLORS.AMBER },
  actions: { flexDirection: 'row', alignItems: 'center' },
  skip: { paddingVertical: 12, paddingRight: 18 },
  skipText: {
    fontFamily: FONT.Regular,
    fontSize: 13,
    color: COLORS.GREY,
  },
  btnNext: { flex: 1 },
  btnFull: { flex: 1 },
});
