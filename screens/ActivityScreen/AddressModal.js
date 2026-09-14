import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import T from '../../Components/Constants/DesignTokens';
import { Badge } from '../../Components/UI';
import Strings from '../../Components/Strings';
import { getSavedAddress, saveSavedAddress } from '../../api/address';

const { COLORS, RADIUS, FONT, TYPE } = T;
const PRIVACY_POLICY_URL = 'https://greyd-ops.vercel.app/portal/privacy';

// v2 §3-⑤ · 시안 12: 승인 직후 주소 수집 — 48시간 데드라인, 미입력 취소는 무페널티(문구만).
export default function AddressModal({ visible, initial, onSubmit, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [line, setLine] = useState(initial?.line || '');
  // 글로벌 주소 포맷 (계획서 TSK-006): 도시/주·도/우편번호를 분리 수집
  const [city, setCity] = useState(initial?.city || '');
  const [stateProvince, setStateProvince] = useState(initial?.state || '');
  const [postalCode, setPostalCode] = useState(initial?.postalCode || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  // 개인정보 수집·이용 동의(2026-09-09) — 매번 새로 받는다(저장된 주소 프리필과 무관). 서버도 다시 검사한다.
  const [privacyAgree, setPrivacyAgree] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const submitLockRef = useRef(false);

  const fillFrom = (a) => {
    setName(a?.name || '');
    setLine(a?.line || '');
    setCity(a?.city || '');
    setStateProvince(a?.state || '');
    setPostalCode(a?.postalCode || '');
    setPhone(a?.phone || '');
  };

  // 시안 12: 열릴 때 initial이 비어 있으면 저장된 기본 배송지로 프리필
  useEffect(() => {
    if (!visible) {
      submitLockRef.current = false;
      setIsSaving(false);
      setSaveError('');
      setPrivacyAgree(false);
      return;
    }
    if (initial && (initial.name || initial.line)) {
      fillFrom(initial);
      return;
    }
    getSavedAddress().then((saved) => {
      if (saved) {
        fillFrom(saved);
      }
    });
  }, [visible, initial]);

  const canSubmit =
    name.trim() && line.trim() && city.trim() && postalCode.trim() && phone.trim() && privacyAgree;

  const submit = async () => {
    if (!canSubmit || submitLockRef.current) {
      return;
    }
    submitLockRef.current = true;
    setIsSaving(true);
    setSaveError('');
    const address = {
      name: name.trim(),
      line: line.trim(),
      city: city.trim(),
      state: stateProvince.trim(),
      postalCode: postalCode.trim(),
      phone: phone.trim(),
    };
    try {
      // 다음 캠페인 자동 입력용 기본 배송지 저장 — 동의 플래그는 저장하지 않는다(캠페인마다 새로 받음)
      await saveSavedAddress(address);
      await onSubmit({ ...address, privacyAgree: true });
    } catch (e) {
      setSaveError(Strings.ADDRESS_SAVE_ERROR);
    } finally {
      submitLockRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!isSaving) {
          onClose();
        }
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={styles.backdrop}
      >
        <View style={styles.sheet}>
          <View style={styles.grabBar} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{Strings.ADDRESS_MODAL_TITLE}</Text>
              <Badge tone="red" text={Strings.ADDRESS_48H_BADGE} />
            </View>
            <Text style={styles.deadline}>{Strings.ADDRESS_MODAL_DEADLINE}</Text>

            <Text style={styles.label}>{Strings.ADDRESS_NAME}</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
            <Text style={styles.label}>{Strings.ADDRESS_LINE}</Text>
            <TextInput style={styles.input} value={line} onChangeText={setLine} />
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>{Strings.ADDRESS_CITY}</Text>
                <TextInput style={styles.input} value={city} onChangeText={setCity} />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>{Strings.ADDRESS_STATE}</Text>
                <TextInput
                  style={styles.input}
                  value={stateProvince}
                  onChangeText={setStateProvince}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>{Strings.ADDRESS_POSTAL}</Text>
                <TextInput
                  style={styles.input}
                  autoCapitalize="characters"
                  value={postalCode}
                  onChangeText={setPostalCode}
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>{Strings.ADDRESS_PHONE}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.consentRow}
              onPress={() => setPrivacyAgree((v) => !v)}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: privacyAgree }}
              testID="address-privacy-consent"
            >
              <View style={[styles.checkbox, privacyAgree && styles.checkboxOn]}>
                {privacyAgree ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.consentText}>{Strings.ADDRESS_PRIVACY_CONSENT}</Text>
            </TouchableOpacity>
            {/* 링크는 체크박스 터치 영역 밖에 둔다 — 안에 있으면 탭 한 번에 열림+토글이 같이 일어난다 */}
            <Text
              style={[styles.consentLink, styles.consentLinkRow]}
              onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})}
            >
              {Strings.ADDRESS_PRIVACY_LINK}
            </Text>

            {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
            <TouchableOpacity
              style={[styles.submit, (!canSubmit || isSaving) && styles.submitDisabled]}
              disabled={!canSubmit || isSaving}
              onPress={submit}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator color={COLORS.ON_AMBER} />
              ) : (
                <Text style={styles.submitText}>{Strings.ADDRESS_SAVE_AUTOFILL}</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.customsNote}>{Strings.ADDRESS_CUSTOMS_NOTE}</Text>
            <TouchableOpacity style={styles.close} onPress={onClose} disabled={isSaving}>
              <Text style={styles.closeText}>{Strings.CANCEL}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  consentLinkRow: { marginTop: 4, marginBottom: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: RADIUS.SHEET,
    borderTopRightRadius: RADIUS.SHEET,
    padding: 20,
    paddingBottom: 30,
    maxHeight: '92%',
    ...T.SHADOW_SHEET,
  },
  grabBar: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD9D2',
    marginBottom: 14,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: FONT.ExtraBold, fontSize: 14.5, color: COLORS.INK, letterSpacing: -0.2 },
  deadline: { ...TYPE.XS, marginTop: 6, marginBottom: 14, lineHeight: 15 },
  label: { fontFamily: FONT.Bold, fontSize: 11, color: COLORS.INK, marginBottom: 5 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    borderRadius: RADIUS.FIELD,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontFamily: FONT.Regular,
    fontSize: 13,
    backgroundColor: COLORS.SURFACE,
    color: COLORS.INK,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 8 },
  rowItem: { flex: 1 },
  submit: {
    backgroundColor: COLORS.AMBER,
    borderRadius: RADIUS.BTN,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  submitDisabled: { opacity: 0.45 },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
    marginBottom: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: COLORS.AMBER, borderColor: COLORS.AMBER },
  checkmark: { fontFamily: FONT.ExtraBold, fontSize: 12, color: COLORS.ON_AMBER, lineHeight: 14 },
  consentText: { ...TYPE.XS, flex: 1, lineHeight: 16, color: COLORS.INK },
  consentLink: { fontFamily: FONT.SemiBold, textDecorationLine: 'underline', color: COLORS.INK },
  submitText: { fontFamily: FONT.ExtraBold, fontSize: 13.5, color: COLORS.ON_AMBER },
  saveError: { ...TYPE.XS, color: COLORS.RED, marginTop: 4, textAlign: 'center' },
  customsNote: { ...TYPE.XS, marginTop: 10, lineHeight: 15 },
  close: { alignItems: 'center', paddingVertical: 11, marginTop: 2 },
  closeText: { fontFamily: FONT.SemiBold, fontSize: 13, color: COLORS.GREY },
});
