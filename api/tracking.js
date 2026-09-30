// 추적 코드 클릭 집계 (2026-09-16 P2) — ops /api/mobile/track-click. 공동구매는 api/groupBuys.js (2026-09-30)
// 클릭은 기기당 코드당 하루 한 번만 보낸다(같은 링크를 여러 번 눌러도 소재 성과가 부풀지 않게).
import FEATURES from '../Components/Constants/Features';
import { isTrackingCode } from '../Components/utils/tracking';
import { opsPost } from './opsClient';
import { prefGetSafe, prefSetSafe } from './prefSafe';

const CLICK_SENT_KEY = 'trackingClickSentV1';
const CLICK_DEDUPE_MS = 24 * 60 * 60 * 1000;

export async function reportTrackingClick(code, now = Date.now()) {
  if (!FEATURES.LIVE_OPS_API || !isTrackingCode(code)) {
    return false;
  }
  let sent = {};
  try {
    sent = JSON.parse((await prefGetSafe(CLICK_SENT_KEY)) || '{}') || {};
  } catch (e) {
    sent = {};
  }
  if (sent[code] && now - Number(sent[code]) < CLICK_DEDUPE_MS) {
    return false;
  }
  try {
    await opsPost('/track-click', { trackingCode: code });
  } catch (e) {
    // 집계 실패는 사용자 흐름을 막지 않는다 — 다음 진입에서 다시 시도
    return false;
  }
  // 오래된 항목은 정리해 저장소가 자라지 않게 한다
  const next = Object.fromEntries(
    Object.entries(sent).filter(([, at]) => now - Number(at) < CLICK_DEDUPE_MS),
  );
  next[code] = now;
  await prefSetSafe(CLICK_SENT_KEY, JSON.stringify(next));
  return true;
}

