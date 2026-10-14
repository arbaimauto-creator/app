// 브랜드 파트너센터 (2026-10-14) — 공동구매를 진행하는 브랜드의 웹 화면.
//
// 서버 정본은 ops(/api/mobile/*, Bearer). 경로·본문은 docs/groupbuy-dev-spec-2026-09-30.md §4-6과 같고,
// 응답 정규화는 앱 api/groupBuys.js와 같은 규칙을 쓴다(웹은 RN 모듈을 가져올 수 없어 필요한 부분만 옮김).
//
// VITE_OPS_API_BASE가 없으면 브라우저 안의 모의 서버(mockServer.js)를 쓴다 — 화면 확인·시연용.
// 정산·상품 등록 요청은 ops에 아직 계약이 없다 → docs/brand-partner-center-2026-10-14.md의 제안 경로를 쓰고,
// 서버가 404를 주면 화면에 "준비 중"으로 보인다.
import * as mock from './mockServer.js';
import { normalizeTerms, DEFAULT_CONTRACT } from './settlement.js';

const BASE = String(import.meta.env.VITE_OPS_API_BASE || '').replace(/\/+$/, '');
export const IS_MOCK = !BASE || import.meta.env.VITE_BRAND_MOCK === '1';

// ── 세션 ────────────────────────────────────────────────────────────
// ops가 발급한 브랜드 접속 링크(…#brand?t=<토큰>)로 들어오면 토큰을 세션에 두고 주소창에서 지운다.
const TOKEN_KEY = 'gdBrandToken';

export function captureTokenFromHash() {
  const m = /[?&]t=([^&]+)/.exec(window.location.hash);
  if (!m) {
    return;
  }
  try {
    sessionStorage.setItem(TOKEN_KEY, decodeURIComponent(m[1]));
  } catch (e) {
    // 세션 저장이 막힌 브라우저 — 이번 페이지에서만 쓴다
    memToken = decodeURIComponent(m[1]);
  }
  window.history.replaceState(null, '', `${window.location.pathname}#brand`);
}

let memToken = null;
export function getToken() {
  if (IS_MOCK) {
    return 'mock';
  }
  try {
    return sessionStorage.getItem(TOKEN_KEY) || memToken;
  } catch (e) {
    return memToken;
  }
}

export function signOut() {
  memToken = null;
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    // 무시
  }
}

export class ApiError extends Error {
  constructor(status, code) {
    super(code || `http_${status}`);
    this.status = status;
    this.code = code || null;
  }
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(body ? { 'Content-Type': 'application/json' } : null),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    // 빈 본문
  }
  if (!res.ok) {
    if (res.status === 401) {
      signOut();
    }
    throw new ApiError(res.status, json?.error);
  }
  return json;
}

// ── 상태 ────────────────────────────────────────────────────────────
export const GB_STATE_LABEL = {
  PENDING_HOST: ['호스트 수락 대기', 'p-info'],
  SCHEDULED: ['오픈 예정', 'p-info'],
  OPEN: ['모집 중', 'p-ok'],
  CLOSED: ['결제 진행 중', 'p-warn'],
  CONFIRMED: ['발송 대기', 'p-acc'],
  SHIPPING: ['발송 중', 'p-warn'],
  DONE: ['완료', 'p-mute'],
  FAILED: ['미달 취소', 'p-mute'],
  CANCELLED: ['취소', 'p-mute'],
};

export const ORDER_STATE_LABEL = {
  PAID: ['발송 대기', 'p-acc'],
  SHIPPED: ['발송 완료', 'p-ok'],
};

// 명단(개인정보)이 열리는 상태 — 결제가 끝난 뒤만
export const RELEASED_STATES = ['CONFIRMED', 'SHIPPING', 'DONE'];
export const ENDED_STATES = ['DONE', 'FAILED', 'CANCELLED'];
export const CANCELLABLE_STATES = ['PENDING_HOST', 'SCHEDULED', 'OPEN'];

// 수명주기 레일: 호스트 수락 → 모집 → 결제 확정 → 발송 → 완료. 값 = 지금 단계(그 앞은 끝남)
export const LIFE_STEPS = ['호스트 수락', '모집', '결제 확정', '발송', '완료'];
const LIFE_INDEX = { PENDING_HOST: 0, SCHEDULED: 1, OPEN: 1, CLOSED: 2, CONFIRMED: 3, SHIPPING: 3, DONE: 5 };
export const lifeIndex = (state) => (state in LIFE_INDEX ? LIFE_INDEX[state] : null);

// ── 택배사 (앱 Components/utils/couriers.js와 같은 코드) ─────────────
export const COURIERS = [
  { code: 'CJ', country: 'KR', ko: 'CJ대한통운', alias: ['CJ', '대한통운', 'CJ대한통운'] },
  { code: 'HANJIN', country: 'KR', ko: '한진택배', alias: ['한진', '한진택배'] },
  { code: 'LOTTE', country: 'KR', ko: '롯데택배', alias: ['롯데', '롯데택배', '롯데글로벌로지스'] },
  { code: 'EPOST', country: 'KR', ko: '우체국택배', alias: ['우체국', '우체국택배'] },
  { code: 'LOGEN', country: 'KR', ko: '로젠택배', alias: ['로젠', '로젠택배'] },
  { code: 'CU', country: 'KR', ko: 'CU 편의점택배', alias: ['CU', 'CU편의점택배'] },
  { code: 'GS', country: 'KR', ko: 'GS 편의점택배', alias: ['GS', 'GS편의점택배', 'GS포스트박스'] },
  { code: 'YAMATO', country: 'JP', ko: '야마토운수', alias: ['야마토', '야마토운수', 'YAMATO'] },
  { code: 'SAGAWA', country: 'JP', ko: '사가와급편', alias: ['사가와', '사가와급편', 'SAGAWA'] },
  { code: 'JAPANPOST', country: 'JP', ko: '일본우편', alias: ['일본우편', 'JAPANPOST', 'JP POST'] },
  { code: 'OTHER', country: null, ko: '기타', alias: ['기타', 'OTHER'] },
];

export const couriersFor = (country) =>
  COURIERS.filter((c) => !country || !c.country || c.country === country);
export const courierName = (code) => COURIERS.find((c) => c.code === code)?.ko || code || '';

// "CJ대한통운", "cj", "한진" → 코드. 모르면 null
export function courierFromText(text) {
  const t = String(text || '').replace(/\s/g, '').toUpperCase();
  if (!t) {
    return null;
  }
  const hit = COURIERS.find(
    (c) => c.code === t || c.alias.some((a) => a.replace(/\s/g, '').toUpperCase() === t),
  );
  return hit ? hit.code : null;
}

export const normalizeTracking = (v) =>
  String(v || '')
    .replace(/[\s-]/g, '')
    .toUpperCase();
export const isValidTracking = (v) => /^[0-9A-Z]{6,30}$/.test(normalizeTracking(v));

// ── 정규화 ──────────────────────────────────────────────────────────
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const arr = (v) => (Array.isArray(v) ? v : []);
const absUrl = (u) => {
  if (!u || typeof u !== 'string') {
    return null;
  }
  if (/^https?:\/\//.test(u)) {
    return u;
  }
  const origin = (BASE.match(/^https?:\/\/[^/]+/) || [''])[0];
  return origin ? `${origin}${u.startsWith('/') ? '' : '/'}${u}` : u;
};

export function normalizeOrder(raw) {
  if (!raw || !raw.id) {
    return null;
  }
  const r = raw.recipient || {};
  return {
    id: String(raw.id),
    state: raw.state === 'SHIPPED' ? 'SHIPPED' : 'PAID',
    quantity: num(raw.quantity, 1),
    option: raw.option || '',
    total: num(raw.total),
    currency: raw.currency || 'KRW',
    recipient: {
      name: r.name || '',
      phone: r.phone || '',
      postalCode: r.postalCode || '',
      address1: r.address1 || '',
      address2: r.address2 || '',
      memo: r.memo || '',
    },
    shipment: raw.shipment?.trackingNumber
      ? {
          courier: raw.shipment.courier || 'OTHER',
          trackingNumber: raw.shipment.trackingNumber,
          shippedAt: raw.shipment.shippedAt || null,
        }
      : null,
    paidAt: raw.paidAt || null,
  };
}

export function normalizeGroupBuy(raw) {
  const gb = raw?.groupBuy || raw;
  if (!gb || !/^gb-[0-9a-f]{8}$/.test(gb.code || '')) {
    return null;
  }
  const p = gb.product || {};
  return {
    code: gb.code,
    title: gb.title || p.name || '',
    state: GB_STATE_LABEL[gb.state] ? gb.state : 'CLOSED',
    openedBy: gb.openedBy === 'ARBAIM' ? 'ARBAIM' : 'BRAND',
    host: { handle: gb.host?.handle || '', name: gb.host?.name || '' },
    product: { name: p.name || '', imageUrl: absUrl(p.imageUrl), listPrice: num(p.listPrice) },
    country: gb.country === 'JP' ? 'JP' : 'KR',
    currency: gb.currency || (gb.country === 'JP' ? 'JPY' : 'KRW'),
    price: num(gb.price),
    shippingFee: num(gb.shippingFee),
    minQuantity: num(gb.minQuantity),
    maxQuantity: num(gb.maxQuantity),
    options: arr(gb.options).map(String).filter(Boolean),
    startsAt: gb.startsAt || null,
    endsAt: gb.endsAt || null,
    shipBy: gb.shipBy || null,
    settlement: normalizeTerms(gb.settlement), // 정산 조건(케이스마다 운영이 세팅)
    reservedQuantity: num(gb.reservedQuantity),
    orderCount: num(gb.orderCount),
  };
}

// ── 공동구매 (ops 계약 §4-6) ─────────────────────────────────────────
const enc = encodeURIComponent;

export async function listGroupBuys() {
  const res = IS_MOCK ? await mock.brandList() : await request('GET', '/brand/groupbuys');
  return arr(res?.groupBuys).map(normalizeGroupBuy).filter(Boolean);
}

export async function cancelGroupBuy(code) {
  return IS_MOCK ? mock.brandCancel(code) : request('POST', `/brand/groupbuys/${enc(code)}/cancel`, {});
}

// 명단 — 결제 완료(CONFIRMED) 이후에만 개인정보가 온다. 그 전엔 { released:false, summary }.
export async function getOrders(code) {
  const res = IS_MOCK
    ? await mock.brandOrders(code)
    : await request('GET', `/brand/groupbuys/${enc(code)}/orders`);
  return {
    released: !!res?.released,
    summary: {
      reserved: num(res?.summary?.reserved),
      paid: num(res?.summary?.paid),
      failed: num(res?.summary?.failed),
      shipped: num(res?.summary?.shipped),
    },
    orders: arr(res?.orders).map(normalizeOrder).filter(Boolean),
  };
}

export async function setShipment(orderId, courier, trackingNumber) {
  const body = { courier, trackingNumber: normalizeTracking(trackingNumber) };
  const res = IS_MOCK
    ? await mock.setShipment(orderId, body)
    : await request('POST', `/brand/groupbuy-orders/${enc(orderId)}/shipment`, body);
  return normalizeOrder(res?.order || res);
}

// ── 제안 경로 (ops 미구현) ───────────────────────────────────────────
// 404면 null → 화면은 "준비 중"
async function proposed(method, path, body) {
  try {
    return await request(method, path, body);
  } catch (e) {
    if (e.status === 404) {
      return null;
    }
    throw e;
  }
}

// 월 정산: { contract: { payoutDay, basis }, settlements: [{ id, periodStart, periodEnd, payoutDate, state: PLANNED|PAID,
//   gross, refunds, hostIncentive, fees, shipping, payout, unset, currency,
//   lines:[{ code, title, terms, quantity, amount, returnedQuantity, refundAmount, base, refunds, hostFee, platformFee, payout, unset }] }] }
// 계산 규칙은 settlement.js(서버가 정본)
export async function listSettlements() {
  const res = IS_MOCK ? await mock.settlements() : await proposed('GET', '/brand/settlements');
  if (!res) {
    return null;
  }
  const contract = { ...DEFAULT_CONTRACT, ...(res.contract || {}) };
  const list = arr(res.settlements).map((s) => ({
    id: String(s.id),
    periodStart: s.periodStart,
    periodEnd: s.periodEnd,
    payoutDate: s.payoutDate,
    state: s.state === 'PAID' ? 'PAID' : 'PLANNED',
    gross: num(s.gross),
    refunds: num(s.refunds),
    hostIncentive: num(s.hostIncentive),
    fees: num(s.fees),
    shipping: num(s.shipping),
    payout: num(s.payout),
    currency: s.currency || 'KRW',
    unset: !!s.unset,
    lines: arr(s.lines).map((l) => ({
      code: l.code || '',
      title: l.title || '',
      terms: normalizeTerms(l.terms),
      quantity: num(l.quantity),
      amount: num(l.amount),
      returnedQuantity: num(l.returnedQuantity),
      refundAmount: num(l.refundAmount),
      base: num(l.base),
      refunds: num(l.refunds),
      hostFee: num(l.hostFee),
      platformFee: num(l.platformFee),
      payout: num(l.payout),
      unset: !!l.unset,
    })),
  }));
  list.contract = contract;
  return list;
}

// 상품 진행 요청: { requests: [{ id, name, spec, quantity, expiresOn, supplyPrice, goal, state, note, createdAt }] }
export async function listProductRequests() {
  const res = IS_MOCK ? await mock.productRequests() : await proposed('GET', '/brand/product-requests');
  return res ? arr(res.requests) : null;
}

export async function createProductRequests(items) {
  return IS_MOCK
    ? mock.createProductRequests(items)
    : request('POST', '/brand/product-requests', { items });
}

export async function resetMock() {
  return mock.reset();
}

// ── 계산 ────────────────────────────────────────────────────────────
export function optionTotals(orders) {
  const map = new Map();
  for (const o of orders) {
    const k = o.option || '옵션 없음';
    const cur = map.get(k) || { option: k, orders: 0, quantity: 0 };
    cur.orders += 1;
    cur.quantity += o.quantity;
    map.set(k, cur);
  }
  return [...map.values()].sort((a, b) => b.quantity - a.quantity);
}

export const fillRatio = (gb) => {
  const goal = gb.maxQuantity || gb.minQuantity;
  return goal ? Math.min(1, gb.reservedQuantity / goal) : 0;
};

// ── CSV ─────────────────────────────────────────────────────────────
function csvCell(value) {
  const s = value == null ? '' : String(value);
  // 수식 주입 방지: = + - @ 로 시작하면 앞에 작은따옴표
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
const toCsv = (rows) => `﻿${rows.map((r) => r.map(csvCell).join(',')).join('\r\n')}`;

// 명단 (docs/groupbuy-rules §3-3 항목 순서)
export function ordersToCsv(orders) {
  const head = ['주문번호', '받는 분', '연락처', '우편번호', '주소', '배송 메모', '옵션', '수량', '결제금액', '통화', '결제 시각', '상태', '택배사', '송장번호'];
  return toCsv([
    head,
    ...orders.map((o) => [
      o.id,
      o.recipient.name,
      o.recipient.phone,
      o.recipient.postalCode,
      [o.recipient.address1, o.recipient.address2].filter(Boolean).join(' '),
      o.recipient.memo,
      o.option,
      o.quantity,
      o.total,
      o.currency,
      o.paidAt ? fmtDateTime(o.paidAt) : '',
      ORDER_STATE_LABEL[o.state][0],
      o.shipment ? courierName(o.shipment.courier) : '',
      o.shipment?.trackingNumber || '',
    ]),
  ]);
}

// 송장 일괄 업로드 양식 — 발송 대기 주문번호를 미리 채워 준다
export function trackingTemplateCsv(orders) {
  return toCsv([
    ['주문번호', '택배사', '송장번호', '받는 분(확인용)', '옵션(확인용)', '수량(확인용)'],
    ...orders.map((o) => [o.id, '', '', o.recipient.name, o.option, o.quantity]),
  ]);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const s = String(text || '').replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"' && s[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') {
        i++;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

// 송장 CSV → [{ line, orderId, courier, trackingNumber, error }]
// 열: 주문번호 · 택배사 · 송장번호 (머리글이 있으면 이름으로, 없으면 앞 세 열)
export function parseTrackingCsv(text, ordersById, country) {
  const rows = parseCsv(text);
  if (!rows.length) {
    return [];
  }
  let idx = { id: 0, courier: 1, tracking: 2 };
  let start = 0;
  const head = rows[0].map((c) => c.replace(/\s/g, ''));
  if (head.some((c) => /주문번호|택배사|송장/.test(c))) {
    idx = {
      id: head.findIndex((c) => /주문번호/.test(c)),
      courier: head.findIndex((c) => /택배사/.test(c)),
      tracking: head.findIndex((c) => /송장/.test(c)),
    };
    start = 1;
  }
  const allowed = new Set(couriersFor(country).map((c) => c.code));
  const seen = new Set();
  return rows.slice(start).map((r, i) => {
    const orderId = String(r[idx.id] ?? '').replace(/^'/, '').trim();
    const courier = courierFromText(r[idx.courier]);
    const trackingNumber = normalizeTracking(String(r[idx.tracking] ?? '').replace(/^'/, ''));
    let error = null;
    if (!orderId) {
      error = '주문번호 없음';
    } else if (!ordersById.has(orderId)) {
      error = '이 공동구매의 주문이 아님';
    } else if (seen.has(orderId)) {
      error = '같은 주문번호가 두 번 있음';
    } else if (!courier || !allowed.has(courier)) {
      error = r[idx.courier] ? `모르는 택배사 "${r[idx.courier]}"` : '택배사 없음';
    } else if (courier !== 'OTHER' && !isValidTracking(trackingNumber)) {
      error = trackingNumber ? '송장번호 형식 오류(영문·숫자 6–30자)' : '송장번호 없음';
    }
    seen.add(orderId);
    return { line: start + i + 1, orderId, courier, trackingNumber, error };
  });
}

// ── 표시 ────────────────────────────────────────────────────────────
export const money = (n, currency = 'KRW') =>
  `${Math.round(n).toLocaleString('ko-KR')}${currency === 'JPY' ? '엔' : '원'}`;
export const int = (n) => Math.round(n).toLocaleString('ko-KR');
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (n) => String(n).padStart(2, '0');
export const fmtDate = (iso) => {
  if (!iso) {
    return '—';
  }
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}(${WD[d.getDay()]})`;
};
export const fmtMonth = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
};
export const fmtDateTime = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export function dday(iso, now = Date.now()) {
  if (!iso) {
    return null;
  }
  const a = new Date(iso);
  const b = new Date(now);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((a - b) / 86400000);
}
