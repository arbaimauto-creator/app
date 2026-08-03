import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { PermissionsAndroid, Platform, SafeAreaView, Text } from 'react-native';
import { horizontalAnimation } from '../Components/CustomComponents/horizontalAnimation';
import { initializeFBPixel, setCountryFromLocation } from '../Components/utils';
import linking from '../Components/utils/linking';
import { navigationTheme } from '../Components/utils/navigationTheme';
import MainDrawerNavigator from './stacks/MainDrawerNavigator';
import CameraNavigator from './stacks/navigator/CameraNavigator';
import { PERMISSIONS, RESULTS, check, openSettings, request } from 'react-native-permissions';
import { Alert } from 'react-native';
import Strings from '../Components/Strings';

const Stack = createStackNavigator();

const Root = () => {
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then(
        (result) => {
          if (PermissionsAndroid.RESULTS.GRANTED === result) {
            setCountryFromLocation();
          }
        },
      );
      request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS).then((notiPermission) => {
        if (notiPermission === RESULTS.BLOCKED) {
          Alert.alert(
            Strings.PUSH_PERMISSION_REQUEST,
            Strings.PUSH_PERMISSION_REQUEST_CONTENT,
            [
              {
                text: Strings.CANCEL,
                onPress: () => {
                  console.log('Cancel Pressed');
                },
                style: 'cancel',
              },
              {
                text: Strings.OK,
                onPress: () => {
                  openSettings();
                },
                style: 'default',
              },
            ],
            { cancelable: true },
          );
        }
      });
    } else {
      setCountryFromLocation();
    }

    initializeFBPixel();
  }, []);

  return (
    <NavigationContainer theme={navigationTheme} linking={linking}>
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
