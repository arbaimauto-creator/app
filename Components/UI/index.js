// greyd 시안 공용 컴포넌트 — DesignTokens 기반. 화면 리스타일 시 이 컴포넌트를 우선 사용한다.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import T from '../Constants/DesignTokens';

const { COLORS, RADIUS, TYPE } = T;

// 흰 카드 (radius 14 + 얕은 그림자)
export function Card({ style, children, ...rest }) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

// CTA 버튼 — variant: 'primary'(앰버) | 'ghost'(테두리) | 'dark'
export function Btn({ title, onPress, variant = 'primary', small, disabled, style, textStyle }) {
  const base = [
    styles.btn,
    variant === 'ghost' && styles.btnGhost,
    variant === 'dark' && styles.btnDark,
    small && styles.btnSm,
    disabled && { opacity: 0.45 },
    style,
  ];
  const text = [
    styles.btnText,
    variant === 'ghost' && styles.btnTextGhost,
    variant === 'dark' && { color: '#FFFFFF' },
    small && { fontSize: 11.5 },
    textStyle,
  ];
  return (
    <TouchableOpacity style={base} onPress={onPress} disabled={disabled} activeOpacity={0.8}>
      <Text style={text}>{title}</Text>
    </TouchableOpacity>
  );
}

// 상태 배지 — tone: 'open'(초록) | 'curated'(회색) | 'amber' | 'red'
const BADGE_TONES = {
  open: { backgroundColor: COLORS.GREEN_SOFT, color: COLORS.GREEN },
  curated: { backgroundColor: '#EBEAE7', color: COLORS.DARK },
  amber: { backgroundColor: COLORS.AMBER_SOFT, color: COLORS.AMBER_DEEP },
  red: { backgroundColor: COLORS.RED_SOFT, color: COLORS.RED },
};
export function Badge({ text, tone = 'amber', style }) {
  const t = BADGE_TONES[tone] || BADGE_TONES.amber;
  return (
    <View style={[styles.badge, { backgroundColor: t.backgroundColor }, style]}>
      <Text style={[styles.badgeText, { color: t.color }]}>{text}</Text>
    </View>
  );
}

// 상태머신 pill 8종 — status: applied/approved/shipped/received/reviewing/done/no_show/cancelled
const PILL_TONES = {
  applied: [COLORS.ST_APPLIED_BG, COLORS.ST_APPLIED_FG],
  approved: [COLORS.ST_APPROVED_BG, COLORS.ST_APPROVED_FG],
  shipped: [COLORS.ST_SHIPPED_BG, COLORS.ST_SHIPPED_FG],
  received: [COLORS.ST_RECEIVED_BG, COLORS.ST_RECEIVED_FG],
  reviewing: [COLORS.ST_REVIEW_BG, COLORS.ST_REVIEW_FG],
  done: [COLORS.ST_DONE_BG, COLORS.ST_DONE_FG],
  no_show: [COLORS.ST_NOSHOW_BG, COLORS.ST_NOSHOW_FG],
  cancelled: [COLORS.ST_CANCELLED_BG, COLORS.ST_CANCELLED_FG],
};
export function StatusPill({ status, label, style }) {
  const [bg, fg] = PILL_TONES[status] || PILL_TONES.applied;
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      <Text style={[styles.pillText, { color: fg }]}>{label != null ? label : status}</Text>
    </View>
  );
}

// 칩 선택기 — items: [{key, label}], selected: key 또는 key 배열
export function Chips({ items, selected, onSelect, style }) {
  const isSel = (key) => (Array.isArray(selected) ? selected.includes(key) : selected === key);
  return (
    <View style={[styles.chips, style]}>
      {items.map((it) => {
        const on = isSel(it.key);
        return (
          <TouchableOpacity
            key={it.key}
            style={[styles.chip, on && styles.chipOn]}
            onPress={() => onSelect && onSelect(it.key)}
            activeOpacity={0.7}>
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// 앰버 진행바 — ratio 0~1
export function ProgressBar({ ratio, height = 7, style }) {
  const w = Math.max(0, Math.min(1, ratio || 0)) * 100;
  return (
    <View style={[styles.prog, { height, borderRadius: height }, style]}>
      <View style={[styles.progFill, { width: `${w}%`, borderRadius: height }]} />
    </View>
  );
}

// 노트 박스 — tone: 'amber' | 'red'
export function NoteBox({ text, tone = 'amber', style, children }) {
  const amber = tone === 'amber';
  return (
    <View
      style={[
        styles.note,
        { backgroundColor: amber ? COLORS.AMBER_SOFT : COLORS.RED_SOFT },
        style,
      ]}>
      {children || (
        <Text style={[styles.noteText, { color: amber ? COLORS.AMBER_DEEP : COLORS.RED }]}>
          {text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.CARD,
    paddingVertical: 13,
    paddingHorizontal: 14,
    ...T.SHADOW_CARD,
  },
  btn: {
    backgroundColor: COLORS.AMBER,
    borderRadius: RADIUS.BTN,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
  },
  btnDark: { backgroundColor: COLORS.INK },
  btnSm: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: RADIUS.BTN_SM },
  btnText: { ...TYPE.BTN, textAlign: 'center' },
  btnTextGhost: { color: COLORS.INK, fontFamily: T.FONT.Bold },
  badge: {
    borderRadius: RADIUS.BADGE,
    paddingVertical: 2,
    paddingHorizontal: 7,
    alignSelf: 'flex-start',
  },
  badgeText: { ...TYPE.BADGE, letterSpacing: 0.2 },
  pill: {
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    alignSelf: 'flex-start',
  },
  pillText: { fontFamily: T.FONT.ExtraBold, fontSize: 9.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.PILL,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  chipOn: { backgroundColor: COLORS.AMBER_SOFT, borderColor: COLORS.AMBER },
  chipText: { fontFamily: T.FONT.SemiBold, fontSize: 11, color: COLORS.GREY },
  chipTextOn: { color: COLORS.AMBER_DEEP },
  prog: { backgroundColor: COLORS.TRACK, overflow: 'hidden' },
  progFill: { height: '100%', backgroundColor: COLORS.AMBER },
  note: { borderRadius: RADIUS.FIELD, paddingVertical: 9, paddingHorizontal: 12 },
  noteText: { fontFamily: T.FONT.Regular, fontSize: 11, lineHeight: 16.5 },
});

export default { Card, Btn, Badge, StatusPill, Chips, ProgressBar, NoteBox };
