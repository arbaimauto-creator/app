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
import { Badge, Card, Chips, ProgressBar, Wordmark } from '../../Components/UI';
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

  const heroClosesIn = hero?.deadline ? daysUntil(hero.deadline) : null;
  // 히어로 정원 소진률 — 시안 1c의 "28 of 40 spots taken" 진행바
  const heroTotal = hero?.reviewersNeeded ?? hero?.quota ?? null;
  const heroTaken = heroTotal != null ? Math.max(0, heroTotal - (hero?.remaining ?? 0)) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        // 전면 히어로가 상태바까지 올라가므로 스크롤 인디케이터 여백도 위로 붙인다
        contentInsetAdjustmentBehavior="never"
      >
        {/* 1c 전면 히어로 — 이미지가 화면 폭을 꽉 채우고 그 위에 헤더가 얹힌다.
            아래 콘텐츠 시트가 이미지 위로 올라오며 상단 모서리만 둥글다. */}
        <View style={styles.heroLayer} pointerEvents="none">
          {hero?.thumbnailUrl ? (
            <FastImage source={{ uri: hero.thumbnailUrl }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroFallback]} />
          )}
          {/* 위쪽은 헤더 글자가, 아래쪽은 시트 경계가 읽히도록 양방향 그라데이션 */}
          <LinearGradient
            colors={['rgba(244,244,244,0.92)', 'rgba(244,244,244,0.15)', 'rgba(244,244,244,0.85)']}
            locations={[0, 0.42, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* 헤더 — 히어로 위에 얹히므로 아이콘은 흰 원형 버튼 */}
        <View style={styles.headerRow}>
          <Wordmark size={17} />
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Search')}
              hitSlop={HIT_SLOP}
            >
              <Text style={styles.headerIcon}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Notification')}
              hitSlop={HIT_SLOP}
            >
              <Text style={styles.headerIcon}>🔔</Text>
              {todos.length > 0 ? <View style={styles.iconDot} /> : null}
            </TouchableOpacity>
          </View>
        </View>

        {/* 히어로 위 텍스트 — 뱃지 2개 + 큰 제목 */}
        {hero ? (
          <View style={styles.heroText}>
            <View style={styles.heroBadges}>
              <Badge tone="amber" text={Strings.HOME_HERO_FEATURED} />
              {heroClosesIn != null ? (
                <Badge tone="curated" text={Strings.HOME_HERO_CLOSES(heroClosesIn)} />
              ) : null}
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {hero.title}
            </Text>
          </View>
        ) : (
          <View style={styles.heroTextEmpty} />
        )}

        {/* 콘텐츠 시트 — 여기부터는 일반 배경 위 카드들 */}
        <View style={styles.sheet}>
          {hero ? (
            <TouchableOpacity activeOpacity={0.9} onPress={() => openCampaign(hero)}>
              <Card>
                <Text style={styles.heroMeta} numberOfLines={1}>
                  {[
                    hero.brand,
                    (hero.countries || []).length
                      ? Strings.HOME_HERO_SHIPS((hero.countries || []).join(' / '))
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                <View style={styles.heroApplyRow}>
                  <View style={styles.heroApplyLeft}>
                    {heroTotal ? (
                      <>
                        <ProgressBar ratio={heroTaken / heroTotal} style={styles.heroBar} />
                        <Text style={styles.xs}>
                          {Strings.HOME_HERO_SPOTS_TAKEN(heroTaken, heroTotal)}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.xs}>{Strings.HOME_HERO_SPOTS(hero.remaining)}</Text>
                    )}
                  </View>
                  <View style={styles.applyBtn}>
                    <Text style={styles.applyBtnText}>{Strings.CAMPAIGN_APPLY}</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ) : null}

          {/* DO THIS NEXT — 할 일이 있을 때만. 오른쪽 원에 D-N */}
          {todos.length > 0 ? (
            <TouchableOpacity
              style={styles.nextStrip}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Activity')}
            >
              <View style={styles.nextBody}>
                <Text style={styles.nextLabel}>{Strings.HOME_DO_NEXT}</Text>
                <Text style={styles.nextTitle} numberOfLines={1}>
                  {todos[0].summary}
                </Text>
              </View>
              <View style={styles.nextDday}>
                <Text style={styles.nextDdayText}>D-{todos[0].d ?? 0}</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {/* Open now — 가로 스크롤 카드 */}
          {miniCampaigns.length > 0 ? (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>{Strings.HOME_APPLY_OPEN_NOW}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Try')} hitSlop={HIT_SLOP}>
                  <Text style={styles.sectionLink}>{Strings.HOME_SEE_ALL} ›</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.openRow}
              >
                {miniCampaigns.map((campaign) => {
                  const isCurated = campaign.applyMode === 'curated';
                  const locked = isCurated && !curatedUnlocked;
                  const points = personalizedPoints(
                    campaign.basePoints ?? campaign.rewardPoint,
                    gScore,
                  );
                  return (
                    <TouchableOpacity
                      key={campaign.id}
                      activeOpacity={0.85}
                      disabled={locked}
                      onPress={() => openCampaign(campaign)}
                    >
                      <View style={[styles.openCard, locked && styles.openLocked]}>
                        <View style={styles.openThumbWrap}>
                          <FastImage
                            source={{ uri: campaign.thumbnailUrl }}
                            style={styles.openThumb}
                          />
                          <Badge
                            tone={locked ? 'curated' : 'amber'}
                            text={locked ? `🔒 G${CURATED_MIN_G}` : Strings.CAMPAIGN_OPEN}
                            style={styles.openBadge}
                          />
                        </View>
                        <View style={styles.openBody}>
                          <Text style={styles.openTitle} numberOfLines={2}>
                            {campaign.title}
                          </Text>
                          <Text style={styles.xs} numberOfLines={1}>
                            {locked
                              ? Strings.CURATED_LOCKED_HINT(CURATED_MIN_G)
                              : `${Strings.CAMPAIGN_REMAINING(campaign.remaining)} · +${points}P`}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          ) : null}

          {/* Trending reviews — 좌우 2열, 높이를 달리해 리듬을 준다 */}
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
                <View style={styles.columns}>
                  {[0, 1].map((col) => (
                    <View key={col} style={styles.column}>
                      {videos
                        .filter((_, i) => i % 2 === col)
                        .map((item, i) => (
                          <TouchableOpacity
                            key={item._id}
                            activeOpacity={0.85}
                            onPress={() => openFeed(item)}
                          >
                            <View style={styles.reviewCard}>
                              <View
                                style={[
                                  styles.reviewThumbWrap,
                                  { height: GRID_HEIGHTS[(col * 2 + i) % 4] + 40 },
                                ]}
                              >
                                <FastImage
                                  source={{ uri: gridThumbUrl(item) }}
                                  style={styles.reviewThumb}
                                />
                                {reviewScore(item) ? (
                                  <Badge
                                    tone="amber"
                                    text={`✓ ${reviewScore(item)}`}
                                    style={styles.reviewBadge}
                                  />
                                ) : null}
                              </View>
                              <View style={styles.reviewBody}>
                                <Text style={styles.reviewTitle} numberOfLines={2}>
                                  {item.titleByCountry || item.title}
                                </Text>
                                {/* 하트 대신 인용 수 — 이 리뷰를 보고 몇 명이 만들었는가 */}
                                {item.relayedVideoCount > 0 ? (
                                  <Text style={styles.reviewMade}>
                                    {Strings.HOME_MADE_THIS(item.relayedVideoCount)}
                                  </Text>
                                ) : null}
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))}
                    </View>
                  ))}
                </View>
              )}

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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

const HERO_H = 380; // 시안 1c: 390×420 기준을 세로 여백에 맞춰 축소

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  // 히어로가 상태바 아래까지 올라오므로 컨테이너에는 인셋을 주지 않는다
  content: { paddingBottom: 28 },

  heroLayer: { position: 'absolute', top: 0, left: 0, right: 0, height: HERO_H },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroFallback: { backgroundColor: COLORS.TRACK },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: T.TOP_INSET + 4,
  },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.LINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: { fontSize: 14 },
  iconDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.AMBER,
    borderWidth: 1.5,
    borderColor: COLORS.SURFACE,
  },

  // 히어로 위 텍스트 — 이미지 하단부에 놓이도록 위쪽을 비운다
  heroText: { paddingHorizontal: 16, paddingTop: HERO_H - 210 },
  heroTextEmpty: { height: 12 },
  heroBadges: { flexDirection: 'row', gap: 7 },
  heroTitle: {
    fontFamily: T.FONT.ExtraBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.8,
    color: COLORS.INK,
    marginTop: 12,
    textShadowColor: 'rgba(255,255,255,0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // 콘텐츠 시트 — 이미지 위로 올라오며 상단 모서리만 둥글다
  sheet: {
    marginTop: 22,
    backgroundColor: COLORS.BG,
    borderTopLeftRadius: T.RADIUS.SHEET,
    borderTopRightRadius: T.RADIUS.SHEET,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },

  heroMeta: { ...TYPE.XS },
  heroApplyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  heroApplyLeft: { flex: 1 },
  heroBar: { marginBottom: 7 },
  xs: { ...TYPE.XS },
  applyBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: T.RADIUS.BTN_SM,
    backgroundColor: COLORS.AMBER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: { fontFamily: T.FONT.ExtraBold, fontSize: 13.5, color: COLORS.ON_AMBER },

  nextStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.AMBER_SOFT,
    borderRadius: T.RADIUS.CARD,
    padding: 13,
  },
  nextBody: { flex: 1 },
  nextLabel: { fontFamily: T.FONT.Bold, fontSize: 11, color: COLORS.AMBER_DEEP },
  nextTitle: { fontFamily: T.FONT.Bold, fontSize: 13, color: COLORS.INK, marginTop: 4 },
  nextDday: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextDdayText: { fontFamily: T.FONT.ExtraBold, fontSize: 13, color: COLORS.INK },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  sectionTitle: {
    fontFamily: T.FONT.ExtraBold,
    fontSize: 20,
    letterSpacing: -0.2,
    color: COLORS.INK,
  },
  sectionLink: { ...TYPE.SUB, fontFamily: T.FONT.Bold },

  openRow: { gap: 10, paddingVertical: 2, paddingRight: 16 },
  openCard: {
    width: 172,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.LINE,
    borderRadius: T.RADIUS.CARD,
    overflow: 'hidden',
  },
  openLocked: { opacity: 0.6 },
  openThumbWrap: { height: 108, backgroundColor: COLORS.TRACK },
  openThumb: { width: '100%', height: '100%' },
  openBadge: { position: 'absolute', top: 8, left: 8 },
  openBody: { paddingHorizontal: 12, paddingTop: 11, paddingBottom: 13 },
  openTitle: { ...TYPE.CARD_TITLE, fontSize: 13, lineHeight: 17, height: 34 },

  columns: { flexDirection: 'row', gap: 10, marginTop: 10 },
  column: { flex: 1, gap: 10 },
  reviewCard: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.LINE,
    borderRadius: T.RADIUS.CARD,
    overflow: 'hidden',
  },
  reviewThumbWrap: { backgroundColor: COLORS.TRACK },
  reviewThumb: { width: '100%', height: '100%' },
  reviewBadge: { position: 'absolute', top: 8, left: 8 },
  reviewBody: { paddingHorizontal: 11, paddingTop: 10, paddingBottom: 12 },
  reviewTitle: { ...TYPE.CARD_TITLE, fontSize: 12.5, lineHeight: 17 },
  reviewMade: { ...TYPE.XS, marginTop: 6 },

  gridLoading: { marginVertical: 24 },
  chips: { marginTop: 16 },
});

