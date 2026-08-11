import { useRoute, useScrollToTop } from '@react-navigation/native';
import T from './Constants/DesignTokens';
import * as React from 'react';
import { Alert, Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { TabBar, TabView } from 'react-native-tab-view';
import UserListItemView from '../screens/UserPageScreen/UserListItemView.js';
import APIprovider from './APIprovider';
import Constants from './Constants';
import ProductListItemView from './ProductListItemView.js';
import Strings from './Strings';
import { getKRWPerUSD } from './utils';
import {moderateScale, verticalScale } from './utils/scailing';
import VideoListItemView from './VideoListItemView.js';

const VideoTabScene = (props, data, isRefreshing, onListEndReached, refScroll) => {
  if (data.length === 0) {
    return (
      <View style={styles.emptyMessageContainer}>
        <Text style={styles.emptyMessage}>{Strings.NO_SEARCH_RESULT(props.searchKeyword)}</Text>
      </View>
    );
  }

  return (
    <Animated.FlatList
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      itemDimension={Constants.VIDEO_VERTICAL_LIST_ITEM_VIEW_HEIGHT + 14}
      data={data}
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
      keyExtractor={(item) => item._id}
      onRefresh={() => {}}
      onEndReached={({ distanceFromEnd }) => {
        if (distanceFromEnd >= 0 && data.length >= 10 && !isRefreshing) {
          onListEndReached();
        }
      }}
      onEndReachedThreshold={0.5}
      refreshing={isRefreshing}
      ref={refScroll}
    />
  );
};

const ProductsTabScene = (
  props,
  data,
  isRefreshing,
  onListEndReached,
  onSelected = () => {},
  refScroll,
  logonUserId,
) => {
  if (data.length === 0) {
    return (
      <View style={styles.emptyMessageContainer}>
        <Text style={styles.emptyMessage}>{Strings.NO_SEARCH_RESULT(props.searchKeyword)}</Text>
      </View>
    );
  }
  
  return (
    <Animated.FlatList
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      itemDimension={Constants.PRODUCT_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT + 14}
      data={data}
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
          onPress={() => onSelected(item)}
          logonUserId={logonUserId}
          disableDefaultNavigation={false}
        />
      )}
      keyExtractor={(item) => item._id}
      onRefresh={() => {}}
      onEndReached={({ distanceFromEnd }) => {
        if (distanceFromEnd > 0 && data.length >= 10 && !isRefreshing) {
          onListEndReached();
        }
      }}
      onEndReachedThreshold={0.5}
      refreshing={isRefreshing}
      ref={refScroll}
    />
  );
};

const B2BProductsTabScene = (
  props,
  data,
  isRefreshing,
  onListEndReached,
  onSelected = () => {},
  refScroll,
  logonUserId,
) => {
  const handleB2BProductPress = (item) => {
    props.navigation.navigate('B2B', {
      screen: 'B2BProductPage',
      params: {
        productId: item._id,
        logonUserId,
        KRWPerUSD: props.KRWPerUSD,
      },
    });
  };

  if (data.length === 0) {
    return (
      <View style={styles.emptyMessageContainer}>
        <Text style={styles.emptyMessage}>{Strings.NO_SEARCH_RESULT(props.searchKeyword)}</Text>
      </View>
    );
  }

  return (
    <Animated.FlatList
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      itemDimension={Constants.PRODUCT_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT + 14}
      data={data}
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
          onPress={() => handleB2BProductPress(item)}
          logonUserId={logonUserId}
          disableDefaultNavigation={true}
        />
      )}
      keyExtractor={(item) => item._id}
      onRefresh={() => {}}
      onEndReached={({ distanceFromEnd }) => {
        if (distanceFromEnd > 0 && data.length >= 10 && !isRefreshing) {
          onListEndReached();
        }
      }}
      onEndReachedThreshold={0.5}
      refreshing={isRefreshing}
      ref={refScroll}
    />
  );
};

const UsersTabScene = (props, data, isRefreshing, onListEndReached, refScroll) => {
  if (data.length === 0) {
    return (
      <View style={styles.emptyMessageContainer}>
        <Text style={styles.emptyMessage}>{Strings.NO_SEARCH_RESULT(props.searchKeyword)}</Text>
      </View>
    );
  }
  return (
    <Animated.FlatList
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      data={data}
      renderItem={({ item, index }) => (
        <UserListItemView
          key={item._id + index}
          navigation={props.navigation}
          user={item}
          theme={'dark'}
        />
      )}
      keyExtractor={(item) => item._id}
      onRefresh={() => {}}
      onEndReached={({ distanceFromEnd }) => {
        if (distanceFromEnd >= 0 && data.length >= 10 && !isRefreshing) {
          onListEndReached();
        }
      }}
      onEndReachedThreshold={0.5}
      refreshing={isRefreshing}
      ref={refScroll}
    />
  );
};

const initialLayout = { width: Dimensions.get('window').width };

export default function SearchResultTabView(props) {
  const [index, setIndex] = React.useState(0);
  const [searchKeyword, setSearchKeyword] = React.useState(null);
  const [KRWPerUSD, setKRWPerUSD] = React.useState(1300);

  const [isVideoSearchRefreshing, setIsVideoSearchRefreshing] = React.useState(false);
  const [isProductSearchRefreshing, setIsProductSearchRefreshing] = React.useState(false);
  const [isUserSearchRefreshing, setIsUserSearchRefreshing] = React.useState(false);

  const [videoList, setVideoList] = React.useState([]);
  const [productList, setProductList] = React.useState([]);
  const [userList, setUserList] = React.useState([]);

  const {
    params: { logonUserId },
  } = useRoute();

  const refScrollVideo = React.useRef(null);
  useScrollToTop(refScrollVideo);
  const refScrollProduct = React.useRef(null);
  useScrollToTop(refScrollProduct);
  const refScrollUser = React.useRef(null);
  useScrollToTop(refScrollUser);

  React.useEffect(() => {
    const fetchExchangeRate = async () => {
      const rate = await getKRWPerUSD();
      setKRWPerUSD(rate);
    };
    fetchExchangeRate();
  }, []);

  if (props.searchKeyword !== searchKeyword) {
    setSearchKeyword(props.searchKeyword);
    if (props.tabData.hasOwnProperty('videoList')) {
      setVideoList(props.tabData.videoList);
    }
    if (props.tabData.hasOwnProperty('productList')) {
      setProductList(props.tabData.productList);
    }
    if (props.tabData.hasOwnProperty('userList')) {
      setUserList(props.tabData.userList);
    }
  }

  const onVideoListEndReached = function () {
    setIsVideoSearchRefreshing(true);
    const offset = videoList[videoList.length - 1].createdAt;
    APIprovider.getVideoSearch(props.searchKeyword, offset, videoList.length)
      .then((res) => {
        getAdditionalVideoSearchCallback(res);
        setIsVideoSearchRefreshing(false);
      })
      .catch((err) => {
        console.log(err);
        Alert.alert(
          Strings.FAILED_TO_LOAD_DATA,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
        setIsVideoSearchRefreshing(false);
      });
  };

  const onProductListEndReached = function () {
    setIsProductSearchRefreshing(true);
    const offset = productList[productList.length - 1].createdAt;
    const skip = productList.length;
    APIprovider.getProductSearch(props.searchKeyword, offset, skip)
      .then((res) => {
        getAdditionalProductSearchCallback(res);
        setIsProductSearchRefreshing(false);
      })
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_TO_LOAD_DATA,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
        setIsProductSearchRefreshing(false);
      });
  };

  const onUserListEndReached = function () {
    setIsUserSearchRefreshing(true);
    const offset = userList[userList.length - 1].createdAt;
    APIprovider.getUserSearch(props.searchKeyword, offset)
      .then((res) => {
        getAdditionalUserSearchCallback(res);
        setIsUserSearchRefreshing(false);
      })
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_TO_LOAD_DATA,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
        setIsUserSearchRefreshing(false);
      });
  };

  const getAdditionalVideoSearchCallback = function (data) {
    setVideoList([...videoList, ...data.videoList]);
  };

  const getAdditionalProductSearchCallback = function (data) {
    setProductList([...productList, ...data.productList]);
  };

  const getAdditionalUserSearchCallback = function (newList) {
    setUserList([...userList, ...newList]);
  };

  let tabs = [];
  if (props.tabData.hasOwnProperty('videoList') && props.tabData.videoList.length > 0) {
    tabs.push({ key: 'video', title: Strings.REVIEWS });
  }
  if (props.tabData.hasOwnProperty('productList') && props.tabData.productList.length > 0) {
    tabs.push({ key: 'products', title: Strings.PRODUCTS });
    tabs.push({ key: 'b2bProducts', title: 'B2B Products' });
  }
  if (props.tabData.hasOwnProperty('userList') && props.tabData.userList.length > 0) {
    tabs.push({ key: 'users', title: Strings.USERS });
  }

  const [routes, setRoutes] = React.useState([]);
  if (routes.length !== tabs.length) {
    setRoutes(tabs);
  }

  if (tabs.length === 0) {
    let noResultMessage = '';
    if (searchKeyword === '') {
      noResultMessage = Strings.INPUT_SEARCH_KEYWORD;
    } else {
      noResultMessage = Strings.NO_SEARCH_RESULT(props.searchKeyword);
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyMessage}>{noResultMessage}</Text>
      </View>
    );
  }

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'video':
        return VideoTabScene(
          props,
          videoList,
          isVideoSearchRefreshing,
          onVideoListEndReached,
          refScrollVideo,
        );
      case 'products':
        return ProductsTabScene(
          props,
          productList,
          isProductSearchRefreshing,
          onProductListEndReached,
          props.onSelected,
          refScrollProduct,
          logonUserId,
        );
      case 'b2bProducts':
        return B2BProductsTabScene(
          {
            ...props,
            KRWPerUSD,
          },
          productList,
          isProductSearchRefreshing,
          onProductListEndReached,
          undefined,
          refScrollProduct,
          logonUserId,
        );
      case 'users':
        return UsersTabScene(
          props,
          userList,
          isUserSearchRefreshing,
          onUserListEndReached,
          refScrollUser,
        );
      default:
        return null;
    }
  };

  return (
    <TabView
      sceneContainerStyle={{ marginTop: verticalScale(10) }}
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={initialLayout}
      style={styles.container}
      renderTabBar={(props) => (
        <TabBar
          {...props}
          {...Constants.TAB_VIEW_STYLE_PROPS}
          scrollEnabled={true}
          tabStyle={{ width: 'auto', margin: -10 }}
          style={{ backgroundColor: T.COLORS.LINE }}
          indicatorStyle={{ backgroundColor: T.COLORS.LINE }}
          indicatorContainerStyle={{ borderBottomColor: T.COLORS.LINE }}
          renderLabel={({ route, focused }) => (
            <View style={styles.tabBarLabelContainer(focused)}>
              <Text style={focused ? styles.tabBarLabelFocused : styles.tabBarLabel}>
                {route.title}
              </Text>
            </View>
          )}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
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
  emptyMessageContainer: {
    flex: 1,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  emptyMessage: {
    color: T.COLORS.INK,
    fontSize: 18,
  },
  tabBarLabelContainer: (focused) => ({
    backgroundColor: focused ? Constants.COLOR_POINT_BLUE : T.COLORS.LINE,
    width: focused ? '110%' : '100%',
    paddingVertical: 10,
    paddingHorizontal: 20,
  }),
});
