// 시안 8 (D23 v2.6): 홈 = 큐레이션 디스커버리 (오늘의집형).
// 히어로(운영 큐레이션) > 캠페인 미니카드 > 리뷰 썸네일 그리드(탭 → 세로 피드) > 카테고리 칩.
// 개인 요소는 "할 일 1줄 스트립"뿐 — 개인 지표는 마이/활동으로. 게스트도 접근 가능.
import React, { useCallback, useEffect, useState } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import APIprovider from '../../Components/APIprovider';
import Constants from '../../Components/Constants';
import T from '../../Components/Constants/DesignTokens';
import Strings from '../../Components/Strings';
import { Badge, Card, Chips, Wordmark } from '../../Components/UI';
import { fetchCampaigns, selectCampaigns } from '../../slices/campaign';
import { getCreatorProfile } from '../../api/creators';
import { getSeedings, SEEDING_STATUS } from '../../api/seedings';
import { daysLeft } from '../ActivityScreen/missionLogic';
import { CURATED_MIN_G, personalizedPoints } from '../TryScreen/points';

const { COLORS, TYPE } = T;
const GRID_HEIGHTS = [118, 96, 100, 132]; // 시안: 96~140 사이에서 리듬만 준다

// 서버 API 실패/빈 응답 시 그리드 폴백 (Phase 1 mock — 실연동 시 제거).
// 홈의 "발견과 욕망"(D23)은 리뷰 그리드가 절반이므로 빈 화면을 허용하지 않는다.
const MOCK_TRENDING = [
  { _id: 'mock-r1', title: 'Time slip eye cream · 2 weeks', score: '4.8', seed: 'greyd-r1' },
  { _id: 'mock-r2', title: 'Brow lift kit self perm', score: '4.6', seed: 'greyd-r2' },
  { _id: 'mock-r3', title: 'Hair treatment before/after', score: '4.9', seed: 'greyd-r3' },
  { _id: 'mock-r4', title: 'Glass skin routine', score: '4.7', seed: 'greyd-r4' },
  { _id: 'mock-r5', title: 'Cushion 12h wear test', score: '4.5', seed: 'greyd-r5' },
  { _id: 'mock-r6', title: 'Vegan lip tint swatch', score: '4.8', seed: 'greyd-r6' },
].map((m) => ({
  ...m,
  isMock: true,
  thumbnailUrl: `https://picsum.photos/seed/${m.seed}/400/560`,
}));

// 할 일 스트립 요약 (v2 §3-⑥ 우선순위: 주소 > 수령 > 업로드 D-N)
function buildTodos(seedings, campaignById) {
  const todos = [];
  Object.values(seedings).forEach((s) => {
    const campaign = campaignById[s.campaignId];
    if (!campaign) {
      return;
    }
    if (s.status === SEEDING_STATUS.APPROVED && !s.address) {
      todos.push({ order: 0, d: 0, summary: `${campaign.title} · ${Strings.HOME_TODO_ADDRESS}` });
    } else if (s.status === SEEDING_STATUS.SHIPPED) {
      todos.push({ order: 1, d: 0, summary: `${campaign.title} · ${Strings.HOME_TODO_RECEIVE}` });
    } else if (
      s.status === SEEDING_STATUS.RECEIVED ||
      (s.status === SEEDING_STATUS.REVIEWING && !s.uploadedAt)
    ) {
      const d = daysLeft(s);
      todos.push({
        order: 2,
        d: d ?? 99,
        summary: `${campaign.title} · ${Strings.HOME_TODO_UPLOAD(d ?? 0)}`,
      });
    }
  });
  todos.sort((a, b) => a.order - b.order || a.d - b.d);
  return todos;
}

// 점수 없으면 null — 배지 숨김 (✓ 0.0 노출 금지)
function reviewScore(item) {
  if (item.isMock) {
    return item.score;
  }
  const raw = item.g6RatingCount > 0 ? item.g6AvgRatingScore : item.ratingScore;
  const n = Number(raw || 0);
  return n > 0 ? n.toFixed(1) : null;
}

// 마감까지 남은 일수 — 지난 날짜는 0으로 (음수 D-day를 보여주지 않는다)
function daysUntil(dateStr) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

// 큐레이션 그리드는 썸네일 있는 리뷰만 전시
function gridThumbUrl(item) {
  return item.thumbnailUrl || item?.relayedVideo?.thumbnailUrl || null;
}

export default function CuratedHome({ navigation }) {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectCampaigns);
  const [gScore, setGScore] = useState(50);
  const [completedCount, setCompletedCount] = useState(0);
  const [todos, setTodos] = useState([]);
  const [videos, setVideos] = useState([]); // null = 로드 실패 → 섹션 숨김
  const [videosLoading, setVideosLoading] = useState(true);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    dispatch(fetchCampaigns());
  }, [dispatch]);

  const loadVideos = useCallback(async (categoryKey) => {
    setVideosLoading(true);
    const res =
      categoryKey === 'all'
        ? await APIprovider.getVideoList('main', undefined, '', '', 0, 12)
        : await APIprovider.getCategorizedVideoList(categoryKey, undefined, '', 0, 12);
    if (APIprovider.isFailure(res)) {
      setVideos(MOCK_TRENDING); // 서버 부재(mock 단계) — 그리드는 항상 채운다
    } else {
      const list = (res?.recent?.videoList ?? res?.videoList ?? []).filter((v) =>
        gridThumbUrl(v),
      );
      setVideos(list.length ? list : MOCK_TRENDING);
    }
    setVideosLoading(false);
  }, []);

  useEffect(() => {
    loadVideos(category);
  }, [category, loadVideos]);

  // 완주·시딩 상태는 다른 탭에서 바뀔 수 있으므로 포커스마다 갱신 (게스트: 프로필 null → 기본값)
  useFocusEffect(
    useCallback(() => {
      getCreatorProfile().then((profile) => {
        if (profile) {
          setGScore(profile.gScore ?? 50);
          setCompletedCount(profile.completedCount ?? 0);
        }
      });
      getSeedings().then((seedings) => {
        const campaignById = Object.fromEntries(campaigns.map((c) => [c.id, c]));
        setTodos(buildTodos(seedings, campaignById));
      });
    }, [campaigns]),
  );

  const curatedUnlocked = gScore >= CURATED_MIN_G || completedCount >= 2;
  const hero = campaigns.find(
    (c) => c.applyMode !== 'curated' && c.status === 'open' && c.remaining > 0,
  );
  const miniCampaigns = campaigns.filter((c) => c.id !== hero?.id).slice(0, 2);

  const openCampaign = (campaign) =>
    navigation.navigate('Try', { screen: 'CampaignDetail', params: { campaign } });

  // 피드는 화면을 갈아타는 곳이 아니라 이어서 넘겨 보는 곳이다.
  // 예전에는 홈 → HomeFeed(미리보기) → VideoPage로 두 단계를 거쳤고, 미리보기에서
  // 영상을 누르면 또 다른 화면이 열려 흐름이 끊겼다. 이제 누른 영상에서 바로
  // 세로 페이저(VideoPage)를 열고, 거기서 위아래로 자유롭게 넘긴다.
  // mock 데이터는 재생할 실제 영상이 없으므로 기존 미리보기 피드로 보낸다.
  const openFeed = (item) => {
    const playable = (videos || []).filter((v) => !v.isMock);
    if (!item || item.isMock || playable.length === 0) {
      navigation.navigate('HomeFeed');
      return;
    }
    navigation.navigate('VideoPage', { videoList: playable, videoId: item._id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 1. 헤더 */}
        <View style={styles.headerRow}>
          <Wordmark size={17} />
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => navigation.navigate('Search')} hitSlop={HIT_SLOP}>
              <Text style={styles.headerIcon}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notification')}
              hitSlop={HIT_SLOP}
            >
              <Text style={styles.headerIcon}>🔔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. 할 일 스트립 — 없으면 숨김 */}
        {todos.length > 0 ? (
          <TouchableOpacity
            style={styles.todoStrip}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Activity')}
          >
            <Text style={styles.todoText} numberOfLines={1}>
              {Strings.HOME_TODO(todos.length, todos[0].summary)}
            </Text>
            <Text style={styles.todoChevron}>›</Text>
          </TouchableOpacity>
        ) : null}

        {/* 3. 히어로 — 첫 Open 캠페인 */}
        {hero ? (
          <TouchableOpacity activeOpacity={0.85} onPress={() => openCampaign(hero)}>
            <View style={styles.hero}>
              {hero.thumbnailUrl ? (
                <FastImage source={{ uri: hero.thumbnailUrl }} style={styles.heroImage} />
              ) : (
                <View style={[styles.heroImage, styles.heroFallback]} />
              )}
              <LinearGradient
                colors={['rgba(20,14,4,0)', 'rgba(20,14,4,0.72)']}
                style={styles.heroOverlay}
              />
              <View style={styles.heroBody}>
                <Badge tone="open" text={Strings.HOME_HERO_SPOTS(hero.remaining)} />
              </View>
            </View>
            {/* 시안: 제목·조건은 이미지 위 글자가 아니라 아래 흰 카드로 내린다.
                밝은 썸네일에서도 읽히고, 신청 판단에 필요한 세 가지를 한 줄로 준다. */}
            <View style={styles.heroCard}>
              <Text style={styles.heroCardTitle} numberOfLines={2}>
                {hero.title}
              </Text>
              <Text style={styles.heroMeta} numberOfLines={1}>
                {[
                  Strings.HOME_HERO_CREATORS(hero.remaining),
                  hero.deadline ? Strings.HOME_HERO_CLOSES(daysUntil(hero.deadline)) : null,
                  (hero.countries || []).length
                    ? Strings.HOME_HERO_SHIPS((hero.countries || []).join('/'))
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* 4. 지금 신청 가능 */}
        {miniCampaigns.length > 0 ? (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>{Strings.HOME_APPLY_OPEN_NOW}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Try')} hitSlop={HIT_SLOP}>
                <Text style={styles.sectionLink}>{Strings.HOME_SEE_ALL} ›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.miniRow}>
              {miniCampaigns.map((campaign) => {
                const isCurated = campaign.applyMode === 'curated';
                const locked = isCurated && !curatedUnlocked;
                const points = personalizedPoints(
                  campaign.basePoints ?? campaign.rewardPoint,
                  gScore,
                );
                const sub = locked
                  ? `🔒 G${CURATED_MIN_G} · ${points}P~`
                  : isCurated
                    ? `Curated · ${points}P`
                    : `Open · ${points}P`;
                return (
                  <TouchableOpacity
                    key={campaign.id}
                    style={styles.miniTouch}
                    activeOpacity={0.85}
                    disabled={locked}
                    onPress={() => openCampaign(campaign)}
                  >
                    <Card style={[styles.miniCard, locked && styles.miniLocked]}>
                      <FastImage source={{ uri: campaign.thumbnailUrl }} style={styles.miniThumb} />
                      <View style={styles.miniBody}>
                        <Text style={styles.miniTitle} numberOfLines={1}>
                          {campaign.title}
                        </Text>
                        <Text style={styles.miniSub} numberOfLines={1}>
                          {sub}
                        </Text>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : null}

        {/* 5. 지금 뜨는 리뷰 — 로드 실패 시 섹션 숨김 */}
        {videos !== null ? (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>{Strings.HOME_TRENDING}</Text>
              <TouchableOpacity onPress={() => openFeed(videos[0])} hitSlop={HIT_SLOP}>
                <Text style={styles.sectionLink}>{Strings.HOME_GO_FEED} ▶</Text>
              </TouchableOpacity>
            </View>
            {videosLoading ? (
              <ActivityIndicator color={COLORS.AMBER} style={styles.gridLoading} />
            ) : (
              <View style={styles.grid}>
                {videos.map((item, index) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.gridItem}
                    activeOpacity={0.85}
                    onPress={() => openFeed(item)}
                  >
                    <View style={[styles.gridThumbWrap, { height: GRID_HEIGHTS[index % 4] }]}>
                      <FastImage source={{ uri: gridThumbUrl(item) }} style={styles.gridThumb} />
                      {reviewScore(item) ? (
                        <Badge
                          tone="amber"
                          text={`✓ ${reviewScore(item)}`}
                          style={styles.gridBadge}
                        />
                      ) : null}
                      <Text style={styles.gridTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 6. 카테고리 칩 */}
            <Chips
              style={styles.chips}
              items={[
                { key: 'all', label: Strings.HOME_CATEGORY_ALL },
                ...Constants.CATEGORY_LIST.map(({ key, title }) => ({ key, label: title })),
              ]}
              selected={category}
              onSelect={setCategory}
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 28, gap: 9 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerIcons: { flexDirection: 'row', gap: 14 },
  headerIcon: { fontSize: 15 },
  todoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.AMBER_SOFT,
    borderRadius: 9,
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  todoText: {
    flex: 1,
    fontFamily: T.FONT.Bold,
    fontSize: 10.5,
    color: COLORS.AMBER_DEEP,
  },
  todoChevron: { fontFamily: T.FONT.Bold, fontSize: 13, color: COLORS.AMBER_DEEP, marginLeft: 6 },
  hero: { height: 118, borderRadius: 14, overflow: 'hidden' },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroFallback: { backgroundColor: COLORS.TRACK },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  heroCard: {
    backgroundColor: COLORS.SURFACE,
    borderBottomLeftRadius: T.RADIUS.CARD,
    borderBottomRightRadius: T.RADIUS.CARD,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: -T.RADIUS.CARD,
    paddingTop: 12 + T.RADIUS.CARD,
  },
  heroCardTitle: { ...TYPE.CARD_TITLE, fontSize: 15, lineHeight: 20 },
  heroMeta: { ...TYPE.SUB, marginTop: 4 },
  heroBody: { position: 'absolute', left: 13, right: 13, bottom: 11 },
  heroTitle: {
    fontFamily: T.FONT.ExtraBold,
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 5,
    lineHeight: 18,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  sectionTitle: { fontFamily: T.FONT.Bold, fontSize: 13, color: COLORS.INK },
  sectionLink: { ...TYPE.XS },
  miniRow: { flexDirection: 'row', gap: 8 },
  miniTouch: { flex: 1 },
  miniCard: {
    paddingVertical: 9,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniLocked: { opacity: 0.75 },
  miniThumb: { width: 34, height: 34, borderRadius: 8, backgroundColor: COLORS.TRACK },
  miniBody: { flex: 1, marginLeft: 8 },
  miniTitle: { fontFamily: T.FONT.Bold, fontSize: 11.5, color: COLORS.INK },
  miniSub: { ...TYPE.XS, marginTop: 1 },
  gridLoading: { marginVertical: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48.6%', marginBottom: 8 },
  gridThumbWrap: { borderRadius: 10, overflow: 'hidden', backgroundColor: COLORS.TRACK },
  gridThumb: { ...StyleSheet.absoluteFillObject },
  gridBadge: { position: 'absolute', left: 7, top: 7 },
  gridTitle: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 7,
    fontFamily: T.FONT.Bold,
    fontSize: 10,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  chips: { marginTop: 2 },
});
