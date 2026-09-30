// 본인확인 화면 (2026-09-16, 기획서 §5.4) — 이메일 → 6자리 코드 → 완료.
// 코드는 서버에서 해시로만 보관되고 10분 유효. 실패 사유는 사용자 언어로 한 줄씩 알려준다.
import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  VERIFY_ERROR,
  confirmVerify,
  getVerifyStatus,
  isValidEmail,
  startVerify,
} from '../api/verify';
import { saveCreatorProfile } from '../api/creators';
import T from './Constants/DesignTokens';
import Strings from './Strings';
import { Btn, Card, NoteBox } from './UI';

const { COLORS, FONT, RADIUS } = T;

const ERROR_TEXT = {
  [VERIFY_ERROR.BAD_EMAIL]: () => Strings.VERIFY_ERR_EMAIL,
  [VERIFY_ERROR.TOO_SOON]: () => Strings.VERIFY_ERR_TOO_SOON,
  [VERIFY_ERROR.EXPIRED]: () => Strings.VERIFY_ERR_EXPIRED,
  [VERIFY_ERROR.LOCKED]: () => Strings.VERIFY_ERR_LOCKED,
  [VERIFY_ERROR.MAIL_FAILED]: () => Strings.VERIFY_ERR_MAIL,
  [VERIFY_ERROR.OFFLINE]: () => Strings.VERIFY_ERR_OFFLINE,
};

export default class IdentityVerifyScreen extends React.Component {
  state = { step: 'email', email: '', code: '', busy: false, sentTo: '' };

  async componentDidMount() {
    const status = await getVerifyStatus();
    if (status?.verifiedAt) {
      this.setState({ step: 'done' });
    } else if (status?.pending?.target) {
      this.setState({ step: 'code', sentTo: status.pending.target, email: status.pending.target });
    } else if (status?.email) {
      this.setState({ email: status.email });
    }
  }

  showError = (e) => {
    if (e?.code === VERIFY_ERROR.MISMATCH) {
      Alert.alert(Strings.VERIFY_ERR_MISMATCH(e.attemptsLeft ?? 0), '', [{ text: Strings.OK }]);
      return;
    }
    const text = (ERROR_TEXT[e?.code] || ERROR_TEXT[VERIFY_ERROR.OFFLINE])();
    Alert.alert(text, '', [{ text: Strings.OK }]);
  };

  onSend = async () => {
    const { email } = this.state;
    if (!isValidEmail(email)) {
      Alert.alert(Strings.VERIFY_ERR_EMAIL, '', [{ text: Strings.OK }]);
      return;
    }
    this.setState({ busy: true });
    try {
      await startVerify(email);
      this.setState({ step: 'code', sentTo: email.trim().toLowerCase(), code: '' });
    } catch (e) {
      this.showError(e);
    } finally {
      this.setState({ busy: false });
    }
  };

  onConfirm = async () => {
    const digits = this.state.code.replace(/\D/g, '');
    if (digits.length !== 6) {
      Alert.alert(Strings.VERIFY_ERR_CODE_LENGTH, '', [{ text: Strings.OK }]);
      return;
    }
    this.setState({ busy: true });
    try {
      const res = await confirmVerify(digits);
      // 마이페이지 신뢰 지표가 서버 왕복 없이 바로 '완료'로 보이게 로컬에도 적는다
      await saveCreatorProfile({ identityVerifiedAt: res?.verifiedAt || new Date().toISOString() });
      this.setState({ step: 'done' });
      const onDone = this.props.route.params?.onDone;
      if (onDone) {
        onDone();
      }
    } catch (e) {
      this.showError(e);
    } finally {
      this.setState({ busy: false });
    }
  };

  render() {
    const { step, email, code, busy, sentTo } = this.state;

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{Strings.VERIFY_TITLE}</Text>
          <Text style={styles.intro}>{Strings.VERIFY_INTRO}</Text>

          {step === 'done' ? (
            <NoteBox text={Strings.VERIFY_DONE} />
          ) : (
            <Card style={styles.card}>
              <Text style={styles.label}>{Strings.VERIFY_EMAIL_LABEL}</Text>
              <TextInput
                style={[styles.input, step === 'code' && styles.inputMuted]}
                value={email}
                editable={step === 'email' && !busy}
                onChangeText={(v) => this.setState({ email: v })}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="name@example.com"
                placeholderTextColor={COLORS.GREY}
                accessibilityLabel={Strings.VERIFY_EMAIL_LABEL}
              />

              {step === 'email' ? (
                <Btn
                  title={Strings.VERIFY_SEND_CODE}
                  onPress={this.onSend}
                  loading={busy}
                  disabled={busy}
                  style={styles.btn}
                />
              ) : (
                <>
                  <Text style={styles.sent}>{Strings.VERIFY_SENT(sentTo)}</Text>
                  <Text style={styles.label}>{Strings.VERIFY_CODE_LABEL}</Text>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    value={code}
                    onChangeText={(v) => this.setState({ code: v.replace(/\D/g, '').slice(0, 6) })}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="000000"
                    placeholderTextColor={COLORS.GREY}
                    accessibilityLabel={Strings.VERIFY_CODE_LABEL}
                  />
                  <Btn
                    title={Strings.VERIFY_CONFIRM}
                    onPress={this.onConfirm}
                    loading={busy}
                    disabled={busy}
                    style={styles.btn}
                  />
                  <Btn
                    title={Strings.VERIFY_RESEND}
                    variant="ghost"
                    onPress={() => this.setState({ step: 'email', code: '' })}
                    disabled={busy}
                    style={styles.btnSecondary}
                  />
                </>
              )}
            </Card>
          )}

          <Text style={styles.foot}>{Strings.VERIFY_PRIVACY_NOTE}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  title: { fontFamily: FONT.ExtraBold, fontSize: 20, color: COLORS.INK },
  intro: { fontFamily: FONT.Regular, fontSize: 13, lineHeight: 19, color: COLORS.GREY },
  card: { padding: 14, gap: 8 },
  label: { fontFamily: FONT.Medium, fontSize: 11.5, color: COLORS.GREY },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: COLORS.LINE,
    borderRadius: RADIUS.FIELD,
    paddingHorizontal: 12,
    fontFamily: FONT.Regular,
    fontSize: 14,
    color: COLORS.INK,
    backgroundColor: COLORS.SURFACE,
  },
  inputMuted: { color: COLORS.GREY, backgroundColor: COLORS.BG },
  codeInput: { fontFamily: T.SERIF.Bold, fontSize: 25, letterSpacing: 6, textAlign: 'center' },
  sent: { fontFamily: FONT.Regular, fontSize: 12, color: COLORS.AMBER_DEEP, marginTop: 2 },
  btn: { marginTop: 6 },
  btnSecondary: { marginTop: 2 },
  foot: { fontFamily: FONT.Regular, fontSize: 11, lineHeight: 16, color: COLORS.GREY },
});
