// 배송지 관리 (시안 화면 19) — 기본 배송지 1건 저장·수정·삭제.
import React, { useCallback, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import T from '../../Components/Constants/DesignTokens';
import { Card, Btn, Badge, NoteBox } from '../../Components/UI';
import { getSavedAddress, saveSavedAddress, clearSavedAddress } from '../../api/address';

const { COLORS, FONT, TYPE } = T;

const EMPTY_FORM = { name: '', line: '', city: '', state: '', postalCode: '', phone: '' };

const FIELDS = [
  { key: 'name', placeholder: '받는 사람' },
  { key: 'line', placeholder: '주소' },
  { key: 'city', placeholder: '도시' },
  { key: 'state', placeholder: '주·도' },
  { key: 'postalCode', placeholder: '우편번호' },
  { key: 'phone', placeholder: '전화' },
];

export default function AddressBook({ navigation }) {
  const [address, setAddress] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const reload = useCallback(() => {
    getSavedAddress().then(setAddress);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const openForm = () => {
    setForm({ ...EMPTY_FORM, ...(address || {}) });
    setFormOpen(true);
  };

  const onDelete = async () => {
    await clearSavedAddress();
    setFormOpen(false);
    reload();
  };

  const onSave = async () => {
    await saveSavedAddress(form);
    setFormOpen(false);
    reload();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>배송지 관리</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {address ? (
          <Card style={styles.addrCard}>
            <View style={styles.row}>
              <Text style={styles.addrTitle}>기본 배송지</Text>
              <Badge tone="amber" text="기본" />
            </View>
            <Text style={styles.body}>
              {address.name} · {address.phone}
            </Text>
            <Text style={styles.body}>
              {address.line}, {address.city} {address.state} {address.postalCode}
            </Text>
            <View style={styles.btnRow}>
              <Btn variant="ghost" small title="수정" onPress={openForm} style={styles.flex1} />
              <Btn variant="ghost" small title="삭제" onPress={onDelete} style={styles.flex1} />
            </View>
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>저장된 배송지가 없어요</Text>
            <Btn variant="ghost" title="+ 새 배송지 추가" onPress={openForm} />
          </Card>
        )}

        {formOpen ? (
          <Card>
            {FIELDS.map((f) => (
              <TextInput
                key={f.key}
                style={styles.input}
                placeholder={f.placeholder}
                placeholderTextColor={COLORS.GREY}
                value={form[f.key]}
                onChangeText={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
              />
            ))}
            <Btn title="저장" onPress={onSave} />
          </Card>
        ) : null}

        <NoteBox
          tone="amber"
          text="승인 후 48시간 안에 주소가 있어야 발송돼요. 저장해두면 다음 캠페인에서 자동 입력됩니다."
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  back: { fontFamily: FONT.Bold, fontSize: 26, color: COLORS.INK, lineHeight: 28 },
  headerTitle: { fontFamily: FONT.ExtraBold, fontSize: 18, color: COLORS.INK },
  scroll: { padding: 16, paddingTop: 4, paddingBottom: 32, gap: 9 },
  addrCard: { borderWidth: 1.5, borderColor: COLORS.AMBER },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addrTitle: { fontFamily: FONT.Bold, fontSize: 13, color: COLORS.INK },
  body: { ...TYPE.SUB, color: COLORS.INK, marginBottom: 2 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 11 },
  flex1: { flex: 1 },
  emptyCard: { alignItems: 'stretch', gap: 12, paddingVertical: 20 },
  emptyText: { ...TYPE.SUB, textAlign: 'center' },
  input: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontFamily: FONT.Regular,
    fontSize: 13,
    color: COLORS.INK,
    marginBottom: 8,
  },
});
