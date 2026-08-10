// 서버 API 준비 전 목데이터 스텁. 서버 연동 시 이 파일의 함수 본문만 교체한다.
// v2 스키마: track(open/curated), base_points, content_guide, 국가별 쿼터.
// 캠페인 식별자는 앱 전역 컨벤션에 맞춰 서버 연동 시 _id로 매핑한다.

// FGI 설문 공통 문항 (계획서 TSK-001: 정량 구매의향/가격적정성/경쟁력 + 정성)
// 캠페인별 커스텀 문항은 campaign.fgiExtraQuestions로 확장한다.
export const FGI_QUANT_ITEMS = [
  { key: 'purchaseIntent', type: 'quant' },
  { key: 'priceFairness', type: 'quant' },
  { key: 'competitiveness', type: 'quant' },
];
const MOCK_CAMPAIGNS = [
  {
    id: 'cmp-001',
    brand: 'SonPlan',
    brandId: 'brand-sonplan',
    title: '썬플랜 타임 슬립 아이크림 글로벌 체험단',
    thumbnailUrl: 'https://intro.greyd.app/resources/checked_v_white.png',
    remaining: 12,
    total: 30,
    deadline: '2026-08-20T23:59:59.000Z',
    countries: ['KR', 'US', 'JP'],
    seedingQuotaPerCountry: { KR: 10, US: 10, JP: 10 },
    rewardPoint: 500, // 하위 호환 (base_points 표시용)
    basePoints: 500,
    track: 'open',
    uploadDays: 14,
    contentGuide: ['타임 슬립 성분 언급', '눈가 사용 장면', '#sonplan 해시태그'],
    fgiExtraQuestions: ['향에 대한 인상은 어땠나요?', '민감성 피부에도 괜찮았나요?'],
    status: 'open',
  },
  {
    id: 'cmp-002',
    brand: 'Again Me',
    brandId: 'brand-againme',
    title: '어게인미 헤어 트리트먼트 리뷰 미션',
    thumbnailUrl: 'https://intro.greyd.app/resources/checked_v_white.png',
    remaining: 0,
    total: 50,
    deadline: '2026-08-10T23:59:59.000Z',
    countries: ['US', 'BR'],
    seedingQuotaPerCountry: { US: 30, BR: 20 },
    rewardPoint: 300,
    basePoints: 300,
    track: 'open',
    uploadDays: 14,
    contentGuide: ['젖은 모발 사용법', '비포/애프터'],
    status: 'closed',
  },
  {
    id: 'cmp-003',
    brand: 'ORG',
    brandId: 'brand-org',
    title: 'ORG 브로우 리프트 펌 키트 신제품 선공개',
    thumbnailUrl: 'https://intro.greyd.app/resources/checked_v_white.png',
    remaining: 25,
    total: 40,
    deadline: '2026-08-30T23:59:59.000Z',
    countries: ['KR', 'US', 'JP', 'DE'],
    seedingQuotaPerCountry: { KR: 10, US: 10, JP: 10, DE: 10 },
    rewardPoint: 800,
    basePoints: 800,
    track: 'curated',
    uploadDays: 14,
    contentGuide: ['셀프 펌 과정 풀샷', '지속력 언급', '#orgbeauty'],
    status: 'open',
  },
];

export function fetchCampaignList() {
  return Promise.resolve(MOCK_CAMPAIGNS);
}

export function applyCampaign(_campaignId, _userId) {
  return Promise.resolve({ success: true });
}
