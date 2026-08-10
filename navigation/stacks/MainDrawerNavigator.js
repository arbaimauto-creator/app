import { createStackNavigator } from '@react-navigation/stack';
import React, { useState } from 'react';
import { View } from 'react-native';
import Preference from 'react-native-default-preference';
import { useDispatch } from 'react-redux';
import headerBackButton from '../../Components/CustomComponents/headerBackButton';
import { horizontalAnimation } from '../../Components/CustomComponents/horizontalAnimation';
import QNAChat from '../../Components/CustomComponents/QNA/QNAChatView';
import {
  AddExternalProductLinkScreen,
  AddingNewProductScreen,
  AddingNewVideoScreen,
  AddressSearchScreen,
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
import BrandWelcome from '../../screens/InviteGateScreen/BrandWelcome';

const Stack = createStackNavigator();

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

  if (isOnboarded === false) {
    Preference.get('isOnboarded').then((value) => {
      setIsOnboarded(value);
    });

    return <View />;
  }

  if (logonUserId === '') {
    Preference.get('userId').then((value) => {
      setLogonUserId(value);

      // if (!value) {
      //   guestUser(
      //     { navigation, route: { params: initialParams } },
      //     (isLoggedIn) => setIsLoggingIn(isLoggedIn),
      //     true,
      //   );
      //   dispatch(setGuest({ isGuest: true }));
      // }
      // dispatch(setGuest({ isGuest: false }));
    });
    Preference.get('userName').then((value) => {
      setLogonUserName(value);
    });
    Preference.get('userProfilePicUrl').then((value) => {
      setLogonUserProfilePicUrl(value);
    });
    Preference.get('userTokenFirebase').then((value) => {
      setLogonUserToken(value);
    });
    Preference.get('userIsSeller').then((value) => {
      setLogonUserIsSeller(value);
    });
    Preference.get('KRW/USD').then((value) => {
      console.log('KRW/USD', value);
      setKRWPerUSD(value);
    });

    Preference.get('previousPage').then((value) => {
      console.log('previousPage', value);
      setPreviousPage(value);
    });
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
    return <View />;
  }

  return (
    <Stack.Navigator
      initialRouteName={isOnboarded && isOnboarded !== '' ? 'NotSignedIn' : 'Onboarding'}
      // initialRouteName={'NotSignedIn'}
      // initialRouteName={'Onboarding'}
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
      <Stack.Screen name="BrandWelcome" component={BrandWelcome} options={{ headerShown: false }} />
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
