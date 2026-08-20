import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { ActivityIndicator, PermissionsAndroid, Platform, View } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import T from '../Components/Constants/DesignTokens';
import { trace } from '../Components/bootTrace';
import { horizontalAnimation } from '../Components/CustomComponents/horizontalAnimation';
import { initializeFBPixel, setCountryFromLocation } from '../Components/utils';
import linking from '../Components/utils/linking';
import { navigationTheme } from '../Components/utils/navigationTheme';
import MainDrawerNavigator from './stacks/MainDrawerNavigator';
import CameraNavigator from './stacks/navigator/CameraNavigator';

const Stack = createStackNavigator();

// linking 해석 대기 중 표시할 최소 화면 (빈 화면 금지)
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

const Root = () => {
  trace('root:render');
  React.useEffect(() => {
    const splashSafetyTimer = setTimeout(() => SplashScreen.hide(), 1800);

    // 실행 시점 권한 요청 금지 (D11): 알림은 수령 확인 직후 컨텍스트 프롬프트가 담당,
    // 국가는 게이트에서 직접 입력받는다. 위치는 이미 허용된 기기에서만 보조로 사용.
    if (Platform.OS === 'android') {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then(
        (granted) => {
          if (granted) {
            setCountryFromLocation();
          }
        },
      );
    } else {
      setCountryFromLocation();
    }

    initializeFBPixel();

    return () => clearTimeout(splashSafetyTimer);
  }, []);

  return (
    <NavigationContainer
      theme={navigationTheme}
      linking={linking}
      // linking 해석(getInitialURL) 동안 NavigationContainer는 자식을 렌더하지 않는다.
      // 기본 fallback은 null(= 흰 화면)이므로 최소한 배경+스피너를 그린다.
      fallback={<BootFallback />}
      // 최종 안전장치: 어떤 화면이 첫 라우트여도 내비 준비 즉시 네이티브 스플래시 해제.
      // (개별 화면의 hide()가 실행되지 않는 경로에서 스플래시 영구 잔류 방지)
      onReady={() => {
        trace('root:nav-ready');
        SplashScreen.hide();
      }}
    >
      <Stack.Navigator initialRouteName={'Main'} screenOptions={horizontalAnimation}>
        <Stack.Screen
          name="Main"
          component={MainDrawerNavigator}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Camera"
          component={CameraNavigator}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Root;
