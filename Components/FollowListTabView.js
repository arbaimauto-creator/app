import * as React from 'react';
import T from './Constants/DesignTokens';
import { Dimensions, StyleSheet, Text } from 'react-native';

import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { TabBar, TabView } from 'react-native-tab-view';
import UserListItemView from '../screens/UserPageScreen/UserListItemView.js';
import Constants from './Constants';
import Strings from './Strings';
import { moderateScale } from './utils/scailing.js';

const UsersTabScene = (idx, props, data, isRefreshing, onListEndReached) => (
  <Animated.FlatList
    showsHorizontalScrollIndicator={false}
    showsVerticalScrollIndicator={false}
    data={data}
    renderItem={({ item, index }) => (
      <UserListItemView navigation={props.navigation} user={item} key={item._id + index} />
    )}
    keyExtractor={(item, idx) => item.userId + '_' + idx}
    onRefresh={() => {
      props.onRefresh(idx);
    }}
    onEndReached={({ distanceFromEnd }) => {
      if (distanceFromEnd >= 0 && data.length >= 10 && !isRefreshing) {
        onListEndReached(idx);
      }
    }}
    onEndReachedThreshold={0.5}
    refreshing={isRefreshing}
  />
);

const initialLayout = { width: Dimensions.get('window').width };

export default function FollowListTabView(props) {
  const [index, setIndex] = React.useState(0);

  const { followerList, followingList } = props;

  let tabs = [];
  tabs.push({ key: 'follower', title: Strings.FOLLOWERS });
  tabs.push({ key: 'following', title: Strings.FOLLOWING });
  const [routes] = React.useState(tabs);
  const renderScene = ({ route, jumpTo }) => {
    switch (route.key) {
      case 'follower':
        return UsersTabScene(
          0,
          props,
          followerList,
          props.isFollowerListRefreshing,
          props.onListEndReached,
        );
      case 'following':
        return UsersTabScene(
          1,
          props,
          followingList,
          props.isFollowingListRefreshing,
          props.onListEndReached,
        );
    }
  };

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={(index) => {
        setIndex(index);
        props.onIndexChanged(index);
      }}
      initialLayout={initialLayout}
      style={styles.container}
      renderTabBar={(props) => (
        <TabBar
          {...props}
          {...Constants.TAB_VIEW_STYLE_PROPS}
          tabStyle={{ width: 'auto', margin: -10 }}
          style={{ backgroundColor: T.COLORS.LINE }}
          indicatorStyle={{ backgroundColor: T.COLORS.LINE }}
          indicatorContainerStyle={{ borderBottomColor: T.COLORS.LINE }}
          renderLabel={({ route, focused }) => {
            switch (route.key) {
              case 'follower':
                return (
                  <View style={styles.tabBarLabelContainer(focused)}>
                    <Text style={focused ? styles.tabBarLabelFocused : styles.tabBarLabel}>
                      {Strings.FOLLOWERS}
                    </Text>
                  </View>
                );
              case 'following':
                return (
                  <View style={styles.tabBarLabelContainer(focused)}>
                    <Text style={focused ? styles.tabBarLabelFocused : styles.tabBarLabel}>
                      {Strings.FOLLOWING}
                    </Text>
                  </View>
                );
            }
          }}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  scene: {
    flex: 1,
  },
  tabLabelStyle: {
    color: T.COLORS.INK,
  },
  tabBarLabelFocused: {
    color: Constants.COLOR_BACKGROUND_DARK,
    fontSize: moderateScale(16),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
  },
  tabBarLabel: {
    color: T.COLORS.INK,
    fontSize: moderateScale(16),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
  },
  tabBarLabelContainer: (focused) => ({
    backgroundColor: focused ? Constants.COLOR_POINT_BLUE : T.COLORS.LINE,
    width: focused ? '110%' : '100%',
    paddingVertical: 10,
    paddingHorizontal: 20,
  }),
  divider: {
    height: 0,
    backgroundColor: '#ccc',
    marginTop: 10,
  },
});
