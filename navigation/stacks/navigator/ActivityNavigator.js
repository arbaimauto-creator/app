import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { horizontalAnimation } from '../../../Components/CustomComponents/horizontalAnimation';
import ActivityScreen from '../../../screens/ActivityScreen';

const Stack = createStackNavigator();

function ActivityNavigator({ route }) {
  return (
    <Stack.Navigator screenOptions={horizontalAnimation}>
      <Stack.Screen
        name="ActivityHome"
        component={ActivityScreen}
        initialParams={route.params}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default ActivityNavigator;
