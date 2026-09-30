// 공동구매 (2026-09-30) — docs/groupbuy-dev-spec-2026-09-30.md
//
// 흐름: 브랜드(또는 아르바임 운영)가 인플루언서(호스트)를 지정해 공동구매를 연다 → 호스트가 수락하고 영상을 붙인다
//   → 구매자는 상세(브랜드 상세페이지 + 호스트 영상)를 보고 주문서를 쓴 뒤 토스 빌링으로 카드를 등록한다(결제 예약)
//   → 마감 시각에 서버가 최소 수량을 판정해 등록 카드로 일괄 결제(미달이면 결제하지 않음)
//   → 결제된 주문 명단(이름·연락처·주소·수량·옵션·금액)이 브랜드에 공개된다 → 브랜드가 택배사·송장번호 입력 → 구매자 추적.
//
// 서버 정본은 ops(/api/mobile/*). ops에 공동구매 API가 올라가기 전에는 FEATURES.GROUP_BUY_MOCK(개발 빌드)로
// 기기 안의 모의 서버(api/groupBuysMock.js)를 쓴다. 릴리스 빌드는 모의 서버를 절대 쓰지 않는다.
import FEATURES from '../Components/Constants/Features';
import { opsGet, opsPost } from './opsClient';
import { OPS_API_BASE } from './opsRuntimeConfig';
import * as mock from './groupBuysMock';

// ── 상태 ────────────────────────────────────────────────────────────
export const GB_STATE = {
  PENDING_HOST: 'PENDING_HOST', // 개설됨, 호스트 수락 대기 (비공개)
  SCHEDULED: 'SCHEDULED', // 수락됨, 시작 전 (예고 노출)
  OPEN: 'OPEN', // 모집 중 — 카드 등록(결제 예약)
  CLOSED: 'CLOSED', // 마감, 판정·결제 진행 중
  CONFIRMED: 'CONFIRMED', // 성사 — 결제 완료, 브랜드에 명단 공개
  SHIPPING: 'SHIPPING', // 발송 시작
  DONE: 'DONE', // 전 주문 발송 완료
  FAILED: 'FAILED', // 최소 수량 미달 — 결제 없음
  CANCELLED: 'CANCELLED', // 운영·브랜드 취소, 호스트 거절
};

export const ORDER_STATE = {
  BILLING_PENDING: 'BILLING_PENDING', // 주문서 작성, 카드 등록 전
  RESERVED: 'RESERVED', // 카드 등록 완료 = 결제 예약
  PAID: 'PAID', // 마감 후 결제 성공
  PAYMENT_FAILED: 'PAYMENT_FAILED', // 마감 후 결제 실패(한도·정지 등)
  SHIPPED: 'SHIPPED', // 송장 입력됨
  VOIDED: 'VOIDED', // 미달·공동구매 취소로 결제 안 함
  CANCELLED: 'CANCELLED', // 마감 전 구매자 취소
};

// 브랜드에 구매자 개인정보(명단)를 공개하는 상태 — 결제가 끝난 뒤만
export const RELEASED_STATES = [GB_STATE.CONFIRMED, GB_STATE.SHIPPING, GB_STATE.DONE];

export const COUNTRIES = {
  KR: { currency: 'KRW' },
  JP: { currency: 'JPY' },
};

const CODE_RE = /^gb-[0-9a-f]{8}$/;
export const isGroupBuyCode = (code) => typeof code === 'string' && CODE_RE.test(code);

// ── 정규화 ──────────────────────────────────────────────────────────
// ops는 상품 이미지를 자기 오리진 상대경로(/api/files/<key>)로 준다 — 앱에서 열 수 있게 절대 URL로
export function absoluteOpsUrl(url, base = OPS_API_BASE) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  if (/^https?:\/\//.test(url)) {
    return url;
  }
  const origin = (String(base || '').match(/^https?:\/\/[^/]+/) || [''])[0];
  return origin ? `${origin}${url.startsWith('/') ? '' : '/'}${url}` : url;
}

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const arr = (v) => (Array.isArray(v) ? v : []);

export function normalizeOrder(raw) {
  if (!raw || !raw.id) {
    return null;
  }
  const r = raw.recipient || {};
  return {
    id: String(raw.id),
    groupBuyCode: raw.groupBuyCode || null,
    groupBuyTitle: raw.groupBuyTitle || '',
    state: ORDER_STATE[raw.state] ? raw.state : ORDER_STATE.BILLING_PENDING,
    quantity: num(raw.quantity, 1),
    option: raw.option || null,
    unitPrice: num(raw.unitPrice),
    shippingFee: num(raw.shippingFee),
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
    createdAt: raw.createdAt || null,
    paidAt: raw.paidAt || null,
    chargeAt: raw.chargeAt || null,
    failureReason: raw.failureReason || null,
  };
}

export function normalizeGroupBuy(raw) {
  const gb = raw?.groupBuy || raw;
  if (!gb || !isGroupBuyCode(gb.code)) {
    return null;
  }
  const product = gb.product || {};
  return {
    code: gb.code,
    title: gb.title || product.name || '',
    state: GB_STATE[gb.state] ? gb.state : GB_STATE.OPEN,
    openedBy: gb.openedBy === 'ARBAIM' ? 'ARBAIM' : 'BRAND',
    brand: { id: gb.brand?.id || null, name: gb.brand?.name || '' },
    host: {
      id: gb.host?.id || null,
      handle: gb.host?.handle || '',
      name: gb.host?.name || '',
      avatarUrl: absoluteOpsUrl(gb.host?.avatarUrl),
      note: gb.host?.note || '',
    },
    product: {
      id: product.id || null,
      name: product.name || '',
      imageUrl: absoluteOpsUrl(product.imageUrl),
      description: product.description || '',
      listPrice: num(product.listPrice),
    },
    country: COUNTRIES[gb.country] ? gb.country : 'KR',
    currency: gb.currency || COUNTRIES[gb.country]?.currency || 'KRW',
    price: num(gb.price),
    shippingFee: num(gb.shippingFee),
    minQuantity: num(gb.minQuantity),
    maxQuantity: num(gb.maxQuantity),
    perUserMax: Math.max(1, num(gb.perUserMax, 5)),
    options: arr(gb.options)
      .map((o) => String(o || '').trim())
      .filter(Boolean),
    detailImages: arr(gb.detailImages)
      .map((u) => absoluteOpsUrl(u))
      .filter(Boolean),
    videos: arr(gb.videos)
      .filter((v) => v && v.videoId)
      .map((v) => ({
        videoId: String(v.videoId),
        thumbnailUrl: absoluteOpsUrl(v.thumbnailUrl),
        caption: v.caption || '',
      })),
    startsAt: gb.startsAt || null,
    endsAt: gb.endsAt || null,
    shipBy: gb.shipBy || null,
    reservedQuantity: num(gb.reservedQuantity),
    orderCount: num(gb.orderCount),
    myRole: ['HOST', 'BRAND'].includes(gb.myRole) ? gb.myRole : 'BUYER',
    myOrders: arr(gb.myOrders).map(normalizeOrder).filter(Boolean),
  };
}

// ── 계산 ────────────────────────────────────────────────────────────
const ms = (iso) => (iso ? new Date(iso).getTime() : NaN);

// 지금 주문(카드 등록)을 받을 수 있는가 — OPEN이고 기간 안이고 물량이 남았을 때
export function canOrder(gb, now = Date.now()) {
  if (!gb || gb.state !== GB_STATE.OPEN) {
    return false;
  }
  if (Number.isFinite(ms(gb.startsAt)) && ms(gb.startsAt) > now) {
    return false;
  }
  if (Number.isFinite(ms(gb.endsAt)) && ms(gb.endsAt) <= now) {
    return false;
  }
  return remainingQuantity(gb) > 0;
}

export function remainingQuantity(gb) {
  if (!gb) {
    return 0;
  }
  if (!gb.maxQuantity) {
    return Infinity;
  }
  return Math.max(0, gb.maxQuantity - gb.reservedQuantity);
}

// 최소 수량 진행률 0~1. 최소 수량이 없으면(0) null — 화면은 진행 막대를 숨긴다.
export function fillRatio(gb) {
  if (!gb || !gb.minQuantity) {
    return null;
  }
  return Math.min(1, gb.reservedQuantity / gb.minQuantity);
}

export function discountPercent(gb) {
  const list = gb?.product?.listPrice;
  if (!list || !gb.price || gb.price >= list) {
    return 0;
  }
  return Math.round((1 - gb.price / list) * 100);
}

export function timeLeft(iso, now = Date.now()) {
  const t = ms(iso);
  if (!Number.isFinite(t)) {
    return null;
  }
  const diff = Math.max(0, t - now);
  return {
    total: diff,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
  };
}

export function orderTotal(gb, quantity) {
  const q = Math.max(0, Math.floor(num(quantity)));
  return gb.price * q + (q > 0 ? gb.shippingFee : 0);
}

// 이미 예약된 내 수량(취소·무효 제외) — 1인 최대 수량 검사에 쓴다
export function myActiveQuantity(gb) {
  return (gb?.myOrders || [])
    .filter((o) => [ORDER_STATE.BILLING_PENDING, ORDER_STATE.RESERVED].includes(o.state))
    .reduce((sum, o) => sum + o.quantity, 0);
}

// 휴대폰: KR 01x-xxxx-xxxx, JP 0x0-xxxx-xxxx 등 — 숫자 10~11자리(+국가번호 허용)
export function isValidPhone(phone) {
  const digits = String(phone || '').replace(/[\s()+-]/g, '');
  return /^\d{9,13}$/.test(digits);
}

export function isValidPostalCode(code, country) {
  const c = String(code || '').replace(/[\s-]/g, '');
  return country === 'JP' ? /^\d{7}$/.test(c) : /^\d{5}$/.test(c);
}

// 주문서 검증 — 오류 키(화면 문구 키) 또는 null
export function validateOrderDraft(gb, draft, now = Date.now()) {
  if (!canOrder(gb, now)) {
    return 'closed';
  }
  const q = Number(draft.quantity);
  if (!Number.isInteger(q) || q < 1) {
    return 'quantity';
  }
  if (q + myActiveQuantity(gb) > gb.perUserMax) {
    return 'perUserMax';
  }
  if (q > remainingQuantity(gb)) {
    return 'soldOut';
  }
  if (gb.options.length && !gb.options.includes(draft.option)) {
    return 'option';
  }
  const r = draft.recipient || {};
  if (!String(r.name || '').trim()) {
    return 'name';
  }
  if (!isValidPhone(r.phone)) {
    return 'phone';
  }
  if (!isValidPostalCode(r.postalCode, gb.country)) {
    return 'postalCode';
  }
  if (!String(r.address1 || '').trim()) {
    return 'address';
  }
  if (!draft.agreeCharge || !draft.agreeThirdParty) {
    return 'agree';
  }
  return null;
}

// 브랜드 개설 폼 검증 — 오류 키 또는 null
export function validateGroupBuyDraft(d, now = Date.now()) {
  if (!String(d.title || '').trim()) {
    return 'title';
  }
  if (!d.productId) {
    return 'product';
  }
  if (
    !String(d.hostHandle || '')
      .replace(/^@/, '')
      .trim()
  ) {
    return 'host';
  }
  if (!COUNTRIES[d.country]) {
    return 'country';
  }
  const price = Number(d.price);
  if (!(price > 0)) {
    return 'price';
  }
  if (d.listPrice && price > Number(d.listPrice)) {
    return 'priceAboveList';
  }
  const min = Number(d.minQuantity || 0);
  const max = Number(d.maxQuantity || 0);
  const perUser = Number(d.perUserMax || 0);
  if (!Number.isInteger(min) || min < 0 || !Number.isInteger(max) || max < 0) {
    return 'quantity';
  }
  if (max && min > max) {
    return 'minAboveMax';
  }
  if (!Number.isInteger(perUser) || perUser < 1) {
    return 'perUser';
  }
  const start = ms(d.startsAt);
  const end = ms(d.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 'period';
  }
  if (end < now) {
    return 'period';
  }
  if (end - start > 30 * 86400000) {
    return 'periodTooLong';
  }
  const images = arr(d.detailImages);
  if (images.some((u) => !/^https:\/\//.test(u))) {
    return 'detailImages';
  }
  return null;
}

// ── 브랜드 명단 CSV (엑셀에서 한글이 깨지지 않게 BOM) ─────────────────
const CSV_HEADERS = [
  ['id', '주문번호'],
  ['name', '받는 분'],
  ['phone', '연락처'],
  ['postalCode', '우편번호'],
  ['address', '주소'],
  ['memo', '배송 메모'],
  ['option', '옵션'],
  ['quantity', '수량'],
  ['total', '결제금액'],
  ['currency', '통화'],
  ['state', '상태'],
  ['courier', '택배사'],
  ['trackingNumber', '송장번호'],
];

function csvCell(value) {
  const s = value == null ? '' : String(value);
  // 수식 주입 방지: = + - @ 로 시작하면 앞에 작은따옴표
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function ordersToCsv(orders) {
  const rows = [CSV_HEADERS.map(([, label]) => label)];
  for (const o of orders) {
    const row = {
      id: o.id,
      name: o.recipient.name,
      phone: o.recipient.phone,
      postalCode: o.recipient.postalCode,
      address: [o.recipient.address1, o.recipient.address2].filter(Boolean).join(' '),
      memo: o.recipient.memo,
      option: o.option || '',
      quantity: o.quantity,
      total: o.total,
      currency: o.currency,
      state: o.state,
      courier: o.shipment?.courier || '',
      trackingNumber: o.shipment?.trackingNumber || '',
    };
    rows.push(CSV_HEADERS.map(([key]) => row[key]));
  }
  return `﻿${rows.map((r) => r.map(csvCell).join(',')).join('\r\n')}`;
}

// ── 토스 빌링(카드 등록) 웹뷰 ────────────────────────────────────────
// 서버(ops)가 토스 SDK를 띄우는 자기 페이지 URL을 준다: <ops>/portal/groupbuy-billing/<orderId>?t=...
// 토스 인증 성공/실패 후 ops가 authKey로 빌링키를 발급하고 <ops>/portal/groupbuy-billing/done?result=...&orderId=... 로 보낸다.
export const opsOrigin = () => (String(OPS_API_BASE || '').match(/^https?:\/\/[^/]+/) || [''])[0];

export function isBillingStartUrl(url, origin = opsOrigin()) {
  return (
    typeof url === 'string' && !!origin && url.startsWith(`${origin}/portal/groupbuy-billing/`)
  );
}

export function billingResultFromUrl(url, origin = opsOrigin()) {
  if (
    typeof url !== 'string' ||
    !origin ||
    !url.startsWith(`${origin}/portal/groupbuy-billing/done`)
  ) {
    return null;
  }
  const query = url.split('?')[1] || '';
  const params = {};
  for (const pair of query.split('#')[0].split('&')) {
    const [k, v = ''] = pair.split('=');
    if (k) {
      params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
    }
  }
  return {
    ok: params.result === 'success',
    orderId: params.orderId || null,
    code: params.code || null,
  };
}

// ── API ─────────────────────────────────────────────────────────────
const isMock = () => !!FEATURES.GROUP_BUY_MOCK;
const enc = encodeURIComponent;

// 구매자
export async function listGroupBuys() {
  const res = isMock() ? await mock.listGroupBuys() : await opsGet('/groupbuys?scope=live');
  return arr(res?.groupBuys).map(normalizeGroupBuy).filter(Boolean);
}

export async function getGroupBuy(code) {
  if (!isGroupBuyCode(code)) {
    return null;
  }
  const res = isMock() ? await mock.getGroupBuy(code) : await opsGet(`/groupbuys/${enc(code)}`);
  return normalizeGroupBuy(res);
}

// 주문서 제출 → { order, billingUrl }. requestId로 중복 제출을 막는다(서버 멱등 키).
export async function createGroupBuyOrder(code, draft, requestId) {
  const body = {
    requestId,
    quantity: Number(draft.quantity),
    option: draft.option || null,
    recipient: {
      name: String(draft.recipient.name).trim(),
      phone: String(draft.recipient.phone).trim(),
      postalCode: String(draft.recipient.postalCode).replace(/[\s-]/g, ''),
      address1: String(draft.recipient.address1).trim(),
      address2: String(draft.recipient.address2 || '').trim(),
      memo: String(draft.recipient.memo || '').trim(),
    },
    agreeCharge: !!draft.agreeCharge,
    agreeThirdParty: !!draft.agreeThirdParty,
  };
  const res = isMock()
    ? await mock.createOrder(code, body)
    : await opsPost(`/groupbuys/${enc(code)}/orders`, body);
  return { order: normalizeOrder(res?.order), billingUrl: res?.billingUrl || null };
}

// 개발 모의 서버 전용: 토스 창 대신 카드 등록을 완료 처리
export async function completeMockBilling(orderId) {
  if (!isMock()) {
    throw new Error('mock only');
  }
  return mock.completeBilling(orderId);
}

export async function cancelGroupBuyOrder(orderId) {
  return isMock()
    ? mock.cancelOrder(orderId)
    : opsPost(`/groupbuy-orders/${enc(orderId)}/cancel`, {});
}

export async function listMyGroupBuyOrders() {
  const res = isMock() ? await mock.myOrders() : await opsGet('/me/groupbuy-orders');
  return arr(res?.orders).map(normalizeOrder).filter(Boolean);
}

// 호스트(인플루언서)
export async function listHostedGroupBuys() {
  const res = isMock() ? await mock.hosted() : await opsGet('/me/hosted-groupbuys');
  return arr(res?.groupBuys).map(normalizeGroupBuy).filter(Boolean);
}

export async function respondHostInvite(code, accept) {
  return isMock()
    ? mock.respondHost(code, !!accept)
    : opsPost(`/groupbuys/${enc(code)}/host`, { accept: !!accept });
}

export async function setHostNote(code, note) {
  const text = String(note || '').slice(0, 300);
  return isMock()
    ? mock.setHostNote(code, text)
    : opsPost(`/groupbuys/${enc(code)}/host`, { note: text });
}

export async function attachHostVideo(code, video) {
  const body = {
    videoId: String(video.videoId),
    thumbnailUrl: video.thumbnailUrl || null,
    caption: String(video.caption || '').slice(0, 80),
  };
  return isMock() ? mock.attachVideo(code, body) : opsPost(`/groupbuys/${enc(code)}/videos`, body);
}

export async function detachHostVideo(code, videoId) {
  return isMock()
    ? mock.detachVideo(code, String(videoId))
    : opsPost(`/groupbuys/${enc(code)}/videos`, { videoId: String(videoId), remove: true });
}

// 브랜드
export async function listBrandGroupBuys() {
  const res = isMock() ? await mock.brandList() : await opsGet('/brand/groupbuys');
  return arr(res?.groupBuys).map(normalizeGroupBuy).filter(Boolean);
}

export async function createBrandGroupBuy(draft, requestId) {
  const body = {
    requestId,
    title: String(draft.title).trim(),
    productId: draft.productId,
    hostHandle: String(draft.hostHandle).trim().replace(/^@/, ''),
    country: draft.country,
    currency: COUNTRIES[draft.country].currency,
    price: Number(draft.price),
    shippingFee: Number(draft.shippingFee || 0),
    minQuantity: Number(draft.minQuantity || 0),
    maxQuantity: Number(draft.maxQuantity || 0),
    perUserMax: Number(draft.perUserMax),
    options: arr(draft.options),
    detailImages: arr(draft.detailImages),
    startsAt: new Date(draft.startsAt).toISOString(),
    endsAt: new Date(draft.endsAt).toISOString(),
    shipBy: draft.shipBy ? new Date(draft.shipBy).toISOString() : null,
  };
  const res = isMock()
    ? await mock.brandCreate({
        ...body,
        productName: draft.productName,
        listPrice: draft.listPrice,
      })
    : await opsPost('/brand/groupbuys', body);
  return normalizeGroupBuy(res);
}

export async function cancelBrandGroupBuy(code) {
  return isMock() ? mock.brandCancel(code) : opsPost(`/brand/groupbuys/${enc(code)}/cancel`, {});
}

// 명단 — 결제 완료(CONFIRMED) 이후에만 개인정보가 담겨 온다. 그 전엔 { released:false, summary }.
export async function listBrandGroupBuyOrders(code) {
  const res = isMock()
    ? await mock.brandOrders(code)
    : await opsGet(`/brand/groupbuys/${enc(code)}/orders`);
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
  const body = {
    courier,
    trackingNumber: String(trackingNumber || '')
      .replace(/[\s-]/g, '')
      .toUpperCase(),
  };
  return isMock()
    ? mock.setShipment(orderId, body)
    : opsPost(`/brand/groupbuy-orders/${enc(orderId)}/shipment`, body);
}

// 개발 모의 서버 전용: 마감 시각을 기다리지 않고 판정·결제를 돌린다
export async function simulateClose(code) {
  if (!isMock()) {
    throw new Error('mock only');
  }
  return mock.closeNow(code);
}

// ── 날짜 입력 (브랜드 개설 폼: "YYYY-MM-DD HH:mm", 기기 현지 시각) ─────────
export function parseDateTimeInput(text) {
  const m = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?\s*$/.exec(
    String(text || ''),
  );
  if (!m) {
    return null;
  }
  const [, y, mo, d, h = '0', mi = '0'] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  // 2026-02-31 같은 넘침 날짜는 거른다
  if (date.getMonth() !== Number(mo) - 1 || date.getDate() !== Number(d) || Number(h) > 23) {
    return null;
  }
  return date.toISOString();
}

export function formatDateTimeInput(date) {
  const d = new Date(date);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
