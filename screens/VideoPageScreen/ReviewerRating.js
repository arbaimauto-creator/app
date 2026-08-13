import React from 'react';
import T from '../../Components/Constants/DesignTokens';
import { StyleSheet, Text, View } from 'react-native';
import Strings from '../../Components/Strings';

const { COLORS, RADIUS, FONT } = T;

// 시안(greyd App.html · Review detail)의 "Rated on 6 points" 카드.
// 별 아이콘 6줄 대신 라벨 · 막대 · 숫자 한 줄로 읽히게 바꿨다.
//
// 주의: 시안은 0~10 척도(Evidence 9.4 …)를 쓰지만, 서버에 저장된 p6Score는
// 0~5 상품 평가(브랜드·품질·실용성…)다. 라벨만 시안대로 갈아끼우면 측정한 적 없는
// 값을 다른 이름으로 보여주는 셈이라, 숫자와 축은 그대로 두고 구조만 옮긴다.
// 리뷰 품질 6축(Evidence·Usage window·Specificity·Balance·Production·Disclosure)은
// 채점이 서버에서 나와야 하므로 ops 연동 후 교체한다.
const MAX = 5;

function RatingRow({ label, score }) {
  const value = typeof score === 'number' ? score : 0;
  const ratio = Math.max(0, Math.min(1, value / MAX));
  return (
    <View style={styles.row}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
      <Text style={[styles.score, !value && styles.scoreEmpty]}>{value ? value.toFixed(1) : '—'}</Text>
    </View>
  );
}

function ReviewerRating({ context }) {
  const { video } = context.state;
  const p6 = video?.p6Score;

  if (!p6) {
    const single = video?.linkedProduct?.uploaderRating;
    if (!single) {
      return null;
    }
    return (
      <View style={styles.card}>
        <RatingRow label={Strings.REVIEW_RATING_TITLE} score={single} />
      </View>
    );
  }

  const rows = [
    [Strings.P6_BRAND, p6.brand],
    [Strings.P6_MERCHANTABILITY, p6.merchantabilityRating],
    [Strings.P6_PRACTICALITY, p6.practicality],
    [Strings.P6_CONVENIENCE, p6.convenience],
    [Strings.P6_DESIGN, p6.design],
    [Strings.P6_REASONABILITY, p6.reasonabilityRating],
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{Strings.REVIEW_RATING_TITLE}</Text>
      {rows.map(([label, score]) => (
        <RatingRow key={label} label={label} score={score} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginVertical: 22,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.LINE,
    borderRadius: RADIUS.CARD,
    padding: 16,
  },
  cardTitle: {
    fontFamily: FONT.Bold,
    fontSize: 11,
    letterSpacing: 0.6,
    color: COLORS.GREY,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  label: {
    width: 104,
    fontFamily: FONT.Medium,
    fontSize: 12.5,
    color: COLORS.INK,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 6,
    backgroundColor: COLORS.TRACK,
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: 6, backgroundColor: COLORS.AMBER },
  score: {
    width: 34,
    textAlign: 'right',
    fontFamily: FONT.ExtraBold,
    fontSize: 13,
    color: COLORS.INK,
    // 숫자 열이 흔들리지 않게
    fontVariant: ['tabular-nums'],
  },
  scoreEmpty: { color: COLORS.GREY, fontFamily: FONT.Regular },
});

export default ReviewerRating;
