import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';

// v2 §5-1: 브랜드 입장 온보딩 1장 — "관전자+평가자" 역할 기대치 세팅.
export default function BrandWelcome({ route, navigation }) {
  const brandName = route.params?.brandName || '';
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.emoji}>🤝</Text>
        <Text style={styles.title}>{Strings.BRAND_WELCOME_T(brandName)}</Text>
        <Text style={styles.text}>{Strings.BRAND_WELCOME_B}</Text>
        <View style={styles.list}>
          <Text style={styles.item}>{Strings.BRAND_WELCOME_1}</Text>
          <Text style={styles.item}>{Strings.BRAND_WELCOME_2}</Text>
          <Text style={styles.item}>{Strings.BRAND_WELCOME_3}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.cta}
        onPress={() =>
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainBottom' }] }))
        }
      >
        <Text style={styles.ctaText}>{Strings.BRAND_WELCOME_CTA}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Constants.COLOR_BACKGROUND_DARK, padding: 28 },
  body: { flex: 1, justifyContent: 'center' },
  emoji: { fontSize: 44, marginBottom: 16 },
  title: {
    fontSize: 25,
    lineHeight: 35,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    color: Constants.TIER_COLORS.ARTISAN,
  },
  text: { marginTop: 14, fontSize: 15, lineHeight: 24, color: Constants.TIER_COLORS.STRIVER },
  list: { marginTop: 20 },
  item: { fontSize: 14.5, lineHeight: 27, color: Constants.TIER_COLORS.ARTISAN },
  cta: {
    backgroundColor: Constants.COLOR_MAIN,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaText: { fontSize: 16, fontWeight: '800', color: '#16130d' },
});
