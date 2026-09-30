// 공동구매 모의 서버 (2026-09-30) — 개발 빌드 전용(FEATURES.GROUP_BUY_MOCK).
// ops 공동구매 API(docs/groupbuy-dev-spec-2026-09-30.md §4)와 같은 응답 모양을 기기 안에서 흉내 낸다.
// 목적: 서버가 올라가기 전에 구매자·호스트·브랜드 화면 전 과정을 한 기기에서 눌러 볼 수 있게.
// 실제 결제·개인정보는 없다. 시드 구매자 이름은 전부 "테스트"로 시작한다.
import { prefGetSafe, prefSetSafe } from './prefSafe';

const KEY = 'groupBuyMockV1';
const DAY = 86400000;

let db = null;

function fail(status, error) {
  const err = new Error(`mock groupbuy ${status}: ${error}`);
  err.status = status;
  err.body = { error };
  return err;
}

function seedOrders(code, count, unit, fee, now, startIndex = 1) {
  const orders = [];
  for (let i = 0; i < count; i += 1) {
    const n = startIndex + i;
    const q = (i % 3) + 1;
    orders.push({
      id: `${code}-seed-${n}`,
      groupBuyCode: code,
      mine: false,
      state: 'RESERVED',
      quantity: q,
      option: null,
      unitPrice: unit,
      shippingFee: fee,
      total: unit * q + fee,
      recipient: {
        name: `테스트 구매자 ${n}`,
        phone: `010-0000-${String(1000 + n).slice(-4)}`,
        postalCode: '06236',
        address1: '서울특별시 강남구 테헤란로 000',
        address2: `${n}층`,
        memo: n % 2 ? '문 앞에 놓아주세요' : '',
      },
      // 결제 실패 재현용 — 마감 결제에서 이 주문만 한도 초과로 떨어진다
      failCharge: n === 3,
      createdAt: new Date(now - (count - i) * 3600000).toISOString(),
    });
  }
  return orders;
}

export function seed(now = Date.now()) {
  const groupBuys = [
    {
      code: 'gb-a1b2c3d4',
      title: '민지의 수분 크림 공동구매',
      state: 'OPEN',
      openedBy: 'BRAND',
      brand: { id: 'brand-roundlab', name: '테스트 브랜드 A' },
      host: {
        id: 'host-minji',
        handle: 'minji.skin',
        name: '민지',
        avatarUrl: null,
        note: '한 달 써보고 진짜 좋아서 브랜드에 직접 요청했어요. 건성 피부에 추천!',
      },
      product: {
        id: 'sp-1001',
        name: '자작나무 수분 크림 80ml',
        imageUrl: null,
        description: '가볍게 스며드는 수분 크림. 민감 피부 테스트 완료.',
        listPrice: 28000,
      },
      country: 'KR',
      currency: 'KRW',
      price: 19900,
      shippingFee: 3000,
      minQuantity: 30,
      maxQuantity: 300,
      perUserMax: 5,
      options: ['50ml', '80ml'],
      detailImages: [],
      videos: [
        { videoId: 'mock-video-1', thumbnailUrl: null, caption: '2주 사용 후기' },
        { videoId: 'mock-video-2', thumbnailUrl: null, caption: '바르는 법' },
      ],
      startsAt: new Date(now - 2 * DAY).toISOString(),
      endsAt: new Date(now + 3 * DAY).toISOString(),
      shipBy: new Date(now + 10 * DAY).toISOString(),
      myRole: 'BUYER',
    },
    {
      code: 'gb-0f0e0d0c',
      title: '선크림 일본 공동구매',
      state: 'PENDING_HOST',
      openedBy: 'ARBAIM',
      brand: { id: 'brand-b', name: '테스트 브랜드 B' },
      host: { id: 'me', handle: 'me', name: '나', avatarUrl: null, note: '' },
      product: {
        id: 'sp-2001',
        name: '톤업 선크림 SPF50+',
        imageUrl: null,
        description: '백탁 없는 톤업 선크림.',
        listPrice: 3200,
      },
      country: 'JP',
      currency: 'JPY',
      price: 2480,
      shippingFee: 0,
      minQuantity: 20,
      maxQuantity: 200,
      perUserMax: 3,
      options: [],
      detailImages: [],
      videos: [],
      startsAt: new Date(now + 1 * DAY).toISOString(),
      endsAt: new Date(now + 6 * DAY).toISOString(),
      shipBy: new Date(now + 14 * DAY).toISOString(),
      myRole: 'HOST',
    },
    {
      code: 'gb-1234abcd',
      title: '클렌징 오일 공동구매',
      state: 'OPEN',
      openedBy: 'BRAND',
      brand: { id: 'brand-mine', name: '내 브랜드(테스트)' },
      host: { id: 'host-yuna', handle: 'yuna.daily', name: '유나', avatarUrl: null, note: '' },
      product: {
        id: 'sp-3001',
        name: '약산성 클렌징 오일 200ml',
        imageUrl: null,
        description: '',
        listPrice: 24000,
      },
      country: 'KR',
      currency: 'KRW',
      price: 16900,
      shippingFee: 0,
      minQuantity: 10,
      maxQuantity: 100,
      perUserMax: 5,
      options: [],
      detailImages: [],
      videos: [],
      startsAt: new Date(now - 4 * DAY).toISOString(),
      endsAt: new Date(now + 1 * DAY).toISOString(),
      shipBy: new Date(now + 8 * DAY).toISOString(),
      myRole: 'BRAND',
    },
  ];
  const orders = [
    ...seedOrders('gb-a1b2c3d4', 10, 19900, 3000, now),
    ...seedOrders('gb-1234abcd', 7, 16900, 0, now),
  ];
  return { groupBuys, orders, seq: 1 };
}

async function load() {
  if (db) {
    return db;
  }
  const raw = await prefGetSafe(KEY);
  try {
    db = raw ? JSON.parse(raw) : null;
  } catch (e) {
    db = null;
  }
  if (!db || !Array.isArray(db.groupBuys)) {
    db = seed();
    await save();
  }
  return db;
}

async function save() {
  await prefSetSafe(KEY, JSON.stringify(db));
}

// 테스트용 — 메모리·저장소 초기화
export async function reset(next = null) {
  db = next;
  if (next) {
    await save();
  } else {
    await prefSetSafe(KEY, '');
  }
}

const COUNTED = ['RESERVED', 'PAID', 'SHIPPED', 'PAYMENT_FAILED'];
const ordersOf = (code) => db.orders.filter((o) => o.groupBuyCode === code);

function view(gb) {
  const orders = ordersOf(gb.code);
  const counted = orders.filter((o) => COUNTED.includes(o.state) && o.state !== 'PAYMENT_FAILED');
  return {
    ...gb,
    reservedQuantity: counted.reduce((s, o) => s + o.quantity, 0),
    orderCount: counted.length,
    myOrders: orders.filter((o) => o.mine).map(orderView),
  };
}

function orderView(o) {
  const gb = db.groupBuys.find((g) => g.code === o.groupBuyCode);
  const { failCharge, mine, ...rest } = o;
  return { ...rest, groupBuyTitle: gb?.title || '', chargeAt: gb?.endsAt || null };
}

function find(code) {
  const gb = db.groupBuys.find((g) => g.code === code);
  if (!gb) {
    throw fail(404, 'not_found');
  }
  return gb;
}

// 시각에 따른 자동 전이: 시작 시각 → OPEN, 마감 시각 → 판정
function sweep(now = Date.now()) {
  let changed = false;
  for (const gb of db.groupBuys) {
    if (gb.state === 'SCHEDULED' && new Date(gb.startsAt).getTime() <= now) {
      gb.state = 'OPEN';
      changed = true;
    }
    if (gb.state === 'OPEN' && new Date(gb.endsAt).getTime() <= now) {
      judge(gb, now);
      changed = true;
    }
  }
  return changed;
}

// 마감 판정 — 예약 수량 ≥ 최소 수량이면 등록 카드로 결제, 아니면 결제 없이 무효
function judge(gb, now) {
  const orders = ordersOf(gb.code);
  for (const o of orders) {
    if (o.state === 'BILLING_PENDING') {
      o.state = 'CANCELLED';
    }
  }
  const reserved = orders.filter((o) => o.state === 'RESERVED');
  const qty = reserved.reduce((s, o) => s + o.quantity, 0);
  if (qty >= gb.minQuantity && qty > 0) {
    for (const o of reserved) {
      if (o.failCharge) {
        o.state = 'PAYMENT_FAILED';
        o.failureReason = 'EXCEED_MAX_AMOUNT';
      } else {
        o.state = 'PAID';
        o.paidAt = new Date(now).toISOString();
      }
    }
    gb.state = 'CONFIRMED';
  } else {
    for (const o of reserved) {
      o.state = 'VOIDED';
    }
    gb.state = 'FAILED';
  }
}

async function ready() {
  await load();
  if (sweep()) {
    await save();
  }
  return db;
}

// ── 구매자 ──
export async function listGroupBuys() {
  await ready();
  return {
    groupBuys: db.groupBuys.filter((g) => ['SCHEDULED', 'OPEN'].includes(g.state)).map(view),
  };
}

export async function getGroupBuy(code) {
  await ready();
  const gb = find(code);
  if (gb.state === 'PENDING_HOST' && gb.myRole === 'BUYER') {
    throw fail(404, 'not_found');
  }
  return { groupBuy: view(gb) };
}

export async function createOrder(code, body) {
  await ready();
  const gb = find(code);
  const now = Date.now();
  if (gb.state !== 'OPEN' || new Date(gb.startsAt).getTime() > now) {
    throw fail(409, 'closed');
  }
  const existing = db.orders.find((o) => o.requestId && o.requestId === body.requestId);
  if (existing) {
    return { order: orderView(existing), billingUrl: null, mock: true };
  }
  const v = view(gb);
  const mineActive = v.myOrders
    .filter((o) => ['BILLING_PENDING', 'RESERVED'].includes(o.state))
    .reduce((s, o) => s + o.quantity, 0);
  if (!(body.quantity >= 1) || body.quantity + mineActive > gb.perUserMax) {
    throw fail(422, 'per_user_max');
  }
  if (gb.maxQuantity && v.reservedQuantity + body.quantity > gb.maxQuantity) {
    throw fail(409, 'sold_out');
  }
  if (!body.agreeCharge || !body.agreeThirdParty) {
    throw fail(422, 'agree_required');
  }
  db.seq += 1;
  const order = {
    id: `${code}-me-${db.seq}`,
    requestId: body.requestId,
    groupBuyCode: code,
    mine: true,
    state: 'BILLING_PENDING',
    quantity: body.quantity,
    option: body.option,
    unitPrice: gb.price,
    shippingFee: gb.shippingFee,
    total: gb.price * body.quantity + gb.shippingFee,
    currency: gb.currency,
    recipient: body.recipient,
    createdAt: new Date(now).toISOString(),
  };
  db.orders.push(order);
  await save();
  return { order: orderView(order), billingUrl: null, mock: true };
}

export async function completeBilling(orderId) {
  await ready();
  const o = db.orders.find((x) => x.id === orderId && x.mine);
  if (!o) {
    throw fail(404, 'not_found');
  }
  if (o.state === 'BILLING_PENDING') {
    o.state = 'RESERVED';
    await save();
  }
  return { order: orderView(o) };
}

export async function cancelOrder(orderId) {
  await ready();
  const o = db.orders.find((x) => x.id === orderId && x.mine);
  if (!o) {
    throw fail(404, 'not_found');
  }
  const gb = find(o.groupBuyCode);
  if (gb.state !== 'OPEN' || !['BILLING_PENDING', 'RESERVED'].includes(o.state)) {
    throw fail(409, 'not_cancellable');
  }
  o.state = 'CANCELLED';
  await save();
  return { order: orderView(o) };
}

export async function myOrders() {
  await ready();
  return {
    orders: db.orders
      .filter((o) => o.mine)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .map(orderView),
  };
}

// ── 호스트 ──
export async function hosted() {
  await ready();
  return { groupBuys: db.groupBuys.filter((g) => g.myRole === 'HOST').map(view) };
}

function hostOnly(code) {
  const gb = find(code);
  if (gb.myRole !== 'HOST') {
    throw fail(403, 'forbidden');
  }
  return gb;
}

export async function respondHost(code, accept) {
  await ready();
  const gb = hostOnly(code);
  if (gb.state !== 'PENDING_HOST') {
    throw fail(409, 'already_decided');
  }
  gb.state = accept
    ? new Date(gb.startsAt).getTime() <= Date.now()
      ? 'OPEN'
      : 'SCHEDULED'
    : 'CANCELLED';
  await save();
  return { groupBuy: view(gb) };
}

export async function setHostNote(code, note) {
  await ready();
  const gb = hostOnly(code);
  gb.host = { ...gb.host, note };
  await save();
  return { groupBuy: view(gb) };
}

export async function attachVideo(code, video) {
  await ready();
  const gb = hostOnly(code);
  if (!gb.videos.some((v) => v.videoId === video.videoId)) {
    if (gb.videos.length >= 10) {
      throw fail(422, 'too_many_videos');
    }
    gb.videos.push(video);
    await save();
  }
  return { groupBuy: view(gb) };
}

export async function detachVideo(code, videoId) {
  await ready();
  const gb = hostOnly(code);
  gb.videos = gb.videos.filter((v) => v.videoId !== videoId);
  await save();
  return { groupBuy: view(gb) };
}

// ── 브랜드 ──
export async function brandList() {
  await ready();
  return { groupBuys: db.groupBuys.filter((g) => g.myRole === 'BRAND').map(view) };
}

function brandOnly(code) {
  const gb = find(code);
  if (gb.myRole !== 'BRAND') {
    throw fail(403, 'forbidden');
  }
  return gb;
}

export async function brandCreate(body) {
  await ready();
  const dup = db.groupBuys.find((g) => g.requestId && g.requestId === body.requestId);
  if (dup) {
    return { groupBuy: view(dup) };
  }
  db.seq += 1;
  const code = `gb-${(0x10000000 + ((Date.now() + db.seq * 7919) % 0xefffffff)).toString(16).slice(-8)}`;
  const gb = {
    requestId: body.requestId,
    code,
    title: body.title,
    state: 'PENDING_HOST',
    openedBy: 'BRAND',
    brand: { id: 'brand-mine', name: '내 브랜드(테스트)' },
    host: {
      id: `host-${body.hostHandle}`,
      handle: body.hostHandle,
      name: body.hostHandle,
      avatarUrl: null,
      note: '',
    },
    product: {
      id: body.productId,
      name: body.productName || body.title,
      imageUrl: null,
      description: '',
      listPrice: body.listPrice || 0,
    },
    country: body.country,
    currency: body.currency,
    price: body.price,
    shippingFee: body.shippingFee,
    minQuantity: body.minQuantity,
    maxQuantity: body.maxQuantity,
    perUserMax: body.perUserMax,
    options: body.options,
    detailImages: body.detailImages,
    videos: [],
    startsAt: body.startsAt,
    endsAt: body.endsAt,
    shipBy: body.shipBy,
    myRole: 'BRAND',
  };
  db.groupBuys.unshift(gb);
  await save();
  return { groupBuy: view(gb) };
}

export async function brandCancel(code) {
  await ready();
  const gb = brandOnly(code);
  if (!['PENDING_HOST', 'SCHEDULED', 'OPEN'].includes(gb.state)) {
    throw fail(409, 'not_cancellable');
  }
  gb.state = 'CANCELLED';
  for (const o of ordersOf(code)) {
    if (['BILLING_PENDING', 'RESERVED'].includes(o.state)) {
      o.state = 'VOIDED';
    }
  }
  await save();
  return { groupBuy: view(gb) };
}

const RELEASED = ['CONFIRMED', 'SHIPPING', 'DONE'];

export async function brandOrders(code) {
  await ready();
  const gb = brandOnly(code);
  const orders = ordersOf(code);
  const count = (states) => orders.filter((o) => states.includes(o.state)).length;
  const summary = {
    reserved: count(['RESERVED']),
    paid: count(['PAID', 'SHIPPED']),
    failed: count(['PAYMENT_FAILED']),
    shipped: count(['SHIPPED']),
  };
  if (!RELEASED.includes(gb.state)) {
    return { released: false, summary, orders: [] };
  }
  return {
    released: true,
    summary,
    orders: orders.filter((o) => ['PAID', 'SHIPPED'].includes(o.state)).map(orderView),
  };
}

export async function setShipment(orderId, { courier, trackingNumber }) {
  await ready();
  const o = db.orders.find((x) => x.id === orderId);
  if (!o) {
    throw fail(404, 'not_found');
  }
  const gb = brandOnly(o.groupBuyCode);
  if (!RELEASED.includes(gb.state) || !['PAID', 'SHIPPED'].includes(o.state)) {
    throw fail(409, 'not_shippable');
  }
  o.state = 'SHIPPED';
  o.shipment = { courier, trackingNumber, shippedAt: new Date().toISOString() };
  const paid = ordersOf(gb.code).filter((x) => ['PAID', 'SHIPPED'].includes(x.state));
  gb.state = paid.every((x) => x.state === 'SHIPPED') ? 'DONE' : 'SHIPPING';
  await save();
  return { order: orderView(o) };
}

export async function closeNow(code) {
  await ready();
  const gb = find(code);
  if (gb.state !== 'OPEN') {
    throw fail(409, 'not_open');
  }
  gb.endsAt = new Date().toISOString();
  judge(gb, Date.now());
  await save();
  return { groupBuy: view(gb) };
}
