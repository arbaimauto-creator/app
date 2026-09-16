// 2차 가공 동의 로직 (2026-09-16) — docs/secondary-use-and-groupbuy-2026-09-16.md P1
jest.mock('../Components/Constants/Features', () => ({ LIVE_OPS_API: true }));

const mockOpsGet = jest.fn();
const mockOpsPost = jest.fn();
jest.mock('../api/opsClient', () => ({
  getGreydAppId: async () => 'device-1234567890',
  opsGet: (...args) => mockOpsGet(...args),
  opsPost: (...args) => mockOpsPost(...args),
}));

import {
  CONSENT_BENEFIT,
  agreeConsent,
  declineConsent,
  describeScope,
  getMyConsents,
  pendingConsents,
  revokeConsent,
} from '../api/consents';

const STRINGS = {
  CONSENT_SCOPE_MEDIA: (l) => `쓰이는 곳: ${l}`,
  CONSENT_SCOPE_COUNTRIES: (l) => `국가: ${l}`,
  CONSENT_SCOPE_MONTHS: (n) => `기간: ${n}개월`,
  CONSENT_SCOPE_EDIT_ON: '편집: 자막·길이 조정 가능',
  CONSENT_SCOPE_EDIT_OFF: '편집: 원본 그대로만',
  CONSENT_SCOPE_ANY_COUNTRY: '아직 미정',
  CONSENT_SCOPE_NONE: '미지정',
  CONSENT_MEDIA_OWNED_MALL: '브랜드 자사몰',
  CONSENT_MEDIA_PAID_ADS: '유료 광고',
  CONSENT_MEDIA_MARKETPLACE: '오픈마켓',
  CONSENT_MEDIA_APP_FEED: 'greyd 앱',
};

beforeEach(() => {
  mockOpsGet.mockReset();
  mockOpsPost.mockReset();
});

test('서버가 응답하지 않아도 화면은 빈 목록으로 뜬다', async () => {
  mockOpsGet.mockRejectedValue(new Error('network'));

  await expect(getMyConsents()).resolves.toEqual([]);
});

test('응답 대기 중인 요청만 골라낸다', () => {
  const all = [
    { id: 1, state: 'REQUESTED' },
    { id: 2, state: 'AGREED' },
    { id: 3, state: 'DECLINED' },
    { id: 4, state: 'REQUESTED' },
  ];

  expect(pendingConsents(all).map((c) => c.id)).toEqual([1, 4]);
  expect(pendingConsents(null)).toEqual([]);
});

test('혜택을 고르지 않으면 동의를 보내지 않는다', async () => {
  await expect(agreeConsent(1, undefined)).rejects.toThrow('benefit_required');
  expect(mockOpsPost).not.toHaveBeenCalled();
});

test('동의는 고른 혜택과 함께 전송된다', async () => {
  mockOpsPost.mockResolvedValue({ ok: true });

  await agreeConsent(7, CONSENT_BENEFIT.GROUP_BUY);

  expect(mockOpsPost).toHaveBeenCalledWith('/consents', {
    greydAppId: 'device-1234567890',
    consentId: 7,
    action: 'agree',
    benefit: 'GROUP_BUY',
  });
});

test('거절과 철회도 같은 경로로 전송된다', async () => {
  mockOpsPost.mockResolvedValue({ ok: true });

  await declineConsent(8, '이번엔 부담돼요');
  expect(mockOpsPost.mock.calls[0][1].action).toBe('decline');
  expect(mockOpsPost.mock.calls[0][1].reason).toBe('이번엔 부담돼요');

  await revokeConsent(8);
  expect(mockOpsPost.mock.calls[1][1].action).toBe('revoke');
});

test('범위 설명은 매체·국가·기간·편집을 각각 한 줄로 만든다', () => {
  const lines = describeScope(
    { media: ['OWNED_MALL', 'PAID_ADS'], countries: ['KR', 'US'], months: 6, editAllowed: true },
    STRINGS,
  );

  expect(lines).toEqual([
    '쓰이는 곳: 브랜드 자사몰, 유료 광고',
    '국가: KR, US',
    '기간: 6개월',
    '편집: 자막·길이 조정 가능',
  ]);
});

test('국가가 비어 있으면 미정으로 보여준다', () => {
  const lines = describeScope({ media: [], countries: [], editAllowed: false }, STRINGS);

  expect(lines[0]).toBe('쓰이는 곳: 미지정');
  expect(lines[1]).toBe('국가: 아직 미정');
  expect(lines[2]).toBe('기간: 12개월');
  expect(lines[3]).toBe('편집: 원본 그대로만');
});
