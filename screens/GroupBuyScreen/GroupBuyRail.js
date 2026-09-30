// 홈 공동구매 레일 (2026-09-30) — 모집 중·오픈 예정 공동구매 가로 카드. 없거나 실패하면 아무것도 그리지 않는다.
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useFocusEffect } from '@react-navigation/native';
import T from '../../Components/Constants/DesignTokens';
import FEATURES from '../../Components/Constants/Features';
import { ProgressBar } from '../../Components/UI';
import { GB_STATE, discountPercent, fillRatio, listGroupBuys, timeLeft } from '../../api/groupBuys';
import { Price, ProductPlaceholder } from './common';
import { gbCopy } from './strings';

const { COLORS, FONT } = T;

export default function GroupBuyRail({ navigation }) {
  const [items, setItems] = useState([]);
  useFocusEffect(
    useCallback(() => {
      if (!FEATURES.GROUP_BUY) {
        return undefined;
      }
      let alive = true;
      listGroupBuys()
        .then((list) => alive && setItems(list))
        .catch(() => alive && setItems([]));
      return () => {
        alive = false;
      };
    }, []),
  );

  if (!FEATURES.GROUP_BUY || !items.length) {
    return null;
  }
  const c = gbCopy();
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>{c.eyebrow}</Text>
        <Text style={styles.more} onPress={() => navigation.navigate('MyGroupBuys')}>
          {c.myTitle} ›
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {items.map((gb) => {
          const off = discountPercent(gb);
          const ratio = fillRatio(gb);
          const upcoming = gb.state === GB_STATE.SCHEDULED;
          const left = timeLeft(upcoming ? gb.startsAt : gb.endsAt);
          return (
            <TouchableOpacity
              key={gb.code}
              accessibilityRole="button"
              accessibilityLabel={gb.title}
              activeOpacity={0.85}
              style={styles.card}
              onPress={() => navigation.navigate('GroupBuy', { code: gb.code })}
            >
              {gb.product.imageUrl ? (
                <FastImage source={{ uri: gb.product.imageUrl }} style={styles.image} />
              ) : (
                <ProductPlaceholder style={styles.image} size={30} label={null} />
              )}
              <Text style={styles.host} numberOfLines={1}>
                @{gb.host.handle}
              </Text>
              <Text style={styles.name} numberOfLines={2}>
                {gb.title}
              </Text>
              <View style={styles.priceRow}>
                {off > 0 ? <Text style={styles.off}>{off}%</Text> : null}
                <Price style={styles.price} amount={gb.price} currency={gb.currency} />
              </View>
              {ratio != null ? <ProgressBar ratio={ratio} height={5} /> : null}
              {left ? (
                <Text style={styles.left}>{upcoming ? c.startsIn(left) : c.left(left)}</Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  head: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontFamily: FONT.ExtraBold, fontSize: 16, color: COLORS.INK },
  more: { fontFamily: FONT.Bold, fontSize: 12, color: COLORS.AMBER_DEEP },
  rail: { paddingHorizontal: 16, gap: 10 },
  card: {
    width: 148,
    gap: 5,
    padding: 8,
    borderRadius: 18,
    backgroundColor: COLORS.GLASS,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  image: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: COLORS.TRACK },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  host: { fontFamily: FONT.Bold, fontSize: 11, color: COLORS.AMBER_DEEP },
  name: { fontFamily: FONT.Bold, fontSize: 12.5, lineHeight: 17, color: COLORS.INK },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  off: { fontFamily: T.SERIF.Bold, fontSize: 17, color: COLORS.RED },
  price: { fontFamily: T.SERIF.Bold, fontSize: 18, color: COLORS.INK },
  left: { fontFamily: FONT.Regular, fontSize: 11, color: COLORS.GREY },
});
