// 내 레퍼런스 (시안 12 · My references) — 저장해 둔 리뷰 보관함.
// 촬영 전에 참고하려고 모아둔 것이므로, 목록에서 바로 피드로 들어가 다시 보고
// "이걸 참고해서 올리기"로 이어가는 게 목적이다.
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import Preference from 'react-native-default-preference';
import T from './Constants/DesignTokens';
import { Badge, EmptyIcon } from './UI';
import Strings from './Strings';
import APIprovider from './APIprovider';

const { COLORS, TYPE } = T;
const GRID_HEIGHTS = [118, 96, 100, 132]; // 홈 그리드와 같은 리듬

// 점수 없으면 배지 숨김 (✓ 0.0 노출 금지) — CuratedHome과 같은 규칙
function reviewScore(item) {
  const raw = item.g6RatingCount > 0 ? item.g6AvgRatingScore : item.ratingScore;
  const n = Number(raw || 0);
  return n > 0 ? n.toFixed(1) : null;
}

function thumbUrl(item) {
  return item.thumbnailUrl || item?.relayedVideo?.thumbnailUrl || null;
}

export default function ReferenceListScreen({ navigation, route }) {
  const [items, setItems] = useState(null); // null = 로딩, [] = 없음
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    Preference.get('userId')
      .then((userId) => APIprovider.getBookmarkedVideoList(route.params?.logonUserId || userId))
      .then((data) => setItems(Array.isArray(data) ? data.filter(thumbUrl) : []))
      .catch(() => {
        setItems([]);
        setError(true);
      });
  }, [route.params?.logonUserId]);

  // 저장/해제하고 돌아오면 목록이 최신이어야 한다
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openFeed = (item) => {
    navigation.navigate('VideoPage', { videoList: items, videoId: item._id });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{Strings.REF_MY_REFERENCES}</Text>
        <Text style={styles.count}>
          {items && items.length > 0 ? Strings.REF_SAVED_COUNT(items.length) : ''}
        </Text>
      </View>

      {items === null ? (
        <ActivityIndicator color={COLORS.AMBER} style={styles.loading} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <EmptyIcon name="bookmark-outline" />
          <Text style={styles.emptyTitle}>
            {error ? Strings.FAILED_TO_LOAD_DATA : Strings.REF_EMPTY_TITLE}
          </Text>
          <Text style={styles.emptyDesc}>{Strings.REF_EMPTY_DESC}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={item._id}
                style={styles.gridItem}
                activeOpacity={0.85}
                onPress={() => openFeed(item)}
              >
                <View style={[styles.thumbWrap, { height: GRID_HEIGHTS[index % 4] }]}>
                  <FastImage source={{ uri: thumbUrl(item) }} style={styles.thumb} />
                  {reviewScore(item) ? (
                    <Badge tone="amber" text={`✓ ${reviewScore(item)}`} style={styles.badge} />
                  ) : null}
                </View>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {item.titleByCountry || item.title || ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  back: { fontSize: 26, color: COLORS.INK, marginRight: 10, marginTop: -3 },
  title: { ...TYPE.H_TITLE, flex: 1 },
  count: { ...TYPE.XS },
  loading: { marginTop: 40 },
  scroll: { padding: 16, paddingBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48.5%', marginBottom: 14 },
  thumbWrap: {
    width: '100%',
    borderRadius: T.RADIUS.CARD,
    overflow: 'hidden',
    backgroundColor: COLORS.TRACK,
  },
  thumb: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 7, left: 7 },
  itemTitle: { ...TYPE.CARD_TITLE, fontSize: 12.5, marginTop: 6, lineHeight: 17 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 30, marginBottom: 10 },
  emptyTitle: { ...TYPE.CARD_TITLE, fontSize: 15, marginBottom: 6 },
  emptyDesc: { ...TYPE.SUB, textAlign: 'center', lineHeight: 18 },
});
