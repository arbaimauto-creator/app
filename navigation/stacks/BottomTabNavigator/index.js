import messaging from '@react-native-firebase/messaging';
import { createNavigatorFactory } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isIPhoneWithDynamicIsland } from 'react-native-safearea-height';
import { isIPhone12, isIPhone12Max } from 'react-native-status-bar-height';
import MyMaterialBottomTabNavigator from '../../../Components/MyMaterialBottomTabNavigator';
import { capitalizeFirstLetter } from '../../../Components/utils';
import DiscoverNavigator from '../navigator/DiscoverNavigator';
import HomeNavigator from '../navigator/HomeNavigator';
import ProductsNavigator from '../navigator/ProductsNavigator';
import UserPageNavigator from '../navigator/UserPageNavigator';
import TryNavigator from '../navigator/TryNavigator';
import ActivityNavigator from '../navigator/ActivityNavigator';
import { tabBarIcon, tabBarLabel } from './renderTabBar';
import { Platform } from 'react-native';
import { StatusBar } from 'react-native';
import Constants from '../../../Components/Constants';
import FEATURES from '../../../Components/Constants/Features';
import { useSelector } from 'react-redux';
import Preference from 'react-native-default-preference';
import BrandDashboard from '../../../screens/BrandScreen/BrandDashboard';
import BrandReview from '../../../screens/BrandScreen/BrandReview';

function BottomTabNavigator({ route, navigation }) {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Home');
  const [logonUserIsSeller, setLogonUserIsSeller] = useState(route.params.logonUserIsSeller);
  // v2.1 D9: 역할별 탭 셸 — brand는 [대시보드·리뷰 평가·마이] 3탭
  const [inviteRole, setInviteRole] = useState(null);
  const insets = useSafeAreaInsets();

  const Stack = createStackNavigator();
  const TabNavigationCreator = createNavigatorFactory(MyMaterialBottomTabNavigator);
  const Tab = TabNavigationCreator();

  const { screenType } = useSelector((state) => state.common.mainScreen);

  route.params = {
    ...route.params,
    logonUserIsSeller: logonUserIsSeller,
    // setLogonUserIsSeller: setLogonUserIsSeller,
  };

  useEffect(() => {
    navigation.setOptions({
      setLogonUserIsSeller: setLogonUserIsSeller,
      setInitialBottomTabRouteName: setInitialRoute,
    });

    Preference.get('inviteRole').then((role) => setInviteRole(role || 'influencer'));

    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        // data 없는(notification-only) 푸시로 실행되면 type이 없다 — 널 가드 없으면
        // 예외로 setLoading(false)가 안 불려 앱이 빈 화면에 영구 정지한다.
        if (remoteMessage?.data?.type) {
          console.log(
            'Notification caused app to open from quit state:',
            remoteMessage.notification,
          );
          setInitialRoute(capitalizeFirstLetter(remoteMessage.data.type)); // e.g. "Settings"
        }
      })
      .catch((err) => console.log('getInitialNotification error', err))
      .finally(() => setLoading(false));
  }, [navigation]);

  if (loading || inviteRole == null) {
    return null;
  }

  const initialParams = {
    ...route.params,
    initialRoute,
    // setInitialBottomTabRouteName: setInitialRoute,
  };

  // 브랜드 셸: 대시보드가 곧 홈. 피드/체험/활동 탭은 브랜드에게 소음이므로 없다.
  if (inviteRole === 'brand') {
    return (
      <Tab.Navigator
        screenOptions={({ navigation: nav, route: tabRoute }) => ({
          tabBarIcon: ({ focused, color }) => tabBarIcon({ focused, color, route: tabRoute }),
          tabBarLabel: ({ focused, color }) => tabBarLabel({ focused, color, route: tabRoute }),
        })}
        shifting={false}
        labeled={false}
        barStyle={{ backgroundColor: '#F4F4F4', elevation: 20 }}
        onIndexChange={(index) => {}}
      >
        <Tab.Screen name="BrandDashboard" component={BrandDashboard} initialParams={initialParams} />
        <Tab.Screen name="BrandReview" component={BrandReview} initialParams={initialParams} />
        <Tab.Screen name="Profile" component={UserPageNavigator} initialParams={initialParams} />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ navigation, route }) => ({
        tabBarIcon: ({ focused, color }) => tabBarIcon({ focused, color, route }),
        tabBarLabel: ({ focused, color }) => tabBarLabel({ focused, color, route }),
      })}
      shifting={false}
      labeled={false}
      barStyle={{
        backgroundColor: '#F4F4F4',

        shadowColor: 'white',
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 0.28,
        shadowRadius: 16.0,
        elevation: 20,

        // paddingBottom:
        //   isIPhone12() || isIPhone12Max() || isIPhoneWithDynamicIsland() ? insets.bottom : 0,
      }}
      onIndexChange={(index) => {}}
    >
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        listeners={() => ({
          tabPress: (e) => {
            FastImage.clearMemoryCache();

            if (Platform.OS !== 'ios') {
              console.log('screenType', screenType);
              StatusBar.setBackgroundColor(
                screenType === 1 ? Constants.TIER_COLORS.GIVER : Constants.TIER_COLORS.ARTISAN,
              );
              StatusBar.setBarStyle('default', true);
            }
          },
        })}
        initialParams={initialParams}
      />
      {/* <Tab.Screen
        name="Reviews"
        component={DiscoverNavigator}
        listeners={() => ({
          tabPress: (e) => {
            FastImage.clearMemoryCache();
          },
        })}
        initialParams={initialParams}
      /> */}
      {/* 커머스 숨김(v2 §D5): 라우트는 유지하되 COMMERCE 플래그가 꺼지면 탭에서 제외 */}
      {FEATURES.COMMERCE ? (
        <Tab.Screen
          name="Store"
          component={ProductsNavigator}
          listeners={() => ({
            tabPress: (e) => {
              FastImage.clearMemoryCache();

              if (Platform.OS !== 'ios') {
                StatusBar.setBackgroundColor(Constants.TIER_COLORS.GIVER);
                StatusBar.setBarStyle('default', true);
              }
            },
          })}
          initialParams={initialParams}
        />
      ) : null}
      <Tab.Screen
        name="Try"
        component={TryNavigator}
        listeners={() => ({
          tabPress: () => {
            FastImage.clearMemoryCache();
            if (Platform.OS !== 'ios') {
              StatusBar.setBackgroundColor(Constants.TIER_COLORS.GIVER);
              StatusBar.setBarStyle('default', true);
            }
          },
        })}
        initialParams={initialParams}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityNavigator}
        listeners={() => ({
          tabPress: () => {
            FastImage.clearMemoryCache();
            if (Platform.OS !== 'ios') {
              StatusBar.setBackgroundColor(Constants.TIER_COLORS.GIVER);
              StatusBar.setBarStyle('default', true);
            }
          },
        })}
        initialParams={initialParams}
      />
      <Tab.Screen
        name="Profile"
        component={UserPageNavigator}
        listeners={() => ({
          tabPress: (e) => {
            FastImage.clearMemoryCache();

            if (Platform.OS !== 'ios') {
              StatusBar.setBackgroundColor(Constants.TIER_COLORS.GIVER);
              StatusBar.setBarStyle('default', true);
            }
          },
        })}
        initialParams={initialParams}
      />
    </Tab.Navigator>
  );
}

export default BottomTabNavigator;
