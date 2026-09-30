// 판매자 모드 진입 — 브랜드 코드 입력 (2026-09-23)
// 마이 탭 "판매자 모드"에서 진입. 아르바임이 제공한 코드를 검증하고 성공 시 판매자 모드로 승격.
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import T from '../../Components/Constants/DesignTokens';
import { Btn, Card, GlassOrbs } from '../../Components/UI';
import Strings from '../../Components/Strings';
import { verifyBrandCode, enterSellerMode } from '../../api/brandCode';

const { COLORS, FONT, RADIUS, TYPE } = T;

export default function BrandCodeEntry({ navigation }) {
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);

  const onSubmit = async () => {
    if (!code.trim() || checking) {
      return;
    }
    setChecking(true);
    try {
      const res = await verifyBrandCode(code);
      if (!res.success) {
        const msg =
          res.reason === 'service_unavailable'
            ? Strings.RETRY_GUIDELINES
            : Strings.BRAND_CODE_INVALID;
        Alert.alert(Strings.BRAND_CODE_TITLE, msg);
        return;
      }
      await enterSellerMode(res);
      Alert.alert(
        Strings.SELLER_MODE_SWITCH,
        `${res.brandName ? res.brandName + ' · ' : ''}${Strings.SELLER_MODE_RESTART}`,
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <GlassOrbs />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{Strings.BRAND_CODE_TITLE}</Text>
      </View>
      <View style={styles.body}>
        <Card>
          <Text style={styles.desc}>{Strings.BRAND_CODE_DESC}</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder={Strings.BRAND_CODE_PH}
            placeholderTextColor={COLORS.GREY}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Btn
            title={checking ? '' : Strings.BRAND_CODE_SUBMIT}
            onPress={onSubmit}
            disabled={!code.trim() || checking}
            style={styles.submit}
          />
          {checking ? (
            <ActivityIndicator color={COLORS.AMBER} style={styles.spinner} />
          ) : null}
          <Text style={styles.hint}>{Strings.BRAND_CODE_HINT}</Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  back: { fontFamily: FONT.Bold, fontSize: 26, color: COLORS.INK, lineHeight: 28 },
  headerTitle: { fontFamily: FONT.ExtraBold, fontSize: 18, color: COLORS.INK },
  body: { padding: 16 },
  desc: { ...TYPE.BODY, marginBottom: 12 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    borderRadius: RADIUS.FIELD,
    backgroundColor: COLORS.SURFACE,
    paddingVertical: 12,
    paddingHorizontal: 13,
    color: COLORS.INK,
    fontFamily: T.LATIN.Bold,
    fontSize: 15,
    letterSpacing: 1,
  },
  submit: { marginTop: 14 },
  spinner: { marginTop: 10 },
  hint: { ...TYPE.XS, marginTop: 12, lineHeight: 15 },
});
