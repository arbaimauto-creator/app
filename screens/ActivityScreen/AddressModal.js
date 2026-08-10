import React, { useState } from 'react';
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
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';

// v2 §3-⑤: 승인 직후 주소 수집 — 48시간 데드라인 문구, 미입력 취소는 무페널티(문구만).
export default function AddressModal({ visible, initial, onSubmit, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [line, setLine] = useState(initial?.line || '');
  // 글로벌 주소 포맷 (계획서 TSK-006): 도시/주·도/우편번호를 분리 수집
  const [city, setCity] = useState(initial?.city || '');
  const [stateProvince, setStateProvince] = useState(initial?.state || '');
  const [postalCode, setPostalCode] = useState(initial?.postalCode || '');
  const [phone, setPhone] = useState(initial?.phone || '');

  const canSubmit = name.trim() && line.trim() && city.trim() && postalCode.trim() && phone.trim();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={styles.backdrop}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>{Strings.ADDRESS_MODAL_TITLE}</Text>
          <Text style={styles.deadline}>{Strings.ADDRESS_MODAL_DEADLINE}</Text>
          <TextInput
            style={styles.input}
            placeholder={Strings.ADDRESS_NAME}
            placeholderTextColor={Constants.TIER_COLORS.STRIVER}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder={Strings.ADDRESS_LINE}
            placeholderTextColor={Constants.TIER_COLORS.STRIVER}
            value={line}
            onChangeText={setLine}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder={Strings.ADDRESS_CITY}
              placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              value={city}
              onChangeText={setCity}
            />
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder={Strings.ADDRESS_STATE}
              placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              value={stateProvince}
              onChangeText={setStateProvince}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder={Strings.ADDRESS_POSTAL}
              placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              autoCapitalize="characters"
              value={postalCode}
              onChangeText={setPostalCode}
            />
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder={Strings.ADDRESS_PHONE}
              placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
          <TouchableOpacity
            style={[styles.submit, !canSubmit && styles.submitDisabled]}
            disabled={!canSubmit}
            onPress={() =>
              onSubmit({
                name: name.trim(),
                line: line.trim(),
                city: city.trim(),
                state: stateProvince.trim(),
                postalCode: postalCode.trim(),
                phone: phone.trim(),
              })
            }
          >
            <Text style={styles.submitText}>{Strings.ADDRESS_SUBMIT}</Text>
          </TouchableOpacity>
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
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 22,
    paddingBottom: 34,
  },
  title: {
    fontSize: 18,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    color: Constants.TIER_COLORS.ARTISAN,
  },
  deadline: { fontSize: 12.5, color: '#c47b00', marginTop: 6, marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
    fontSize: 14,
    backgroundColor: '#fff',
    color: Constants.TIER_COLORS.ARTISAN,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 8 },
  rowInput: { flex: 1 },
  submit: {
    backgroundColor: Constants.COLOR_MAIN,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { fontSize: 15, fontWeight: '800', color: '#16130d' },
  close: { alignItems: 'center', paddingVertical: 12 },
  closeText: { fontSize: 13.5, color: Constants.TIER_COLORS.STRIVER },
});
