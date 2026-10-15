const store = {};
jest.mock('./prefSafe', () => ({
  prefGetSafe: jest.fn(async (key) => store[key] ?? null),
  prefSetSafe: jest.fn(async (key, value) => {
    store[key] = value;
    return true;
  }),
}));

const {
  SEEN_KEYS_PREF,
  __resetShownThisLaunch,
  buildNoticesUrl,
  fetchNotices,
  loadPendingNotices,
  rememberShown,
  reportSeen,
  sanitizeNotice,
} = require('./mobileNotices');

const notice = (over = {}) => ({
  id: 'n1',
  key: 'k1',
  title: '점검 안내',
  body: '첫 줄\n둘째 줄',
  imageUrl: null,
  cta: null,
  showMode: 'ONCE',
  priority: 10,
  ...over,
});

const okFetch = (notices) => jest.fn(async () => ({ ok: true, json: async () => ({ notices }) }));

const query = { lang: 'ko', country: 'KR', platform: 'ios', version: '3.0.0' };

beforeEach(() => {
  delete store[SEEN_KEYS_PREF];
  __resetShownThisLaunch();
});

test('요청 URL: 언어·국가·플랫폼·버전, 국가는 ISO2가 아니면 비운다', () => {
  expect(buildNoticesUrl(query)).toBe(
    'https://ops.greyd.app/api/mobile/notices?lang=ko&country=KR&platform=ios&version=3.0.0',
  );
  expect(
    buildNoticesUrl({ lang: 'ja', country: null, platform: 'android', version: '3.0.0' }),
  ).toBe(
    'https://ops.greyd.app/api/mobile/notices?lang=en&country=&platform=android&version=3.0.0',
  );
  expect(buildNoticesUrl({ ...query, country: 'Korea' })).toContain('country=&');
});

test('네트워크 실패·오류 응답·이상한 본문은 빈 목록', async () => {
  expect(
    await fetchNotices(
      query,
      jest.fn(async () => Promise.reject(new Error('offline'))),
    ),
  ).toEqual([]);
  expect(
    await fetchNotices(
      query,
      jest.fn(async () => ({ ok: false })),
    ),
  ).toEqual([]);
  expect(
    await fetchNotices(
      query,
      jest.fn(async () => ({ ok: true, json: async () => ({}) })),
    ),
  ).toEqual([]);
});

test('서버 순서를 유지하고, 지원하지 않는 CTA는 버린다', async () => {
  const list = await loadPendingNotices(
    query,
    okFetch([
      notice({ id: 'a', key: 'ka', cta: { label: '보기', url: 'https://greyd.app/x' } }),
      notice({ id: 'b', key: 'kb', cta: { label: '이동', url: 'greyd://events' } }),
      notice({ id: 'c', key: 'kc', cta: { label: '위험', url: 'intent://scan' } }),
    ]),
  );
  expect(list.map((n) => n.id)).toEqual(['a', 'b', 'c']);
  expect(list[2].cta).toBeNull();
  expect(list[0].body).toBe('첫 줄\n둘째 줄');
});

test('ONCE는 key 기준으로 한 번만, key가 바뀌면 다시 보인다', async () => {
  const [first] = await loadPendingNotices(query, okFetch([notice()]));
  await rememberShown(first);
  __resetShownThisLaunch(); // 앱 재실행
  expect(await loadPendingNotices(query, okFetch([notice()]))).toHaveLength(0);
  expect(await loadPendingNotices(query, okFetch([notice({ key: 'k1-v2' })]))).toHaveLength(1);
});

test('EVERY_LAUNCH는 같은 실행 중엔 한 번, 재실행하면 다시', async () => {
  const every = notice({ key: 'ke', showMode: 'EVERY_LAUNCH' });
  const [first] = await loadPendingNotices(query, okFetch([every]));
  await rememberShown(first);
  expect(store[SEEN_KEYS_PREF]).toBeUndefined();
  expect(await loadPendingNotices(query, okFetch([every]))).toHaveLength(0); // 백그라운드 복귀
  __resetShownThisLaunch();
  expect(await loadPendingNotices(query, okFetch([every]))).toHaveLength(1);
});

test('필수값이 없으면 버리고, 이미지는 https만', () => {
  expect(sanitizeNotice({ id: 'x', title: 't' })).toBeNull();
  expect(sanitizeNotice(notice({ imageUrl: 'http://a/b.png' })).imageUrl).toBeNull();
  expect(sanitizeNotice(notice({ imageUrl: 'https://a/b.png' })).imageUrl).toBe('https://a/b.png');
});

test('seen 집계는 POST, 실패는 삼킨다', async () => {
  const f = jest.fn(async () => ({ ok: true }));
  await reportSeen('n 1', f);
  expect(f).toHaveBeenCalledWith(
    'https://ops.greyd.app/api/mobile/notices/n%201/seen',
    expect.objectContaining({ method: 'POST' }),
  );
  await expect(
    reportSeen(
      'n1',
      jest.fn(async () => Promise.reject(new Error('x'))),
    ),
  ).resolves.toBeUndefined();
});
