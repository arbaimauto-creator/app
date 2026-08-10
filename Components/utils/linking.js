import dynamicLinks from '@react-native-firebase/dynamic-links';
import { Alert, Linking } from 'react-native';
import Preference from 'react-native-default-preference';
import { store } from '../../redux/store';
import { setGuest } from '../../slices/user';
import APIprovider from '../APIprovider';
import { loginWithGuest } from '../../screens/SignInScreen/commonHelperFunction';
import Strings from '../Strings';

const config = {
  screens: {
    Main: {
      initialRouteName: 'MainBottom',
      screens: {
        ProductPage: 'products/:productId',
        VideoPage: 'videos/:videoId',
        // VideoPage: 'comments/:videoId',
        UserPage: 'users/:pageOwnerUserId',
        OrderList: 'orders',
        MyOrderList: 'myorders',
        Notification: 'notifications',
        // 이 부분 링킹으로 들어갈 때, 반복해서 타게되는 이슈 있음, 디버깅 필요.
        MainBottom: {
          screens: {
            Profile: 'mypage/:pageOwnerUserId',
          },
        },
        // QNAChat: 'users/:pageOwnerUserId/qna/:qnaId',
        QNAChat: 'qnas/:qnaId',
        NoticeList: 'events',
      },
    },
  },
};

// 다이나믹 링크 url이 greyd:// 스킴이 아니라 https://greyd.app/... 형태로 오는 경우가 일반적이라
// 두 형태 모두에서 경로를 추출한다. 추출 실패 시 null (기존 코드는 undefined.startsWith로 크래시했음)
const extractDeepLinkPath = (url) => {
  if (!url) {
    return null;
  }
  if (url.includes('greyd://')) {
    return url.split('greyd://')[1];
  }
  const match = url.match(/^https?:\/\/greyd\.app\/(.+)$/);
  return match ? match[1] : null;
};

// 딥링크 경로 화이트리스트 (보안 감사 M2) — config에 정의된 라우트 프리픽스만 수용.
// 커스텀 스킴(greyd://)은 타 앱이 임의 발신 가능하므로 미등록 경로는 버린다.
// 기능 다이어트: 커머스 경로(products/orders/myorders)는 COMMERCE 플래그 복원 시 함께 되살린다
const ALLOWED_LINK_PREFIXES = ['videos/', 'users/', 'notifications', 'mypage/', 'qnas/', 'events'];
const isAllowedLinkPath = (path) =>
  typeof path === 'string' && ALLOWED_LINK_PREFIXES.some((prefix) => path.startsWith(prefix));

const linking = {
  prefixes: ['https://greyd.app', 'greyd://'],
  config,
  async getInitialURL() {
    // Check if the app was opened by a deep link
    const url = await Linking.getInitialURL();
    const dynamicLink = await dynamicLinks().getInitialLink();

    console.log('deeplink getInitialURL', url, dynamicLink);

    if (dynamicLink) {
      const dynamicLinkParams = extractDeepLinkPath(dynamicLink.url);
      if (!dynamicLinkParams || !isAllowedLinkPath(dynamicLinkParams)) {
        return 'mylinker://home';
      }

      /* 다이나믹 링크를 통해 들어왔을대 로그인 되도록 로직추가 */
      const {
        user: { isGuest },
      } = store.getState();

      if (
        isGuest &&
        (dynamicLinkParams.startsWith('users') || dynamicLinkParams.startsWith('qnas'))
      ) {
        return Alert.alert(Strings.LOGIN_REQUIRED_TITLE, Strings.LOGIN_REQUIRED_TO_VIEW_PAGE);
      }

      const myUserId = await Preference.get('userId');
      const myUserName = await Preference.get('userName');
      const originalRequesterToken = await Preference.get('userAccessToken');

      if (!myUserId || !myUserName || !originalRequesterToken) {
        await loginWithGuest();
        // return Alert.alert(
        //   '로그인 필요',
        //   '해당 페이지는 게스트모드 혹은 로그인 상태에서 확인 가능합니다.',
        // );
      }

      if (
        (myUserId === '640a908e092ea7d56d4a41d5' && myUserName === 'guest_arbaim') ||
        (myUserId === '63a126963389e30449162c3b' && myUserName === 'greyd.guest')
      ) {
        store.dispatch(setGuest({ isGuest: true }));
      }

      if (originalRequesterToken) {
        APIprovider.setRequester(originalRequesterToken, myUserId);
      }
      /* 다이나믹 링크를 통해 들어왔을대 로그인 되도록 로직추가 */

      return 'greyd://' + dynamicLinkParams;
    }

    if (url) {
      // 직접 스킴 진입도 동일 화이트리스트 적용
      const path = extractDeepLinkPath(url);
      return path && isAllowedLinkPath(path) ? url : 'mylinker://home';
    }
    // If it was not opened by a deep link, go to the home screen
    return 'mylinker://home';
  },
  // Custom function to subscribe to incoming links
  subscribe(listener) {
    // First, you may want to do the default deep link handling
    const onReceiveURL = ({ url }) => listener(url);

    // Listen to incoming links from deep linking
    // Linking.addEventListener('url', onReceiveURL);
    // ✅ addEventListener가 반환하는 subscription 저장
    const linkingSubscription = Linking.addEventListener('url', onReceiveURL);

    const handleDynamicLink = async (dynamicLink) => {
      console.log('handleDynamicLinkhandleDynamicLinkhandleDynamicLink', dynamicLink);

      // const dynamicLinkParams = dynamicLink.url.split('?')[1];
      // const pathArray = dynamicLinkParams.split('&').map(qs => qs.split('=')[1]);

      // const url = 'greyd://' + pathArray.join('/');

      const dynamicLinkParams = extractDeepLinkPath(dynamicLink.url);
      if (!dynamicLinkParams || !isAllowedLinkPath(dynamicLinkParams)) {
        return;
      }

      const url = 'greyd://' + dynamicLinkParams;

      /* 다이나믹 링크를 통해 들어왔을대 로그인 되도록 로직추가 */
      const {
        user: { isGuest },
      } = store.getState();

      if (
        isGuest &&
        (dynamicLinkParams.startsWith('users') || dynamicLinkParams.startsWith('qnas'))
      ) {
        return Alert.alert(Strings.LOGIN_REQUIRED_TITLE, Strings.LOGIN_REQUIRED_TO_VIEW_PAGE);
      }

      const myUserId = await Preference.get('userId');
      const myUserName = await Preference.get('userName');
      const originalRequesterToken = await Preference.get('userAccessToken');

      if (!myUserId || !myUserName || !originalRequesterToken) {
        await loginWithGuest();
        // return Alert.alert(
        //   '로그인 필요',
        //   '해당 페이지는 게스트모드 혹은 로그인 상태에서 확인 가능합니다.',
        // );
      }

      if (
        (myUserId === '640a908e092ea7d56d4a41d5' && myUserName === 'guest_arbaim') ||
        (myUserId === '63a126963389e30449162c3b' && myUserName === 'greyd.guest')
      ) {
        store.dispatch(setGuest({ isGuest: true }));
      }

      if (originalRequesterToken) {
        APIprovider.setRequester(originalRequesterToken, myUserId);
      }
      /* 다이나믹 링크를 통해 들어왔을대 로그인 되도록 로직추가 */

      listener(url);
    };

    const unsubscribeToDynamicLinks = dynamicLinks().onLink(handleDynamicLink);
    return () => {
      unsubscribeToDynamicLinks();
      // Linking.removeEventListener('url', onReceiveURL);
      linkingSubscription?.remove(); // ✅ 새로운 방식
    };
  },
};

export default linking;
