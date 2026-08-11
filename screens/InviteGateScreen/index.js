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
import { verifyInviteCode } from '../../api/invites';
import { logEvent, resetAnalyticsContext } from '../../api/common/analytics';
import { trace } from '../../Components/bootTrace';

const { COLORS, FONT } = T;

// v2 §3-①②: 초대 코드 게이트. 필수 입력 3개 이하(코드·국가), 실패는 인라인 에러.
const COUNTRIES = ['US', 'JP', 'DE', 'IN', 'BR', 'VN', 'TH', 'KR'];
const COUNTRY_ITEMS = COUNTRIES.map((c) => ({ key: c, label: c }));

// 무차별 대입 완화(보안 감사 M3 — 클라 UX 가드, 실보안은 서버 레이트리밋):
// 연속 실패 시 지수 쿨다운. 서버 검증 도입 시에도 UI 스로틀로 유지.
const THROTTLE_AFTER = 5; // 연속 실패 허용 횟수
const COOLDOWN_BASE_SEC = 30;

// 저장이 실패하거나 응답하지 않아도 게이트 통과를 막지 않는다.
// (릴리스에서 네이티브 응답이 없으면 버튼이 '먹통'으로 보였던 원인)
async function prefSet(key, value) {
  try {
    await Promise.race([
      Preference.set(key, String(value ?? '')),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch (e) {
    trace(`gate:pref-set-fail:${key}`);
  }
}

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
    // 국가는 게이트 입력분을 그대로 ops 골든 레코드에 실어 보낸다 (핸들은 온보딩에서 갱신)
    const result = await verifyInviteCode(code, { country });
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
    // D26 확정: 앱 초대 코드는 인플루언서 전용 — 브랜드 코드는 발급 개념 자체가 없다.
    // (브랜드=ops 웹 매직링크, 운영=ops 콘솔. 서버 연동 후 role≠influencer 응답은 방어적으로 차단)
    if (result.role !== 'influencer') {
      setError(Strings.INVITE_BRAND_WEB_ONLY);
      return;
    }
    await prefSet('inviteRole', result.role);
    await prefSet('inviteCode', code.trim().toUpperCase());
    await prefSet('creatorCountry', country);
    try {
      resetAnalyticsContext(); // role·country 확정 — 공통 파라미터 갱신
      logEvent('gate_code_submit', { result: 'ok' });
    } catch (e) {
      trace('gate:analytics-fail');
    }
    // D28: 게이트 직후 로그인 — 계정에 게이트 통과가 묶여야 기기 변경·재설치 복구가 된다.
    // 로그인 성공 시 resetToMain이 온보딩 미완이면 CreatorOnboarding으로 보낸다.
    trace('gate:navigate-signin');
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'NotSignedIn' }] }));
  };

  // 어떤 이유로든 예외가 나면 버튼이 '먹통'으로 보이지 않게 화면에 원인을 띄운다.
  const onSubmitSafe = async () => {
    try {
      await onSubmit();
    } catch (e) {
      setIsVerifying(false);
      setError(`오류: ${e?.message || String(e)}`);
    }
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
            onPress={onSubmitSafe}
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
