import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { horizontalAnimation } from '../../../Components/CustomComponents/horizontalAnimation';
import {
  B2BPageScreen,
  B2BProductListScreen,
  B2BProductPage,
  B2BProductInquiryScreen,
} from '../../../Components/index';
import Constants from '../../../Components/Constants';

const Stack = createStackNavigator();

function B2BNavigator({ route, navigation }) {
  return (
    <Stack.Navigator screenOptions={horizontalAnimation}>
      <Stack.Screen
        name="B2BPage"
        component={B2BPageScreen}
        initialParams={route.params}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="B2BProductList"
        component={B2BProductListScreen}
        options={{
          headerShown: false,
        }}
        initialParams={{
          listOf: Constants.PRODUCT_LIST_CATEGORY,
          ...route.params,
        }}
      />

      <Stack.Screen
        name="B2BProductPage"
        component={B2BProductPage}
        initialParams={route.params}
        options={{
          headerShown: false,
          tabBarVisible: false,
        }}
      />

      <Stack.Screen
        name="B2BProductInquiry"
        component={B2BProductInquiryScreen}
        options={{
          headerShown: true,
          title: 'B2B Product Inquiry',
          headerTitleStyle: {
            fontSize: 20,
            fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
          },
          headerTintColor: Constants.TIER_COLORS.ARTISAN,
        }}
      />
    </Stack.Navigator>
  );
}

export default B2BNavigator;
