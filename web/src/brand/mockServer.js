// 브랜드 파트너센터 모의 서버 — VITE_OPS_API_BASE가 없을 때만 쓴다(화면 확인·시연).
// 응답 모양은 ops 계약(docs/groupbuy-dev-spec-2026-09-30.md §4-6)과 같게 맞춘다.
// 데이터는 이 브라우저의 localStorage에만 있고, 이름·연락처·주소는 전부 지어낸 예시 값이다.

const KEY = 'gd-brand-mock-v2'; // v2: 월 정산
const DAY = 86400000;
const wait = (ms = 160) => new Promise((r) => setTimeout(r, ms));
const clone = (v) => JSON.parse(JSON.stringify(v));

const NAMES = ['김서연', '이지우', '박하은', '최민준', '정수아', '강도윤', '조예린', '윤서준', '장지아', '임하준', '한유나', '오시우', '서지민', '신예준', '권나은', '황주원'];
const AREAS = [
  ['04050', '서울 마포구 예시로 12'],
  ['13529', '경기 성남시 분당구 예시길 7'],
  ['48058', '부산 해운대구 예시대로 101'],
  ['05551', '서울 송파구 예시로 300'],
  ['21984', '인천 연수구 예시로 55'],
  ['42110', '대구 수성구 예시로 8'],
];
const MEMOS = ['', '문 앞에 놓아주세요', '', '경비실에 맡겨주세요', ''];

function seedOrders(code, count, opts, price, fee, shippedCount, paidAt) {
  const orders = [];
  for (let i = 0; i < count; i++) {
    const [postalCode, address1] = AREAS[i % AREAS.length];
    const quantity = (i % 5 === 0 ? 2 : 1) + (i % 11 === 0 ? 1 : 0);
    const shipped = i < shippedCount;
    orders.push({
      id: `${code}-${String(i + 1).padStart(4, '0')}`,
      state: shipped ? 'SHIPPED' : 'PAID',
      quantity,
      option: opts[i % opts.length],
      unitPrice: price,
      shippingFee: fee,
      total: price * quantity + fee,
      currency: 'KRW',
      recipient: {
        name: NAMES[i % NAMES.length],
        phone: `010-0000-${String(1000 + i * 37).slice(-4)}`,
        postalCode,
        address1,
        address2: `${100 + (i % 9)}동 ${200 + i}호`,
        memo: MEMOS[i % MEMOS.length],
      },
      shipment: shipped
        ? { courier: 'CJ', trackingNumber: String(688120459780 + i * 313), shippedAt: new Date(paidAt + DAY).toISOString() }
        : null,
      paidAt: new Date(paidAt + i * 60000).toISOString(),
    });
  }
  return orders;
}

export function seed(now = Date.now()) {
  const iso = (d) => new Date(now + d * DAY).toISOString();
  const gb = (code, o) => ({
    code,
    openedBy: 'ARBAIM',
    brand: { id: 'brand-sample', name: '예시 브랜드' },
    country: 'KR',
    currency: 'KRW',
    shippingFee: 3000,
    perUserMax: 5,
    ...o,
  });
  const groupBuys = [
    gb('gb-1a2b3c01', {
      title: '비타 C 브라이트 앰플 30ml 공동구매',
      state: 'OPEN',
      host: { handle: 'minji.skin', name: '민지' },
      product: { name: '비타 C 브라이트 앰플 30ml', listPrice: 32000 },
      price: 19800,
      minQuantity: 300,
      maxQuantity: 5000,
      options: ['1개', '2개 세트'],
      startsAt: iso(-8),
      endsAt: iso(6),
      shipBy: iso(10),
      reservedQuantity: 3640,
      orderCount: 2710,
    }),
    gb('gb-1a2b3c02', {
      title: '히알루론 수분 크림 50ml 공동구매',
      state: 'SHIPPING',
      host: { handle: 'daily.hana', name: '하나' },
      product: { name: '히알루론 수분 크림 50ml', listPrice: 28000 },
      price: 15900,
      minQuantity: 100,
      maxQuantity: 600,
      options: ['기본 1개', '2개 세트', '3개 세트 + 미니'],
      startsAt: iso(-10),
      endsAt: iso(-3),
      shipBy: iso(2),
      reservedQuantity: 0,
      orderCount: 0,
    }),
    gb('gb-1a2b3c03', {
      title: '펩타이드 아이세럼 15ml 테스트 공동구매',
      state: 'PENDING_HOST',
      openedBy: 'BRAND',
      host: { handle: 'jp.beauty.rin', name: 'Rin' },
      product: { name: '펩타이드 아이세럼 15ml', listPrice: 36000 },
      country: 'JP',
      currency: 'JPY',
      price: 2980,
      shippingFee: 0,
      minQuantity: 50,
      maxQuantity: 800,
      options: [],
      startsAt: iso(4),
      endsAt: iso(14),
      shipBy: iso(20),
      reservedQuantity: 0,
      orderCount: 0,
    }),
    gb('gb-1a2b3c04', {
      title: '시카 진정 마스크팩 10매 공동구매',
      state: 'DONE',
      host: { handle: 'skin.log.yu', name: '유' },
      product: { name: '시카 진정 마스크팩 10매', listPrice: 15000 },
      price: 8900,
      minQuantity: 200,
      maxQuantity: 0,
      options: ['10매', '20매'],
      startsAt: iso(-40),
      endsAt: iso(-26),
      shipBy: iso(-22),
      reservedQuantity: 0,
      orderCount: 0,
    }),
    gb('gb-1a2b3c05', {
      title: '선 크림 SPF50 50ml 공동구매',
      state: 'FAILED',
      host: { handle: 'sun.daily', name: '선데일리' },
      product: { name: '선 크림 SPF50 50ml', listPrice: 24000 },
      price: 13900,
      minQuantity: 300,
      maxQuantity: 1000,
      options: [],
      startsAt: iso(-20),
      endsAt: iso(-13),
      shipBy: null,
      reservedQuantity: 212,
      orderCount: 190,
    }),
  ];
  const orders = {
    'gb-1a2b3c02': seedOrders('gb-1a2b3c02', 24, groupBuys[1].options, 15900, 3000, 9, now - 3 * DAY + 3600000),
    'gb-1a2b3c04': seedOrders('gb-1a2b3c04', 18, groupBuys[3].options, 8900, 3000, 18, now - 26 * DAY + 3600000),
  };
  const failed = { 'gb-1a2b3c02': 2, 'gb-1a2b3c04': 1 };
  for (const g of groupBuys) {
    const list = orders[g.code];
    if (list) {
      g.reservedQuantity = list.reduce((a, o) => a + o.quantity, 0);
      g.orderCount = list.length;
    }
  }

  // 월 정산 — 한 달(1일~말일) 결제 완료분을 다음 달 10일에 지급(예시). 이번 달은 집계 중(지급 예정).
  // 지급일·차감률은 계약 전 예시 값.
  const cur = new Date(now);
  const grossByMonth = [352800000, 368400000, 347400000, 397800000, 423000000, 376200000]; // 마지막 = 이번 달(진행 중)
  const settlements = grossByMonth.map((gross, i) => {
    const back = grossByMonth.length - 1 - i;
    const start = new Date(cur.getFullYear(), cur.getMonth() - back, 1);
    const end = new Date(cur.getFullYear(), cur.getMonth() - back + 1, 0, 23, 59);
    const payout = new Date(cur.getFullYear(), cur.getMonth() - back + 1, 10);
    const refunds = Math.round((gross * (0.006 + (i % 3) * 0.003)) / 1000) * 1000;
    const hostIncentive = Math.round(((gross - refunds) * 0.06) / 1000) * 1000;
    const fees = Math.round(((gross - refunds) * 0.04) / 1000) * 1000;
    const shipping = Math.round((gross * 0.0095) / 1000) * 1000;
    const vita = Math.round((gross * 0.62) / 100) * 100;
    return {
      id: `stl-${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      payoutDate: payout.toISOString(),
      // 지급일 당일까지는 '지급 예정' — 지급 처리는 그날 영업시간 중
      state: payout.getTime() + DAY <= now ? 'PAID' : 'PLANNED',
      gross,
      refunds,
      hostIncentive,
      fees,
      shipping,
      payout: gross - refunds - hostIncentive - fees - shipping,
      currency: 'KRW',
      lines: [
        { code: 'gb-1a2b3c01', title: '비타 C 브라이트 앰플 30ml', amount: vita },
        { code: 'gb-1a2b3c02', title: '히알루론 수분 크림 50ml', amount: gross - vita },
      ],
    };
  });

  const productRequests = [
    { id: 'pr-0001', name: '비타 앰플 리필 30ml', spec: '30ml', quantity: 2000, expiresOn: '2027-02-28', supplyPrice: 8200, goal: 'CLEARANCE', state: 'NEGOTIATING', note: '제안 공급가 7,600원 — 회신 필요', createdAt: new Date(now - 4 * DAY).toISOString() },
    { id: 'pr-0002', name: '수분 크림 미니 15ml', spec: '15ml', quantity: 6000, expiresOn: '2026-11-30', supplyPrice: 2400, goal: 'CLEARANCE', state: 'REVIEW', note: '', createdAt: new Date(now - 1 * DAY).toISOString() },
  ];

  return { groupBuys, orders, failed, settlements, productRequests };
}

let db = null;
function load() {
  if (db) {
    return db;
  }
  try {
    const raw = localStorage.getItem(KEY);
    db = raw ? JSON.parse(raw) : seed();
  } catch (e) {
    db = seed();
  }
  return db;
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch (e) {
    // 저장이 막힌 브라우저 — 메모리에서만 유지
  }
}
function fail(status, error) {
  const e = new Error(error);
  e.status = status;
  e.code = error;
  throw e;
}

export async function reset() {
  db = seed();
  save();
  await wait();
}

export async function brandList() {
  await wait();
  return { groupBuys: clone(load().groupBuys) };
}

export async function brandCancel(code) {
  await wait();
  const g = load().groupBuys.find((x) => x.code === code);
  if (!g) {
    fail(404, 'not_found');
  }
  if (!['PENDING_HOST', 'SCHEDULED', 'OPEN'].includes(g.state)) {
    fail(409, 'not_cancellable');
  }
  g.state = 'CANCELLED';
  save();
  return { groupBuy: clone(g) };
}

export async function brandOrders(code) {
  await wait();
  const d = load();
  const g = d.groupBuys.find((x) => x.code === code);
  if (!g) {
    fail(404, 'not_found');
  }
  const list = d.orders[code] || [];
  const released = ['CONFIRMED', 'SHIPPING', 'DONE'].includes(g.state);
  return {
    released,
    summary: {
      reserved: released ? 0 : g.orderCount,
      paid: list.length,
      failed: d.failed[code] || 0,
      shipped: list.filter((o) => o.state === 'SHIPPED').length,
    },
    orders: released ? clone(list) : [],
  };
}

export async function setShipment(orderId, { courier, trackingNumber }) {
  await wait(90);
  const d = load();
  const code = orderId.slice(0, 11);
  const g = d.groupBuys.find((x) => x.code === code);
  const o = (d.orders[code] || []).find((x) => x.id === orderId);
  if (!g || !o) {
    fail(404, 'not_found');
  }
  if (!['CONFIRMED', 'SHIPPING', 'DONE'].includes(g.state)) {
    fail(409, 'not_released');
  }
  if (!courier || (courier !== 'OTHER' && !/^[0-9A-Z]{6,30}$/.test(trackingNumber))) {
    fail(422, 'invalid_tracking');
  }
  o.state = 'SHIPPED';
  o.shipment = { courier, trackingNumber, shippedAt: o.shipment?.shippedAt || new Date().toISOString() };
  g.state = d.orders[code].every((x) => x.state === 'SHIPPED') ? 'DONE' : 'SHIPPING';
  save();
  return { order: clone(o) };
}

export async function settlements() {
  await wait();
  return { settlements: clone(load().settlements) };
}

export async function productRequests() {
  await wait();
  return { requests: clone(load().productRequests) };
}

export async function createProductRequests(items) {
  await wait();
  const d = load();
  const created = items.map((it, i) => ({
    ...it,
    id: `pr-${Date.now().toString(36)}-${i}`,
    state: 'REVIEW',
    note: '',
    createdAt: new Date().toISOString(),
  }));
  d.productRequests = [...created, ...d.productRequests];
  save();
  return { requests: clone(created) };
}
