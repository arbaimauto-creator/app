import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { horizontalAnimation } from '../../../Components/CustomComponents/horizontalAnimation';
import { DiscoverScreen } from '../../../Components/index';

const Stack = createStackNavigator();

function DiscoverNavigator({ route, _navigation }) {
  return (
    <Stack.Navigator screenOptions={horizontalAnimation}>
      <Stack.Screen
        name="Discover"
        component={DiscoverScreen}
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

export default DiscoverNavigator;
