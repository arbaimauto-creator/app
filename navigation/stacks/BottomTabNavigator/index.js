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
import TryNavigator from '../navigator/TryNavigator';
import ActivityNavigator from '../navigator/ActivityNavigator';
import { tabBarIcon, tabBarLabel } from './renderTabBar';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'react-native';
import Constants from '../../../Components/Constants';
import T from '../../../Components/Constants/DesignTokens';
import FEATURES from '../../../Components/Constants/Features';
import { prefGetSafe } from '../../../api/prefSafe';
import { useSelector } from 'react-redux';
import Preference from 'react-native-default-preference';
import BrandDashboard from '../../../screens/BrandScreen/BrandDashboard';
import BrandReview from '../../../screens/BrandScreen/BrandReview';
import BrandMy from '../../../screens/BrandScreen/BrandMy';
import MyScreen from '../../../screens/MyScreen';

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

  // route.params를 직접 재할당하면 렌더마다 새 객체가 되고, 중첩 navigate('MainBottom',
  // { screen: 'Activity' })가 남긴 `screen` 파라미터를 useNavigationBuilder가 "새 요청"으로
  // 재해석해 매 렌더 navigate를 디스패치했다(Maximum update depth — Activity 진입 시 실측).
  // 파라미터는 읽기만 하고, 자식에게는 별도 객체로 넘긴다.
  const { screen: _nestedScreen, params: _nestedParams, ...parentParams } = route.params || {};

  useEffect(() => {
    navigation.setOptions({
      setLogonUserIsSeller: setLogonUserIsSeller,
      setInitialBottomTabRouteName: setInitialRoute,
    });

    // iOS 릴리스에서 Preference가 응답하지 않는 사례가 있어(api/prefSafe 주석) 타임아웃 레이스로 감싼다.
    // 이전엔 무응답이면 아래 null 렌더가 영구히 남아 자동 로그인 직후 빈 화면이 됐다(2026-09-15).
    prefGetSafe('inviteRole')
      .then((role) => setInviteRole(role || 'influencer'))
      .catch(() => setInviteRole('influencer'));

    // 초기 푸시 조회도 상한을 둔다 — 네이티브 응답이 없으면 5초 뒤 그냥 진행
    Promise.race([
      messaging().getInitialNotification(),
      new Promise((resolve) => setTimeout(() => resolve(null), 5000)),
    ])
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
    // 빈 화면 금지 — 스피너라도 그린다 (root.js BootFallback과 동일 배경)
    return (
      <View style={styles.bootFallback}>
        <ActivityIndicator size="large" color={T.COLORS.AMBER} />
      </View>
    );
  }

  const initialParams = {
    ...parentParams,
    logonUserIsSeller,
    initialRoute,
    // setInitialBottomTabRouteName: setInitialRoute,
  };

  // 브랜드 셸: 대시보드가 곧 홈. 피드/체험/활동 탭은 브랜드에게 소음이므로 없다.
  // D26: BRAND_APP off면 잔존 brand 역할이 있어도 브랜드 셸 미노출 (게이트가 신규 진입 차단)
  if (inviteRole === 'brand' && FEATURES.BRAND_APP) {
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
        <Tab.Screen
          name="BrandDashboard"
          component={BrandDashboard}
          initialParams={initialParams}
        />
        <Tab.Screen name="BrandReview" component={BrandReview} initialParams={initialParams} />
        <Tab.Screen name="Profile" component={BrandMy} initialParams={initialParams} />
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
              StatusBar.setBackgroundColor(T.COLORS.BG);
              StatusBar.setBarStyle('dark-content', true);
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
      <Tab.Screen
        name="Try"
        component={TryNavigator}
        listeners={() => ({
          tabPress: () => {
            FastImage.clearMemoryCache();
            if (Platform.OS !== 'ios') {
              StatusBar.setBackgroundColor(T.COLORS.BG);
              StatusBar.setBarStyle('dark-content', true);
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
              StatusBar.setBackgroundColor(T.COLORS.BG);
              StatusBar.setBarStyle('dark-content', true);
            }
          },
        })}
        initialParams={initialParams}
      />
      <Tab.Screen
        name="Profile"
        component={MyScreen}
        listeners={() => ({
          tabPress: (e) => {
            FastImage.clearMemoryCache();

            if (Platform.OS !== 'ios') {
              StatusBar.setBackgroundColor(T.COLORS.BG);
              StatusBar.setBarStyle('dark-content', true);
            }
          },
        })}
        initialParams={initialParams}
      />
    </Tab.Navigator>
  );
}

export default BottomTabNavigator;

const styles = StyleSheet.create({
  bootFallback: {
    flex: 1,
    backgroundColor: T.COLORS.BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
