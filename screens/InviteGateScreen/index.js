import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import Preference from 'react-native-default-preference';
import T from '../../Components/Constants/DesignTokens';
import Strings from '../../Components/Strings';
import { Btn, Chips } from '../../Components/UI';
import { verifyInviteCode } from '../../api/invites';

const { COLORS, FONT } = T;

// v2 §3-①②: 초대 코드 게이트. 필수 입력 3개 이하(코드·국가), 실패는 인라인 에러.
const COUNTRIES = ['US', 'JP', 'DE', 'IN', 'BR', 'VN', 'TH', 'KR'];
const COUNTRY_ITEMS = COUNTRIES.map((c) => ({ key: c, label: c }));

export default function InviteGateScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [country, setCountry] = useState(null);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const onSubmit = async () => {
    if (isVerifying) {
      return;
    }
    setError('');
    if (code.trim().length < 6) {
      setError(Strings.INVITE_CODE_FORMAT_ERROR);
      return;
    }
    if (!country) {
      setError(Strings.INVITE_COUNTRY_REQUIRED);
      return;
    }
    setIsVerifying(true);
    const result = await verifyInviteCode(code);
    setIsVerifying(false);
    if (!result.success) {
      setError(Strings.INVITE_CODE_INVALID);
      return;
    }
    await Preference.set('inviteRole', result.role);
    await Preference.set('inviteCode', code.trim().toUpperCase());
    await Preference.set('creatorCountry', country);
    if (result.brandId) {
      await Preference.set('inviteBrandId', result.brandId);
      await Preference.set('inviteBrandName', result.brandName || '');
    }
    // 크리에이터는 온보딩으로, 브랜드는 역할 안내 1장(BrandWelcome)으로
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          result.role === 'influencer'
            ? { name: 'CreatorOnboarding' }
            : { name: 'BrandWelcome', params: { brandName: result.brandName } },
        ],
      }),
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={styles.inner}
      >
        <Text style={styles.logo}>
          greyd
          <Text style={styles.logoDot}>.</Text>
        </Text>
        <Text style={styles.title}>{Strings.INVITE_GATE_TITLE}</Text>
        <Text style={styles.subtitle}>{Strings.INVITE_GATE_SUBTITLE}</Text>

        <TextInput
          style={styles.codeInput}
          placeholder={Strings.INVITE_CODE_PLACEHOLDER}
          placeholderTextColor={COLORS.GREY}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          value={code}
          onChangeText={(v) => {
            setCode(v);
            setError('');
          }}
        />

        <Text style={styles.countryLabel}>{Strings.INVITE_COUNTRY_LABEL}</Text>
        <Chips
          items={COUNTRY_ITEMS}
          selected={country}
          onSelect={(k) => {
            setCountry(k);
            setError('');
          }}
          style={styles.countryRow}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isVerifying ? (
          <View style={styles.submitLoading}>
            <ActivityIndicator color={COLORS.ON_AMBER} />
          </View>
        ) : (
          <Btn
            title={Strings.INVITE_SUBMIT}
            onPress={onSubmit}
            disabled={!code || !country}
            style={styles.submit}
          />
        )}

        <Text style={styles.help}>{Strings.INVITE_NO_CODE_HELP}</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  inner: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },
  logo: {
    fontFamily: FONT.Black,
    fontSize: 30,
    color: COLORS.INK,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  logoDot: { color: COLORS.AMBER, fontFamily: FONT.Black },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: FONT.ExtraBold,
    color: COLORS.INK,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subtitle: {
    ...T.TYPE.SUB,
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 26,
  },
  codeInput: {
    borderWidth: 1.5,
    borderColor: COLORS.AMBER,
    borderRadius: 9,
    paddingVertical: 14,
    fontSize: 22,
    letterSpacing: 10,
    textAlign: 'center',
    color: COLORS.INK,
    fontFamily: FONT.ExtraBold,
    backgroundColor: COLORS.AMBER_FAINT,
  },
  countryLabel: {
    ...T.TYPE.LABEL,
    marginTop: 22,
    marginBottom: 9,
  },
  countryRow: { justifyContent: 'flex-start' },
  error: { marginTop: 14, color: COLORS.RED, fontSize: 12, fontFamily: FONT.SemiBold },
  submit: { marginTop: 24, paddingVertical: 14 },
  submitLoading: {
    marginTop: 24,
    backgroundColor: COLORS.AMBER,
    borderRadius: T.RADIUS.BTN,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  help: {
    ...T.TYPE.XS,
    marginTop: 18,
    textAlign: 'center',
    lineHeight: 16,
  },
});
