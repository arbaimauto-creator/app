import { useRoute } from '@react-navigation/native';
import * as React from 'react';
import { Alert, Dimensions, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-elements';
import { FlatGrid } from 'react-native-super-grid';
import { TabBar, TabView } from 'react-native-tab-view';
import IconEntypo from 'react-native-vector-icons/Entypo';
import IconFeather from 'react-native-vector-icons/Feather';
import IconMaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import APIprovider from '../../Components/APIprovider';
import Constants from '../../Components/Constants';
import ProductListItemView from '../../Components/ProductListItemView.js';
import Strings from '../../Components/Strings';
import VideoListItemView from '../../Components/VideoListItemView.js';

const VideoTabScene = (props, data, isRefreshing, onListEndReached) => (
  <View>
    <FlatGrid
      itemDimension={Constants.VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_2}
      spacing={Constants.VIDEO_LIST_SPACING}
      data={data}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <VideoListItemView
          style={{ height: Constants.VIDEO_GRID_LIST_ITEM_VIEW_HEIGHT_2 }}
          navigation={props.navigation}
          data={item}
          noCreator
        />
      )}
      onEndReached={({ distanceFromEnd }) => {
        console.log('onEndReached()', distanceFromEnd);
        if (distanceFromEnd >= 0 && data.length >= 10 && !isRefreshing) {
          onListEndReached();
        }
      }}
      onEndReachedThreshold={0.5}
    />
    {data.length < props.tabData.videoCount && (
      <Button
        title={<IconFeather size={18} name="more-vertical" color="#666" />}
        type="clear"
        titleStyle={{ color: '#666' }}
        containerStyle={{ paddingBottom: 10 }}
        onPress={onListEndReached}
      />
    )}
  </View>
);

const ProductsTabScene = (props, data, isRefreshing, onListEndReached, logonUserId) => (
  <View>
    <FlatGrid
      itemDimension={Constants.PRODUCT_GRID_LIST_ITEM_VIEW_WIDTH}
      spacing={2}
      data={data}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <ProductListItemView
          navigation={props.navigation}
          data={item}
          style={{ height: Constants.PRODUCT_GRID_LIST_ITEM_VIEW_HEIGHT }}
          type={'grid'}
          logonUserId={logonUserId}
        />
      )}
      onEndReached={({ distanceFromEnd }) => {
        if (distanceFromEnd >= 0 && data.length >= 10 && !isRefreshing) {
          onListEndReached();
        }
      }}
      onEndReachedThreshold={0.5}
    />
    {data.length < props.tabData.productCount && (
      <Button
        title={<IconFeather size={18} name="more-vertical" color="#666" />}
        type="clear"
        titleStyle={{ color: '#666' }}
        containerStyle={{ paddingBottom: 10 }}
        onPress={onListEndReached}
      />
    )}
  </View>
);

const initialLayout = { width: Dimensions.get('window').width };

export default function UserPageTabView(props) {
  const userUploadList = {
    videoList: props.tabData.userUploadVideo,
    productList: props.tabData.userUploadProduct,
  };
  const [index, setIndex] = React.useState(0);
  const [isVideoListRefreshing, setIsVideoListRefreshing] = React.useState(false);
  const [isProductListRefreshing, setIsProductListRefreshing] = React.useState(false);
  const [videoList, setVideoList] = React.useState([]);
  const [productList, setProductList] = React.useState([]);
  //    const [, forceUpdate] = React.useReducer(x => x + 1, 0)

  const {
    params: { logonUserId },
  } = useRoute();

  if (
    userUploadList.hasOwnProperty('videoList') &&
    videoList.length === 0 &&
    userUploadList.videoList.length > 0
  ) {
    setVideoList(userUploadList.videoList);
  }
  if (
    userUploadList.hasOwnProperty('productList') &&
    productList.length === 0 &&
    userUploadList.productList.length > 0
  ) {
    setProductList(userUploadList.productList);
  }

  const onVideoListEndReached = function () {
    setIsVideoListRefreshing(true);
    const offset = userUploadList.videoList[userUploadList.videoList.length - 1].createdAt;
    APIprovider.getUserUploadVideoList(
      props.tabData.userId,
      offset,
      userUploadList.videoList.length,
    )
      .then(getAdditionalVideoListCallback)
      .catch((err) => {
        console.log(err);
        Alert.alert(
          Strings.FAILED_TO_LOAD_DATA,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
        setIsVideoListRefreshing(false);
      });
  };

  const onProductListEndReached = function () {
    setIsProductListRefreshing(true);
    const offset = userUploadList.productList[userUploadList.productList.length - 1].createdAt;
    const skip = userUploadList.productList.length;
    APIprovider.getUserUploadProductList(props.tabData.userId, offset, skip)
      .then(getAdditionalProductListCallback)
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_TO_LOAD_DATA,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
        setIsProductListRefreshing(false);
      });
  };

  const getAdditionalVideoListCallback = function (data) {
    setVideoList([...videoList, ...data.videoList]);
    setIsVideoListRefreshing(false);
    //      forceUpdate()
  };

  const getAdditionalProductListCallback = function (data) {
    setProductList([...productList, ...data.productList]);
    setIsProductListRefreshing(false);
    //      forceUpdate()
  };

  let tabs = [];
  if (userUploadList.hasOwnProperty('videoList') && userUploadList.videoList.length > 0) {
    tabs.push({ key: 'video', title: Strings.REVIEWS });
  }
  if (userUploadList.hasOwnProperty('productList') && userUploadList.productList.length > 0) {
    tabs.push({ key: 'products', title: Strings.PRODUCTS });
  }
  const [routes] = React.useState(tabs);

  if (tabs.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          height: 300,
        }}
      >
        <Text>{Strings.NO_UPLOAD}</Text>
      </View>
    );
  } else {
    const renderScene = ({ route, jumpTo }) => {
      switch (route.key) {
        case 'video':
          return VideoTabScene(props, videoList, isVideoListRefreshing, onVideoListEndReached);
        case 'products':
          return ProductsTabScene(
            props,
            productList,
            isProductListRefreshing,
            onProductListEndReached,
            logonUserId,
          );
      }
    };

    return (
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        style={styles.container}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: Constants.COLOR_MAIN }}
            labelStyle={styles.tabLabelStyle}
            indicatorContainerStyle={{ backgroundColor: 'white' }}
            renderLabel={({ route, focused }) => {
              switch (route.key) {
                case 'video':
                  return (
                    <View style={styles.tabBarLabelContainer}>
                      <IconMaterialCommunityIcons name={'video'} size={26} color={'#000'} />
                      <Text style={{ marginLeft: 10 }}>{Strings.REVIEWS}</Text>
                    </View>
                  );
                case 'products':
                  return (
                    <View style={styles.tabBarLabelContainer}>
                      <IconEntypo name={'shop'} size={22} color={'#000'} />
                      <Text style={{ marginLeft: 10 }}>{Strings.PRODUCTS}</Text>
                    </View>
                  );
              }
            }}
          />
        )}
      />
    );
  }
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
    color: Constants.COLOR_BACKGROUND_DARK,
  },
  tabBarLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 0,
    backgroundColor: '#ccc',
    marginTop: 10,
  },
});
