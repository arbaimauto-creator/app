// Phase 1.5 2단계 — 로컬 상태머신은 그대로 두고 ops에 미러링하는 브리지.
// LIVE_OPS_API OFF면 전부 no-op. 실패해도 절대 던지지 않는다 — 로컬 진행이 우선이고,
// 미전송분은 주간 수동 브리지(29번 플랜)가 잡는다. 3단계(토큰 인증)에서 정본이 ops로 넘어간다.
import Preference from 'react-native-default-preference';
import FEATURES from '../Components/Constants/Features';
import { opsPost } from './opsClient';
import { getCreatorProfile } from './creators';
import { toChannelPayload } from './channels';

// 기기 식별자 — 3단계에서 로그인 계정과 매핑된다 (ops Influencer.greydAppId)
export async function getGreydAppId() {
  let id = await Preference.get('greydAppId');
  if (!id) {
    id = `app-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await Preference.set('greydAppId', id);
  }
  return id;
}

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
  const [greydAppId, profile] = await Promise.all([getGreydAppId(), getCreatorProfile()]);
  await safePost(
    '/apply',
    {
      campaignId: campaign.id,
      greydAppId,
      handle: profile?.handleUrl ?? null,
      country: profile?.country ?? null,
      appealText: appealText ?? null,
      applyMode: campaign.applyMode,
      autoConfirmed: autoConfirmed === true,
    },
    'apply',
  );
}

// 수령 확인 → ops Shipment DELIVERED (수동 브리지 ② 일부 대체)
export async function opsReceived(campaignId) {
  const greydAppId = await getGreydAppId();
  await safePost('/received', { campaignId, greydAppId }, 'received');
}

// 리뷰 링크 제출 → ops Content + POSTED (수동 브리지 ③ 대체)
export async function opsUpload(campaignId, postUrl, format) {
  const greydAppId = await getGreydAppId();
  await safePost('/upload', { campaignId, greydAppId, postUrl, format: format ?? null }, 'upload');
}
