import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { CameraScreen } from '../../../Components/index';
import AddingNewVideoScreen from '../../../Components/index';

const Stack = createStackNavigator();

function CameraNavigator({ route, navigation }) {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        initialParams={route.params}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            alert('Default behavior prevented initially');
          },
        })}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="AddingNewVideoScreen"
        component={AddingNewVideoScreen}
        initialParams={route.params}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

export default CameraNavigator;
