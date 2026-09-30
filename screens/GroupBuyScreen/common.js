// 공동구매 화면 공용 조각 (2026-09-30)
import React, { useCallback, useRef, useState } from 'react';
import {
  RefreshControl,
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
import FEATURES from '../../Components/Constants/Features';
import { Badge, Btn, GlassOrbs, NoteBox } from '../../Components/UI';
import { GB_STATE, ORDER_STATE } from '../../api/groupBuys';
import { gbCopy, lang } from './strings';

const { COLORS, FONT, LATIN, RADIUS } = T;

export function money(amount, currency) {
  const n = Number(amount || 0);
  if (currency === 'JPY') {
    return lang() === 'ko' ? `${n.toLocaleString()}엔` : `¥${n.toLocaleString()}`;
  }
  return lang() === 'ko' ? `${n.toLocaleString()}원` : `₩${n.toLocaleString()}`;
}

const pad = (n) => String(n).padStart(2, '0');
export function dateLabel(iso, withTime = true) {
  if (!iso) {
    return '-';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '-';
  }
  const day = `${d.getMonth() + 1}/${d.getDate()}`;
  return withTime ? `${day} ${pad(d.getHours())}:${pad(d.getMinutes())}` : day;
}

const STATE_TONE = {
  [GB_STATE.OPEN]: 'amber',
  [GB_STATE.SCHEDULED]: 'curated',
  [GB_STATE.PENDING_HOST]: 'curated',
  [GB_STATE.CLOSED]: 'curated',
  [GB_STATE.CONFIRMED]: 'open',
  [GB_STATE.SHIPPING]: 'open',
  [GB_STATE.DONE]: 'open',
  [GB_STATE.FAILED]: 'red',
  [GB_STATE.CANCELLED]: 'red',
};
export function StateBadge({ state, style }) {
  return (
    <Badge
      tone={STATE_TONE[state] || 'curated'}
      text={gbCopy().state[state] || state}
      style={style}
    />
  );
}

const ORDER_TONE = {
  [ORDER_STATE.RESERVED]: 'amber',
  [ORDER_STATE.PAID]: 'open',
  [ORDER_STATE.SHIPPED]: 'open',
  [ORDER_STATE.PAYMENT_FAILED]: 'red',
};
export function OrderBadge({ state, style }) {
  return (
    <Badge
      tone={ORDER_TONE[state] || 'curated'}
      text={gbCopy().orderState[state] || state}
      style={style}
    />
  );
}

// 화면 틀 — 글래스 배경 + 뒤로 + 제목 + 당겨서 새로고침
export function Frame({ navigation, title, children, onRefresh, refreshing, footer, scrollRef }) {
  const c = gbCopy();
  return (
    <SafeAreaView style={s.page}>
      <GlassOrbs />
      <View style={s.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={c.back}
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={s.backBtn} />
      </View>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.AMBER}
              colors={[COLORS.AMBER]}
            />
          ) : undefined
        }
      >
        {FEATURES.GROUP_BUY_MOCK ? <NoteBox text={c.mockNotice} /> : null}
        {children}
      </ScrollView>
      {footer ? <View style={s.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

export function Failure({ retry, text }) {
  const c = gbCopy();
  return (
    <View style={s.failure}>
      <Text style={s.body} accessibilityRole="alert">
        {text || c.loadError}
      </Text>
      {retry ? <Btn small variant="ghost" title={c.retry} onPress={retry} /> : null}
    </View>
  );
}

export function Field({ label, style, multiline, ...rest }) {
  return (
    <View style={[s.field, style]}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={COLORS.GREY}
        style={[s.input, multiline && s.inputMulti]}
        multiline={multiline}
        {...rest}
      />
    </View>
  );
}

export function CheckRow({ checked, onToggle, text }) {
  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!checked }}
      onPress={onToggle}
      style={s.checkRow}
      activeOpacity={0.7}
    >
      <View style={[s.checkBox, checked && s.checkBoxOn]}>
        {checked ? <Text style={s.checkMark}>✓</Text> : null}
      </View>
      <Text style={s.checkText}>{text}</Text>
    </TouchableOpacity>
  );
}

export function Stepper({ value, onChange, min = 1, max = 99 }) {
  const set = (v) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <View style={s.stepper}>
      <TouchableOpacity accessibilityLabel="minus" onPress={() => set(value - 1)} style={s.stepBtn}>
        <Text style={s.stepText}>−</Text>
      </TouchableOpacity>
      <Text style={s.stepValue}>{value}</Text>
      <TouchableOpacity accessibilityLabel="plus" onPress={() => set(value + 1)} style={s.stepBtn}>
        <Text style={s.stepText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// 포커스될 때마다 불러오는 훅 — { data, loading, error, reload }
// key가 바뀌면(예: 공동구매 코드) 새로 불러온다. loader는 매 렌더 새 함수여도 된다.
export function useFocusLoad(loader, key = '') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loaderRef.current(key));
    } catch (e) {
      setError(e?.status === 404 ? 'notfound' : 'network');
    } finally {
      setLoading(false);
    }
  }, [key]);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  return { data, setData, loading, error, reload };
}

export function requestId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 30, lineHeight: 32, color: COLORS.INK },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONT.Bold,
    fontSize: 16,
    color: COLORS.INK,
  },
  content: { padding: 16, paddingBottom: 48, gap: 12 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.LINE,
    backgroundColor: 'rgba(243,237,226,0.96)',
    gap: 6,
  },
  failure: { gap: 10, alignItems: 'center', paddingVertical: 24 },
  eyebrow: { fontFamily: LATIN.Bold, fontSize: 10, letterSpacing: 1.4, color: COLORS.AMBER_DEEP },
  h1: { fontFamily: FONT.ExtraBold, fontSize: 20, color: COLORS.INK, lineHeight: 27 },
  h2: { fontFamily: FONT.Bold, fontSize: 15, color: COLORS.INK },
  body: { fontFamily: FONT.Regular, fontSize: 13, lineHeight: 19, color: COLORS.INK },
  sub: { fontFamily: FONT.Regular, fontSize: 12, lineHeight: 17, color: COLORS.GREY },
  strong: { fontFamily: FONT.Bold, fontSize: 13, color: COLORS.INK },
  price: { fontFamily: LATIN.ExtraBold, fontSize: 24, color: COLORS.INK, letterSpacing: -0.4 },
  strike: {
    fontFamily: FONT.Regular,
    fontSize: 12,
    color: COLORS.GREY,
    textDecorationLine: 'line-through',
  },
  off: { fontFamily: FONT.ExtraBold, fontSize: 16, color: COLORS.RED },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  field: { gap: 6 },
  label: { fontFamily: FONT.Bold, fontSize: 12, color: COLORS.INK },
  input: {
    borderWidth: 1,
    borderColor: COLORS.LINE,
    borderRadius: RADIUS.FIELD,
    backgroundColor: COLORS.SURFACE,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONT.Regular,
    fontSize: 14,
    color: COLORS.INK,
  },
  inputMulti: { minHeight: 84, textAlignVertical: 'top' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.GREY,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkBoxOn: { backgroundColor: COLORS.AMBER, borderColor: COLORS.AMBER },
  checkMark: { fontSize: 12, color: COLORS.ON_AMBER, fontFamily: FONT.Bold },
  checkText: {
    flex: 1,
    fontFamily: FONT.Regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.INK,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.LINE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.SURFACE,
  },
  stepText: { fontFamily: LATIN.Bold, fontSize: 18, color: COLORS.INK, lineHeight: 22 },
  stepValue: {
    fontFamily: LATIN.ExtraBold,
    fontSize: 16,
    color: COLORS.INK,
    minWidth: 28,
    textAlign: 'center',
  },
  thumb: {
    width: 104,
    height: 150,
    borderRadius: 14,
    backgroundColor: COLORS.TRACK,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: { fontSize: 28, color: COLORS.GREY },
  hero: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: RADIUS.CARD - 6,
    backgroundColor: COLORS.TRACK,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.AMBER_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: { fontFamily: FONT.Bold, fontSize: 16, color: COLORS.AMBER_DEEP },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.PILL,
    alignItems: 'center',
  },
  tabOn: { backgroundColor: COLORS.INK },
  tabText: { fontFamily: FONT.Bold, fontSize: 13, color: COLORS.GREY },
  tabTextOn: { color: '#FFFFFF' },
  link: { fontFamily: FONT.Bold, fontSize: 13, color: COLORS.AMBER_DEEP },
});
