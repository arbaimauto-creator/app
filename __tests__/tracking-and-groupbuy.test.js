// 추적 코드 입구 · 클릭 집계 (2026-09-16 P2) — 공동구매는 __tests__/groupbuys.test.js
jest.mock('../Components/Constants/Features', () => ({ LIVE_OPS_API: true, COMMERCE: false }));

const mockOpsPost = jest.fn();
jest.mock('../api/opsClient', () => ({
  opsGet: jest.fn(),
  opsPost: (...args) => mockOpsPost(...args),
  getGreydAppId: async () => 'app-test-device',
}));

const mockStore = {};
jest.mock('../api/prefSafe', () => ({
  prefGetSafe: async (k) => (k in mockStore ? mockStore[k] : null),
  prefSetSafe: async (k, v) => {
    mockStore[k] = v;
  },
}));

const fs = require('fs');
const path = require('path');

import {
  ATTRIBUTION_WINDOW_MS,
  TRACKING_KEY,
  activeCodeFromRecord,
  clearTrackingCode,
  getActiveTrackingCode,
  isTrackingCode,
  rememberTrackingCode,
  stripQuery,
  trackingCodeFromUrl,
  trackingKind,
} from '../Components/utils/tracking';
import { reportTrackingClick } from '../api/tracking';

beforeEach(() => {
  mockOpsPost.mockReset();
  for (const k of Object.keys(mockStore)) {
    delete mockStore[k];
  }
});

describe('추적 코드 파싱', () => {
  test('ra-/gb- 형식만 코드로 본다', () => {
    expect(isTrackingCode('ra-0123abcd')).toBe(true);
    expect(isTrackingCode('gb-deadbeef')).toBe(true);
    expect(isTrackingCode('xx-deadbeef')).toBe(false);
    expect(isTrackingCode('ra-DEADBEEF')).toBe(false);
    expect(isTrackingCode('ra-123')).toBe(false);
    expect(trackingKind('gb-deadbeef')).toBe('groupbuy');
    expect(trackingKind('ra-deadbeef')).toBe('asset');
    expect(trackingKind('nope')).toBeNull();
  });

  test('스킴·https 어느 쪽 URL이든 ?tc= 를 꺼낸다', () => {
    expect(trackingCodeFromUrl('greyd://videos/abc?tc=ra-0123abcd')).toBe('ra-0123abcd');
    expect(trackingCodeFromUrl('https://greyd.app/groupbuy/gb-deadbeef?utm=x&tc=gb-deadbeef#top')).toBe(
      'gb-deadbeef',
    );
    expect(trackingCodeFromUrl('https://greyd.app/videos/abc?tc=evil')).toBeNull();
    expect(trackingCodeFromUrl('https://greyd.app/videos/abc')).toBeNull();
    expect(trackingCodeFromUrl(null)).toBeNull();
    expect(stripQuery('videos/abc?tc=ra-0123abcd')).toBe('videos/abc');
  });
});

describe('귀속 기간', () => {
  test('7일 안에서만 살아 있고, 결제 뒤엔 지워진다', async () => {
    const now = 1_800_000_000_000;
    await rememberTrackingCode('ra-0123abcd', now);
    expect(await getActiveTrackingCode(now + 1000)).toBe('ra-0123abcd');
    expect(await getActiveTrackingCode(now + ATTRIBUTION_WINDOW_MS + 1)).toBeNull();
    await clearTrackingCode();
    expect(await getActiveTrackingCode(now + 1000)).toBeNull();
  });

  test('깨진 저장값·미래 시각은 무시한다', () => {
    const now = 1_800_000_000_000;
    expect(activeCodeFromRecord('{not json', now)).toBeNull();
    expect(activeCodeFromRecord(JSON.stringify({ code: 'bad', at: now }), now)).toBeNull();
    expect(activeCodeFromRecord(JSON.stringify({ code: 'ra-0123abcd', at: now + 3_600_000 }), now)).toBeNull();
    expect(mockStore[TRACKING_KEY]).toBeUndefined();
  });
});

describe('클릭 집계', () => {
  test('같은 코드는 하루 한 번만 보낸다', async () => {
    mockOpsPost.mockResolvedValue({ ok: true });
    const now = 1_800_000_000_000;
    expect(await reportTrackingClick('ra-0123abcd', now)).toBe(true);
    expect(await reportTrackingClick('ra-0123abcd', now + 60_000)).toBe(false);
    expect(await reportTrackingClick('ra-0123abcd', now + 25 * 3_600_000)).toBe(true);
    expect(mockOpsPost).toHaveBeenCalledTimes(2);
    expect(mockOpsPost).toHaveBeenCalledWith('/track-click', { trackingCode: 'ra-0123abcd' });
  });

  test('전송 실패는 기록하지 않아 다음에 다시 시도한다', async () => {
    mockOpsPost.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ ok: true });
    expect(await reportTrackingClick('gb-deadbeef')).toBe(false);
    expect(await reportTrackingClick('gb-deadbeef')).toBe(true);
  });
});

describe('딥링크 계약', () => {
  const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

  test('공동구매 경로는 열려 있고 커머스 경로는 플래그 뒤에 있다', () => {
    const linking = read('Components/utils/linking.js');
    const allowedList = linking.match(/const ALLOWED_LINK_PREFIXES = \[([^\]]+)\]/s)?.[1] || '';
    expect(allowedList).toContain("'groupbuy/'");
    expect(linking).toContain("GroupBuy: 'groupbuy/:code'");
    expect(linking).toContain('FEATURES.COMMERCE && COMMERCE_LINK_PREFIXES');
    expect(linking).toContain('captureTrackingCode(url)');
    expect(linking).toContain('captureTrackingCode(dynamicLink.url)');
  });

  test('주문서는 딥링크 코드를 폴백으로 쓰고 결제 뒤 지운다', () => {
    const sheet = read('Components/OrderSheetScreen.js');
    expect(sheet).toContain('getActiveTrackingCode()');
    expect(sheet).toContain('clearTrackingCode()');
    const navigator = read('navigation/stacks/MainDrawerNavigator.js');
    expect(navigator).toContain('name="GroupBuy"');
  });
});
