// 본인확인 (2026-09-16, 기획서 §5.4) — 1차 수단은 이메일 6자리 코드. ops /api/mobile/verify.
// 완료되면 /me의 identityVerifiedAt로 내려오고, 마이페이지 신뢰 지표가 '완료'로 바뀐다.
import FEATURES from '../Components/Constants/Features';
import { opsGet, opsPost } from './opsClient';

export const VERIFY_ERROR = {
  BAD_EMAIL: 'bad_email',
  TOO_SOON: 'too_soon',
  MISMATCH: 'mismatch',
  EXPIRED: 'expired',
  LOCKED: 'locked',
  MAIL_FAILED: 'mail_failed',
  OFFLINE: 'offline',
};

export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());

function toError(e) {
  const code = e?.body?.error || e?.error || e?.message;
  const known = Object.values(VERIFY_ERROR).includes(code) ? code : VERIFY_ERROR.OFFLINE;
  const err = new Error(known);
  err.code = known;
  err.attemptsLeft = e?.body?.attemptsLeft;
  return err;
}

export async function getVerifyStatus() {
  if (!FEATURES.LIVE_OPS_API) {
    return { verifiedAt: null, pending: null };
  }
  try {
    return await opsGet('/verify');
  } catch (e) {
    return { verifiedAt: null, pending: null };
  }
}

export async function startVerify(email) {
  const normalized = String(email || '')
    .trim()
    .toLowerCase();
  if (!isValidEmail(normalized)) {
    const err = new Error(VERIFY_ERROR.BAD_EMAIL);
    err.code = VERIFY_ERROR.BAD_EMAIL;
    throw err;
  }
  try {
    return await opsPost('/verify', { action: 'start', email: normalized });
  } catch (e) {
    throw toError(e);
  }
}

export async function confirmVerify(code) {
  const digits = String(code || '').replace(/\D/g, '');
  try {
    return await opsPost('/verify', { action: 'confirm', code: digits });
  } catch (e) {
    throw toError(e);
  }
}
