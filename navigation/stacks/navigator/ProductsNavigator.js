import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { horizontalAnimation } from '../../../Components/CustomComponents/horizontalAnimation';
import { StoreScreen, ProductPageScreen } from '../../../Components/index'; 

const Stack = createStackNavigator();

function ProductsNavigator({ route, navigation }) {
  return (
    <Stack.Navigator screenOptions={horizontalAnimation}>
      <Stack.Screen
        name="StoreMain"
        component={StoreScreen}
        initialParams={route.params}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ProductPage"
        component={ProductPageScreen} 
        initialParams={route.params}
        options={{
          headerShown: false, 
        }}
      />
    </Stack.Navigator>
  );
}

export default ProductsNavigator;
