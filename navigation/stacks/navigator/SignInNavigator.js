import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import headerBackButton from '../../../Components/CustomComponents/headerBackButton';
import {
  SignInScreen,
  AgreementToSignUpScreen,
  SignUpScreen,
  SignUpProfilePicScreen,
  SignUpIntroductionScreen,
} from '../../../Components/index';

const Stack = createStackNavigator();

function SignInNavigator({ route, navigation }) {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
        initialParams={route.params}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AgreementToSignUp"
        component={AgreementToSignUpScreen}
        initialParams={route.params}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        initialParams={route.params}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="SignUpProfilePic"
        component={SignUpProfilePicScreen}
        initialParams={route.params}
        options={{
          ...headerBackButton,
        }}
      />
      <Stack.Screen
        name="SignUpIntroduction"
        component={SignUpIntroductionScreen}
        initialParams={route.params}
        options={{
          ...headerBackButton,
        }}
      />
    </Stack.Navigator>
  );
}

export default SignInNavigator;
