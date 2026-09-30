// 공동구매 (2026-09-30) — 정규화·판정·검증·CSV·토스 복귀 URL·택배 추적·모의 서버 전 과정
jest.mock('../Components/Constants/Features', () => ({
  LIVE_OPS_API: true,
  GROUP_BUY: true,
  GROUP_BUY_MOCK: false,
}));
// 생성 파일(gitignore) — 없는 체크아웃에서도 돌도록 가상 모듈로
jest.mock(
  '../api/opsRuntimeConfig',
  () => ({ OPS_API_BASE: 'https://ops.test/api/mobile', OPS_APP_KEY: 'test-key' }),
  { virtual: true },
);

const mockOpsGet = jest.fn();
const mockOpsPost = jest.fn();
jest.mock('../api/opsClient', () => ({
  opsGet: (...args) => mockOpsGet(...args),
  opsPost: (...args) => mockOpsPost(...args),
}));

const mockStore = {};
jest.mock('../api/prefSafe', () => ({
  prefGetSafe: async (k) => (k in mockStore ? mockStore[k] : null),
  prefSetSafe: async (k, v) => {
    mockStore[k] = v;
  },
}));

// 같은 객체를 api/groupBuys.js가 읽는다 — 테스트마다 모의 서버 모드를 바꾼다
const mockFeatures = require('../Components/Constants/Features');
const fs = require('fs');
const path = require('path');

import * as api from '../api/groupBuys';
import * as mockServer from '../api/groupBuysMock';
import { couriersFor, isValidTrackingNumber, trackingUrl } from '../Components/utils/couriers';
import { externalAppTarget } from '../Components/utils/paymentSchemes';

const NOW = new Date('2026-10-01T03:00:00Z').getTime();
const H = 3600000;

const rawGb = (over = {}) => ({
  code: 'gb-a1b2c3d4',
  title: '수분 크림 공동구매',
  state: 'OPEN',
  brand: { id: 'b1', name: '브랜드' },
  host: { id: 'h1', handle: 'minji', avatarUrl: '/api/files/a.png' },
  product: { id: 'p1', name: '크림', listPrice: 28000, imageUrl: '/api/files/p.png' },
  country: 'KR',
  price: 19900,
  shippingFee: 3000,
  minQuantity: 30,
  maxQuantity: 100,
  perUserMax: 5,
  options: ['50ml', '80ml', ''],
  startsAt: new Date(NOW - 24 * H).toISOString(),
  endsAt: new Date(NOW + 24 * H).toISOString(),
  reservedQuantity: 12,
  myOrders: [{ id: 'o1', state: 'RESERVED', quantity: 2 }],
  ...over,
});

const goodOrder = (over = {}) => ({
  quantity: 1,
  option: '50ml',
  recipient: {
    name: '홍길동',
    phone: '010-1234-5678',
    postalCode: '06236',
    address1: '서울 강남구',
  },
  agreeCharge: true,
  agreeThirdParty: true,
  ...over,
});

beforeEach(() => {
  mockOpsGet.mockReset();
  mockOpsPost.mockReset();
  mockFeatures.GROUP_BUY_MOCK = false;
  for (const k of Object.keys(mockStore)) {
    delete mockStore[k];
  }
});

describe('정규화', () => {
  test('코드 형식이 아니면 버리고, 상대경로 이미지는 ops 절대 URL로', () => {
    expect(api.normalizeGroupBuy({ code: 'bad' })).toBeNull();
    expect(api.normalizeGroupBuy(null)).toBeNull();
    const gb = api.normalizeGroupBuy({ groupBuy: rawGb() });
    expect(gb.product.imageUrl).toBe('https://ops.test/api/files/p.png');
    expect(gb.host.avatarUrl).toBe('https://ops.test/api/files/a.png');
    expect(gb.currency).toBe('KRW');
    expect(gb.options).toEqual(['50ml', '80ml']);
    expect(gb.myOrders[0].state).toBe('RESERVED');
    expect(api.normalizeGroupBuy(rawGb({ country: 'JP' })).currency).toBe('JPY');
    expect(api.normalizeGroupBuy(rawGb({ state: 'WEIRD' })).state).toBe('OPEN');
  });

  test('주문은 모르는 상태를 카드 등록 전으로, 송장이 없으면 shipment null', () => {
    const o = api.normalizeOrder({ id: 5, state: 'NOPE', recipient: { name: 'A' } });
    expect(o.id).toBe('5');
    expect(o.state).toBe('BILLING_PENDING');
    expect(o.shipment).toBeNull();
    expect(
      api.normalizeOrder({ id: 1, shipment: { courier: 'CJ', trackingNumber: '123456789' } })
        .shipment.courier,
    ).toBe('CJ');
  });
});

describe('판정·계산', () => {
  const gb = api.normalizeGroupBuy(rawGb());

  test('OPEN·기간 안·물량 남음일 때만 주문', () => {
    expect(api.canOrder(gb, NOW)).toBe(true);
    expect(api.canOrder(gb, NOW + 25 * H)).toBe(false);
    expect(api.canOrder({ ...gb, startsAt: new Date(NOW + H).toISOString() }, NOW)).toBe(false);
    expect(api.canOrder({ ...gb, state: 'SCHEDULED' }, NOW)).toBe(false);
    expect(api.canOrder({ ...gb, reservedQuantity: 100 }, NOW)).toBe(false);
    expect(api.canOrder({ ...gb, maxQuantity: 0, reservedQuantity: 9999 }, NOW)).toBe(true);
  });

  test('진행률·할인율·합계·남은 시간', () => {
    expect(api.fillRatio(gb)).toBeCloseTo(0.4);
    expect(api.fillRatio({ ...gb, minQuantity: 0 })).toBeNull();
    expect(api.fillRatio({ ...gb, reservedQuantity: 90 })).toBe(1);
    expect(api.discountPercent(gb)).toBe(29);
    expect(api.discountPercent({ ...gb, price: 30000 })).toBe(0);
    expect(api.orderTotal(gb, 2)).toBe(19900 * 2 + 3000);
    expect(api.orderTotal(gb, 0)).toBe(0);
    expect(api.timeLeft(new Date(NOW + 26 * H + 5 * 60000).toISOString(), NOW)).toMatchObject({
      days: 1,
      hours: 2,
      minutes: 5,
    });
    expect(api.timeLeft(null)).toBeNull();
  });
});

describe('주문서 검증', () => {
  const gb = api.normalizeGroupBuy(rawGb());

  test('정상 주문은 통과', () => {
    expect(api.validateOrderDraft(gb, goodOrder(), NOW)).toBeNull();
  });

  test.each([
    [{ quantity: 0 }, 'quantity'],
    [{ quantity: 4 }, 'perUserMax'], // 이미 2개 예약 + 4 > 5
    [{ option: '100ml' }, 'option'],
    [{ recipient: { ...goodOrder().recipient, name: ' ' } }, 'name'],
    [{ recipient: { ...goodOrder().recipient, phone: '123' } }, 'phone'],
    [{ recipient: { ...goodOrder().recipient, postalCode: '1234' } }, 'postalCode'],
    [{ recipient: { ...goodOrder().recipient, address1: '' } }, 'address'],
    [{ agreeThirdParty: false }, 'agree'],
    [{ agreeCharge: false }, 'agree'],
  ])('%j → %s', (over, key) => {
    expect(api.validateOrderDraft(gb, goodOrder(over), NOW)).toBe(key);
  });

  test('마감·물량 부족', () => {
    expect(api.validateOrderDraft(gb, goodOrder(), NOW + 48 * H)).toBe('closed');
    const almost = { ...gb, reservedQuantity: 99, myOrders: [] };
    expect(api.validateOrderDraft(almost, goodOrder({ quantity: 2 }), NOW)).toBe('soldOut');
  });

  test('일본 우편번호는 7자리', () => {
    const jp = api.normalizeGroupBuy(rawGb({ country: 'JP', options: [] }));
    const r = { ...goodOrder().recipient, postalCode: '150-0001', phone: '090-1234-5678' };
    expect(api.validateOrderDraft(jp, goodOrder({ option: null, recipient: r }), NOW)).toBeNull();
    expect(api.validateOrderDraft(jp, goodOrder({ option: null }), NOW)).toBe('postalCode');
  });
});

describe('브랜드 개설 검증', () => {
  const good = {
    title: '공동구매',
    productId: 'p1',
    hostHandle: '@minji',
    country: 'KR',
    price: '19900',
    listPrice: 28000,
    minQuantity: '30',
    maxQuantity: '300',
    perUserMax: '5',
    startsAt: new Date(NOW).toISOString(),
    endsAt: new Date(NOW + 5 * 24 * H).toISOString(),
    detailImages: ['https://cdn.test/a.jpg'],
  };

  test('정상 통과', () => {
    expect(api.validateGroupBuyDraft(good, NOW)).toBeNull();
  });

  test.each([
    [{ title: '' }, 'title'],
    [{ productId: null }, 'product'],
    [{ hostHandle: '@' }, 'host'],
    [{ country: 'US' }, 'country'],
    [{ price: '0' }, 'price'],
    [{ price: '30000' }, 'priceAboveList'],
    [{ minQuantity: '1.5' }, 'quantity'],
    [{ minQuantity: '400' }, 'minAboveMax'],
    [{ perUserMax: '0' }, 'perUser'],
    [{ endsAt: new Date(NOW - H).toISOString() }, 'period'],
    [{ endsAt: new Date(NOW + 31 * 24 * H).toISOString() }, 'periodTooLong'],
    [{ detailImages: ['http://x/a.jpg'] }, 'detailImages'],
  ])('%j → %s', (over, key) => {
    expect(api.validateGroupBuyDraft({ ...good, ...over }, NOW)).toBe(key);
  });

  test('최대 0 = 제한 없음이면 최소가 커도 통과', () => {
    expect(
      api.validateGroupBuyDraft({ ...good, maxQuantity: '0', minQuantity: '999' }, NOW),
    ).toBeNull();
  });

  test('날짜 입력 파싱', () => {
    expect(api.parseDateTimeInput('2026-10-05 09:30')).toBe(
      new Date(2026, 9, 5, 9, 30).toISOString(),
    );
    expect(api.parseDateTimeInput('2026-10-05')).toBe(new Date(2026, 9, 5).toISOString());
    expect(api.parseDateTimeInput('2026-02-31 10:00')).toBeNull();
    expect(api.parseDateTimeInput('2026-10-05 25:00')).toBeNull();
    expect(api.parseDateTimeInput('어제')).toBeNull();
    expect(api.formatDateTimeInput(new Date(2026, 0, 2, 3, 4))).toBe('2026-01-02 03:04');
  });
});

describe('명단 CSV', () => {
  test('BOM, 쉼표·따옴표 이스케이프, 수식 주입 방지', () => {
    const orders = [
      api.normalizeOrder({
        id: 'o1',
        state: 'PAID',
        quantity: 2,
        total: 42800,
        currency: 'KRW',
        option: '50ml',
        recipient: {
          name: '=HYPERLINK("x")',
          phone: '010',
          postalCode: '06236',
          address1: '서울, 강남',
          address2: '"101"호',
        },
        shipment: { courier: 'CJ', trackingNumber: '123456789012' },
      }),
    ];
    const csv = api.ordersToCsv(orders);
    expect(csv.startsWith('﻿주문번호,받는 분')).toBe(true);
    const row = csv.split('\r\n')[1];
    expect(row).toContain(`"'=HYPERLINK(""x"")"`);
    expect(row).toContain('"서울, 강남 ""101""호"');
    expect(row).toContain('CJ,123456789012');
  });
});

describe('토스 빌링 웹뷰 URL', () => {
  test('시작 URL은 ops 공동구매 빌링 경로만', () => {
    expect(api.isBillingStartUrl('https://ops.test/portal/groupbuy-billing/o1?t=abc')).toBe(true);
    expect(api.isBillingStartUrl('https://evil.test/portal/groupbuy-billing/o1')).toBe(false);
    expect(api.isBillingStartUrl('https://ops.test/portal/store/x')).toBe(false);
  });

  test('복귀 URL에서 결과를 읽는다', () => {
    expect(
      api.billingResultFromUrl(
        'https://ops.test/portal/groupbuy-billing/done?result=success&orderId=o%201',
      ),
    ).toEqual({ ok: true, orderId: 'o 1', code: null });
    expect(
      api.billingResultFromUrl(
        'https://ops.test/portal/groupbuy-billing/done?result=fail&code=USER_CANCEL',
      ),
    ).toMatchObject({
      ok: false,
      code: 'USER_CANCEL',
    });
    expect(
      api.billingResultFromUrl('https://evil.test/portal/groupbuy-billing/done?result=success'),
    ).toBeNull();
    expect(api.billingResultFromUrl('https://ops.test/portal/groupbuy-billing/o1')).toBeNull();
  });

  test('카드사 앱 스킴은 웹뷰 밖으로, intent://는 스킴·스토어로 바꾼다', () => {
    expect(externalAppTarget('https://pay.toss.im/x')).toBeNull();
    expect(externalAppTarget('about:blank')).toBeNull();
    expect(externalAppTarget('ispmobile://TID=1')).toEqual({
      url: 'ispmobile://TID=1',
      fallback: null,
    });
    expect(
      externalAppTarget('intent://pay?x=1#Intent;scheme=kb-acp;package=com.kbcard.cxh.appcard;end'),
    ).toEqual({ url: 'kb-acp://pay?x=1', fallback: 'market://details?id=com.kbcard.cxh.appcard' });
  });
});

describe('택배 추적', () => {
  test('국가별 택배사 + 기타', () => {
    const kr = couriersFor('KR').map((c) => c.code);
    expect(kr).toContain('CJ');
    expect(kr).toContain('OTHER');
    expect(kr).not.toContain('YAMATO');
    expect(couriersFor('JP').map((c) => c.code)).toEqual([
      'YAMATO',
      'SAGAWA',
      'JAPANPOST',
      'OTHER',
    ]);
  });

  test('추적 URL', () => {
    expect(trackingUrl('CJ', '1234-5678-9012')).toMatch(/invc_no=123456789012$/);
    expect(trackingUrl('OTHER', '123456789')).toBeNull();
    expect(trackingUrl('CJ', '12')).toBeNull();
    expect(trackingUrl('NOPE', '123456789')).toBeNull();
    expect(isValidTrackingNumber('ab 1234 56')).toBe(true);
  });
});

describe('ops API 경로 (실서버 모드)', () => {
  test('구매자·호스트·브랜드 경로와 본문', async () => {
    mockOpsGet.mockResolvedValue({ groupBuys: [rawGb(), { code: 'nope' }] });
    expect(await api.listGroupBuys()).toHaveLength(1);
    expect(mockOpsGet).toHaveBeenLastCalledWith('/groupbuys?scope=live');

    mockOpsGet.mockResolvedValue({ groupBuy: rawGb() });
    expect((await api.getGroupBuy('gb-a1b2c3d4')).code).toBe('gb-a1b2c3d4');
    expect(await api.getGroupBuy('../etc')).toBeNull();

    mockOpsPost.mockResolvedValue({
      order: { id: 'o9', state: 'BILLING_PENDING' },
      billingUrl: 'https://ops.test/portal/groupbuy-billing/o9',
    });
    const res = await api.createGroupBuyOrder(
      'gb-a1b2c3d4',
      goodOrder({ recipient: { ...goodOrder().recipient, postalCode: '062-36 ' } }),
      'req-1',
    );
    expect(res.billingUrl).toContain('/portal/groupbuy-billing/o9');
    const [p, body] = mockOpsPost.mock.calls[0];
    expect(p).toBe('/groupbuys/gb-a1b2c3d4/orders');
    expect(body).toMatchObject({
      requestId: 'req-1',
      quantity: 1,
      agreeCharge: true,
      agreeThirdParty: true,
    });
    expect(body.recipient.postalCode).toBe('06236');

    mockOpsPost.mockResolvedValue({ ok: true });
    await api.setShipment('o9', 'CJ', '1234 5678-9012');
    expect(mockOpsPost).toHaveBeenLastCalledWith('/brand/groupbuy-orders/o9/shipment', {
      courier: 'CJ',
      trackingNumber: '123456789012',
    });
    await api.respondHostInvite('gb-a1b2c3d4', 1);
    expect(mockOpsPost).toHaveBeenLastCalledWith('/groupbuys/gb-a1b2c3d4/host', { accept: true });

    mockOpsGet.mockResolvedValue({ released: false, summary: { reserved: 3 } });
    const list = await api.listBrandGroupBuyOrders('gb-a1b2c3d4');
    expect(list).toEqual({
      released: false,
      summary: { reserved: 3, paid: 0, failed: 0, shipped: 0 },
      orders: [],
    });
  });

  test('모의 서버 전용 함수는 실서버 모드에서 막힌다', async () => {
    await expect(api.simulateClose('gb-a1b2c3d4')).rejects.toThrow('mock only');
    await expect(api.completeMockBilling('o1')).rejects.toThrow('mock only');
  });
});

describe('모의 서버 전 과정', () => {
  beforeEach(async () => {
    mockFeatures.GROUP_BUY_MOCK = true;
    await mockServer.reset(mockServer.seed(Date.now()));
  });

  test('주문 → 카드 등록 → 마감 성사 → 명단 공개 → 송장 → 배송 조회', async () => {
    const gb = await api.getGroupBuy('gb-1234abcd'); // 브랜드 소유, 최소 10, 시드 예약 있음
    expect(gb.myRole).toBe('BRAND');

    // 마감 전 명단은 잠겨 있다
    let orders = await api.listBrandGroupBuyOrders('gb-1234abcd');
    expect(orders.released).toBe(false);
    expect(orders.orders).toEqual([]);

    const { order } = await api.createGroupBuyOrder(
      'gb-1234abcd',
      goodOrder({ option: null, quantity: 2 }),
      'r1',
    );
    expect(order.state).toBe('BILLING_PENDING');
    // 같은 요청 번호로 다시 보내도 주문은 하나
    const again = await api.createGroupBuyOrder(
      'gb-1234abcd',
      goodOrder({ option: null, quantity: 2 }),
      'r1',
    );
    expect(again.order.id).toBe(order.id);
    await api.completeMockBilling(order.id);

    const closed = await api.simulateClose('gb-1234abcd');
    expect(closed.groupBuy.state).toBe('CONFIRMED');

    orders = await api.listBrandGroupBuyOrders('gb-1234abcd');
    expect(orders.released).toBe(true);
    expect(orders.summary.failed).toBe(1); // 시드 3번 주문은 한도 초과
    expect(orders.orders.every((o) => o.state === 'PAID')).toBe(true);
    const mine = orders.orders.find((o) => o.id === order.id);
    expect(mine.recipient.name).toBe('홍길동');

    for (const o of orders.orders) {
      await api.setShipment(o.id, 'CJ', '123456789012');
    }
    const after = await api.listBrandGroupBuys();
    expect(after.find((g) => g.code === 'gb-1234abcd').state).toBe('DONE');

    const my = await api.listMyGroupBuyOrders();
    expect(my[0].state).toBe('SHIPPED');
    expect(trackingUrl(my[0].shipment.courier, my[0].shipment.trackingNumber)).toContain(
      '123456789012',
    );
  });

  test('최소 수량 미달이면 결제 없이 무효', async () => {
    const gb = await api.getGroupBuy('gb-a1b2c3d4'); // 최소 30, 시드 예약 20개 남짓
    expect(gb.reservedQuantity).toBeLessThan(30);
    const { order } = await api.createGroupBuyOrder('gb-a1b2c3d4', goodOrder(), 'r2');
    await api.completeMockBilling(order.id);
    await mockServer.closeNow('gb-a1b2c3d4');
    const after = await api.getGroupBuy('gb-a1b2c3d4');
    expect(after.state).toBe('FAILED');
    expect(after.myOrders[0].state).toBe('VOIDED');
  });

  test('1인 최대 수량·마감 전 취소·호스트 수락', async () => {
    await expect(
      api.createGroupBuyOrder('gb-a1b2c3d4', goodOrder({ quantity: 6 }), 'r3'),
    ).rejects.toMatchObject({ body: { error: 'per_user_max' } });

    const { order } = await api.createGroupBuyOrder('gb-a1b2c3d4', goodOrder(), 'r4');
    await api.cancelGroupBuyOrder(order.id);
    expect((await api.listMyGroupBuyOrders())[0].state).toBe('CANCELLED');

    // 호스트 제안은 수락 전 구매자에게 안 보인다
    expect((await api.listGroupBuys()).map((g) => g.code)).not.toContain('gb-0f0e0d0c');
    const hosted = await api.listHostedGroupBuys();
    expect(hosted[0].state).toBe('PENDING_HOST');
    await api.respondHostInvite('gb-0f0e0d0c', true);
    await api.attachHostVideo('gb-0f0e0d0c', { videoId: 'v1', caption: '후기' });
    const live = await api.listGroupBuys();
    const jp = live.find((g) => g.code === 'gb-0f0e0d0c');
    expect(jp.state).toBe('SCHEDULED');
    expect(jp.videos[0].videoId).toBe('v1');
  });

  test('브랜드 개설 → 호스트 대기 → 취소', async () => {
    const created = await api.createBrandGroupBuy(
      {
        title: '새 공구',
        productId: 'sp-mock-1',
        productName: '테스트 상품',
        listPrice: 30000,
        hostHandle: '@yuna',
        country: 'JP',
        price: 2000,
        minQuantity: 0,
        maxQuantity: 0,
        perUserMax: 3,
        options: [],
        detailImages: [],
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 5 * 24 * H).toISOString(),
      },
      'c1',
    );
    expect(created.state).toBe('PENDING_HOST');
    expect(created.currency).toBe('JPY');
    expect(created.host.handle).toBe('yuna');
    await api.cancelBrandGroupBuy(created.code);
    const list = await api.listBrandGroupBuys();
    expect(list.find((g) => g.code === created.code).state).toBe('CANCELLED');
  });
});

describe('배선 계약', () => {
  const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

  test('라우트 등록과 진입점', () => {
    const nav = read('navigation/stacks/MainDrawerNavigator.js');
    for (const name of [
      'GroupBuy',
      'GroupBuyOrder',
      'GroupBuyBilling',
      'MyGroupBuys',
      'HostGroupBuy',
      'BrandGroupBuys',
      'BrandGroupBuyCreate',
      'BrandGroupBuyOrders',
    ]) {
      expect(nav).toContain(`name="${name}"`);
    }
    expect(read('screens/HomeScreen/CuratedHome.js')).toContain('<GroupBuyRail');
    expect(read('screens/MyScreen/index.js')).toContain("navigate('MyGroupBuys')");
    expect(read('screens/BrandScreen/BrandMy.js')).toContain("navigate('BrandGroupBuys')");
  });

  test('릴리스 검사가 모의 서버 플래그를 지킨다', () => {
    expect(read('scripts/verify-release.js')).toContain('GROUP_BUY_MOCK');
  });
});
