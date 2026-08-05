import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { horizontalAnimation } from '../../../Components/CustomComponents/horizontalAnimation';
import TryScreen from '../../../screens/TryScreen';
import CampaignDetail from '../../../screens/TryScreen/CampaignDetail';

const Stack = createStackNavigator();

function TryNavigator({ route }) {
  return (
    <Stack.Navigator screenOptions={horizontalAnimation}>
      <Stack.Screen
        name="TryHome"
        component={TryScreen}
        initialParams={route.params}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CampaignDetail"
        component={CampaignDetail}
        initialParams={route.params}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default TryNavigator;
