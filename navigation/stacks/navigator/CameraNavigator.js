import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
// Components/index.js는 default export가 없다. default로 받으면 undefined가 되어
// Stack.Screen의 component prop이 깨지므로 named import로 받아야 한다.
import { AddingNewVideoScreen, CameraScreen } from '../../../Components/index';

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
