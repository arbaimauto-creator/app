import * as React from 'react';
import T from './Constants/DesignTokens';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { SectionGrid } from 'react-native-super-grid';
import { TabBar, TabView } from 'react-native-tab-view';
import Constants from './Constants';
import Strings from './Strings';
import VideoListItemView from './VideoListItemView';
import { LoadingView } from './Views';

const initialLayout = { width: Dimensions.get('window').width - 20 };
const reviewCount = [50, 50, 100, 50, 10, 10, 10, 10, 10, 10, 10, 10];

export default function ReviewsTabView(props) {
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState(props.tabs);
  const [data, setData] = React.useState(props.data);

  React.useEffect(() => {
    if (!data && props.data) {
      setData(props.data);
    } else if (data && props.data) {
      let newData = data;
      let isChanged = false;
      for (let i = 0; i < Constants.CATEGORY_LIST.length; i++) {
        if (!props.data[Constants.CATEGORY_LIST[i]]) {
          continue;
        }
        const newListLength = props.data[Constants.CATEGORY_LIST[i].key].length;
        const oldListLength = data[Constants.CATEGORY_LIST[i].key].length;
        if (
          newListLength !== oldListLength ||
          props.data[Constants.CATEGORY_LIST[i].key][newListLength - 1].videoId !==
            data[Constants.CATEGORY_LIST[i].key][oldListLength - 1].videoId
        ) {
          newData[Constants.CATEGORY_LIST[i].key] = props.data[Constants.CATEGORY_LIST[i].key];
          isChanged = true;
        }
      }
      if (isChanged) {
        setData(newData);
      }
    }
  }, [data, props]);

  const renderScene = ({ route, jumpTo }) => {
    if (!props.data) {
      return <LoadingView />;
    }
    if (Math.abs(index - routes.indexOf(route)) > 2) {
      return <LoadingView />;
    }
    return (
      <SectionGrid
        itemDimension={Constants.VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_2}
        spacing={Constants.VIDEO_LIST_SPACING}
        sections={[{ title: 'header', data: props.data[route.key] }]}
        renderItem={({ item, index }) => {
          return (
            <VideoListItemView
              key={route.key + '_' + index + '_' + item._id}
              style={{
                height: Constants.VIDEO_GRID_LIST_ITEM_VIEW_HEIGHT_2,
                marginBottom: -20,
              }}
              navigation={props.navigation}
              data={item}
              dataType={route.key}
              dataSortType={'recent'}
              dataList={props.data[route.key]}
            />
          );
        }}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={(section) => (
          <View
            style={{
              height: 20,
              marginTop: 10,
              marginBottom: -5,
              marginHorizontal: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: T.COLORS.INK, fontSize: 15, marginLeft: 5 }}>
                {`${reviewCount[index]}`}
              </Text>
              <Text style={{ color: T.COLORS.INK, fontSize: 15, marginLeft: 2 }}>
                {'+'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: T.COLORS.INK, fontSize: 15 }}>
                {Strings.LATEST_ORDER}
              </Text>
              <FastImage source={require('../Resources/img/iconRenewal/icSortDown22.png')} />
            </View>
          </View>
        )}
        listKey={'ReviewsTabView_' + route.key}
        keyExtractor={(item) => route.key + item.videoId}
        onRefresh={() => {}}
        onEndReached={({ distanceFromEnd }) => {
          if (distanceFromEnd >= 0 && props.data[route.key].length >= 10) {
            props.onVideoListEndReached(route.key);
          }
        }}
        onEndReachedThreshold={0.5}
        refreshing={false}
        ref={props.scrollRef}
      />
    );
  };

  return (
    <TabView
      lazy
      navigationState={{ index, routes }}
      renderScene={renderScene}
      renderLazyPlaceholder={({ route }) => {
        return <LoadingView />;
      }}
      onIndexChange={(idx) => {
        setIndex(idx);
        props.onTabChanged(idx);
      }}
      initialLayout={initialLayout}
      style={styles.container}
      renderTabBar={(props) => (
        <TabBar
          {...props}
          bounces
          scrollEnabled
          tabStyle={{
            width: 'auto',
            padding: 0,
            marginHorizontal: 6,
            marginBottom: -5,
          }}
          indicatorStyle={{ backgroundColor: Constants.COLOR_MAIN, height: 3 }}
          indicatorContainerStyle={{
            marginHorizontal: 10,
            backgroundColor: Constants.COLOR_BACKGROUND_DARK,
          }}
          style={{
            backgroundColor: Constants.COLOR_BACKGROUND_DARK,
            marginBottom: 10,
            paddingHorizontal: 10,
          }}
          renderLabel={({ route, focused }) => {
            return (
              <Text style={focused ? styles.tabBarLabelFocused : styles.tabBarLabel}>
                {route.title}
              </Text>
            );
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
    color: Constants.COLOR_MAIN,
    fontSize: 19,
    fontWeight: 'bold',
  },
  tabBarLabel: {
    color: 'rgb(128, 128, 128)',
    fontSize: 19,
    fontWeight: 'bold',
  },
  divider: {
    height: 0,
    backgroundColor: '#ccc',
    marginTop: 10,
  },
});
