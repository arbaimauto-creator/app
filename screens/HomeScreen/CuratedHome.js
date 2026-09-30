import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Preference from 'react-native-default-preference';
import { useFocusEffect, useScrollToTop } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import APIprovider from '../../Components/APIprovider';
import T from '../../Components/Constants/DesignTokens';
import Strings from '../../Components/Strings';
import { Badge, Btn, GlassOrbs, NoteBox, Wordmark } from '../../Components/UI';
import { fetchCampaigns, selectCampaigns } from '../../slices/campaign';
import { getCreatorProfile } from '../../api/creators';
import { getSeedings, SEEDING_STATUS } from '../../api/seedings';
import { daysLeft } from '../ActivityScreen/missionLogic';
import {
  buildActivityNotifications,
  countUnread,
  getActivityNotiReadAt,
} from '../../api/activityNotifications';
import GroupBuyRail from '../GroupBuyScreen/GroupBuyRail';
import HomeHero from './HomeHero';
import AutoTranslateText from '../../Components/AutoTranslateText';
import {
  REGULAR_UNLOCK_HITS,
  addRegular,
  getRegulars,
  hitCount,
  isUnlocked,
  removeRegular,
  seedRegularsFromFollowing,
} from '../../api/regulars';

const { COLORS, TYPE } = T;
const FILTERS = ['For you', 'Following', 'Skincare', 'Makeup', 'Food'];
const SORTS = ['Latest', 'Made count', 'Score'];
const CURATIONS = [
  {
    id: 'barrier',
    eyebrow: "EDITOR'S PICK",
    title: 'Barrier care that held up for 14 days',
    meta: '12 honest reviews',
    category: 'Skincare',
    image: 'https://picsum.photos/seed/greyd-curation-barrier/720/480',
  },
  {
    id: 'summer',
    eyebrow: 'TRENDING NOW',
    title: 'No-filter summer base tests',
    meta: '8 wear tests',
    category: 'Makeup',
    image: 'https://picsum.photos/seed/greyd-curation-base/720/480',
  },
  {
    id: 'routine',
    eyebrow: 'COMMUNITY LIST',
    title: 'The routines creators repurchased',
    meta: '21 community picks',
    category: 'For you',
    image: 'https://picsum.photos/seed/greyd-curation-routine/720/480',
  },
];

const MOCK_POSTS = [
  {
    _id: 'social-r1',
    title: 'Day 14 barrier cream test — same light, same hour',
    descriptionByCountry:
      'Redness is visibly down from day 9. The pump is annoying, but the finish stayed calm all day.',
    score: 9.2,
    category: 'Skincare',
    author: { name: 'yuna.reviews' },
    relayedVideoCount: 42,
    commentsCount: 12,
    thumbnailUrl: 'https://picsum.photos/seed/greyd-social-1/900/1100',
    isMock: true,
  },
  {
    _id: 'social-r2',
    title: '8-hour sunscreen pilling test, no filter',
    descriptionByCountry:
      'Full coverage at hour 0, a pilling check at hour 3, and the honest humidity result at hour 8.',
    score: 8.8,
    category: 'Makeup',
    author: { name: 'dana.tests' },
    relayedVideoCount: 31,
    commentsCount: 8,
    thumbnailUrl: 'https://picsum.photos/seed/greyd-social-2/900/1150',
    isMock: true,
  },
  {
    _id: 'social-r3',
    title: 'This cleanser stripped my skin',
    descriptionByCountry:
      'Sponsored or not, here is the pH strip and the before-and-after tightness at ten minutes.',
    score: 8.4,
    category: 'Skincare',
    author: { name: 'minji.beauty' },
    relayedVideoCount: 19,
    commentsCount: 24,
    thumbnailUrl: 'https://picsum.photos/seed/greyd-social-3/900/1040',
    isMock: true,
  },
];

function buildTodos(seedings, campaigns) {
  const byId = Object.fromEntries(campaigns.map((item) => [item.id, item]));
  return Object.values(seedings)
    .map((seeding) => {
      const campaign = byId[seeding.campaignId];
      if (!campaign) {
        return null;
      }
      if (
        seeding.status === SEEDING_STATUS.RECEIVED ||
        (seeding.status === SEEDING_STATUS.REVIEWING && !seeding.uploadedAt)
      ) {
        return { title: campaign.title, d: daysLeft(seeding) ?? 0, order: 0 };
      }
      if (seeding.status === SEEDING_STATUS.SHIPPED) {
        return { title: campaign.title, d: 0, order: 1 };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order || a.d - b.d);
}

const thumb = (item) => item.thumbnailUrl || item?.relayedVideo?.thumbnailUrl || null;
const authorName = (item) =>
  item?.author?.name || item?.user?.name || item?.userName || 'greyd.creator';
const authorId = (item) => item?.author?.userId || item?.user?.userId || item?.userId || null;
// 필터/정렬 값은 로직 키로 유지하고 표시만 번역한다 (2026-09-17)
const filterLabel = (value) => Strings.HOME_FILTER_LABEL?.[value] || value;
const sortLabel = (value) => Strings.HOME_SORT_LABEL?.[value] || value;
const authorImage = (item) =>
  item?.author?.profilePicUrl || item?.user?.profilePicUrl || thumb(item);
const postCategory = (item) =>
  item?.category?.title || item?.category?.name || item?.categoryName || item?.category || 'Review';
const madeCount = (item) => Number(item.relayedVideoCount || item.madeCount || 0);
const commentCount = (item) =>
  Number(item.commentsCount || item.commentCount || item.comments?.length || 0);
const caption = (item) =>
  item.descriptionByCountry ||
  item.description ||
  item.titleByCountry ||
  item.title ||
  'An honest review from the greyd community.';

function reviewScore(item) {
  const raw =
    item.score ??
    (item.g6RatingCount > 0 ? item.g6AvgRatingScore : item.ratingScore) ??
    item.g6AvgRatingScore;
  const value = Number(raw || 0);
  if (value <= 0) {
    return null;
  }
  return value > 10 ? (value / 10).toFixed(1) : value.toFixed(1);
}

export default function CuratedHome({ navigation }) {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectCampaigns);
  const [gScore, setGScore] = useState(50);
  const [todos, setTodos] = useState([]);
  const [unreadNoti, setUnreadNoti] = useState(0);
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);
  const feedRequest = useRef(0);
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);
  const [filter, setFilter] = useState('For you');
  const [sort, setSort] = useState('Latest');
  // 단골 (2026-09-17): { [authorId]: { regular: bool, hits: number } } — 팔로우 대체
  const [regularState, setRegularState] = useState({});
  const [saved, setSaved] = useState({});

  const loadRegulars = useCallback(async () => {
    const ids = await getRegulars();
    const next = {};
    ids.forEach((id) => {
      next[id] = { regular: true, hits: REGULAR_UNLOCK_HITS };
    });
    setRegularState(next);
  }, []);

  useEffect(() => {
    // 기존 팔로우 승계 — 서버 목록을 한 번 읽어 단골 캐시에 병합 (실패해도 무시)
    Preference.get('userId')
      .then((uid) => (uid ? APIprovider.getFollowingList(uid) : null))
      .then((res) => {
        const ids = (res?.userList ?? res?.list ?? [])
          .map((u) => u.userId || u._id)
          .filter(Boolean);
        return ids.length ? seedRegularsFromFollowing(ids) : null;
      })
      .catch(() => {})
      .finally(loadRegulars);
  }, [loadRegulars]);

  const onToggleRegular = async (item) => {
    const id = authorId(item);
    if (!id) {
      return;
    }
    const current = regularState[id];
    if (current?.regular) {
      setRegularState((s) => ({ ...s, [id]: { ...current, regular: false } }));
      removeRegular(id);
      APIprovider.followUser(id, false).catch(() => {});
      return;
    }
    if (await isUnlocked(id)) {
      setRegularState((s) => ({ ...s, [id]: { regular: true, hits: REGULAR_UNLOCK_HITS } }));
      addRegular(id);
      APIprovider.followUser(id, true).catch(() => {});
      return;
    }
    const hits = await hitCount(id);
    setRegularState((s) => ({ ...s, [id]: { regular: false, hits } }));
    Alert.alert(
      Strings.REGULAR_LOCKED_TITLE,
      `${Strings.REGULAR_LOCKED(hits, REGULAR_UNLOCK_HITS)}\n${Strings.REGULAR_LOCKED_GUIDE}`,
    );
  };

  useEffect(() => {
    dispatch(fetchCampaigns());
  }, [dispatch]);

  const loadPosts = useCallback(async () => {
    const request = ++feedRequest.current;
    setLoading(true);
    setFeedError(false);
    try {
      const response = await APIprovider.getVideoList('main', undefined, '', '', 0, 20);
      if (request !== feedRequest.current) {
        return;
      }
      if (APIprovider.isFailure(response)) {
        throw new Error('Feed unavailable');
      }
      const list = (response?.recent?.videoList ?? response?.videoList ?? []).filter(thumb);
      setPosts(list.length ? list : MOCK_POSTS);
    } catch {
      if (request === feedRequest.current) {
        setFeedError(true);
      }
    } finally {
      if (request === feedRequest.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadPosts();
    return () => {
      feedRequest.current += 1;
    };
  }, [loadPosts]);

  useFocusEffect(
    useCallback(() => {
      getCreatorProfile()
        .then((profile) => setGScore(profile?.gScore ?? 50))
        .catch(() => {});
      getSeedings()
        .then(async (seedings) => {
          setTodos(buildTodos(seedings, campaigns));
          // 종 아이콘 점 = 아직 안 읽은 캠페인 활동 알림(할 일 개수가 아니라)
          const readAt = await getActivityNotiReadAt().catch(() => null);
          setUnreadNoti(countUnread(buildActivityNotifications(seedings, campaigns), readAt));
        })
        .catch(() => {});
    }, [campaigns]),
  );

  const visiblePosts = useMemo(() => {
    let result = posts.filter((item) => {
      if (filter === 'For you') {
        return true;
      }
      if (filter === 'Following') {
        return Boolean(regularState[authorId(item)]?.regular);
      }
      return String(postCategory(item)).toLowerCase().includes(filter.toLowerCase());
    });
    result = [...result];
    if (sort === 'Made count') {
      result.sort((a, b) => madeCount(b) - madeCount(a));
    } else if (sort === 'Score') {
      result.sort((a, b) => Number(reviewScore(b) || 0) - Number(reviewScore(a) || 0));
    }
    return result;
  }, [filter, regularState, posts, sort]);

  const creators = useMemo(() => {
    const seen = new Set();
    const unique = posts.filter((item) => {
      const name = authorName(item);
      if (seen.has(name)) {
        return false;
      }
      seen.add(name);
      return true;
    });
    // 단골 리뷰어 우선 노출 (2026-09-17, 설계 §4-3) — 안정 정렬이라 나머지 순서는 유지
    const isRegularAuthor = (item) => Boolean(regularState[authorId(item)]?.regular);
    return unique
      .sort((a, b) => Number(isRegularAuthor(b)) - Number(isRegularAuthor(a)))
      .slice(0, 8);
  }, [posts, regularState]);

  const playablePosts = useMemo(() => posts.filter((post) => !post.isMock), [posts]);

  const openPost = (item) => {
    // 구버전 홈(HomeFeed)으로 보내지 않는다 — 새 버전과 호환되지 않는 옛 리워드 동선이 노출된다.
    if (item.isMock || playablePosts.length === 0) {
      return;
    }
    navigation.navigate('VideoPage', { videoList: playablePosts, videoId: item._id });
  };

  // 구매 직행 (2026-09-17): 연결 상품이 있으면 상품 페이지로, 없으면 리뷰를 열어 구매 CTA로
  const openBuy = (item) => {
    const productId = item?.linkedProduct?.productId || item?.linkedProduct?._id;
    if (productId) {
      navigation.navigate('ProductPage', { productId });
      return;
    }
    openPost(item);
  };

  const openAuthor = (item) => {
    const userId = authorId(item);
    if (!userId) {
      return;
    }
    navigation.navigate('UserPage', {
      pageOwnerUserId: userId,
      pageOwnerUserName: authorName(item),
      pageOwnerUserProfilePicUrl: item?.author?.profilePicUrl || item?.user?.profilePicUrl || null,
    });
  };

  const cycleSort = () => setSort((current) => SORTS[(SORTS.indexOf(current) + 1) % SORTS.length]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 글래스 컨셉 (2026-09-17): 유리 카드 뒤에 떠 있는 골드 오브 */}
      <GlassOrbs />
      <View style={styles.header}>
        <Wordmark size={20} />
        <View style={styles.gScore}>
          <Text style={styles.gLabel}>G</Text>
          <Text style={styles.gValue}>{gScore}</Text>
        </View>
        <View style={styles.headerActions}>
          <RoundIcon
            name="storefront-outline"
            onPress={() => navigation.navigate('StoreCatalog')}
          />
          <RoundIcon name="magnify" onPress={() => navigation.navigate('Search')} />
          <RoundIcon
            name="bell-outline"
            dot={unreadNoti > 0}
            onPress={() => navigation.navigate('Notification')}
          />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              loadPosts();
              dispatch(fetchCampaigns());
            }}
            tintColor={COLORS.AMBER}
            colors={[COLORS.AMBER]}
          />
        }
      >
        {feedError && (
          <View style={{ paddingHorizontal: 16, gap: 8 }}>
            <NoteBox text={Strings.FAILED_TO_LOAD_DATA} tone="red" />
            <Btn title={Strings.FEED_RETRY} onPress={loadPosts} variant="ghost" small />
          </View>
        )}
        {!loading && posts.some((post) => post.isMock) && (
          <View style={{ paddingHorizontal: 16 }}>
            <NoteBox text={Strings.FEED_DEMO_NOTICE} />
          </View>
        )}
        {/* 기획서 §5.1 첫 화면: 할 일 → 신청 가능 캠페인 → 보상 현황이 리뷰 피드보다 먼저 */}
        <HomeHero navigation={navigation} campaigns={campaigns} />

        {/* 공동구매 (2026-09-30) — 모집 중·오픈 예정. 없으면 렌더하지 않는다 */}
        <GroupBuyRail navigation={navigation} />

        <TouchableOpacity
          style={styles.composer}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Camera')}
        >
          <View style={styles.composerIcon}>
            <MaterialCommunityIcons name="plus" size={22} color={COLORS.AMBER_DEEP} />
          </View>
          <View style={styles.composerCopy}>
            <Text style={styles.composerEyebrow}>
              {todos[0] ? Strings.HOME_COMPOSER_DRAFT : Strings.HOME_COMPOSER_SHARE}
            </Text>
            <Text style={styles.composerTitle} numberOfLines={1}>
              {todos[0]?.title || Strings.HOME_COMPOSER_PROMPT}
            </Text>
          </View>
          <View style={styles.primarySmall}>
            <Text style={styles.primarySmallText}>
              {todos[0] ? Strings.HOME_COMPOSER_CONTINUE : Strings.HOME_COMPOSER_CREATE}
            </Text>
          </View>
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
        >
          <TouchableOpacity style={styles.story} onPress={() => navigation.navigate('Camera')}>
            <View style={[styles.storyImage, styles.addStory]}>
              <MaterialCommunityIcons name="plus" size={23} color={COLORS.GREY} />
            </View>
            <Text style={styles.storyName}>Post</Text>
          </TouchableOpacity>
          {creators.map((item) => (
            <TouchableOpacity key={item._id} style={styles.story} onPress={() => openPost(item)}>
              <View style={styles.storyRing}>
                <FastImage source={{ uri: authorImage(item) }} style={styles.storyImage} />
                <View style={styles.storyScore}>
                  <Text style={styles.storyScoreText}>{reviewScore(item) || 'G'}</Text>
                </View>
              </View>
              <Text style={styles.storyName} numberOfLines={1}>
                @{authorName(item).replace(/^@/, '')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filter, filter === item && styles.filterSelected]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextSelected]}>
                {filterLabel(item)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.curationHeader}>
          <View>
            <Text style={styles.curationEyebrow}>{Strings.HOME_CURATED_EYEBROW}</Text>
            <Text style={styles.curationHeading}>{Strings.HOME_CURATED_HEADING}</Text>
          </View>
          <TouchableOpacity onPress={() => setFilter('For you')}>
            <Text style={styles.curationSeeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.curationRail}
        >
          {CURATIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.curationCard}
              activeOpacity={0.9}
              onPress={() => setFilter(item.category)}
            >
              <FastImage source={{ uri: item.image }} style={styles.curationImage}>
                <View style={styles.curationShade} />
                <View style={styles.curationCopy}>
                  <Text style={styles.curationCardEyebrow}>{item.eyebrow}</Text>
                  <Text style={styles.curationTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.curationMetaRow}>
                    <Text style={styles.curationMeta}>{item.meta}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={15} color="#FFFFFF" />
                  </View>
                </View>
              </FastImage>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.feedMeta}>
          <Text style={styles.feedCount}>
            {Strings.HOME_REVIEWS_COUNT(visiblePosts.length, filterLabel(filter))}
          </Text>
          <View style={styles.feedActions}>
            {playablePosts.length > 0 ? (
              <TouchableOpacity
                style={[styles.sortButton, styles.swipeFeedButton]}
                onPress={() => openPost(playablePosts[0])}
                accessibilityRole="button"
                accessibilityLabel="Open vertical swipe feed"
              >
                <MaterialCommunityIcons name="gesture-swipe-vertical" size={15} color="#FFFFFF" />
                <Text style={styles.swipeFeedText}>{Strings.HOME_GO_FEED}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.sortButton} onPress={cycleSort}>
              <Text style={styles.sortText}>{sortLabel(sort)}</Text>
              <MaterialCommunityIcons name="swap-vertical" size={15} color={COLORS.INK} />
            </TouchableOpacity>
          </View>
        </View>

        {loading && visiblePosts.length === 0 ? (
          <ActivityIndicator color={COLORS.AMBER} style={styles.loader} />
        ) : visiblePosts.length ? (
          <View style={styles.feed}>
            {visiblePosts.map((item) => (
              <PostCard
                key={item._id}
                item={item}
                following={Boolean(regularState[authorId(item)]?.regular)}
                saved={Boolean(saved[item._id])}
                onOpen={() => openPost(item)}
                onAuthor={() => openAuthor(item)}
                onFollow={() => onToggleRegular(item)}
                onSave={() =>
                  setSaved((current) => ({ ...current, [item._id]: !current[item._id] }))
                }
                onShare={() =>
                  Share.share({ message: item.titleByCountry || item.title || caption(item) })
                }
                onBuy={() => openBuy(item)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="account-search-outline" size={30} color={COLORS.GREY} />
            <Text style={styles.emptyTitle}>{Strings.HOME_EMPTY_TITLE(filterLabel(filter))}</Text>
            <Text style={styles.emptyBody}>{Strings.HOME_EMPTY_BODY}</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => setFilter('For you')}>
              <Text style={styles.emptyButtonText}>{Strings.HOME_EMPTY_BACK}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && visiblePosts.length > 0 ? (
          <View style={styles.caughtUp}>
            <Text style={styles.caughtUpTitle}>{Strings.HOME_CAUGHT_UP}</Text>
            <Text style={styles.caughtUpBody}>{Strings.HOME_CAUGHT_UP_BODY}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function RoundIcon({ name, dot, onPress }) {
  return (
    <TouchableOpacity style={styles.iconButton} onPress={onPress}>
      <MaterialCommunityIcons name={name} size={18} color={COLORS.INK} />
      {dot ? <View style={styles.notificationDot} /> : null}
    </TouchableOpacity>
  );
}

function PostCard({ item, following, saved, onOpen, onAuthor, onFollow, onSave, onShare, onBuy }) {
  const name = authorName(item);
  const value = reviewScore(item);
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.authorTap}
          activeOpacity={0.8}
          onPress={onAuthor}
          accessibilityRole="button"
          accessibilityLabel={`Open @${name.replace(/^@/, '')} profile`}
        >
          <FastImage source={{ uri: authorImage(item) }} style={styles.postAvatar} />
          <View style={styles.identity}>
            <View style={styles.nameRow}>
              <Text style={styles.postName} numberOfLines={1}>
                @{name.replace(/^@/, '')}
              </Text>
              <View style={styles.authorScore}>
                <Text style={styles.authorScoreText}>G {Math.round(Number(value || 8) * 10)}</Text>
              </View>
            </View>
            <Text style={styles.postMeta} numberOfLines={1}>
              {postCategory(item)} ·{' '}
              {item.isSponsored ? Strings.HOME_POST_SPONSORED : Strings.HOME_POST_COMMUNITY}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.followButton, following && styles.followingButton]}
          onPress={onFollow}
        >
          <Text style={[styles.followText, following && styles.followingText]}>
            {following ? Strings.REGULAR_DONE : Strings.REGULAR_CTA}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.media} activeOpacity={0.94} onPress={onOpen}>
        <FastImage source={{ uri: thumb(item) }} style={styles.mediaImage} />
        {value ? <Badge tone="amber" text={`✓ ${value}`} style={styles.mediaScore} /> : null}
        <View style={styles.mediaType}>
          <MaterialCommunityIcons
            name={item.videoUrl ? 'play' : 'image-multiple-outline'}
            size={13}
            color="#FFFFFF"
          />
          <Text style={styles.mediaTypeText}>{item.videoUrl ? 'VIDEO' : 'PHOTO'}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.postBody}>
        <View style={styles.marks}>
          <Metric label={Strings.HOME_METRIC_EVIDENCE} value={value || '—'} />
          <Metric label={Strings.HOME_METRIC_MADE} value={madeCount(item)} />
          <Metric label={Strings.HOME_METRIC_COMMENTS} value={commentCount(item)} />
        </View>
        {/* 리뷰 본문 자동 번역 (2026-09-17) — 앱 언어와 다르면 번역, "원문 보기" 가능 */}
        <AutoTranslateText text={caption(item)} style={styles.caption} numberOfLines={4} />
        <Text style={styles.tags}>
          #honestreview #greyd #{String(postCategory(item)).toLowerCase()}
        </Text>
        <TouchableOpacity style={styles.madeRow} onPress={onOpen}>
          <View style={styles.avatarStack}>
            {[0, 1, 2].map((index) => (
              <View key={index} style={[styles.stackAvatar, index > 0 && styles.stackOverlap]} />
            ))}
          </View>
          <Text style={styles.madeText}>
            <Text style={styles.madeStrong}>{madeCount(item)}</Text>
            {Strings.HOME_MADE_FROM_SUFFIX}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.commentPreview} onPress={onOpen}>
          <Text style={styles.commentText}>
            <Text style={styles.commentAuthor}>greyd.community </Text>
            {Strings.HOME_PROMPT_QUESTION}
          </Text>
          <Text style={styles.commentCount}>
            {Strings.HOME_VIEW_ALL_COMMENTS(commentCount(item))}
          </Text>
        </TouchableOpacity>
        <View style={styles.actions}>
          <Action
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            label={saved ? Strings.REF_SAVED : Strings.REF_SAVE}
            active={saved}
            onPress={onSave}
          />
          <Action icon="share-variant-outline" label={Strings.SHARE} onPress={onShare} />
          {/* "참고해서 올리기"는 저장(책갈피) → 리뷰 상세의 히든 동선으로 — 홈 카드는 구매 직행 (2026-09-17) */}
          <TouchableOpacity style={styles.makeAction} onPress={onBuy}>
            <Text style={styles.makeActionText}>{Strings.HOME_GO_BUY}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function Metric({ label, value }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Action({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.action, active && styles.actionActive]} onPress={onPress}>
      <MaterialCommunityIcons
        name={icon}
        size={16}
        color={active ? COLORS.AMBER_DEEP : COLORS.GREY}
      />
      <Text style={[styles.actionText, active && styles.actionTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LINE,
  },
  gScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: T.RADIUS.PILL,
    backgroundColor: COLORS.AMBER_SOFT,
  },
  gLabel: { fontFamily: T.FONT.ExtraBold, fontSize: 10, color: COLORS.AMBER_DEEP },
  gValue: { fontFamily: T.SERIF.Bold, fontSize: 15, color: COLORS.AMBER_DEEP, lineHeight: 17 },
  headerActions: { marginLeft: 'auto', flexDirection: 'row', gap: 10 },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(27,24,20,0.18)',
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
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
  content: { paddingTop: 12, paddingBottom: 28 },
  composer: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    borderRadius: T.RADIUS.CARD,
    backgroundColor: COLORS.GLASS,
    ...T.SHADOW_SOFT,
  },
  composerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.IVORY,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.CHAMPAGNE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerCopy: { flex: 1, minWidth: 0 },
  composerEyebrow: { fontFamily: T.FONT.Bold, fontSize: 11, color: COLORS.AMBER_DEEP },
  composerTitle: { fontFamily: T.FONT.Bold, fontSize: 13, color: COLORS.INK, marginTop: 3 },
  primarySmall: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: T.RADIUS.BTN_SM,
    backgroundColor: COLORS.INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarySmallText: {
    fontFamily: T.FONT.SemiBold,
    fontSize: 12,
    color: COLORS.ON_INK,
    letterSpacing: 0.2,
  },
  rail: { gap: 13, paddingHorizontal: 16, paddingBottom: 14 },
  story: { width: 58, alignItems: 'center', gap: 6 },
  storyRing: {
    width: 58,
    height: 58,
    padding: 1.5,
    borderRadius: 29,
    backgroundColor: COLORS.CHAMPAGNE,
  },
  storyImage: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderColor: COLORS.BG },
  addStory: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: COLORS.GREY,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyScore: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.LINE,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyScoreText: { fontFamily: T.FONT.ExtraBold, fontSize: 9, color: COLORS.INK },
  storyName: { ...TYPE.XS, width: 58, textAlign: 'center' },
  filters: { gap: 7, paddingHorizontal: 16, paddingBottom: 6 },
  filter: {
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: T.RADIUS.PILL,
    borderWidth: 1,
    borderColor: COLORS.LINE,
    backgroundColor: COLORS.SURFACE,
  },
  filterSelected: { borderColor: COLORS.AMBER, backgroundColor: COLORS.AMBER },
  filterText: { fontFamily: T.FONT.Regular, fontSize: 11.5, color: COLORS.GREY },
  filterTextSelected: { fontFamily: T.FONT.Bold, color: COLORS.ON_AMBER },
  curationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  curationEyebrow: {
    fontFamily: T.FONT.ExtraBold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: COLORS.AMBER_DEEP,
  },
  curationHeading: { fontFamily: T.FONT.ExtraBold, fontSize: 18, color: COLORS.INK, marginTop: 3 },
  curationSeeAll: { fontFamily: T.FONT.Bold, fontSize: 11.5, color: COLORS.GREY },
  curationRail: { gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  curationCard: {
    width: 246,
    height: 156,
    overflow: 'hidden',
    borderRadius: T.RADIUS.CARD,
    backgroundColor: COLORS.TRACK,
    ...T.SHADOW_CARD,
  },
  curationImage: { flex: 1, justifyContent: 'flex-end' },
  curationShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,15,15,0.34)',
  },
  curationCopy: { padding: 14 },
  curationCardEyebrow: {
    fontFamily: T.FONT.ExtraBold,
    fontSize: 9.5,
    letterSpacing: 0.7,
    color: COLORS.AMBER,
  },
  curationTitle: {
    maxWidth: 210,
    marginTop: 4,
    fontFamily: T.FONT.ExtraBold,
    fontSize: 16,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  curationMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  curationMeta: { fontFamily: T.FONT.Bold, fontSize: 10.5, color: '#FFFFFF' },
  feedMeta: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 10 },
  feedCount: { fontFamily: T.FONT.Bold, fontSize: 11, color: COLORS.GREY },
  feedActions: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: T.RADIUS.BTN_SM,
    borderWidth: 1,
    borderColor: COLORS.LINE,
    backgroundColor: COLORS.SURFACE,
  },
  sortText: { fontFamily: T.FONT.Bold, fontSize: 11, color: COLORS.INK },
  swipeFeedButton: { backgroundColor: COLORS.INK, borderColor: COLORS.INK },
  swipeFeedText: { fontFamily: T.FONT.Bold, fontSize: 11, color: '#FFFFFF' },
  loader: { marginVertical: 48 },
  feed: { gap: 12, paddingHorizontal: 16 },
  postCard: {
    overflow: 'hidden',
    borderRadius: T.RADIUS.CARD,
    borderWidth: 1,
    borderColor: COLORS.LINE,
    backgroundColor: COLORS.SURFACE,
    ...T.SHADOW_CARD,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12 },
  authorTap: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 9 },
  postAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.TRACK },
  identity: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postName: { fontFamily: T.FONT.Bold, fontSize: 12.5, color: COLORS.INK, maxWidth: '70%' },
  authorScore: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 5,
    backgroundColor: COLORS.AMBER_SOFT,
  },
  authorScoreText: { fontFamily: T.FONT.ExtraBold, fontSize: 9.5, color: COLORS.AMBER_DEEP },
  postMeta: { ...TYPE.XS, marginTop: 3 },
  followButton: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: T.RADIUS.BTN_SM,
    borderWidth: 1,
    borderColor: COLORS.AMBER,
    backgroundColor: COLORS.AMBER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: { borderColor: COLORS.LINE, backgroundColor: 'transparent' },
  followText: { fontFamily: T.FONT.ExtraBold, fontSize: 11, color: COLORS.ON_AMBER },
  followingText: { color: COLORS.GREY },
  media: { height: 360, position: 'relative', backgroundColor: COLORS.TRACK },
  mediaImage: { width: '100%', height: '100%' },
  mediaScore: { position: 'absolute', top: 10, left: 10 },
  mediaType: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
    backgroundColor: 'rgba(23,23,23,0.72)',
  },
  mediaTypeText: { fontFamily: T.FONT.ExtraBold, fontSize: 10, color: '#FFFFFF' },
  postBody: { padding: 13, paddingTop: 11 },
  marks: { flexDirection: 'row', gap: 6 },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
    backgroundColor: COLORS.BG,
  },
  metricLabel: { fontFamily: T.FONT.Regular, fontSize: 10, color: COLORS.GREY },
  metricValue: { fontFamily: T.FONT.ExtraBold, fontSize: 10.5, color: COLORS.INK },
  caption: {
    fontFamily: T.FONT.Regular,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.INK,
    marginTop: 10,
  },
  tags: { fontFamily: T.FONT.Regular, fontSize: 11.5, color: COLORS.AMBER_DEEP, marginTop: 6 },
  madeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  avatarStack: { flexDirection: 'row' },
  stackAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.SURFACE,
    backgroundColor: COLORS.TRACK,
  },
  stackOverlap: { marginLeft: -7 },
  madeText: { fontFamily: T.FONT.Regular, fontSize: 11.5, color: COLORS.GREY },
  madeStrong: { fontFamily: T.FONT.ExtraBold, color: COLORS.INK },
  commentPreview: {
    marginTop: 11,
    padding: 10,
    borderRadius: T.RADIUS.FIELD,
    backgroundColor: COLORS.BG,
  },
  commentText: { fontFamily: T.FONT.Regular, fontSize: 11.5, lineHeight: 17, color: COLORS.INK },
  commentAuthor: { fontFamily: T.FONT.Bold },
  commentCount: { ...TYPE.XS, marginTop: 5 },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.LINE,
  },
  action: {
    height: 34,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: T.RADIUS.BTN_SM,
    borderWidth: 1,
    borderColor: COLORS.LINE,
  },
  actionActive: { borderColor: COLORS.AMBER_SOFT, backgroundColor: COLORS.AMBER_SOFT },
  actionText: { fontFamily: T.FONT.ExtraBold, fontSize: 11, color: COLORS.GREY },
  actionTextActive: { color: COLORS.AMBER_DEEP },
  makeAction: {
    flex: 1,
    height: 34,
    borderRadius: T.RADIUS.BTN_SM,
    backgroundColor: COLORS.AMBER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  makeActionText: { fontFamily: T.FONT.ExtraBold, fontSize: 11, color: COLORS.ON_AMBER },
  empty: { marginHorizontal: 16, marginTop: 38, alignItems: 'center', paddingHorizontal: 20 },
  emptyTitle: { fontFamily: T.FONT.Bold, fontSize: 14, color: COLORS.INK, marginTop: 14 },
  emptyBody: { ...TYPE.BODY, color: COLORS.GREY, textAlign: 'center', marginTop: 6 },
  emptyButton: {
    marginTop: 16,
    height: 44,
    paddingHorizontal: 18,
    borderRadius: T.RADIUS.BTN,
    backgroundColor: COLORS.AMBER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: { fontFamily: T.FONT.ExtraBold, fontSize: 13.5, color: COLORS.ON_AMBER },
  caughtUp: {
    margin: 16,
    padding: 18,
    alignItems: 'center',
    borderRadius: T.RADIUS.CARD,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.LINE,
  },
  caughtUpTitle: { fontFamily: T.FONT.Bold, fontSize: 12.5, color: COLORS.INK },
  caughtUpBody: { ...TYPE.SUB, marginTop: 4, textAlign: 'center' },
});
