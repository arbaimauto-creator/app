import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import T from '../../Components/Constants/DesignTokens';
import { Card, Btn } from '../../Components/UI';
import Strings from '../../Components/Strings';

const { COLORS, FONT } = T;

// v2 §5-1: 브랜드 입장 온보딩 1장 — "관전자+평가자" 역할 기대치 세팅.
export default function BrandWelcome({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Card style={styles.heroCard}>
          <Text style={styles.emoji}>🤝</Text>
          <Text style={styles.title}>{'캠페인은 ARBAIM이\n개설하고 운영합니다.'}</Text>
          <Text style={styles.sub}>
            {'결과를 보고, 평가만 하세요.\n크리에이터 관리·배송·CS 전부 저희 몫입니다.'}
          </Text>
        </Card>

        <Card style={styles.analystCard}>
          <Text style={styles.analystLabel}>담당 애널리스트</Text>
          <View style={styles.analystRow}>
            <View style={styles.analystDot} />
            <Text style={styles.analystName}>김소연 · ARBAIM</Text>
            <Text style={styles.analystSla}>평가 응답 ≤ 7일</Text>
          </View>
        </Card>
      </View>

      <Btn
        title={Strings.BRAND_WELCOME_CTA}
        onPress={() =>
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainBottom' }] }))
        }
        style={{ marginBottom: 12 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG, padding: 20 },
  body: { flex: 1, justifyContent: 'center' },
  heroCard: { paddingVertical: 24, paddingHorizontal: 18, alignItems: 'center' },
  emoji: { fontSize: 26, marginBottom: 10 },
  title: {
    fontFamily: FONT.ExtraBold,
    fontSize: 16.5,
    lineHeight: 24,
    color: COLORS.INK,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  sub: {
    marginTop: 10,
    fontFamily: FONT.Regular,
    fontSize: 11.5,
    lineHeight: 18,
    color: COLORS.GREY,
    textAlign: 'center',
  },
  analystCard: { marginTop: 10 },
  analystLabel: { ...T.TYPE.XS },
  analystRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  analystDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.AMBER,
    marginRight: 9,
  },
  analystName: { flex: 1, fontFamily: FONT.Bold, fontSize: 13, color: COLORS.INK },
  analystSla: { ...T.TYPE.XS },
});
