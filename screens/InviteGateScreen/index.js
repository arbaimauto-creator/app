import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
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
import { verifyInviteCode } from '../../api/invites';

// v2 §3-①②: 초대 코드 게이트. 필수 입력 3개 이하(코드·국가), 실패는 인라인 에러.
const COUNTRIES = ['US', 'JP', 'DE', 'IN', 'BR', 'VN', 'TH', 'KR'];

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
    // 크리에이터는 온보딩으로, 브랜드는 곧장 메인(브랜드 셸)으로
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          result.role === 'influencer' ? { name: 'CreatorOnboarding' } : { name: 'MainBottom' },
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
        <Image
          source={require('../../Resources/img/icGreydSplashSymbol126.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>{Strings.INVITE_GATE_TITLE}</Text>
        <Text style={styles.subtitle}>{Strings.INVITE_GATE_SUBTITLE}</Text>

        <TextInput
          style={styles.codeInput}
          placeholder={Strings.INVITE_CODE_PLACEHOLDER}
          placeholderTextColor={Constants.TIER_COLORS.STRIVER}
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
        <View style={styles.countryRow}>
          {COUNTRIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.countryChip, country === c && styles.countryChipOn]}
              onPress={() => {
                setCountry(c);
                setError('');
              }}
            >
              <Text style={[styles.countryChipText, country === c && styles.countryChipTextOn]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.submit, (!code || !country) && styles.submitDisabled]}
          disabled={!code || !country || isVerifying}
          onPress={onSubmit}
        >
          {isVerifying ? (
            <ActivityIndicator color="#16130d" />
          ) : (
            <Text style={styles.submitText}>{Strings.INVITE_SUBMIT}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.help}>{Strings.INVITE_NO_CODE_HELP}</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Constants.COLOR_BACKGROUND_DARK },
  inner: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },
  logo: { width: 72, height: 72, alignSelf: 'center', marginBottom: 18 },
  title: {
    fontSize: 22,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    color: Constants.TIER_COLORS.ARTISAN,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Constants.TIER_COLORS.STRIVER,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  codeInput: {
    borderWidth: 1.5,
    borderColor: Constants.COLOR_MAIN,
    borderRadius: 12,
    paddingVertical: 14,
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    color: Constants.TIER_COLORS.ARTISAN,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
    backgroundColor: '#fff',
  },
  countryLabel: {
    marginTop: 22,
    marginBottom: 8,
    fontSize: 13,
    color: Constants.TIER_COLORS.STRIVER,
  },
  countryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  countryChip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  countryChipOn: { backgroundColor: Constants.COLOR_MAIN, borderColor: Constants.COLOR_MAIN },
  countryChipText: { fontSize: 13, color: Constants.TIER_COLORS.ARTISAN },
  countryChipTextOn: { fontWeight: '800', color: '#16130d' },
  error: { marginTop: 14, color: '#d33', fontSize: 13 },
  submit: {
    marginTop: 24,
    backgroundColor: Constants.COLOR_MAIN,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { fontSize: 16, fontWeight: '800', color: '#16130d' },
  help: {
    marginTop: 18,
    fontSize: 12.5,
    color: Constants.TIER_COLORS.STRIVER,
    textAlign: 'center',
    lineHeight: 19,
  },
});
