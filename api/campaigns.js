// 서버 API 준비 전 목데이터 스텁. 서버 연동 시 이 파일의 함수 본문만 교체한다.
const MOCK_CAMPAIGNS = [
  {
    id: 'cmp-001',
    brand: 'SonPlan',
    title: '썬플랜 타임 슬립 아이크림 글로벌 체험단',
    thumbnailUrl: 'https://intro.greyd.app/resources/checked_v_white.png',
    remaining: 12,
    total: 30,
    deadline: '2026-08-20T23:59:59.000Z',
    countries: ['KR', 'US', 'JP'],
    rewardPoint: 500,
    status: 'open',
  },
  {
    id: 'cmp-002',
    brand: 'Again Me',
    title: '어게인미 헤어 트리트먼트 리뷰 미션',
    thumbnailUrl: 'https://intro.greyd.app/resources/checked_v_white.png',
    remaining: 0,
    total: 50,
    deadline: '2026-08-10T23:59:59.000Z',
    countries: ['US', 'BR'],
    rewardPoint: 300,
    status: 'closed',
  },
  {
    id: 'cmp-003',
    brand: 'ORG',
    title: 'ORG 브로우 리프트 펌 키트 신제품 선공개',
    thumbnailUrl: 'https://intro.greyd.app/resources/checked_v_white.png',
    remaining: 25,
    total: 40,
    deadline: '2026-08-30T23:59:59.000Z',
    countries: ['KR', 'US', 'JP', 'DE'],
    rewardPoint: 800,
    status: 'open',
  },
];

export function fetchCampaignList() {
  return Promise.resolve(MOCK_CAMPAIGNS);
}

export function applyCampaign(_campaignId, _userId) {
  return Promise.resolve({ success: true });
}
