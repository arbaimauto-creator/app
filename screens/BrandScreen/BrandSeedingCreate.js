// 판매자 제품 뿌리기 (2026-09-17) — FGI/리뷰 캠페인용 제품 배포 요청 폼.
// 캠페인 게시는 서버(ops) 검수를 거친다 — 여기서는 요청을 만들고 아웃박스로 보낸다.
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import T from '../../Components/Constants/DesignTokens';
import { Badge, Card, GlassOrbs } from '../../Components/UI';
import Strings from '../../Components/Strings';
import { createSeedingRequest, listSeedingRequests } from '../../api/brandSeedings';

const { COLORS, FONT, RADIUS, TYPE } = T;
const DEFAULT_DAYS = 14;

export default function BrandSeedingCreate({ navigation }) {
  const [title, setTitle] = useState('');
  const [quantity, setQuantity] = useState('');
  const [points, setPoints] = useState('');
  const [days, setDays] = useState(String(DEFAULT_DAYS));
  const [fgi, setFgi] = useState(true);
  const [requests, setRequests] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(() => {
    listSeedingRequests().then(setRequests);
  }, []);

  useEffect(reload, [reload]);

  const onSubmit = async () => {
    if (!title.trim() || !Number(quantity)) {
      Alert.alert(Strings.BRAND_SEED_FORM_INCOMPLETE);
      return;
    }
    setSubmitting(true);
    const deadline = Date.now() + (Number(days) || DEFAULT_DAYS) * 24 * 60 * 60 * 1000;
    try {
      await createSeedingRequest({
        title: title.trim(),
        quantity,
        points,
        deadline,
        fgi,
      });
      setTitle('');
      setQuantity('');
      setPoints('');
      setDays(String(DEFAULT_DAYS));
      reload();
      Alert.alert(Strings.BRAND_SEED_TITLE, Strings.BRAND_SEED_SUBMITTED);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <GlassOrbs />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{Strings.BRAND_SEED_TITLE}</Text>
        </View>
        <Text style={styles.desc}>{Strings.BRAND_SEED_DESC}</Text>

        <Card style={styles.formCard}>
          <Text style={styles.label}>{Strings.BRAND_SEED_FORM_TITLE}</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={Strings.BRAND_SEED_FORM_TITLE_PH}
            placeholderTextColor={COLORS.GREY}
          />
          <View style={styles.rowFields}>
            <View style={styles.rowField}>
              <Text style={styles.label}>{Strings.BRAND_SEED_QTY}</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
                placeholder="20"
                placeholderTextColor={COLORS.GREY}
              />
            </View>
            <View style={styles.rowField}>
              <Text style={styles.label}>{Strings.BRAND_SEED_POINTS}</Text>
              <TextInput
                style={styles.input}
                value={points}
                onChangeText={setPoints}
                keyboardType="number-pad"
                placeholder="500"
                placeholderTextColor={COLORS.GREY}
              />
            </View>
            <View style={styles.rowField}>
              <Text style={styles.label}>{Strings.BRAND_SEED_DAYS}</Text>
              <TextInput
                style={styles.input}
                value={days}
                onChangeText={setDays}
                keyboardType="number-pad"
                placeholder={String(DEFAULT_DAYS)}
                placeholderTextColor={COLORS.GREY}
              />
            </View>
          </View>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{Strings.BRAND_SEED_FGI}</Text>
              <Text style={styles.xs}>{Strings.BRAND_SEED_FGI_DESC}</Text>
            </View>
            <Switch
              trackColor={{ false: COLORS.TRACK, true: COLORS.AMBER }}
              thumbColor={COLORS.SURFACE}
              ios_backgroundColor={COLORS.TRACK}
              onValueChange={setFgi}
              value={fgi}
            />
          </View>
          <TouchableOpacity
            style={[styles.submit, submitting && { opacity: 0.5 }]}
            onPress={onSubmit}
            disabled={submitting}
            accessibilityRole="button"
          >
            <Text style={styles.submitText}>{Strings.BRAND_SEED_SUBMIT}</Text>
          </TouchableOpacity>
        </Card>

        <Text style={styles.sectionTitle}>{Strings.BRAND_SEED_REQUESTS}</Text>
        {requests.length === 0 ? (
          <Text style={styles.xs}>{Strings.BRAND_SEED_EMPTY}</Text>
        ) : (
          requests.map((r) => (
            <Card key={r.id} style={styles.requestCard}>
              <View style={styles.requestRow}>
                <Text style={styles.requestTitle} numberOfLines={1}>
                  {r.title}
                </Text>
                <Badge tone="amber" text={Strings.BRAND_SEED_STATUS_QUEUED} />
              </View>
              <Text style={styles.xs}>
                {Strings.BRAND_SEED_LINE(r.quantity, r.points)}
                {r.fgi ? ` · FGI` : ''}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  scroll: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { fontFamily: FONT.Bold, fontSize: 26, color: COLORS.INK, lineHeight: 28 },
  headerTitle: { fontFamily: FONT.ExtraBold, fontSize: 18, color: COLORS.INK },
  desc: { ...TYPE.XS, marginTop: 6 },
  formCard: { marginTop: 12 },
  label: { fontFamily: FONT.Bold, fontSize: 12, color: COLORS.INK, marginTop: 10 },
  xs: { ...TYPE.XS, marginTop: 3 },
  input: {
    marginTop: 6,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    borderRadius: RADIUS.FIELD,
    backgroundColor: COLORS.SURFACE,
    paddingVertical: 9,
    paddingHorizontal: 11,
    color: COLORS.INK,
    fontFamily: FONT.Regular,
    fontSize: 13,
  },
  rowFields: { flexDirection: 'row', gap: 9 },
  rowField: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  submit: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 9,
    backgroundColor: COLORS.AMBER,
    alignItems: 'center',
  },
  submitText: { fontFamily: FONT.ExtraBold, fontSize: 13, color: COLORS.ON_AMBER },
  sectionTitle: { fontFamily: FONT.Bold, fontSize: 13, color: COLORS.INK, marginTop: 18 },
  requestCard: { marginTop: 8 },
  requestRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  requestTitle: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.INK, flex: 1, minWidth: 0 },
});
