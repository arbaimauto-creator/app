import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { horizontalAnimation } from '../../../Components/CustomComponents/horizontalAnimation';
import { MainScreen,VideoPageScreenWrapper } from '../../../Components/index';
const Stack = createStackNavigator();

function HomeNavigator({ route, _navigation }) {
  return (
    <Stack.Navigator screenOptions={horizontalAnimation}>
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
