# "단골" 관계 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 팔로우를 "단골"(근거 기반 신뢰 관계)로 대체 — 적중 2회가 쌓여야 단골 맺기가 열린다.

**Architecture:** 적중 기록·잠금 판정은 `api/regulars.js`(prefSafe 로컬 저장, 기존 hiddenCampaigns 패턴)로 신설. 관계 저장은 기존 팔로우 API(`APIprovider.followUser`)를 그대로 쓰고, UI(홈 카드·FollowList·마이 탭)는 라벨과 게이트만 교체한다. 서버 변경 없음.

**Tech Stack:** React Native 0.76, Jest, react-native-default-preference(prefSafe 래퍼)

## Global Constraints

- 정책 상수 `REGULAR_UNLOCK_HITS = 2` — 숫자를 코드에 흩뿌리지 말 것
- 기존 팔로우 관계는 삭제·잠금 소급 없이 전부 단골로 승계
- 같은 리뷰(videoId)로는 적중 1회만, 같은 리뷰에 프롬프트 재노출 금지
- 문자열은 반드시 `Components/Strings/kor.js`·`eng.js` 양쪽에 추가
- 커밋 전 `corepack yarn test --runInBand` 통과 확인 (Windows에서 `yarn` 단독 명령은 없음 — bash로 `corepack yarn` 사용)

---

### Task 1: 적중 원장 `api/regulars.js`

**Files:**
- Create: `api/regulars.js`
- Test: `api/regulars.test.js`

**Interfaces:**
- Produces: `REGULAR_UNLOCK_HITS`(number), `recordHit(reviewerId, videoId, type, at?) -> Promise<{counted, hits}>`, `hitCount(reviewerId) -> Promise<number>`, `isUnlocked(reviewerId) -> Promise<boolean>`, `wasPromptShown(videoId) -> Promise<boolean>`, `markPromptShown(videoId) -> Promise<void>`, `getRegulars() -> Promise<string[]>`, `addRegular(reviewerId)`, `removeRegular(reviewerId)`, `seedRegularsFromFollowing(ids) -> Promise<string[]>`
- Consumes: `api/prefSafe.js`의 `prefGetSafe(key)`, `prefSetSafe(key, value)`

- [ ] **Step 1: 실패하는 테스트 작성** — `api/regulars.test.js`

```js
// 단골 적중 원장 (2026-09-17) — 리뷰 단위 dedupe, 2회 도달 시 잠금 해제
jest.mock('./prefSafe', () => {
  const store = {};
  return {
    prefGetSafe: jest.fn(async (k) => store[k] ?? null),
    prefSetSafe: jest.fn(async (k, v) => {
      store[k] = v;
    }),
    __store: store,
  };
});

const {
  REGULAR_UNLOCK_HITS,
  recordHit,
  hitCount,
  isUnlocked,
  wasPromptShown,
  markPromptShown,
  getRegulars,
  addRegular,
  removeRegular,
  seedRegularsFromFollowing,
} = require('./regulars');

const pref = require('./prefSafe');

beforeEach(() => {
  Object.keys(pref.__store).forEach((k) => delete pref.__store[k]);
});

test('적중이 쌓이면 카운트되고 2회에 잠금이 풀린다', async () => {
  expect(await isUnlocked('rev1')).toBe(false);
  const first = await recordHit('rev1', 'v1', 'helpful', 1000);
  expect(first).toEqual({ counted: true, hits: 1 });
  expect(await isUnlocked('rev1')).toBe(false);
  const second = await recordHit('rev1', 'v2', 'purchase', 2000);
  expect(second).toEqual({ counted: true, hits: REGULAR_UNLOCK_HITS });
  expect(await isUnlocked('rev1')).toBe(true);
});

test('같은 리뷰로는 두 번 적중되지 않는다', async () => {
  await recordHit('rev1', 'v1', 'helpful', 1000);
  const dup = await recordHit('rev1', 'v1', 'purchase', 2000);
  expect(dup).toEqual({ counted: false, hits: 1 });
  expect(await hitCount('rev1')).toBe(1);
});

test('프롬프트는 리뷰당 한 번만', async () => {
  expect(await wasPromptShown('v1')).toBe(false);
  await markPromptShown('v1');
  expect(await wasPromptShown('v1')).toBe(true);
});

test('단골 등록·해제·팔로우 승계', async () => {
  await addRegular('rev1');
  await seedRegularsFromFollowing(['rev2', 'rev3', 'rev1']);
  expect((await getRegulars()).sort()).toEqual(['rev1', 'rev2', 'rev3']);
  await removeRegular('rev2');
  expect((await getRegulars()).sort()).toEqual(['rev1', 'rev3']);
});

test('저장값이 깨져 있어도 빈 상태로 동작한다', async () => {
  pref.__store.regularHitsV1 = '{{{broken';
  expect(await hitCount('rev1')).toBe(0);
  const r = await recordHit('rev1', 'v1', 'helpful', 1000);
  expect(r.counted).toBe(true);
});
```

- [ ] **Step 2: 실패 확인**

Run: `corepack yarn jest api/regulars.test.js`
Expected: FAIL — "Cannot find module './regulars'"

- [ ] **Step 3: 구현** — `api/regulars.js`

```js
// 단골 적중 원장 (2026-09-17, docs/superpowers/specs/2026-09-17-dangol-relationship-design.md)
// 적중 2회(리뷰 단위 dedupe)가 쌓여야 그 리뷰어의 "단골 맺기"가 열린다.
// 서버 배포가 막혀 있어 기기 저장으로 시작 — 관계 자체는 기존 팔로우 API가 저장한다.
import { prefGetSafe, prefSetSafe } from './prefSafe';

export const REGULAR_UNLOCK_HITS = 2;

const HITS_KEY = 'regularHitsV1'; // { [reviewerId]: [{videoId, type, at}] }
const PROMPTS_KEY = 'regularPromptsV1'; // [videoId]
const REGULARS_KEY = 'regularIdsV1'; // [reviewerId] — 팔로우 승계분 포함 캐시

async function readJson(key, fallback) {
  const raw = await prefGetSafe(key);
  if (!raw) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (e) {
    return fallback;
  }
}

export async function recordHit(reviewerId, videoId, type, at = Date.now()) {
  const all = await readJson(HITS_KEY, {});
  const hits = Array.isArray(all[reviewerId]) ? all[reviewerId] : [];
  if (hits.some((h) => h.videoId === videoId)) {
    return { counted: false, hits: hits.length };
  }
  const next = [...hits, { videoId, type, at }];
  await prefSetSafe(HITS_KEY, JSON.stringify({ ...all, [reviewerId]: next }));
  return { counted: true, hits: next.length };
}

export async function hitCount(reviewerId) {
  const all = await readJson(HITS_KEY, {});
  return Array.isArray(all[reviewerId]) ? all[reviewerId].length : 0;
}

export async function isUnlocked(reviewerId) {
  return (await hitCount(reviewerId)) >= REGULAR_UNLOCK_HITS;
}

export async function wasPromptShown(videoId) {
  const shown = await readJson(PROMPTS_KEY, []);
  return Array.isArray(shown) && shown.includes(videoId);
}

export async function markPromptShown(videoId) {
  const shown = await readJson(PROMPTS_KEY, []);
  const list = Array.isArray(shown) ? shown : [];
  if (!list.includes(videoId)) {
    await prefSetSafe(PROMPTS_KEY, JSON.stringify([...list, videoId]));
  }
}

export async function getRegulars() {
  const list = await readJson(REGULARS_KEY, []);
  return Array.isArray(list) ? list : [];
}

export async function addRegular(reviewerId) {
  const list = await getRegulars();
  if (!list.includes(reviewerId)) {
    await prefSetSafe(REGULARS_KEY, JSON.stringify([...list, reviewerId]));
  }
}

export async function removeRegular(reviewerId) {
  const list = await getRegulars();
  await prefSetSafe(REGULARS_KEY, JSON.stringify(list.filter((id) => id !== reviewerId)));
}

// 기존 팔로우 승계 — 잠금 소급 없이 전부 단골로 (설계 §3)
export async function seedRegularsFromFollowing(ids) {
  const list = await getRegulars();
  const merged = [...new Set([...list, ...(ids || [])])];
  await prefSetSafe(REGULARS_KEY, JSON.stringify(merged));
  return merged;
}
```

- [ ] **Step 4: 통과 확인**

Run: `corepack yarn jest api/regulars.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: 커밋**

```bash
git add api/regulars.js api/regulars.test.js
git commit -m "feat(regulars): 단골 적중 원장 - 리뷰 단위 dedupe, 2회 잠금 해제"
```

---

### Task 2: 문자열 + 홈 카드 단골 버튼 3-상태

**Files:**
- Modify: `Components/Strings/kor.js` (SET_LANGUAGE_NOTE 근처 아무 곳, 키 정렬 무관)
- Modify: `Components/Strings/eng.js` (같은 키)
- Modify: `screens/HomeScreen/CuratedHome.js` (PostCard follow 버튼 영역, 현재 `onFollow` 배선)

**Interfaces:**
- Consumes: Task 1의 `hitCount`, `isUnlocked`, `getRegulars`, `addRegular`, `removeRegular`, `seedRegularsFromFollowing`, `REGULAR_UNLOCK_HITS`; `APIprovider.followUser(targetUserId, isFollow)`(기존, `Components/APIprovider.js:1420`); `APIprovider.getFollowingList(userId)`(기존, `:1400`); CuratedHome의 `authorId(item)` 헬퍼(기존)
- Produces: Strings 키 `REGULAR_CTA`, `REGULAR_DONE`, `REGULAR_LOCKED(n, total)`, `REGULAR_LOCKED_TITLE`, `REGULAR_LOCKED_GUIDE`, `REGULAR_COUNT(n)`, `REGULAR_MY_LIST`, `REGULAR_PROMPT_HELPFUL_TITLE`, `REGULAR_PROMPT_HELPFUL_YES`, `REGULAR_PROMPT_LATER`, `REGULAR_PROMPT_PURCHASE_TITLE`

- [ ] **Step 1: Strings 추가** — kor.js

```js
  // 단골 (2026-09-17) — 팔로우 대체, 근거(적중) 기반 신뢰 관계
  REGULAR_CTA: '단골 맺기',
  REGULAR_DONE: '단골',
  REGULAR_LOCKED: (n, total) => `적중 ${n}/${total}`,
  REGULAR_LOCKED_TITLE: '아직 단골을 맺을 수 없어요',
  REGULAR_LOCKED_GUIDE:
    '이 리뷰어의 리뷰를 보고 구매하거나 저장했다가 "맞았어요"를 2번 확인하면 단골을 맺을 수 있어요.',
  REGULAR_COUNT: (n) => `단골 ${n}명`,
  REGULAR_MY_LIST: '나의 단골',
  REGULAR_PROMPT_HELPFUL_TITLE: '이 리뷰, 도움됐나요?',
  REGULAR_PROMPT_HELPFUL_YES: '도움됐어요',
  REGULAR_PROMPT_LATER: '아직 몰라요',
  REGULAR_PROMPT_PURCHASE_TITLE: '리뷰대로였나요?',
```

eng.js:

```js
  // Regulars (2026-09-17) — evidence-based trust relationship replacing follow
  REGULAR_CTA: 'Become a regular',
  REGULAR_DONE: 'Regular',
  REGULAR_LOCKED: (n, total) => `Hits ${n}/${total}`,
  REGULAR_LOCKED_TITLE: 'Not a regular yet',
  REGULAR_LOCKED_GUIDE:
    'Buy or save through this reviewer, then confirm "it was right" twice to become a regular.',
  REGULAR_COUNT: (n) => `${n} regulars`,
  REGULAR_MY_LIST: 'My regulars',
  REGULAR_PROMPT_HELPFUL_TITLE: 'Was this review helpful?',
  REGULAR_PROMPT_HELPFUL_YES: 'It helped',
  REGULAR_PROMPT_LATER: 'Not sure yet',
  REGULAR_PROMPT_PURCHASE_TITLE: 'Was the review right?',
```

- [ ] **Step 2: CuratedHome 상태·로드 배선**

`CuratedHome` 컴포넌트의 기존 `const [following, setFollowing] = useState({})`를 단골 상태로 교체:

```js
  // 단골 (2026-09-17): { [authorId]: { regular: bool, hits: number } }
  const [regularState, setRegularState] = useState({});

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
```

import 추가: `Preference from 'react-native-default-preference'`,
`{ REGULAR_UNLOCK_HITS, addRegular, getRegulars, hitCount, isUnlocked, removeRegular, seedRegularsFromFollowing } from '../../api/regulars'`.

`getFollowingList` 응답의 리스트 필드명이 다르면(구현 시 실제 응답 확인) 그 필드로 교체하되 `.catch(() => {})` 방어는 유지.

- [ ] **Step 3: 버튼 핸들러 교체**

기존 `onFollow` 인라인 setFollowing 로직을 다음으로 교체:

```js
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
    Alert.alert(Strings.REGULAR_LOCKED_TITLE, Strings.REGULAR_LOCKED_GUIDE);
  };
```

`Alert`를 react-native import에 추가. PostCard 호출부는 `onFollow={() => onToggleRegular(item)}` 형태 유지(프롭 이름은 `onFollow` 그대로 둬도 됨). PostCard 버튼 렌더는:

```js
        <TouchableOpacity
          style={[styles.followButton, following && styles.followingButton]}
          onPress={onFollow}
        >
          <Text style={[styles.followText, following && styles.followingText]}>
            {following ? Strings.REGULAR_DONE : Strings.REGULAR_CTA}
          </Text>
        </TouchableOpacity>
```

PostCard의 `following` 프롭 계산은 호출부에서 `Boolean(regularState[authorId(item)]?.regular)`로 교체(기존 `following[authorName(item)]` 참조 제거).

- [ ] **Step 4: 전체 테스트**

Run: `corepack yarn test --runInBand`
Expected: 전부 PASS (기존 146 + Task 1의 5)

- [ ] **Step 5: 커밋**

```bash
git add Components/Strings/kor.js Components/Strings/eng.js screens/HomeScreen/CuratedHome.js
git commit -m "feat(regulars): 홈 카드 단골 버튼 3-상태 + 팔로우 승계 + 문자열"
```

---

### Task 3: FollowList·마이 탭 라벨 교체

**Files:**
- Modify: `screens/MyScreen/index.js` (팔로워/팔로잉 카드 — `navigation.navigate('FollowList')` 하는 Card)
- Modify: `Components/FollowListScreen.js` 및 `Components/FollowListTabView.js` (탭 라벨이 Strings.FOLLOWERS/FOLLOWING이면 교체)

**Interfaces:**
- Consumes: Task 2의 Strings 키 `REGULAR_MY_LIST`, `REGULAR_COUNT`
- Produces: 추가 Strings 키 `REGULAR_TAB_FANS`(kor: '나를 단골로 둔 사람', eng: 'My regulars (fans)') — FollowListTabView의 FOLLOWERS 탭 라벨 대체용. kor/eng 양쪽 추가.

- [ ] **Step 1: 마이 탭 카드 라벨**

`screens/MyScreen/index.js`의 팔로워/팔로잉 카드에서
`{Strings.FOLLOWERS} · {Strings.FOLLOWING}` → `{Strings.REGULAR_MY_LIST}` 로 교체.

- [ ] **Step 2: FollowList 탭 라벨**

`Components/FollowListTabView.js`(및 FollowListScreen 헤더에 있으면 거기도)에서
`Strings.FOLLOWERS` → `Strings.REGULAR_TAB_FANS`, `Strings.FOLLOWING` → `Strings.REGULAR_MY_LIST`.
데이터 로딩·API 호출은 손대지 않는다(팔로우 API 그대로).

- [ ] **Step 3: 전체 테스트 + 커밋**

Run: `corepack yarn test --runInBand` → PASS

```bash
git add screens/MyScreen/index.js Components/FollowListScreen.js Components/FollowListTabView.js Components/Strings/kor.js Components/Strings/eng.js
git commit -m "feat(regulars): 팔로우 화면 라벨을 단골 계열로 교체"
```

---

### Task 4: 도움 적중 프롬프트 (저장 리뷰 재방문)

**Files:**
- Modify: `screens/VideoPageScreen/index.js`

**Interfaces:**
- Consumes: Task 1의 `recordHit`, `wasPromptShown`, `markPromptShown`; Task 2의 Strings 프롬프트 키; VideoPageScreen의 `this.state.video` (필드: `videoId`, `isBookmarked`, `author.userId`)

- [ ] **Step 1: 프롬프트 메서드 추가**

`screens/VideoPageScreen/index.js` 클래스에 메서드 추가 (openAuthorFromSheet 근처):

```js
  // 단골 적중 (2026-09-17): 저장해 둔 리뷰를 다시 열었을 때 한 번만 묻는다
  maybePromptHelpfulHit = async () => {
    const video = this.state.video;
    const reviewerId = video?.author?.userId;
    const videoId = video?.videoId;
    if (!reviewerId || !videoId || !video?.isBookmarked) {
      return;
    }
    if (await wasPromptShown(videoId)) {
      return;
    }
    await markPromptShown(videoId);
    Alert.alert(Strings.REGULAR_PROMPT_HELPFUL_TITLE, '', [
      { text: Strings.REGULAR_PROMPT_LATER, style: 'cancel' },
      {
        text: Strings.REGULAR_PROMPT_HELPFUL_YES,
        onPress: () => recordHit(reviewerId, videoId, 'helpful').catch(() => {}),
      },
    ]);
  };
```

import 추가: `{ recordHit, wasPromptShown, markPromptShown } from '../../api/regulars'`.
`Alert`·`Strings`는 이미 import돼 있음(확인 후 없으면 추가).

- [ ] **Step 2: 호출 지점 배선**

비디오 데이터가 로드되어 `this.setState({ video: ... })` 되는 메서드를 찾는다
(`grep -n "setState({\s*video" screens/VideoPageScreen/index.js` 후 서버 응답을 넣는 지점).
그 setState 콜백에서 `this.maybePromptHelpfulHit()` 호출:

```js
this.setState({ video: loadedVideo }, () => this.maybePromptHelpfulHit());
```

여러 지점이면 "화면 진입 시 최초 로드" 지점 1곳에만 건다(스와이프 전환마다 뜨지 않게).

- [ ] **Step 3: 전체 테스트 + 커밋**

Run: `corepack yarn test --runInBand` → PASS

```bash
git add screens/VideoPageScreen/index.js
git commit -m "feat(regulars): 저장 리뷰 재방문 시 도움 적중 프롬프트 (리뷰당 1회)"
```

---

### Task 5: 구매 적중 프롬프트 (결제 성공 복귀)

**Files:**
- Modify: `Components/CheckoutScreen.js` (`classifyCheckoutUrl` SUCCESS 분기, `:61` 근처)
- Modify: 리뷰 → 주문서/결제로 넘어가는 navigate 호출부에 `hitContext` 파라미터 전달 (구현 시 `grep -n "Checkout" screens Components`로 진입점 확인; 리뷰 화면에서 출발하는 경로에만 추가)

**Interfaces:**
- Consumes: Task 1의 `recordHit`, `wasPromptShown`, `markPromptShown`; Task 2의 `REGULAR_PROMPT_PURCHASE_TITLE` 등
- Produces: navigation param 규약 `hitContext = { reviewerId, videoId }` (리뷰 출발 구매에만 존재, 없으면 프롬프트 생략)

- [ ] **Step 1: CheckoutScreen SUCCESS 분기에 프롬프트**

SUCCESS 처리부(주문 완료 화면 이동/알럿 직전)에 추가:

```js
    const hitContext = this.props.route?.params?.hitContext;
    if (hitContext?.reviewerId && hitContext?.videoId) {
      wasPromptShown(hitContext.videoId).then((shown) => {
        if (shown) {
          return;
        }
        markPromptShown(hitContext.videoId);
        Alert.alert(Strings.REGULAR_PROMPT_PURCHASE_TITLE, '', [
          { text: Strings.REGULAR_PROMPT_LATER, style: 'cancel' },
          {
            text: Strings.REGULAR_PROMPT_HELPFUL_YES,
            onPress: () =>
              recordHit(hitContext.reviewerId, hitContext.videoId, 'purchase').catch(() => {}),
          },
        ]);
      });
    }
```

CheckoutScreen이 함수 컴포넌트면 `route.params?.hitContext`로 동일 로직.
import: `{ recordHit, wasPromptShown, markPromptShown } from '../api/regulars'`.

- [ ] **Step 2: hitContext 전달**

리뷰 화면(VideoPageScreen의 구매 CTA)에서 주문서/결제로 navigate 하는 곳을 찾아
params에 `hitContext: { reviewerId: video.author?.userId, videoId: video.videoId }` 추가.
중간 화면(주문서)이 있으면 그 화면이 받은 `hitContext`를 Checkout으로 그대로 전달.

- [ ] **Step 3: 전체 테스트 + 커밋**

Run: `corepack yarn test --runInBand` → PASS

```bash
git add Components/CheckoutScreen.js screens/VideoPageScreen/index.js
git commit -m "feat(regulars): 결제 성공 복귀 시 구매 적중 프롬프트 + hitContext 전달"
```

---

### Task 6: 홈 스토리 레일 단골 우선 정렬

**Files:**
- Modify: `screens/HomeScreen/CuratedHome.js` (스토리 레일 — `styles.story` map 하는 곳)

**Interfaces:**
- Consumes: Task 2의 `regularState`, 기존 `authorId(item)`

- [ ] **Step 1: 정렬 추가**

스토리 레일 데이터 소스를 다음으로 교체(레일에 이미 쓰는 배열 이름을 확인해 그대로 정렬만 삽입):

```js
  const railPosts = useMemo(() => {
    const isRegularAuthor = (item) => Boolean(regularState[authorId(item)]?.regular);
    return [...visiblePosts].sort((a, b) => Number(isRegularAuthor(b)) - Number(isRegularAuthor(a)));
  }, [visiblePosts, regularState]);
```

레일 map은 `railPosts`를 사용. 피드 본문 정렬은 건드리지 않는다.

- [ ] **Step 2: 전체 테스트 + 커밋**

Run: `corepack yarn test --runInBand` → PASS

```bash
git add screens/HomeScreen/CuratedHome.js
git commit -m "feat(regulars): 홈 스토리 레일에 단골 리뷰어 우선 노출"
```
