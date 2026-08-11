import * as React from 'react';
import T from './Constants/DesignTokens';
import { Text, View, StyleSheet, Dimensions } from 'react-native';

import { TabBar, TabView } from 'react-native-tab-view';

import ProductListItemView from './ProductListItemView.js';
import VideoListItemView from './VideoListItemView.js';
import Constants from './Constants';
import Strings from './Strings';
import Animated from 'react-native-reanimated';
import { useRoute } from '@react-navigation/native';
import { moderateScale } from './utils/scailing.js';

const VideoTabScene = (props) => (
  <View>
    <Animated.FlatList
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      itemDimension={Constants.VIDEO_VERTICAL_LIST_ITEM_VIEW_HEIGHT + 14}
      data={props.videoList}
      renderItem={({ item, idx }) => (
        <VideoListItemView
          key={item._id + idx}
          style={{
            height: Constants.VIDEO_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT + 14,
            paddingVertical: 7,
            paddingHorizontal: 20,
          }}
          navigation={props.navigation}
          data={item}
          type={'list_vertical'}
        />
      )}
      keyExtractor={(item) => item.videoId}
      onRefresh={() => {
        props.onRefresh(0);
      }}
      onEndReached={({ distanceFromEnd }) => {
        if (distanceFromEnd >= 0 && props.videoList.length >= 10 && !props.isVideoListRefreshing) {
          props.onListEndReached(0);
        }
      }}
      onEndReachedThreshold={0.5}
      refreshing={props.isVideoListRefreshing}
    />
  </View>
);

const ProductsTabScene = (props) => {
  return (
    <View>
      <Animated.FlatList
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        itemDimension={Constants.PRODUCT_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT + 14}
        data={props.productList}
        renderItem={({ item, idx }) => (
          <ProductListItemView
            key={item._id + idx}
            navigation={props.navigation}
            data={item}
            style={{
              height: Constants.PRODUCT_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT + 14,
              paddingVertical: 7,
              paddingHorizontal: 20,
            }}
            type={'list_vertical'}
            logonUserId={props.logonUserId}
          />
        )}
        keyExtractor={(item) => item.productId}
        onRefresh={() => {
          props.onRefresh(1);
        }}
        onEndReached={({ distanceFromEnd }) => {
          if (
            distanceFromEnd > 0 &&
            props.productList.length >= 10 &&
            !props.isProductListRefreshing
          ) {
            props.onListEndReached(1);
          }
        }}
        onEndReachedThreshold={0.5}
        refreshing={props.isProductListRefreshing}
      />
    </View>
  );
};

const initialLayout = { width: Dimensions.get('window').width };

export default function BookmarkListTabView(props) {
  const [index, setIndex] = React.useState(0);
  const {
    params: { logonUserId },
  } = useRoute();

  let tabs = [];
  tabs.push({ key: 'video', title: Strings.REVIEWS });
  tabs.push({ key: 'products', title: Strings.PRODUCTS });
  const [routes] = React.useState(tabs);
  const renderScene = ({ route, jumpTo }) => {
    switch (route.key) {
      case 'video':
        return VideoTabScene(props);
      case 'products':
        return ProductsTabScene({ ...props, logonUserId });
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
              case 'video':
                return (
                  <View style={styles.tabBarLabelContainer(focused)}>
                    <Text style={focused ? styles.tabBarLabelFocused : styles.tabBarLabel}>
                      {Strings.REVIEWS}
                    </Text>
                  </View>
                );
              case 'products':
                return (
                  <View style={styles.tabBarLabelContainer(focused)}>
                    <Text style={focused ? styles.tabBarLabelFocused : styles.tabBarLabel}>
                      {Strings.PRODUCTS}
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
  tabBarLabelFocused: {
    color: Constants.COLOR_BACKGROUND_DARK,
    fontSize: moderateScale(16),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
  },
  tabBarLabel: {
    color: T.COLORS.GREY,
    fontSize: moderateScale(16),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
  },
  divider: {
    height: 0,
    backgroundColor: T.COLORS.GREY,
    marginTop: 10,
  },
  tabBarLabelContainer: (focused) => ({
    backgroundColor: focused ? Constants.COLOR_POINT_BLUE : T.COLORS.LINE,
    width: focused ? '150%' : '100%',
    paddingVertical: 10,
    paddingHorizontal: 20,
  }),
});
