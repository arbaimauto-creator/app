// 공동구매 정산 계산 (2026-10-14) — 조건은 공동구매(케이스)마다 운영이 세팅한다.
// 서버(ops)가 정본으로 같은 규칙을 쓰고, 화면은 내려받은 결과를 보여주기만 한다. 이 파일은 그 규칙의 기준 구현.
//
// 정산 방식
//  - SUPPLY     창고형 공구: 브랜드는 확정 공급가 × 판매 수량을 받는다. 판매가·호스트 몫은 브랜드 정산과 무관.
//  - COMMISSION 인스타(인플루언서) 공구: 판매 금액에서 인플루언서 수수료율(인플마다 다름)과 운영 수수료율을 뺀다.
// 반품: 환불해 주고 그 몫을 정산에서 뺀다(SUPPLY는 공급가 × 반품 수량, COMMISSION은 환불 금액 기준으로 수수료도 다시 계산).
// 지급: 브랜드 계약의 지급일(기본 익월 10일). 1일~말일 결제 완료분을 묶는다.

export const SETTLEMENT_TYPES = {
  SUPPLY: '창고형 · 공급가 정산',
  COMMISSION: '인스타 공구 · 수수료 정산',
};

export const DEFAULT_CONTRACT = { payoutDay: 10, basis: 'PAID' }; // basis: PAID(결제 완료 시점) | SHIPPED(발송 완료 시점)

const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const won = (v) => Math.round(v);

export function normalizeTerms(t) {
  const type = t?.type === 'SUPPLY' ? 'SUPPLY' : t?.type === 'COMMISSION' ? 'COMMISSION' : null;
  return {
    type,
    supplyPrice: n(t?.supplyPrice), // SUPPLY: 개당 확정 공급가(VAT 포함)
    hostRateBps: n(t?.hostRateBps), // COMMISSION: 인플루언서 수수료율(1% = 100)
    platformRateBps: n(t?.platformRateBps), // COMMISSION: 운영 수수료율
    note: t?.note || '',
  };
}

// sales: { quantity, amount(결제 금액), returnedQuantity, refundAmount }
export function computeLine(terms, sales) {
  const t = normalizeTerms(terms);
  const qty = n(sales.quantity);
  const retQty = Math.min(n(sales.returnedQuantity), qty);
  if (t.type === 'SUPPLY') {
    const base = won(t.supplyPrice * qty);
    const refunds = won(t.supplyPrice * retQty);
    return { type: t.type, base, refunds, hostFee: 0, platformFee: 0, payout: base - refunds };
  }
  if (t.type === 'COMMISSION') {
    const base = won(n(sales.amount));
    const refunds = Math.min(won(n(sales.refundAmount)), base);
    const net = base - refunds;
    const hostFee = won((net * t.hostRateBps) / 10000);
    const platformFee = won((net * t.platformRateBps) / 10000);
    return { type: t.type, base, refunds, hostFee, platformFee, payout: net - hostFee - platformFee };
  }
  // 조건이 아직 세팅되지 않은 공동구매 — 지급액을 만들지 않는다(운영 확인 필요)
  return { type: null, base: 0, refunds: 0, hostFee: 0, platformFee: 0, payout: 0, unset: true };
}

export function summarize(lines) {
  const sum = (k) => lines.reduce((a, l) => a + n(l[k]), 0);
  return {
    gross: sum('base'),
    refunds: sum('refunds'),
    hostIncentive: sum('hostFee'),
    fees: sum('platformFee'),
    payout: sum('payout'),
    unset: lines.some((l) => l.unset),
  };
}

// periodStart가 속한 달의 다음 달 payoutDay (그 달에 없는 날이면 말일)
export function payoutDateFor(periodStart, payoutDay = DEFAULT_CONTRACT.payoutDay) {
  const d = new Date(periodStart);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const last = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(Math.max(1, payoutDay), last));
}

export function termsLabel(terms, fmt = (v) => Math.round(v).toLocaleString('ko-KR')) {
  const t = normalizeTerms(terms);
  if (t.type === 'SUPPLY') return `창고형 · 공급가 ${fmt(t.supplyPrice)}원 × 판매 수량`;
  if (t.type === 'COMMISSION') {
    const p = (bps) => `${(bps / 100).toFixed(bps % 100 ? 1 : 0)}%`;
    return `인스타 공구 · 인플루언서 ${p(t.hostRateBps)}${t.platformRateBps ? ` · 운영 ${p(t.platformRateBps)}` : ''}`;
  }
  return '정산 조건 확인 중';
}
