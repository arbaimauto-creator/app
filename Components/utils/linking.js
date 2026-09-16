import dynamicLinks from '@react-native-firebase/dynamic-links';
import { Alert, Linking } from 'react-native';
import Preference from 'react-native-default-preference';
import { store } from '../../redux/store';
import { setGuest } from '../../slices/user';
import APIprovider from '../APIprovider';
import { loginWithGuest } from '../../screens/SignInScreen/commonHelperFunction';
import Strings from '../Strings';
import { trace } from '../bootTrace';
import FEATURES from '../Constants/Features';
import { reportTrackingClick } from '../../api/tracking';
import { trackEvent } from '../../api/experiments';
import { rememberTrackingCode, stripQuery, trackingCodeFromUrl } from './tracking';

// getInitialURL은 NavigationContainer가 자식 렌더 전에 await 한다.
// 여기서 무응답이면 앱은 영원히 빈 화면이 되므로 반드시 상한을 둔다.
const INITIAL_URL_TIMEOUT_MS = 3000;
// A normal cold start is not a deep link. React Navigation expects null here;
// returning an unregistered placeholder URL can build an invalid initial state
// and leave the app on the fallback screen after a relaunch.
const DEFAULT_URL = null;

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
        // 공동구매 (2026-09-16 P3) — 소재·초대 링크 greyd://groupbuy/gb-xxxx 또는 https://greyd.app/groupbuy/gb-xxxx
        GroupBuy: 'groupbuy/:code',
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
const ALLOWED_LINK_PREFIXES = ['videos/', 'users/', 'notifications', 'mypage/', 'qnas/', 'events', 'groupbuy/'];
// 커머스 경로는 플래그가 켜진 빌드에서만 (products/:productId → 상품 상세)
const COMMERCE_LINK_PREFIXES = ['products/'];
const isAllowedLinkPath = (path) => {
  if (typeof path !== 'string') {
    return false;
  }
  const bare = stripQuery(path);
  if (ALLOWED_LINK_PREFIXES.some((prefix) => bare.startsWith(prefix))) {
    return true;
  }
  return FEATURES.COMMERCE && COMMERCE_LINK_PREFIXES.some((prefix) => bare.startsWith(prefix));
};

// 추적 코드(?tc=ra-xxxx / gb-xxxx) — 2차 가공물·공동구매 링크로 들어온 진입을 기기에 기억하고 클릭을 집계한다.
// 경로 화이트리스트와 무관하게 먼저 처리한다: 홈으로 떨어져도 7일 안의 주문은 귀속된다.
const captureTrackingCode = (url) => {
  const code = trackingCodeFromUrl(url);
  if (!code) {
    return null;
  }
  rememberTrackingCode(code)
    .then(() => reportTrackingClick(code))
    .catch(() => {});
  trackEvent('tc.enter', { kind: code.startsWith('gb-') ? 'groupbuy' : 'asset' });
  return code;
};

// 실제 초기 URL 해석. 아래 getInitialURL이 타임아웃·에러를 감싼다.
async function resolveInitialURL() {
  // Check if the app was opened by a deep link
  const url = await Linking.getInitialURL();
  trace('linking:initial-url=' + (url ? 1 : 0));
  const dynamicLink = await dynamicLinks().getInitialLink();
  trace('linking:dynamiclink=' + (dynamicLink ? 1 : 0));

  console.log('deeplink getInitialURL', url, dynamicLink);

  if (dynamicLink) {
    captureTrackingCode(dynamicLink.url);
    const dynamicLinkParams = extractDeepLinkPath(dynamicLink.url);
    if (!dynamicLinkParams || !isAllowedLinkPath(dynamicLinkParams)) {
      return DEFAULT_URL;
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

    let myUserId = await Preference.get('userId');
    let myUserName = await Preference.get('userName');
    let originalRequesterToken = await Preference.get('userAccessToken');

    if (!myUserId || !myUserName || !originalRequesterToken) {
      await loginWithGuest();
      myUserId = await Preference.get('userId');
      myUserName = await Preference.get('userName');
      originalRequesterToken = await Preference.get('userAccessToken');
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

    if (originalRequesterToken && myUserId) {
      APIprovider.setRequester(originalRequesterToken, myUserId);
    }
    /* 다이나믹 링크를 통해 들어왔을대 로그인 되도록 로직추가 */

    return 'greyd://' + dynamicLinkParams;
  }

  if (url) {
    // 직접 스킴 진입도 동일 화이트리스트 적용
    captureTrackingCode(url);
    const path = extractDeepLinkPath(url);
    return path && isAllowedLinkPath(path) ? url : DEFAULT_URL;
  }
  // If it was not opened by a deep link, go to the home screen
  return DEFAULT_URL;
}

const linking = {
  prefixes: ['https://greyd.app', 'greyd://'],
  config,
  async getInitialURL() {
    trace('linking:getInitialURL-start');
    let timer = null;
    try {
      const timeout = new Promise((resolve) => {
        timer = setTimeout(() => {
          // dynamicLinks().getInitialLink()가 응답하지 않는 경우(네트워크·SDK 초기화 지연)
          // NavigationContainer가 자식을 영원히 렌더하지 않는 것을 막는다.
          trace('linking:dynamiclink-timeout');
          resolve(DEFAULT_URL);
        }, INITIAL_URL_TIMEOUT_MS);
      });

      // 타임아웃이 먼저 이긴 뒤 뒤늦게 reject되어도 unhandled rejection이 되지 않도록 개별 catch.
      const resolved = resolveInitialURL().catch(() => {
        trace('linking:resolve-error');
        return DEFAULT_URL;
      });
      const result = await Promise.race([resolved, timeout]);
      trace('linking:getInitialURL-done');
      return result;
    } catch (e) {
      trace('linking:getInitialURL-error');
      return DEFAULT_URL;
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  },
  // Custom function to subscribe to incoming links
  subscribe(listener) {
    // First, you may want to do the default deep link handling
    const onReceiveURL = ({ url }) => {
      captureTrackingCode(url);
      const path = extractDeepLinkPath(url);
      if (!path || !isAllowedLinkPath(path)) {
        return;
      }
      listener(url);
    };

    // Listen to incoming links from deep linking
    // Linking.addEventListener('url', onReceiveURL);
    // ✅ addEventListener가 반환하는 subscription 저장
    const linkingSubscription = Linking.addEventListener('url', onReceiveURL);

    const handleDynamicLink = async (dynamicLink) => {
      console.log('handleDynamicLinkhandleDynamicLinkhandleDynamicLink', dynamicLink);

      // const dynamicLinkParams = dynamicLink.url.split('?')[1];
      // const pathArray = dynamicLinkParams.split('&').map(qs => qs.split('=')[1]);

      // const url = 'greyd://' + pathArray.join('/');

      captureTrackingCode(dynamicLink.url);
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

      let myUserId = await Preference.get('userId');
      let myUserName = await Preference.get('userName');
      let originalRequesterToken = await Preference.get('userAccessToken');

      if (!myUserId || !myUserName || !originalRequesterToken) {
        await loginWithGuest();
        myUserId = await Preference.get('userId');
        myUserName = await Preference.get('userName');
        originalRequesterToken = await Preference.get('userAccessToken');
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

      if (originalRequesterToken && myUserId) {
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
