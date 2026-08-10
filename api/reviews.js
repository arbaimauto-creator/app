// 브랜드 화면용 업로드 리뷰 mock 스텁 (캠페인별) — 서버 연동 시 교체.
// SNS 정량 지표는 1단계 운영 수동 입력 원칙: metricsSource:'manual' + capturedAt 명시.
const MOCK_REVIEWS = {
  'cmp-001': [
    {
      id: 'rv-101',
      seedingId: 'sd-101',
      reviewer: 'mia_beauty',
      country: 'US',
      thumbnailUrl: 'https://intro.greyd.app/resources/checked_v_white.png',
      uploadedAt: '2026-08-05T10:00:00.000Z',
      platformUrl: 'https://instagram.com/p/mock101',
      format: 'short',
      productionStyle: 'face_review',
      views7d: 4200,
      likes7d: 512,
      metricsSource: 'manual',
      capturedAt: '2026-08-12T00:00:00.000Z',
    },
    {
      id: 'rv-102',
      seedingId: 'sd-102',
      reviewer: 'yuki.skin',
      country: 'JP',
      thumbnailUrl: 'https://intro.greyd.app/resources/checked_v_white.png',
      uploadedAt: '2026-08-06T10:00:00.000Z',
      platformUrl: 'https://tiktok.com/@mock102',
      format: 'short',
      productionStyle: 'demo',
      views7d: 8900,
      likes7d: 1200,
      metricsSource: 'manual',
      capturedAt: '2026-08-13T00:00:00.000Z',
    },
    {
      id: 'rv-103',
      seedingId: 'sd-103',
      reviewer: 'seoulglow',
      country: 'KR',
      thumbnailUrl: 'https://intro.greyd.app/resources/checked_v_white.png',
      uploadedAt: '2026-08-07T10:00:00.000Z',
      platformUrl: 'https://instagram.com/p/mock103',
      format: 'long',
      productionStyle: 'before_after',
      views7d: 2100,
      likes7d: 300,
      metricsSource: 'manual',
      capturedAt: '2026-08-14T00:00:00.000Z',
    },
  ],
};

// 국가별 집계 mock (대시보드 스코어보드용): 시딩 쿼터 대비 업로드·평균 점수·평균 도달·소요일
const MOCK_COUNTRY_STATS = {
  'cmp-001': [
    { country: 'US', quota: 10, uploaded: 9, avgScore: 4.2, avgViews: 5200, avgDaysToUpload: 6 },
    { country: 'JP', quota: 10, uploaded: 7, avgScore: 4.5, avgViews: 7100, avgDaysToUpload: 8 },
    { country: 'KR', quota: 10, uploaded: 8, avgScore: 3.9, avgViews: 2400, avgDaysToUpload: 5 },
  ],
};

// 위클리 발견 카드 — 1단계는 애널리스트가 이 텍스트를 직접 수정한다 (CMS는 2단계)
const MOCK_WEEKLY_FINDINGS = {
  'cmp-001': "🇯🇵 일본: 예상 밖 '지속력' 언급 집중 (7건 중 5건). 데모형 콘텐츠 도달이 페이스 리뷰 대비 1.7배.",
};

export function fetchCampaignReviews(campaignId) {
  return Promise.resolve(MOCK_REVIEWS[campaignId] || []);
}

export function fetchCountryStats(campaignId) {
  return Promise.resolve(MOCK_COUNTRY_STATS[campaignId] || []);
}

export function fetchWeeklyFinding(campaignId) {
  return Promise.resolve(MOCK_WEEKLY_FINDINGS[campaignId] || null);
}
