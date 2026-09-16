// 기기에서 확인하지 못한 두 경로를 로직 수준에서 검증한다 (2026-09-16).
// - 리뷰어에게 질문 토글: 댓글 전송 본문에 isQuestion이 실려야 한다 (게스트 계정이라 화면 확인 불가)
// - 저장 목록에서 리뷰 열기: detailMode가 VideoPage 라우트로 넘어가야 전체 상세로 열린다
jest.mock('react-native-default-preference', () => ({ get: jest.fn(), set: jest.fn() }));
jest.mock('react-native-fs', () => ({}));
jest.mock('../Components/Constants', () => ({
  CUSTOM_FONTS: { SCDREAM: {}, SUIT: {} },
  COLOR_MAIN: '#000',
}));
jest.mock('../Components/Constants/Features', () => ({ COMMERCE: false }));
jest.mock('../Components/utils', () => ({
  __esModule: true,
  default: { getCurrentDeviceVersion: jest.fn() },
  getKRWPerUSD: jest.fn(),
  isGuestUser: () => false,
  moderateScale: (n) => n,
}));
jest.mock('../Components/utils/scailing', () => ({ moderateScale: (n) => n }));
jest.mock('@react-navigation/native', () => ({ useRoute: () => ({ params: {} }) }));
jest.mock('react-native-fast-image', () => 'FastImage');
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/Entypo', () => 'IconEntypo');
jest.mock('react-native-vector-icons/Feather', () => 'IconFeather');
jest.mock('../Components/CustomComponents/ReviewDescriptionSummary', () => 'Summary');
jest.mock('../screens/UserPageScreen/UserProfilePicView', () => 'ProfilePic');
jest.mock('../screens/VideoPageScreen/VideoHashTag', () => 'HashTag');
jest.mock('../Components/Views', () => ({ ReviewGradeBadgeView: 'Grade' }));
jest.mock('../Contexts', () => ({ Context: { Provider: 'Provider' } }));

import APIprovider from '../Components/APIprovider';
import VideoListItemView from '../Components/VideoListItemView';

describe('리뷰어에게 질문 토글', () => {
  let sent;

  beforeEach(() => {
    sent = [];
    APIprovider.request = jest.fn((url, method, params) => {
      sent.push({ url, method, params });
      return Promise.resolve({});
    });
  });

  test('토글을 켜면 댓글 본문에 isQuestion true가 실린다', async () => {
    await APIprovider.addNewVideoComment({
      comment: '이거 민감성 피부에도 괜찮나요?',
      videoId: 'v1',
      targetId: 'v1',
      isSecret: false,
      isQuestion: true,
    });

    expect(sent).toHaveLength(1);
    expect(sent[0].method).toBe('POST');
    expect(sent[0].url).toContain('/videos/v1/comments');
    expect(sent[0].params.isQuestion).toBe(true);
    expect(sent[0].params.comment).toBe('이거 민감성 피부에도 괜찮나요?');
  });

  test('토글을 끄면 일반 댓글로 나간다 (isQuestion false, 필드 누락 아님)', async () => {
    await APIprovider.addNewVideoComment({
      comment: '잘 봤어요',
      videoId: 'v2',
      targetId: 'v2',
      isSecret: false,
    });

    expect(sent[0].params.isQuestion).toBe(false);
    expect(sent[0].params.isSecret).toBe(false);
  });
});

describe('저장 목록에서 리뷰 열기', () => {
  function openFrom(props) {
    const navigation = { push: jest.fn() };
    const instance = new VideoListItemView({
      navigation,
      data: { _id: 'r1', videoId: 'r1' },
      onPress: () => true,
      ...props,
    });
    instance.onClicked();
    return navigation.push;
  }

  test('저장 탭에서 열면 detailMode로 전체 상세가 열린다', () => {
    const push = openFrom({ detailMode: true });

    expect(push).toHaveBeenCalledTimes(1);
    const [route, params] = push.mock.calls[0];
    expect(route).toBe('VideoPage');
    expect(params.detailMode).toBe(true);
    expect(params.videoId).toBe('r1');
  });

  test('일반 목록에서 열면 쇼츠 모드 그대로다', () => {
    const push = openFrom({});

    expect(push.mock.calls[0][1].detailMode).toBe(false);
  });
});
