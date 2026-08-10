import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
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

// v2 §3-⑤ · 시안 12: 승인 직후 주소 수집 — 48시간 데드라인, 미입력 취소는 무페널티(문구만).
export default function AddressModal({ visible, initial, onSubmit, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [line, setLine] = useState(initial?.line || '');
  // 글로벌 주소 포맷 (계획서 TSK-006): 도시/주·도/우편번호를 분리 수집
  const [city, setCity] = useState(initial?.city || '');
  const [stateProvince, setStateProvince] = useState(initial?.state || '');
  const [postalCode, setPostalCode] = useState(initial?.postalCode || '');
  const [phone, setPhone] = useState(initial?.phone || '');

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

  const canSubmit = name.trim() && line.trim() && city.trim() && postalCode.trim() && phone.trim();

  const submit = async () => {
    const address = {
      name: name.trim(),
      line: line.trim(),
      city: city.trim(),
      state: stateProvince.trim(),
      postalCode: postalCode.trim(),
      phone: phone.trim(),
    };
    // 다음 캠페인 자동 입력용 기본 배송지 저장
    await saveSavedAddress(address);
    onSubmit(address);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={styles.backdrop}
      >
        <View style={styles.sheet}>
          <View style={styles.grabBar} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>{Strings.ADDRESS_MODAL_TITLE}</Text>
            <Badge tone="red" text="48시간" />
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
            style={[styles.submit, !canSubmit && styles.submitDisabled]}
            disabled={!canSubmit}
            onPress={submit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitText}>저장 — 다음부터 자동 입력</Text>
          </TouchableOpacity>
          <Text style={styles.customsNote}>
            해외 배송은 통관 사정으로 지연될 수 있어요. 통관 지연 기간은 업로드 기한(D-day)에서
            제외됩니다.
          </Text>
          <TouchableOpacity style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}>{Strings.CANCEL}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: RADIUS.SHEET,
    borderTopRightRadius: RADIUS.SHEET,
    padding: 20,
    paddingBottom: 30,
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
  submitText: { fontFamily: FONT.ExtraBold, fontSize: 13.5, color: COLORS.ON_AMBER },
  customsNote: { ...TYPE.XS, marginTop: 10, lineHeight: 15 },
  close: { alignItems: 'center', paddingVertical: 11, marginTop: 2 },
  closeText: { fontFamily: FONT.SemiBold, fontSize: 13, color: COLORS.GREY },
});
