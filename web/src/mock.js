// 앱(api/*.js)과 동일 스키마의 웹용 mock — 서버 연동 시 fetch로 교체.
// 원칙 유지: 파생값 미저장, SNS 지표는 metricsSource:'manual' + capturedAt.
export const INVITE_CODES = [
  { code: 'BRAND1', brandId: 'brand-sonplan', brandName: 'SonPlan' },
  { code: 'BRAND2', brandId: 'brand-org', brandName: 'ORG' },
];

// ARBAIM 운영자 전용 (#admin 게이트) — 서버 인증 도입 전 임시
export const ADMIN_CODE = 'ADMIN1';

export const CAMPAIGNS = [
  {
    id: 'cmp-001',
    brandId: 'brand-sonplan',
    brand: 'SonPlan',
    title: '썬플랜 타임 슬립 아이크림 글로벌 체험단',
    period: '2026.08.11 – 2026.09.10',
    countries: ['US', 'JP', 'KR'],
    seedingTotal: 30,
    // Admin 콘솔 확장 필드 — 브랜드 리포트(App.jsx)에서는 사용하지 않음
    openPct: 70,
    curatedPct: 30,
    uploadDays: 14,
    unitCost: 12000, // 내부용 — 브랜드 비노출
    shipCost: 8500, // 내부용 — 브랜드 비노출
  },
];

// 초대 코드 원장 (mock) — 운영 콘솔 '초대 코드' 탭 초기 데이터
export const INVITE_CODE_LEDGER = [
  { code: 'GRD-K71', role: 'influencer', channel: '운영 직접', engraving: '', validLabel: 'D-2', status: 'unused', usedBy: '' },
  { code: 'GRD-M1A', role: 'influencer', channel: '추천 (@mia_beauty)', engraving: 'Invited by @mia', validLabel: 'D-6', status: 'used', usedBy: '@yuna_j' },
  { code: 'GRD-B02', role: 'brand', channel: '세일즈 (SonPlan)', engraving: '', validLabel: 'D-5', status: 'used', usedBy: 'SonPlan' },
  { code: 'GRD-K58', role: 'influencer', channel: '운영 직접', engraving: '', validLabel: '만료', status: 'expired', usedBy: '' },
];

export const FGI_STATS = {
  'cmp-001': {
    overallScore: 82,
    purchaseIntentRate: 71,
    quant: { purchaseIntent: 4.1, priceFairness: 3.6, competitiveness: 4.3 },
    fairPriceUsdMedian: 24,
    priceDistribution: { '<$15': 3, '$15-20': 6, '$20-25': 8, '$25-30': 5, '$30+': 2 },
    responses: 24,
    keywords: {
      positive: ['absorbs fast', 'cooling', 'packaging', 'brightening', 'gentle'],
      negative: ['scent too strong', 'small size', 'sticky at first'],
    },
  },
};

export const COUNTRY_STATS = {
  'cmp-001': [
    { country: 'US', quota: 10, uploaded: 9, avgScore: 4.2, avgViews: 5200, avgDaysToUpload: 6 },
    { country: 'JP', quota: 10, uploaded: 7, avgScore: 4.5, avgViews: 7100, avgDaysToUpload: 8 },
    { country: 'KR', quota: 10, uploaded: 8, avgScore: 3.9, avgViews: 2400, avgDaysToUpload: 5 },
  ],
};

export const WEEKLY_FINDINGS = {
  'cmp-001': [
    {
      week: 'W3',
      text: "🇯🇵 일본: 예상 밖 '지속력' 언급 집중 (7건 중 5건). 데모형 콘텐츠 도달이 페이스 리뷰 대비 1.7배.",
    },
    {
      week: 'W2',
      text: '🇺🇸 미국: 25-34 여성에서 "cooling" 키워드 반복 — 여름 시즌 소구 후보.',
    },
  ],
};

export const REVIEWS = {
  'cmp-001': [
    {
      id: 'rv-101',
      reviewer: 'mia_beauty',
      country: 'US',
      followerBand: 'nano',
      format: 'short',
      productionStyle: 'face_review',
      views7d: 4200,
      likes7d: 512,
      platformUrl: 'https://instagram.com/p/mock101',
      thumbnailUrl: 'https://intro.greyd.app/resources/checked_v_white.png',
      uploadedAt: '2026-08-05',
      metricsSource: 'manual',
      capturedAt: '2026-08-12',
    },
    {
      id: 'rv-102',
      reviewer: 'yuki.skin',
      country: 'JP',
      followerBand: 'micro',
      format: 'short',
      productionStyle: 'demo',
      views7d: 8900,
      likes7d: 1200,
      platformUrl: 'https://tiktok.com/@mock102',
      thumbnailUrl: 'https://intro.greyd.app/resources/checked_v_white.png',
      uploadedAt: '2026-08-06',
      metricsSource: 'manual',
      capturedAt: '2026-08-13',
    },
    {
      id: 'rv-103',
      reviewer: 'seoulglow',
      country: 'KR',
      followerBand: 'nano',
      format: 'long',
      productionStyle: 'before_after',
      views7d: 2100,
      likes7d: 300,
      platformUrl: 'https://instagram.com/p/mock103',
      thumbnailUrl: 'https://intro.greyd.app/resources/checked_v_white.png',
      uploadedAt: '2026-08-07',
      metricsSource: 'manual',
      capturedAt: '2026-08-14',
    },
  ],
};

export const QUALITATIVE = {
  'cmp-001': [
    {
      id: 'q1',
      country: 'US',
      reviewer: 'mia_beauty',
      pros: 'Absorbs incredibly fast, no sticky finish. The cooling applicator feels premium.',
      cons: 'The scent is a bit strong for sensitive noses.',
    },
    {
      id: 'q2',
      country: 'JP',
      reviewer: 'yuki.skin',
      pros: '朝のメイク前でもすぐ馴染む。パッケージが高見えする。',
      cons: 'サイズが小さく感じる。価格に対して量が少ない印象。',
    },
    {
      id: 'q3',
      country: 'KR',
      reviewer: 'seoulglow',
      pros: '쿨링감이 확실하고 다크서클 부위가 밝아 보여요.',
      cons: '처음엔 살짝 끈적이는 느낌이 있어요.',
    },
  ],
};
