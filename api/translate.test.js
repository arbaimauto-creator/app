// 리뷰 자동 번역 (2026-09-17) — 감지·대상 판정·번역 파싱·실패 폴백
const { detectLang, needsTranslation, translate } = require('./translate');

test('한글/영어를 감지한다', () => {
  expect(detectLang('저희는 실리콘 식기를 정말 좋아해요')).toBe('ko');
  expect(detectLang('Honest review of the barrier cream')).toBe('en');
  expect(detectLang('진짜 good 제품이에요 완전 추천')).toBe('ko');
  expect(detectLang('')).toBe(null);
  expect(detectLang('!!! 123')).toBe(null);
});

test('앱 언어와 다를 때만 번역 대상이다', () => {
  expect(needsTranslation('한국어 리뷰입니다', 'en')).toBe(true);
  expect(needsTranslation('한국어 리뷰입니다', 'ko')).toBe(false);
  expect(needsTranslation('English review here', 'ko')).toBe(true);
  expect(needsTranslation('', 'ko')).toBe(false);
});

test('번역 응답을 조립하고 캐시한다', async () => {
  const fetcher = jest.fn(async () => ({
    ok: true,
    json: async () => [
      [
        ['We really love ', '저희는 정말 좋아해요 ', null],
        ['silicone dishes.', '실리콘 식기를.', null],
      ],
    ],
  }));
  const first = await translate('저희는 정말 좋아해요 실리콘 식기를.', 'en', fetcher);
  expect(first).toBe('We really love silicone dishes.');
  const second = await translate('저희는 정말 좋아해요 실리콘 식기를.', 'en', fetcher);
  expect(second).toBe(first);
  expect(fetcher).toHaveBeenCalledTimes(1);
});

test('네트워크 실패면 null — 원문 유지', async () => {
  const fetcher = jest.fn(async () => {
    throw new Error('offline');
  });
  expect(await translate('다른 문장', 'en', fetcher)).toBe(null);
});
