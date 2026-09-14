// 배송지 관리 (시안 화면 19) — 기본 배송지 1건 저장·수정·삭제.
import React, { useCallback, useState } from 'react';
import {
  Alert,
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
import Strings from '../../Components/Strings';
import { getSavedAddress, saveSavedAddress, clearSavedAddress } from '../../api/address';

const { COLORS, FONT, TYPE } = T;

const EMPTY_FORM = { name: '', line: '', city: '', state: '', postalCode: '', phone: '' };

const FIELDS = [
  { key: 'name', placeholder: () => Strings.ADDRESS_NAME },
  { key: 'line', placeholder: () => Strings.ADDRESS_LINE },
  { key: 'city', placeholder: () => Strings.ADDRESS_CITY },
  { key: 'state', placeholder: () => Strings.ADDRESS_STATE },
  { key: 'postalCode', placeholder: () => Strings.ADDRESS_POSTAL },
  { key: 'phone', placeholder: () => Strings.ADDRESS_PHONE },
];

export default function AddressBook({ navigation }) {
  const [address, setAddress] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const reload = useCallback(() => {
    getSavedAddress()
      .then(setAddress)
      .catch(() => setAddress(null));
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

  const onDelete = () => {
    Alert.alert(Strings.ADDR_DELETE_CONFIRM_TITLE, Strings.ADDR_DELETE_CONFIRM_BODY, [
      { text: Strings.CANCEL, style: 'cancel' },
      {
        text: Strings.ADDR_DELETE,
        style: 'destructive',
        onPress: async () => {
          try {
            await clearSavedAddress();
            setFormOpen(false);
            reload();
          } catch (e) {
            Alert.alert(Strings.RETRY_GUIDELINES);
          }
        },
      },
    ]);
  };

  const REQUIRED = ['name', 'line', 'city', 'postalCode', 'phone'];
  const onSave = async () => {
    const trimmed = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, (v || '').trim()]));
    if (REQUIRED.some((k) => !trimmed[k])) {
      Alert.alert(Strings.ADDR_FORM_INCOMPLETE);
      return;
    }
    try {
      await saveSavedAddress(trimmed);
      setFormOpen(false);
      reload();
    } catch (e) {
      Alert.alert(Strings.RETRY_GUIDELINES);
    }
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
        <Text style={styles.headerTitle}>{Strings.ADDR_MANAGE_TITLE}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {address ? (
          <Card style={styles.addrCard}>
            <View style={styles.row}>
              <Text style={styles.addrTitle}>{Strings.ADDR_DEFAULT_TITLE}</Text>
              <Badge tone="amber" text={Strings.ADDR_DEFAULT_BADGE} />
            </View>
            <Text style={styles.body}>
              {address.name} · {address.phone}
            </Text>
            <Text style={styles.body}>
              {address.line}, {address.city} {address.state} {address.postalCode}
            </Text>
            <View style={styles.btnRow}>
              <Btn
                variant="ghost"
                small
                title={Strings.ADDR_EDIT}
                onPress={openForm}
                style={styles.flex1}
              />
              <Btn
                variant="ghost"
                small
                title={Strings.ADDR_DELETE}
                onPress={onDelete}
                style={styles.flex1}
              />
            </View>
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>{Strings.ADDR_EMPTY}</Text>
            <Btn variant="ghost" title={Strings.ADDR_ADD_NEW} onPress={openForm} />
          </Card>
        )}

        {formOpen ? (
          <Card>
            {FIELDS.map((f) => (
              <TextInput
                key={f.key}
                style={styles.input}
                placeholder={f.placeholder()}
                placeholderTextColor={COLORS.GREY}
                value={form[f.key]}
                onChangeText={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
              />
            ))}
            <Btn title={Strings.ADDRESS_SUBMIT} onPress={onSave} />
          </Card>
        ) : null}

        <NoteBox tone="amber" text={Strings.ADDR_NOTE} />
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
