// 공동구매 화면 스모크 (2026-09-30) — 모의 서버 모드에서 각 화면이 오류 없이 그려지고 핵심 문구가 보이는지
jest.mock('../Components/Constants/Features', () => ({
  LIVE_OPS_API: true,
  GROUP_BUY: true,
  GROUP_BUY_MOCK: true,
}));
jest.mock(
  '../api/opsRuntimeConfig',
  () => ({ OPS_API_BASE: 'https://ops.test/api/mobile', OPS_APP_KEY: 'test-key' }),
  { virtual: true },
);
jest.mock('../api/opsClient', () => ({
  opsGet: jest.fn(() => Promise.reject(new Error('offline'))),
  opsPost: jest.fn(() => Promise.reject(new Error('offline'))),
}));
const mockStore = {};
jest.mock('../api/prefSafe', () => ({
  prefGetSafe: async (k) => (k in mockStore ? mockStore[k] : null),
  prefSetSafe: async (k, v) => {
    mockStore[k] = v;
  },
}));
jest.mock('../api/experiments', () => ({ trackEvent: jest.fn() }));
jest.mock('../api/address', () => ({ getSavedAddress: async () => null }));
jest.mock('../Components/utils/tracking', () => ({ rememberTrackingCode: async () => {} }));
jest.mock('../Components/APIprovider', () => ({
  __esModule: true,
  default: { getUserUploadVideoList: async () => ({ videoList: [] }) },
}));
jest.mock('../Components/Strings', () => ({ getLanguage: () => 'ko' }));
jest.mock('react-native-fast-image', () => {
  const { View } = require('react-native');
  return (props) => <View {...props} />;
});
jest.mock('react-native-fs', () => ({ CachesDirectoryPath: '/tmp', writeFile: jest.fn() }));
jest.mock('react-native-share', () => ({ open: jest.fn() }));
jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('@react-navigation/native', () => {
  const { useEffect } = require('react');
  return { useFocusEffect: (cb) => useEffect(cb, [cb]) };
});
jest.mock('../Components/UI', () => {
  const { Text, TouchableOpacity, View } = require('react-native');
  const Box = ({ children, style }) => <View style={style}>{children}</View>;
  return {
    Card: Box,
    GlowCard: Box,
    GlassOrbs: () => null,
    NoteBox: ({ text, children }) => (children ? <View>{children}</View> : <Text>{text}</Text>),
    Badge: ({ text }) => <Text>{text}</Text>,
    ProgressBar: () => null,
    Chips: ({ items, onSelect }) => (
      <View>
        {items.map((it) => (
          <TouchableOpacity key={it.key} onPress={() => onSelect(it.key)}>
            <Text>{it.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    ),
    Btn: ({ title, onPress, disabled }) => (
      <TouchableOpacity onPress={onPress} disabled={disabled} accessibilityLabel={title}>
        <Text>{title}</Text>
      </TouchableOpacity>
    ),
  };
});
jest.mock('../api/store', () => ({
  listStores: async () => ({ stores: [] }),
  sellerProducts: async () => ({ products: [] }),
}));
jest.mock('../screens/StoreScreen/strings', () => ({ productName: (p) => p.nameKo }));

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import * as mockServer from '../api/groupBuysMock';
import {
  BrandGroupBuyCreateScreen,
  BrandGroupBuyOrdersScreen,
  BrandGroupBuysScreen,
  GroupBuyDetailScreen,
  GroupBuyOrderScreen,
  HostGroupBuyScreen,
  MyGroupBuysScreen,
} from '../screens/GroupBuyScreen';

const navigation = { navigate: jest.fn(), goBack: jest.fn(), setParams: jest.fn() };

async function render(Screen, params = {}) {
  let tree;
  await act(async () => {
    tree = renderer.create(<Screen navigation={navigation} route={{ params }} />);
  });
  // 비동기 로드가 끝날 때까지 몇 번 더 흘려보낸다
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
  return tree;
}

const texts = (tree) =>
  tree.root
    .findAll((n) => typeof n.type === 'string' && n.type === 'Text')
    .flatMap((n) => n.props.children)
    .flat(Infinity)
    .filter((x) => typeof x === 'string' || typeof x === 'number')
    .join(' ');

beforeEach(async () => {
  jest.useRealTimers();
  for (const k of Object.keys(mockStore)) {
    delete mockStore[k];
  }
  await mockServer.reset(mockServer.seed(Date.now()));
  navigation.navigate.mockClear();
});

test('상세: 가격·호스트·참여 버튼', async () => {
  const tree = await render(GroupBuyDetailScreen, { code: 'gb-a1b2c3d4' });
  const t = texts(tree);
  expect(t).toContain('민지의 수분 크림 공동구매');
  expect(t).toContain('@');
  expect(t).toContain('minji.skin');
  expect(t).toContain('19,900원');
  expect(t).toContain('29% 할인');
  // v2: 갤러리·실시간 마감·목표·참여자·고정 탭·구매 안내
  expect(tree.root.findAllByProps({ accessibilityLabel: '1/4' }).length).toBeGreaterThan(0);
  expect(t).toContain('마감까지');
  expect(t).toContain('목표까지 11개 남았어요');
  expect(t).toContain('10명 참여 중');
  expect(t).toContain('구매 안내');
  expect(t).toContain('자주 묻는 질문');
  // 참여하기 → 옵션 시트 → 주문서(고른 옵션·수량을 넘긴다)
  const join = tree.root.findByProps({ accessibilityLabel: '공동구매 참여하기' });
  await act(async () => join.props.onPress());
  expect(navigation.navigate).not.toHaveBeenCalled();
  expect(texts(tree)).toContain('옵션 선택');
  const toOrder = tree.root.findByProps({ accessibilityLabel: '주문서 작성' });
  await act(async () => toOrder.props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('GroupBuyOrder', {
    code: 'gb-a1b2c3d4',
    option: '50ml',
    quantity: 1,
  });
  tree.unmount();
});

test('주문서: 옵션 시트에서 고른 옵션·수량으로 시작한다', async () => {
  const tree = await render(GroupBuyOrderScreen, {
    code: 'gb-a1b2c3d4',
    option: '80ml',
    quantity: 2,
  });
  // 19,900 × 2 + 배송비 3,000
  expect(texts(tree)).toContain('42,800원');
  tree.unmount();
});

test('상세: 없는 코드는 안내', async () => {
  const tree = await render(GroupBuyDetailScreen, { code: 'gb-ffffffff' });
  expect(texts(tree)).toContain('공동구매를 찾을 수 없어요');
  tree.unmount();
});

test('주문서: 동의 전에는 제출 버튼이 막혀 있다', async () => {
  const tree = await render(GroupBuyOrderScreen, { code: 'gb-a1b2c3d4' });
  const t = texts(tree);
  expect(t).toContain('결제 예정 금액');
  expect(t).toContain('22,900원'); // 19,900 + 배송비 3,000
  const submit = tree.root.findByProps({
    accessibilityLabel: '(테스트) 카드 등록 건너뛰고 참여하기',
  });
  expect(submit.props.disabled).toBe(true);
  tree.unmount();
});

test('내 공동구매·호스트·브랜드 화면이 그려진다', async () => {
  let tree = await render(MyGroupBuysScreen, { tab: 'hosting' });
  expect(texts(tree)).toContain('선크림 일본 공동구매');
  tree.unmount();

  tree = await render(HostGroupBuyScreen, { code: 'gb-0f0e0d0c' });
  expect(texts(tree)).toContain('수락하기');
  tree.unmount();

  tree = await render(BrandGroupBuysScreen);
  expect(texts(tree)).toContain('클렌징 오일 공동구매');
  tree.unmount();

  tree = await render(BrandGroupBuyCreateScreen);
  expect(texts(tree)).toContain('테스트 상품 (모의)');
  tree.unmount();
});

test('브랜드 명단: 마감 전 잠김 → 마감 처리 → 명단·송장 입력', async () => {
  let tree = await render(BrandGroupBuyOrdersScreen, { code: 'gb-1234abcd' });
  expect(texts(tree)).toContain('명단이 공개돼요');
  const close = tree.root.findByProps({ accessibilityLabel: '(테스트) 지금 마감 처리' });
  await act(async () => close.props.onPress());
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
  const t = texts(tree);
  expect(t).toContain('이테스트1');
  expect(t).toContain('명단 내보내기 (CSV)');
  expect(t).toContain('CJ대한통운');
  tree.unmount();
});
