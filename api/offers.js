// 제안형 시딩 mock (D25 · ops 정합 I11) — ops 아웃바운드 매칭의 앱 채널.
// 서버 연동 시 이 파일의 함수 본문만 GET/POST /api/mobile/offers 로 교체한다.
// 상태: pending | accepted | declined | expired
// - 수락 = ops Match ACCEPTED→CONFIRMED 상등. 앱 seeding은 applied 스킵, approved로 시작
// - 거절/만료 = ops DECLINED/NO_RESPONSE 상등. G-스코어·Strike 무영향
// - 매칭 조건(팔로워·국가·카테고리·G밴드)은 ops가 정본 — 앱은 표시만
import Preference from 'react-native-default-preference';
import { fetchCampaignList } from './campaigns';

const STORE_KEY = 'offersV2';

// ops 매칭이 이 계정을 후보로 선정했다는 가정의 시드 (Phase 1 수동 브리지로 주간 갱신)
const MOCK_OFFERS = [
  {
    id: 'off-001',
    campaignId: 'cmp-003',
    proposedAt: '2026-08-09T09:00:00.000Z',
    expiresAt: '2026-08-13T23:59:59.000Z', // 응답 시한 D-3
  },
];

async function readResponses() {
  try {
    const raw = await Preference.get(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

// 제안 목록 — 캠페인 조인 + 저장된 응답/만료 반영
export async function getOffers() {
  const [campaigns, responses] = await Promise.all([fetchCampaignList(), readResponses()]);
  const byId = Object.fromEntries(campaigns.map((c) => [c.id, c]));
  return MOCK_OFFERS.map((offer) => {
    const stored = responses[offer.id];
    let status = stored?.status ?? 'pending';
    if (status === 'pending' && Date.now() > Date.parse(offer.expiresAt)) {
      status = 'expired';
    }
    return { ...offer, status, campaign: byId[offer.campaignId] };
  }).filter((offer) => offer.campaign != null);
}

// 수락/거절 기록 — declineReason은 매칭 학습 재료 (선택 항목, D25)
export async function respondToOffer(offerId, status, declineReason) {
  const responses = await readResponses();
  responses[offerId] = { status, declineReason: declineReason ?? null, respondedAt: Date.now() };
  await Preference.set(STORE_KEY, JSON.stringify(responses));
  return responses[offerId];
}
