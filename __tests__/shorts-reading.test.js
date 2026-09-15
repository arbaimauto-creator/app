import React from 'react';
import renderer, { act } from 'react-test-renderer';
import RenderSlide from '../screens/VideoPageScreen/RenderSlide';
import VideoOverlay from '../screens/VideoPageScreen/VideoOverlay';
import Strings from '../Components/Strings';

jest.mock('@react-navigation/native', () => ({ useIsFocused: () => true }));
jest.mock('../Components/VideoPlayerView', () => 'Video');
jest.mock('../screens/VideoPageScreen/SliderImage', () => 'SliderImage');
jest.mock('react-native-fast-image', () => 'FastImage');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('../Components/APIprovider', () => ({}));
jest.mock('../Components/Constants', () => ({ CUSTOM_FONTS: { SCDREAM: {}, SUIT: {} } }));
jest.mock('../Components/Constants/Features', () => ({}));
jest.mock('../Components/CustomComponents/VideoLikeButton', () => 'Like');
jest.mock('../Components/utils', () => ({
  __esModule: true,
  default: {},
  isGuestUser: () => false,
}));
jest.mock('../Components/Views', () => ({ ReviewGradeBadgeView: 'Grade' }));
jest.mock('../screens/UserPageScreen/UserProfilePicView', () => 'Profile');

function makeContext() {
  return {
    state: {
      video: { author: { name: 'reviewer' }, description: 'A review to read.' },
      paused: false,
    },
    props: { route: { params: { isFocused: true } }, navigation: { push: jest.fn() } },
    openDetails: jest.fn(),
    onFullScreen: jest.fn(),
    isVideoPortrait: () => true,
    getPlayerStyle: () => ({}),
  };
}

test('review stays available after legacy visibility updates and opens only on request', () => {
  const context = makeContext();
  let tree;
  act(() => {
    tree = renderer.create(<VideoOverlay context={context} />);
  });
  context.state.isShowingVideoInfo = false;
  act(() => {
    tree.update(<VideoOverlay context={context} />);
  });
  expect(JSON.stringify(tree.toJSON())).toContain('A review to read.');
  expect(context.openDetails).not.toHaveBeenCalled();
  const button = tree.root.findAll(
    (node) =>
      node.props.accessibilityLabel === Strings.SHORTS_READ_REVIEW &&
      typeof node.props.onPress === 'function',
  )[0];
  act(() => {
    button.props.onPress();
  });
  expect(context.openDetails).toHaveBeenCalledTimes(1);
  act(() => tree.unmount());
});

test.each([false, true])('closing the reading sheet restores paused=%s', (paused) => {
  const context = makeContext();
  context.state.paused = paused;
  const item = { type: 'video', url: 'https://example.com/review.mp4' };
  let tree;
  act(() => {
    tree = renderer.create(<RenderSlide context={context} item={item} index={0} />);
  });
  expect(tree.root.findByType('Video').props.paused).toBe(paused);
  context.state.isDetailsOpen = true;
  act(() => {
    tree.update(<RenderSlide context={context} item={item} index={0} />);
  });
  expect(tree.root.findByType('Video').props.paused).toBe(true);
  context.state.isDetailsOpen = false;
  act(() => {
    tree.update(<RenderSlide context={context} item={item} index={0} />);
  });
  expect(tree.root.findByType('Video').props.paused).toBe(paused);
  act(() => tree.unmount());
});
