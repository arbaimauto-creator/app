import React from 'react';
import { Linking, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import T from '../../Components/Constants/DesignTokens';
import { Card, Btn } from '../../Components/UI';
import Strings from '../../Components/Strings';
import FEATURES from '../../Components/Constants/Features';

const { COLORS, FONT } = T;

// v2 §5-1: 브랜드 입장 안내 1장.
// D26: 브랜드 퍼널은 앱에서 제외 — 평가·리포트는 웹(담당 애널리스트가 링크 발송).
// BRAND_APP 플래그 복원 시 기존 앱 진입(MainBottom)으로 되돌아간다.
export default function BrandWelcome({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Card style={styles.heroCard}>
          <Text style={styles.emoji}>🤝</Text>
          <Text style={styles.title}>{Strings.BRAND_WELCOME_TITLE}</Text>
          <Text style={styles.sub}>
            {FEATURES.BRAND_APP ? Strings.BRAND_WELCOME_SUB : Strings.BRAND_WEB_SUB}
          </Text>
        </Card>

        <Card style={styles.analystCard}>
          <Text style={styles.analystLabel}>{Strings.BRAND_ANALYST_LABEL}</Text>
          <View style={styles.analystRow}>
            <View style={styles.analystDot} />
            <Text style={styles.analystName}>{Strings.BRAND_ANALYST_NAME}</Text>
            <Text style={styles.analystSla}>{Strings.BRAND_ANALYST_SLA}</Text>
          </View>
        </Card>
      </View>

      {FEATURES.BRAND_APP ? (
        <Btn
          title={Strings.BRAND_WELCOME_CTA}
          onPress={() =>
            navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainBottom' }] }))
          }
          style={{ marginBottom: 12 }}
        />
      ) : (
        <Btn
          title={Strings.BRAND_WEB_CTA}
          onPress={() => Linking.openURL('mailto:hello@greyd.app')}
          style={{ marginBottom: 12 }}
        />
      )}
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
