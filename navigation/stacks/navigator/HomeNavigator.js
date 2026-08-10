import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { horizontalAnimation } from '../../../Components/CustomComponents/horizontalAnimation';
import { MainScreen, VideoPageScreenWrapper } from '../../../Components/index';
import CuratedHome from '../../../screens/HomeScreen/CuratedHome';
const Stack = createStackNavigator();

function HomeNavigator({ route, _navigation }) {
  return (
    <Stack.Navigator screenOptions={horizontalAnimation}>
      {/* 시안 8 (D23 v2.6): 홈 = 큐레이션 디스커버리. 피드(HomeFeed)는 "피드로 보기"로 진입하는 스택 화면 (시안 8b) */}
      <Stack.Screen
        name="CuratedHome"
        component={CuratedHome}
        initialParams={route.params}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HomeFeed"
        component={MainScreen}
        initialParams={route.params}
        listeners={({ navigation }) => ({
          state: (e) => {
            if (navigation.isFocused()) {
            }
          },
        })}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="VideoPage"
        component={VideoPageScreenWrapper}
        initialParams={route.params}
        listeners={({ navigation }) => ({
          state: (e) => {
            if (navigation.isFocused()) {
            }
          },
        })}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

export default HomeNavigator;
