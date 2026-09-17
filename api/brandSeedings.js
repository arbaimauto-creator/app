// 판매자 시딩(제품 뿌리기) 요청 (2026-09-17)
// 판매자가 앱에서 FGI/리뷰 캠페인용 제품 배포를 요청한다. 캠페인 생성 권한은 서버(ops)에
// 있으므로 앱은 요청을 로컬에 기록하고 ops 아웃박스로 전송한다 — 서버가 닫혀 있으면
// 큐에 남아 자동 재전송된다(api/opsOutbox.js).
import { prefGetSafe, prefSetSafe } from './prefSafe';
import { enqueue } from './opsOutbox';

const KEY = 'brandSeedingRequestsV1';

export async function listSeedingRequests() {
  const raw = await prefGetSafe(KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export async function createSeedingRequest(
  { title, quantity, deadline, fgi, points, productId },
  at = Date.now(),
) {
  const request = {
    id: `bsr-${at}`,
    title,
    quantity: Number(quantity) || 0,
    deadline: deadline || null,
    fgi: !!fgi,
    points: Number(points) || 0,
    productId: productId || null,
    status: 'queued',
    at,
  };
  const list = await listSeedingRequests();
  await prefSetSafe(KEY, JSON.stringify([request, ...list]));
  await enqueue('campaign.create', request.id, '/brand/campaigns', request).catch(() => {});
  return request;
}
