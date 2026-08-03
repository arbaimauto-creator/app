import * as React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { TabBar, TabView } from 'react-native-tab-view';

import Constants from './Constants';

const initialLayout = { width: Dimensions.get('window').width };

export default function CategoryTabView(props) {
  const [index, setIndex] = React.useState(0);

  let tabs = [];
  props.categoryList.forEach((item) => {
    tabs.push({ key: item.key, title: item.title });
  });

  const [routes] = React.useState(tabs);
  const renderScene = ({ route, jumpTo }) => {
    return props.renderScene(route.key);
  };

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      style={[styles.container, props.style]}
      initialLayout={{ width: Dimensions.get('window').width }}
      swipeEnabled={false}
      renderTabBar={(tabBarProps) => (
        <TabBar
          {...tabBarProps}
          style={{
            backgroundColor:
              props.theme === 'dark'
                ? Constants.COLOR_BACKGROUND_DARK
                : Constants.TIER_COLORS.ARTISAN,
          }}
          tabStyle={{ width: 'auto' }}
          scrollEnabled={true}
          indicatorStyle={{ backgroundColor: Constants.COLOR_MAIN }}
          labelStyle={{
            color:
              props.theme === 'dark'
                ? Constants.TIER_COLORS.ARTISAN
                : Constants.COLOR_BACKGROUND_DARK,
          }}
          indicatorContainerStyle={{
            backgroundColor:
              props.theme === 'dark'
                ? Constants.COLOR_BACKGROUND_DARK
                : Constants.TIER_COLORS.ARTISAN,
          }}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  divider: {
    height: 0,
    backgroundColor: '#ccc',
    marginTop: 10,
  },
});
