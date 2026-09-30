// greyd 시안 공용 컴포넌트 — DesignTokens 기반. 화면 리스타일 시 이 컴포넌트를 우선 사용한다.
// 2026-09-16 컨셉 반영: 카드는 넓고 옅은 그림자로 살짝 떠 있고, 기본 버튼은 광택이 있는 앰버 그라데이션,
// 강조 카드(GlowCard)는 아래쪽에서 앰버 빛이 번진다. 세 시안(따뜻한 글로우·글라스·뉴모피즘)의 공통 어휘.
import React from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { BlurView } from '@react-native-community/blur';
import T from '../Constants/DesignTokens';

const { COLORS, RADIUS, TYPE, GRADIENT } = T;

// 유리 카드 (2026-09-17 글래스 컨셉 v2) — 진짜 배경 블러. 뒤의 오브·배경이 흐려져 비친다.
// overflow hidden이 블러를 모서리에 맞춰 자른다. 흰 틴트는 얇게 — 두꺼우면 유리가 아니라 반투명 판이 된다.
export function Card({ style, children, ...rest }) {
  return (
    <View style={[styles.card, style]} {...rest}>
      <BlurView
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        blurType="light"
        blurAmount={16}
        overlayColor="transparent"
        reducedTransparencyFallbackColor="#FFFFFF"
      />
      <View style={styles.cardTint} pointerEvents="none" />
      {children}
    </View>
  );
}

// 앰버 글로우 카드 — 시안 1의 "아래에서 번지는 따뜻한 빛". 큰 수치·상태 요약(G-스코어·포인트)에 쓴다.
// glow: 0~1 (빛 세기). 자식은 빛 위에 그려진다.
// contentStyle: 자식 컨테이너 스타일(가운데 정렬 등) — 바깥 카드의 alignItems는 안쪽까지 전달되지 않는다.
export function GlowCard({ style, contentStyle, children, glow = 0.9, ...rest }) {
  return (
    <View style={[styles.card, styles.glowCard, style]} {...rest}>
      <BlurView
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        blurType="light"
        blurAmount={16}
        overlayColor="transparent"
        reducedTransparencyFallbackColor="#FFFFFF"
      />
      <View style={styles.cardTint} pointerEvents="none" />
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="greydGlow" cx="50%" cy="115%" rx="70%" ry="95%">
            <Stop offset="0" stopColor={COLORS.AMBER} stopOpacity={glow} />
            <Stop offset="0.55" stopColor={COLORS.AMBER} stopOpacity={glow * 0.28} />
            <Stop offset="1" stopColor={COLORS.AMBER} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#greydGlow)" />
      </Svg>
      <View style={[styles.glowInner, contentStyle]}>{children}</View>
    </View>
  );
}

// CTA 버튼 — variant: 'primary'(광택 앰버) | 'ghost'(테두리) | 'dark'
export function Btn({
  title,
  onPress,
  variant = 'primary',
  small,
  disabled,
  loading = false,
  style,
  textStyle,
  accessibilityLabel,
  ...rest
}) {
  const glossy = variant === 'primary' || variant === 'dark';
  const base = [
    styles.btn,
    variant === 'ghost' && styles.btnGhost,
    variant === 'dark' && styles.btnDark,
    glossy && !disabled && (variant === 'dark' ? styles.btnDarkShadow : styles.btnPrimaryShadow),
    small && styles.btnSm,
    disabled && { opacity: 0.45 },
    style,
  ];
  const text = [
    styles.btnText,
    variant === 'ghost' && styles.btnTextGhost,
    variant === 'dark' && { color: '#FFFFFF' },
    small && { fontSize: 13 },
    textStyle,
  ];
  return (
    <TouchableOpacity
      {...rest}
      style={base}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !!disabled || loading, busy: loading }}
    >
      {glossy ? (
        <>
          <LinearGradient
            pointerEvents="none"
            colors={variant === 'dark' ? GRADIENT.INK : GRADIENT.AMBER}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[StyleSheet.absoluteFill, styles.btnFill, small && styles.btnFillSm]}
          />
          {/* 위쪽 광택 띠 — 유리·젤 질감(시안 2) */}
          <LinearGradient
            pointerEvents="none"
            colors={GRADIENT.GLOSS}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.btnGloss, small && styles.btnGlossSm]}
          />
        </>
      ) : null}
      {loading && (
        <ActivityIndicator size="small" color={variant === 'dark' ? '#FFFFFF' : COLORS.INK} />
      )}
      <Text style={text}>{title}</Text>
    </TouchableOpacity>
  );
}

// 글래스 배경 오브 (2026-09-17 컨셉) — 화면 뒤에 떠 있는 골드 구체 2~3개.
// 화면 루트(SafeAreaView 바로 아래)에 한 번 깔면 유리 카드가 이 빛을 비춰 보인다.
export function GlassOrbs({ style }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <LinearGradient
        colors={GRADIENT.ORB_SOFT}
        start={{ x: 0.2, y: 0.1 }}
        end={{ x: 0.9, y: 1 }}
        style={[styles.orb, { width: 230, height: 230, top: -60, right: -70 }]}
      />
      <LinearGradient
        colors={GRADIENT.ORB_SOFT}
        start={{ x: 0.8, y: 0 }}
        end={{ x: 0.1, y: 1 }}
        style={[styles.orb, { width: 150, height: 150, top: 260, left: -60, opacity: 0.75 }]}
      />
      <LinearGradient
        colors={GRADIENT.ORB_SOFT}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={[styles.orb, { width: 300, height: 300, bottom: -110, right: -90, opacity: 0.6 }]}
      />
    </View>
  );
}

// 브랜드 워드마크 — "greyd" + 앰버 점. 로고 텍스트는 반드시 이 컴포넌트로 (점 누락 방지).
export function Wordmark({ size = 30, style, center }) {
  return (
    <Text style={[styles.wordmark, { fontSize: size }, center && { textAlign: 'center' }, style]}>
      greyd
      <Text style={styles.wordmarkDot}>.</Text>
    </Text>
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
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.chip, on && styles.chipOn]}
            onPress={() => onSelect && onSelect(it.key)}
            activeOpacity={0.7}
          >
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
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(w) }}
      style={[styles.prog, { height, borderRadius: height }, style]}
    >
      <View style={[styles.progFill, { width: `${w}%`, borderRadius: height }]} />
    </View>
  );
}

// 노트 박스 — tone: 'amber' | 'red'
export function NoteBox({ text, tone = 'amber', style, children }) {
  const amber = tone === 'amber';
  return (
    <View
      style={[styles.note, { backgroundColor: amber ? COLORS.AMBER_SOFT : COLORS.RED_SOFT }, style]}
    >
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
    // 글래스 v2: 진짜 블러 위에 얇은 흰 틴트 — backgroundColor는 블러가 대신한다
    backgroundColor: 'transparent',
    borderRadius: RADIUS.CARD,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    overflow: 'hidden',
    elevation: 3,
  },
  cardTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: RADIUS.CARD,
  },
  glowCard: { overflow: 'hidden' },
  glowInner: { position: 'relative', alignSelf: 'stretch' },
  btn: {
    minHeight: 48,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.AMBER,
    borderRadius: RADIUS.BTN,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  btnFill: { borderRadius: RADIUS.BTN },
  btnFillSm: { borderRadius: RADIUS.BTN_SM },
  btnGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
    borderTopLeftRadius: RADIUS.BTN,
    borderTopRightRadius: RADIUS.BTN,
  },
  btnGlossSm: { borderTopLeftRadius: RADIUS.BTN_SM, borderTopRightRadius: RADIUS.BTN_SM },
  btnPrimaryShadow: { ...T.SHADOW_GLOW },
  btnDarkShadow: { ...T.SHADOW_SOFT },
  btnGhost: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
  },
  btnDark: { backgroundColor: COLORS.INK },
  btnSm: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: RADIUS.BTN_SM },
  btnText: { ...TYPE.BTN, textAlign: 'center' },
  btnTextGhost: { color: COLORS.INK, fontFamily: T.FONT.Bold },
  wordmark: {
    fontFamily: T.FONT.Black,
    color: COLORS.INK,
    letterSpacing: -0.5,
  },
  wordmarkDot: { color: COLORS.AMBER, fontFamily: T.FONT.Black },
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
    minHeight: 44,
    justifyContent: 'center',
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
  orb: { position: 'absolute', borderRadius: 999 },
  noteText: { fontFamily: T.FONT.Regular, fontSize: 11, lineHeight: 16.5 },
});

export default { Card, GlowCard, Btn, Badge, StatusPill, Chips, ProgressBar, NoteBox, GlassOrbs };
