import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Preference from 'react-native-default-preference';
import { useDispatch } from 'react-redux';
import headerBackButton from '../../Components/CustomComponents/headerBackButton';
import { horizontalAnimation } from '../../Components/CustomComponents/horizontalAnimation';
import QNAChat from '../../Components/CustomComponents/QNA/QNAChatView';
import {
  AddExternalProductLinkScreen,
  AddingNewProductScreen,
  AddingNewVideoScreen,
  AgreementToWithdrawalScreen,
  BlockedUserListScreen,
  BookmarkListScreen,
  CartScreen,
  EditProfileScreen,
  EditSingleVideoScreen,
  FollowListScreen,
  G6Guide,
  HelpScreen,
  MakeOrderScreen,
  MembershipWithdrawalPage,
  MyOrderListScreen,
  MyStoreScreen,
  NotificationScreen,
  OrderListScreen,
  OrderPageScreen,
  OrderRejectionPage,
  PasswordInputScreen,
  PayPaypalScreen,
  PayScreen,
  ProductListScreen,
  ProductPageScreen,
  PurchaseCancellationPage,
  QRScreen,
  RegisterAsSellerApplicationScreen,
  RegisterAsSellerScreen,
  RegisterAsSellerSuccessScreen,
  RevenueListScreen,
  RewardListScreen,
  SearchProductScreen,
  SearchScreen,
  SettingScreen,
  TierGuide,
  TutorialReviewScreen,
  UserListScreen,
  UserPageScreen,
  VideoGuide,
  VideoListScreen,
  WithdrawalManagementScreen,
  WithdrawalRequestScreen,
} from '../../Components/index';
import B2BNavigator from './navigator/B2BNavigator';
import VideoPageScreenWrapper from '../../Components/VideoPageScreenWrapper';
import ChatView from '../../screens/ChatView';
import { guestUser } from '../../screens/SignInScreen/commonHelperFunction';
import { setGuest } from '../../slices/user';
import BottomTabNavigator from './BottomTabNavigator';
import SignInNavigator from './navigator/SignInNavigator';
import G6UserChart from '../../Components/CustomComponents/G6/G6UserChart';
import InitialGuideScreen from '../../Components/CustomComponents/InitialGuide/InitialGuideScreen';
import RewardGuide from '../../Components/CustomComponents/RewardGuide';
import OnboardingScreen from '../../Components/OnboardingScreen';
import NoticeList from '../../Components/CustomComponents/Notice/NoticeList';
import NoticeDetail from '../../Components/CustomComponents/Notice/NoticeDetail';
import RatingList from '../../screens/VideoPageScreen/RatingList';
import MustReadDetail from '../../screens/AddingNewVideoScreen/MustReadDetail';
import GlobalMakeOrderScreen from '../../Components/GlobalMakeOrderScreen';
import InviteGateScreen from '../../screens/InviteGateScreen';
import CreatorOnboarding from '../../screens/InviteGateScreen/CreatorOnboarding';
import FgiSurvey from '../../screens/TryScreen/FgiSurvey';
import ReviewLinkSubmit from '../../screens/TryScreen/ReviewLinkSubmit';
import BrandWelcome from '../../screens/InviteGateScreen/BrandWelcome';
import AddressBook from '../../screens/MyScreen/AddressBook';
import AboutScreen from '../../screens/MyScreen/AboutScreen';
import GreydSettingsScreen from '../../screens/MyScreen/SettingsScreen';
import ApplyDone from '../../screens/TryScreen/ApplyDone';
import MissionDone from '../../screens/ActivityScreen/MissionDone';
import FirstImpression from '../../screens/ActivityScreen/FirstImpression';
import T from '../../Components/Constants/DesignTokens';
import { trace } from '../../Components/bootTrace';

const Stack = createStackNavigator();

// 부팅 시 Preference 조회 최대 대기 시간. 초과하면 기본값(null)으로 진행한다.
// (네이티브 모듈이 응답하지 않아도 흰 화면에 영구히 갇히지 않게 하는 최후 방어선)
const PREF_TIMEOUT_MS = 2500;
const TIMED_OUT = {};

/**
 * Preference.get 방어 래퍼: reject·동기 throw·무응답 모두 null로 수렴시킨다.
 * 정상 경로에서는 Preference.get과 동일한 값을 그대로 돌려준다.
 */
function prefGet(key) {
  let timer = null;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), PREF_TIMEOUT_MS);
  });
  const read = Promise.resolve()
    .then(() => Preference.get(key))
    .catch(() => {
      trace('pref:error:' + key);
      return null;
    });

  return Promise.race([read, timeout]).then((value) => {
    if (timer) {
      clearTimeout(timer);
    }
    if (value === TIMED_OUT) {
      trace('pref:timeout:' + key);
      return null;
    }
    return value;
  });
}

// 빈 <View /> 대신 최소한의 시각적 신호(배경 + 스피너)를 남긴다.
function BootFallback() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: T.COLORS.BG,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator size="large" color={T.COLORS.AMBER} />
    </View>
  );
}

function MainDrawerNavigator({ route, navigation }) {
  const [logonUserId, setLogonUserId] = useState('');
  const [logonUserName, setLogonUserName] = useState('');
  const [logonUserProfilePicUrl, setLogonUserProfilePicUrl] = useState('');
  const [logonUserToken, setLogonUserToken] = useState('');
  const [logonUserIsSeller, setLogonUserIsSeller] = useState('');
  const [KRWPerUSD, setKRWPerUSD] = useState(1);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const dispatch = useDispatch();

  const [isOnboarded, setIsOnboarded] = useState(false);
  const [previousPage, setPreviousPage] = useState('');
  // 클로즈드 베타 게이트 (v2 §3-1): 초대 코드 통과 전엔 게이트가 최전면
  const [gatePassed, setGatePassed] = useState(null);
  // 부팅 Preference 로드 완료 여부. 성공·실패·타임아웃 어느 경우에도 true가 되어
  // 반드시 스택이 렌더된다(이전 구조는 응답이 없으면 영구히 <View />였다).
  const [bootLoaded, setBootLoaded] = useState(false);

  // 렌더 본문에서 Promise를 띄우고 setState 하던 구조를 useEffect로 이동.
  useEffect(() => {
    let alive = true;
    trace('drawer:boot-start');

    Promise.all([
      prefGet('inviteRole'),
      prefGet('inviteCode'),
      prefGet('creatorCountry'),
      prefGet('isOnboarded'),
      prefGet('userId'),
      prefGet('userName'),
      prefGet('userProfilePicUrl'),
      prefGet('userTokenFirebase'),
      prefGet('userIsSeller'),
      prefGet('KRW/USD'),
      prefGet('previousPage'),
    ])
      .then(
        ([
          inviteRole,
          inviteCode,
          creatorCountry,
          onboarded,
          userId,
          userName,
          profilePicUrl,
          userToken,
          userIsSeller,
          krwPerUsd,
          prevPage,
        ]) => {
          if (!alive) {
            return;
          }
          const hasCompleteGateState = Boolean(inviteRole && inviteCode && creatorCountry);
          setGatePassed(hasCompleteGateState ? 'yes' : 'no');
          setIsOnboarded(onboarded);
          setLogonUserId(userId);
          setLogonUserName(userName);
          setLogonUserProfilePicUrl(profilePicUrl);
          setLogonUserToken(userToken);
          setLogonUserIsSeller(userIsSeller);
          if (krwPerUsd) {
            setKRWPerUSD(krwPerUsd);
          }
          setPreviousPage(prevPage);
          trace(
            'drawer:boot-done gate=' +
              (hasCompleteGateState ? 'yes' : 'no') +
              ' uid=' +
              (userId ? 1 : 0),
          );
          setBootLoaded(true);
        },
      )
      .catch(() => {
        // prefGet이 이미 개별 방어를 하므로 도달 불가에 가깝지만, 어떤 경우에도 진행시킨다.
        if (!alive) {
          return;
        }
        trace('drawer:boot-error');
        setGatePassed('no');
        setBootLoaded(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  if (!bootLoaded) {
    trace('drawer:boot-pending');
    return <BootFallback />;
  }

  const initialParams = {
    logonUserId,
    logonUserName,
    logonUserProfilePicUrl,
    logonUserToken,
    logonUserIsSeller,
    setLogonUserId,
    setLogonUserName,
    setLogonUserProfilePicUrl,
    setLogonUserToken,
    setLogonUserIsSeller,
    KRWPerUSD,
    isLoggingIn,
    setIsLoggingIn,
    previousPage,
    setPreviousPage,
  };

  /* logonUserId === '': when initial rendering before completed to load 'userId' from preference.
   * logonUserId === null: logout
   * So added below for blocking from unnecessary rendering
   */

  if (logonUserId === '') {
    trace('drawer:userId-empty');
    return <BootFallback />;
  }

  trace('drawer:render-stack onboarded=' + String(isOnboarded));

  return (
    <Stack.Navigator
      // v2 §3-1: 게이트 미통과 = 초대 게이트가 최전면 (클로즈드 베타 — 신규 디자인 진입점).
      // 통과 후에는 화면 인벤토리 1번 = 소셜 로그인. 온보딩 4장은 게이트 이후 CreatorOnboarding 담당.
      initialRouteName={gatePassed === 'yes' ? 'NotSignedIn' : 'InviteGate'}
      screenOptions={horizontalAnimation}
    >
      <Stack.Screen
        name="Onboarding"
        // component={InitialGuideScreen}
        component={OnboardingScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="VideoGuide"
        component={VideoGuide}
        initialParams={route.params}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="TierGuide"
        component={TierGuide}
        initialParams={route.params}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="G6Guide"
        component={G6Guide}
        initialParams={route.params}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="B2B"
        component={B2BNavigator}
        initialParams={initialParams}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NotSignedIn"
        component={SignInNavigator}
        initialParams={initialParams}
        options={({ route, navigation }) => ({
          headerShown: false,
        })}
      />
      <Stack.Screen
        name="MainBottom"
        component={BottomTabNavigator}
        initialParams={initialParams}
        options={({ route, navigation }) => ({
          headerShown: false,
        })}
      />
      {/* Greyd 1단계: 초대 코드 게이트 + 크리에이터 온보딩 (v2 §3) */}
      <Stack.Screen
        name="InviteGate"
        component={InviteGateScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreatorOnboarding"
        component={CreatorOnboarding}
        options={{ headerShown: false }}
      />
      {/* FGI 설문 — 업로드 전 필수 단계 (계획서 TSK-007) */}
      <Stack.Screen name="FgiSurvey" component={FgiSurvey} options={{ headerShown: false }} />
      {/* D27: 첫인상 30초 — 수령 확인 직후 (스킵 가능) */}
      <Stack.Screen
        name="FirstImpression"
        component={FirstImpression}
        options={{ headerShown: false }}
      />
      {/* 시안 15: 미션 리뷰는 링크 제출 — 피드 업로더(AddingNewVideo)와 별개 */}
      <Stack.Screen
        name="ReviewLinkSubmit"
        component={ReviewLinkSubmit}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="BrandWelcome" component={BrandWelcome} options={{ headerShown: false }} />
      {/* 마이 탭 서브 화면 + 신청·완주 결과 화면 (시안 11·16·17·18·19·20·25) */}
      <Stack.Screen name="AddressBook" component={AddressBook} options={{ headerShown: false }} />
      <Stack.Screen name="AboutGreyd" component={AboutScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="GreydSettings"
        component={GreydSettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="ApplyDone" component={ApplyDone} options={{ headerShown: false }} />
      <Stack.Screen name="MissionDone" component={MissionDone} options={{ headerShown: false }} />
      <Stack.Screen
        name="VideoPage"
        component={VideoPageScreenWrapper}
        initialParams={initialParams}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="VideoPageForDeeplink"
        component={VideoPageScreenWrapper}
        initialParams={initialParams}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="VideoList"
        component={VideoListScreen}
        initialParams={initialParams}
        options={{
          title: null,
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="EditSingleVideo"
        component={EditSingleVideoScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="AddingNewVideo"
        component={AddingNewVideoScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="AddExternalProductLink"
        component={AddExternalProductLinkScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        initialParams={initialParams}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Notification"
        component={NotificationScreen}
        initialParams={initialParams}
        options={{
          headerShown: true,
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="TutorialReview"
        component={TutorialReviewScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="BlockedUserList"
        component={BlockedUserListScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="SearchProduct"
        component={SearchProductScreen}
        initialParams={initialParams}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ProductPage"
        component={ProductPageScreen}
        initialParams={initialParams}
        options={{
          headerShown: false,
          tabBarVisible: false,
        }}
      />
      <Stack.Screen
        name="ProductList"
        component={ProductListScreen}
        initialParams={initialParams}
        options={{
          title: null,
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="AddingNewProduct"
        component={AddingNewProductScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="UserPage"
        component={UserPageScreen}
        initialParams={initialParams}
        options={({ route, navigation }) => ({
          headerShown: false,
        })}
      />
      <Stack.Screen
        name="UserList"
        component={UserListScreen}
        initialParams={initialParams}
        options={{
          title: null,
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        initialParams={initialParams}
        options={({ route, navigation }) => ({
          ...headerBackButton,
        })}
      />
      <Stack.Screen
        name="FollowList"
        component={FollowListScreen}
        initialParams={initialParams}
        options={({ route, navigation }) => ({
          ...headerBackButton,
        })}
      />
      <Stack.Screen
        name="Settings"
        component={SettingScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="Help"
        component={HelpScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="MembershipWithdrawal"
        component={MembershipWithdrawalPage}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="PasswordInput"
        component={PasswordInputScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="OrderPage"
        component={OrderPageScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="OrderList"
        component={OrderListScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="MyOrderList"
        component={MyOrderListScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="MakeOrder"
        component={MakeOrderScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="GlobalMakeOrder"
        component={GlobalMakeOrderScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="Pay"
        component={PayScreen}
        initialParams={initialParams}
        options={{
          // headerShown: null,
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="PayPaypal"
        component={PayPaypalScreen}
        initialParams={initialParams}
        options={{
          // headerShown: null,
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="BookmarkList"
        component={BookmarkListScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="RewardList"
        component={RewardListScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      {/* <Stack.Screen name="NotificationTest"
        component={NotificationTestScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton
        }}/> */}
      <Stack.Screen
        name="MyStore"
        component={MyStoreScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="RevenueList"
        component={RevenueListScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="RegisterAsSeller"
        component={RegisterAsSellerScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="RegisterAsSellerApplication"
        component={RegisterAsSellerApplicationScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="RegisterAsSellerSuccess"
        component={RegisterAsSellerSuccessScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="Withdrawal"
        component={WithdrawalManagementScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="AgreementToWithdrawal"
        component={AgreementToWithdrawalScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="WithdrawalRequest"
        component={WithdrawalRequestScreen}
        initialParams={route.params}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="PurchaseCancellation"
        component={PurchaseCancellationPage}
        initialParams={route.params}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="OrderRejection"
        component={OrderRejectionPage}
        initialParams={route.params}
        options={{
          ...headerBackButton,
        }}
      />
      {/* <Stack.Screen
        name="AddressSearch"
        component={AddressSearchScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      /> */}
      <Stack.Screen
        name="QRCode"
        component={QRScreen}
        initialParams={initialParams}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="ChatView"
        component={ChatView}
        initialParams={initialParams}
        options={() => ({
          headerShown: false,
        })}
      />
      <Stack.Screen
        name="QNAChat"
        component={QNAChat}
        initialParams={initialParams}
        options={() => ({
          headerShown: false,
        })}
      />
      <Stack.Screen
        name="G6UserChart"
        component={G6UserChart}
        initialParams={initialParams}
        options={() => ({
          headerShown: false,
        })}
      />
      <Stack.Screen
        name="RewardGuide"
        component={RewardGuide}
        initialParams={route.params}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="NoticeList"
        component={NoticeList}
        initialParams={route.params}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="NoticeDetail"
        component={NoticeDetail}
        initialParams={route.params}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="RatingList"
        component={RatingList}
        initialParams={route.params}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="MustReadDetail"
        component={MustReadDetail}
        initialParams={route.params}
        options={{
          ...headerBackButton,
        }}
      />
    </Stack.Navigator>
  );
}

export default MainDrawerNavigator;
