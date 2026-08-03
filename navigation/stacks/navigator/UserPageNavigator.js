import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { horizontalAnimation } from '../../../Components/CustomComponents/horizontalAnimation';
import { UserPageScreen } from '../../../Components/index';
const Stack = createStackNavigator();

function UserPageNavigator({ route, navigation }) {
  return (
    <Stack.Navigator screenOptions={horizontalAnimation}>
      <Stack.Screen
        name="MyPage"
        component={UserPageScreen}
        initialParams={{
          ...route.params,
          pageOwnerUserId: route.params.logonUserId,
          pageOwnerUserName: route.params.logonUserName,
        }}
        options={({ route, navigation }) => ({
          headerShown: false,
        })}
      />
    </Stack.Navigator>
  );
}

export default UserPageNavigator;
