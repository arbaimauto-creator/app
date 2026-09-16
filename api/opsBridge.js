// Phase 1.5 2단계 — 로컬 상태머신은 그대로 두고 ops에 미러링하는 브리지.
// LIVE_OPS_API OFF면 전부 no-op. 실패해도 절대 던지지 않는다 — 로컬 진행이 우선이고,
// 미전송분은 주간 수동 브리지(29번 플랜)가 잡는다. 3단계(토큰 인증)에서 정본이 ops로 넘어간다.
import FEATURES from '../Components/Constants/Features';
import { getGreydAppId, opsGet, opsPost } from './opsClient';
import { getCreatorProfile } from './creators';
import { toChannelPayload } from './channels';
import { sendOrQueue } from './opsOutbox';

// 기기 식별자 — 3단계에서 로그인 계정과 매핑된다 (ops Influencer.greydAppId)
// 저장소가 응답하지 않아도 게이트가 멈추지 않도록 타임아웃 레이스로 접근한다.
// (읽기 실패 시 새 ID 생성 — 코드 재사용 판정이 갈릴 수 있으나 멈춤보다 낫다)
// 기기 식별자는 세션 발급(opsClient.ensureOpsSession)과 공유한다
export { getGreydAppId };

async function safePost(path, body, tag) {
  if (!FEATURES.LIVE_OPS_API) {
    return;
  }
  try {
    await opsPost(path, body);
  } catch (e) {
    if (__DEV__) {
      console.log(`ops bridge ${tag} failed (local state unaffected)`, e?.message);
    }
  }
}

// 푸시 토큰 등록 (2026-09-16) — ops가 FCM v1로 직접 보내는 알림(2차 활용 요청·FGI 선정·인센티브 확정·공동구매 성사·노쇼)의 수신처.
// 앱 서버(greyd_server)도 같은 토큰을 따로 갖고 있다(레거시 알림). 토큰이 바뀌면 다음 실행 때 다시 등록된다.
export async function opsRegisterPushToken(token, platform) {
  if (!token || typeof token !== 'string') {
    return;
  }
  await safePost('/push-token', { token, platform }, 'push-token');
}

// D29: 온보딩 완료 → ops 골든 레코드에 채널 3종·인구통계 동기화.
// 이게 있어야 앱 가입자가 ops 매칭 후보로 실제 계산된다 (핸들 없으면 지표 수집도 불가).
export async function opsSyncProfile(profile) {
  const greydAppId = await getGreydAppId();
  await safePost(
    '/profile',
    {
      greydAppId,
      country: profile?.country ?? null,
      primaryPlatform: profile?.primaryPlatform ?? null,
      channels: toChannelPayload(profile?.channels),
      ageBand: profile?.ageBand ?? null,
      gender: profile?.gender ?? null,
      categories: profile?.contentCategories ?? [],
      skinType: profile?.skinType ?? null,
    },
    'profile',
  );
}

// 신청 → ops Match 생성 (수동 브리지 ① 대체). 제안 수락도 autoConfirmed=true로 동일 경로.
export async function opsApply({ campaign, appealText, autoConfirmed }) {
  // 개발용 mock 픽스처(api/campaigns DEV_MOCK_CAMPAIGN)는 ops에 없어 400으로 떨어진다 — 로컬만 진행
  if (!FEATURES.LIVE_OPS_API || String(campaign?.id || '').startsWith('mock-')) {
    return null;
  }
  const [greydAppId, profile] = await Promise.all([getGreydAppId(), getCreatorProfile()]);
  return opsPost('/apply', {
    campaignId: campaign.id,
    greydAppId,
    handle: profile?.handleUrl ?? null,
    country: profile?.country ?? null,
    appealText: appealText ?? null,
    applyMode: campaign.applyMode,
    autoConfirmed: autoConfirmed === true,
  });
}

// 내 스탯 정본 조회 (G-스코어·스트라이크·완주 수·포인트 잔액).
// Bearer 세션이면 신원이 토큰에 있고, 공유키 폴백이면 greydAppId를 쿼리로 싣는다.
export async function opsGetMe() {
  if (!FEATURES.LIVE_OPS_API) {
    return null;
  }
  const greydAppId = await getGreydAppId();
  return opsGet(`/me?greydAppId=${encodeURIComponent(greydAppId)}`);
}

// ops에는 아직 /seedings 라우트가 없다 (있는 것: auth·campaigns·offers·profile·
// apply·received·upload). 매 호출마다 404를 받아 던지고 있어서, 진행 목록을 읽는
// 모든 화면(Activity·홈 할 일·캠페인 상세)이 불필요한 왕복과 예외를 겪었다.
// 서버에 라우트가 생기면 이 상수를 켠다.
const OPS_SEEDINGS_ROUTE_READY = true;

export async function opsGetSeedings() {
  if (!FEATURES.LIVE_OPS_API || !OPS_SEEDINGS_ROUTE_READY) {
    return [];
  }
  const response = await opsGet('/seedings');
  return Array.isArray(response?.seedings) ? response.seedings : [];
}

// 수령 확인 → ops Shipment DELIVERED (수동 브리지 ② 일부 대체)
export async function opsReceived(campaignId) {
  if (!FEATURES.LIVE_OPS_API) {
    return;
  }
  const greydAppId = await getGreydAppId();
  await sendOrQueue('received', campaignId, '/received', { campaignId, greydAppId });
}

// 리뷰 링크 제출 → ops Content + POSTED (수동 브리지 ③ 대체)
export async function opsUpload(campaignId, postUrl, format) {
  if (!FEATURES.LIVE_OPS_API) {
    return;
  }
  const greydAppId = await getGreydAppId();
  await sendOrQueue('upload', campaignId, '/upload', {
    campaignId,
    greydAppId,
    postUrl,
    format: format ?? null,
  });
}

export async function opsCancel(campaignId) {
  if (!FEATURES.LIVE_OPS_API) {
    return;
  }
  const greydAppId = await getGreydAppId();
  await sendOrQueue('cancel', campaignId, '/cancel', { campaignId, greydAppId });
}

export async function opsAddress(campaignId, address) {
  if (!FEATURES.LIVE_OPS_API) {
    return;
  }
  const greydAppId = await getGreydAppId();
  await sendOrQueue('address', campaignId, '/address', {
    campaignId,
    greydAppId,
    name: address.name,
    phone: address.phone,
    addr1: address.line,
    addr2: [address.city, address.state].filter(Boolean).join(', ') || null,
    zip: address.postalCode,
    // 개인정보 수집·이용 동의(2026-09-09) — 서버는 true 가 아니면 400 privacy_consent_required 로 거부한다
    privacyAgree: address.privacyAgree === true,
  });
}

// FGI 출석 확인 (2026-09-16, 기획서 §5.3 P3) — 선정된 사람이 세션 시작 30분 전부터 누른다.
// 실패하면 예외를 그대로 올린다(화면이 실패 안내를 띄워야 한다 — 출석은 조용히 삼키면 안 된다).
export async function opsFgiCheckIn(campaignId) {
  if (!FEATURES.LIVE_OPS_API) {
    return { ok: true, attendedAt: new Date().toISOString(), engine: 'mock' };
  }
  const greydAppId = await getGreydAppId();
  return opsPost('/fgi-attend', {
    greydAppId,
    campaignId: String(campaignId).replace(/^cmp-/, ''),
  });
}

export async function opsFgi(campaignId, survey, firstImpression) {
  if (!FEATURES.LIVE_OPS_API) {
    return;
  }
  const greydAppId = await getGreydAppId();
  await sendOrQueue('fgi', campaignId, '/fgi', {
    campaignId,
    greydAppId,
    quant: {
      purchaseIntent: survey.purchaseIntent,
      priceFairness: survey.priceFairness,
      competitiveness: survey.competitiveness,
      recommend: survey.recommend,
    },
    fairPriceUsd: survey.fairPriceUsd ?? null,
    priceCapUsd: survey.priceCeilingUsd ?? null,
    competitor: survey.competitorName ?? null,
    pros: survey.pros,
    cons: survey.cons,
    extraAnswers: survey.extraAnswers ?? null,
    firstImpression: firstImpression ?? null,
    profileSnapshot: survey.profileSnapshot ?? {},
    usageDays: survey.usageDays ?? null,
  });
}
