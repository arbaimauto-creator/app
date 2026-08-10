import React, { useEffect, useState } from 'react';
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
import SplashScreen from 'react-native-splash-screen';
import Preference from 'react-native-default-preference';
import T from '../../Components/Constants/DesignTokens';
import Strings from '../../Components/Strings';
import { Btn, Chips, Wordmark } from '../../Components/UI';
import FEATURES from '../../Components/Constants/Features';
import { verifyInviteCode } from '../../api/invites';
import { logEvent, resetAnalyticsContext } from '../../api/common/analytics';

const { COLORS, FONT } = T;

// v2 §3-①②: 초대 코드 게이트. 필수 입력 3개 이하(코드·국가), 실패는 인라인 에러.
const COUNTRIES = ['US', 'JP', 'DE', 'IN', 'BR', 'VN', 'TH', 'KR'];
const COUNTRY_ITEMS = COUNTRIES.map((c) => ({ key: c, label: c }));

// 무차별 대입 완화(보안 감사 M3 — 클라 UX 가드, 실보안은 서버 레이트리밋):
// 연속 실패 시 지수 쿨다운. 서버 검증 도입 시에도 UI 스로틀로 유지.
const THROTTLE_AFTER = 5; // 연속 실패 허용 횟수
const COOLDOWN_BASE_SEC = 30;

export default function InviteGateScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [country, setCountry] = useState(null);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // 게이트가 첫 화면일 때 네이티브 스플래시 해제 (레거시는 SignInScreen이 담당)
  useEffect(() => {
    SplashScreen.hide();
  }, []);
  const [failCount, setFailCount] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const onSubmit = async () => {
    if (isVerifying) {
      return;
    }
    const now = Date.now();
    if (now < cooldownUntil) {
      setError(Strings.INVITE_THROTTLED(Math.ceil((cooldownUntil - now) / 1000)));
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
      logEvent('gate_code_submit', { result: result.reason === 'expired' ? 'expired' : 'invalid' });
      const nextFails = failCount + 1;
      setFailCount(nextFails);
      if (nextFails >= THROTTLE_AFTER) {
        // 5회부터 30초, 이후 실패마다 2배 (30→60→120…)
        const cooldownSec = COOLDOWN_BASE_SEC * Math.pow(2, nextFails - THROTTLE_AFTER);
        setCooldownUntil(Date.now() + cooldownSec * 1000);
        setError(Strings.INVITE_THROTTLED(cooldownSec));
        return;
      }
      setError(Strings.INVITE_CODE_INVALID);
      return;
    }
    setFailCount(0);
    // D26: 브랜드는 웹 리포트 전용 — 앱 진입 차단 (역할 저장 전에 안내로 종료)
    if (result.role === 'brand' && !FEATURES.BRAND_APP) {
      setError(Strings.INVITE_BRAND_WEB_ONLY);
      return;
    }
    await Preference.set('inviteRole', result.role);
    await Preference.set('inviteCode', code.trim().toUpperCase());
    await Preference.set('creatorCountry', country);
    resetAnalyticsContext(); // role·country 확정 — 공통 파라미터 갱신
    logEvent('gate_code_submit', { result: 'ok' });
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
        <Wordmark size={30} center style={styles.logo} />
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
