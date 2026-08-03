import {
  NavigationHelpersContext,
  TabActions,
  TabRouter,
  useNavigationBuilder,
  useTheme,
} from '@react-navigation/native';
import * as React from 'react';
import { StyleSheet, Text } from 'react-native';
import { BottomNavigation, DarkTheme, DefaultTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// type Props = MaterialBottomTabNavigationConfig & {
//   state: TabNavigationState,
//   navigation: MaterialBottomTabNavigationHelpers,
//   descriptors: MaterialBottomTabDescriptorMap,
// };

// type Scene = { route: { key: string } };

export default function MyMaterialBottomTabNavigator({
  initialRouteName,
  children,
  screenOptions,
  tabBarStyle,
  contentStyle,
  ...rest
}) {
  const { dark, colors } = useTheme();

  const theme = React.useMemo(() => {
    const t = dark ? DarkTheme : DefaultTheme;

    return {
      ...t,
      colors: {
        ...t.colors,
        ...colors,
        surface: colors.card,
      },
    };
  }, [colors, dark]);

  const { state, navigation, descriptors } = useNavigationBuilder(TabRouter, {
    children,
    screenOptions,
    initialRouteName,
  });

  const focusedRoute = state.routes[state.index];
  const focusedDescriptor = descriptors[focusedRoute.key];
  const focusedOptions = focusedDescriptor.options;
  if (focusedOptions.tabBarVisible === false) {
    rest.barStyle.height = 0;
  }

  return (
    <NavigationHelpersContext.Provider value={navigation}>
      <BottomNavigation
        {...rest}
        theme={theme}
        navigationState={state}
        onIndexChange={(index) => {
          navigation.dispatch({
            ...TabActions.jumpTo(state.routes[index].name),
            target: state.key,
          });
          rest.onIndexChange(index);
        }}
        renderScene={({ route }) => descriptors[route.key].render()}
        renderIcon={({ route, focused, color }) => {
          const { options } = descriptors[route.key];

          if (typeof options.tabBarIcon === 'string') {
            return (
              <MaterialCommunityIcons
                name={options.tabBarIcon}
                color={color}
                size={24}
                style={styles.icon}
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden
              />
            );
          }

          if (typeof options.tabBarIcon === 'function') {
            return options.tabBarIcon({ focused, color });
          }

          return null;
        }}
        renderLabel={({ route, focused, color }) => {
          const { options } = descriptors[route.key];

          if (typeof options.tabBarLabel === 'function') {
            return options.tabBarLabel({ focused, color });
          } else {
            return (
              <Text>
                {options.tabBarLabel !== undefined
                  ? options.tabBarLabel
                  : options.title !== undefined
                    ? options.title
                    : route.name}
              </Text>
            );
          }
        }}
        //barStyle={ descriptors[route.key].barStyle() }
        getLabelText={({ route }) => {
          const { options } = descriptors[route.key];

          return options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;
        }}
        getColor={({ route }) => descriptors[route.key].options.tabBarColor}
        getBadge={({ route }) => descriptors[route.key].options.tabBarBadge}
        getAccessibilityLabel={({ route }) =>
          descriptors[route.key].options.tabBarAccessibilityLabel
        }
        getTestID={({ route }) => descriptors[route.key].options.tabBarTestID}
        onTabPress={({ route, preventDefault }) => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (event.defaultPrevented) {
            preventDefault();
          }
        }}
      />
    </NavigationHelpersContext.Provider>
  );
}

const styles = StyleSheet.create({
  icon: {
    backgroundColor: 'transparent',
  },
});
