import * as React from 'react';
import { Alert, Dimensions, StyleSheet, Text, TouchableNativeFeedback, View } from 'react-native';
import Preference from 'react-native-default-preference';
import FastImage from 'react-native-fast-image';
import Animated from 'react-native-reanimated';
import { TabBar, TabView } from 'react-native-tab-view';
import IconMaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import APIprovider from './APIprovider';
import Constants from './Constants';
import MyStoreDashboardView from './MyStoreDashboardView';
import ProductListItemView from './ProductListItemView.js';
import RevenueListScreen from './RevenueListScreen';
import Strings from './Strings';
import { useRoute } from '@react-navigation/native';
import { moderateScale } from './utils/scailing';

function AddingProductButton({ props, onAddedNewProduct }) {
  return (
    <TouchableNativeFeedback
      background={TouchableNativeFeedback.Ripple('#777', true)}
      onPress={() => {
        props.navigation.navigate('AddingNewProduct', {
          onAddedNewProduct: onAddedNewProduct,
        });
      }}
    >
      <View style={styles.addingProductButtonContainer}>
        <FastImage
          style={styles.addingProductButton}
          resizeMode={'contain'}
          source={require('../Resources/img/icBtnCircle68Y.png')}
        />
        <IconMaterialCommunityIcons
          name={'plus'}
          size={42}
          color={'black'}
          style={styles.addingProductButtonIcon}
        />
      </View>
    </TouchableNativeFeedback>
  );
}

const OrdersTabScene = (props) => (
  <View>
    <MyStoreDashboardView parentProps={props} />
  </View>
);

const ProductsTabScene = (
  props,
  productList,
  setProductList,
  isRefreshing,
  onListEndReached,
  onAddedNewProduct,
  forceUpdate,
  logonUserId,
) => (
  <View style={{ flex: 1, paddingVertical: 20 }}>
    {productList.length > 0 ? (
      <Animated.FlatList
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        itemDimension={Constants.PRODUCT_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT + 14}
        data={productList}
        renderItem={({ item, idx }) => (
          <ProductListItemView
            key={item._id + idx}
            navigation={props.navigation}
            data={item}
            onItemRemoved={() => {
              productList.slice(idx, 1);
              setProductList(productList);
            }}
            style={{
              height: Constants.PRODUCT_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT + 14,
              paddingVertical: 7,
              paddingHorizontal: 20,
            }}
            type={'list_vertical'}
            logonUserId={logonUserId}
          />
        )}
        keyExtractor={(item) => item.productId}
        onRefresh={() => { }}
        onEndReached={({ distanceFromEnd }) => {
          if (distanceFromEnd > 0 && productList.length >= 10 && !isRefreshing) {
            onListEndReached();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshing={isRefreshing}
      />
    ) : (
      <View style={styles.emptyMessageContainer}>
        <Text style={styles.emptyMessage}>{Strings.EMPTY_PRODUCT_GUIDE1}</Text>
        <Text style={styles.emptyMessage}>{Strings.EMPTY_PRODUCT_GUIDE2}</Text>
      </View>
    )}
    <AddingProductButton props={props} onAddedNewProduct={onAddedNewProduct} />
  </View>
);

const RevenuesTabScene = ({ props }) => (
  <View style={{ flex: 1 }}>
    <RevenueListScreen {...props} />
  </View>
);

const initialLayout = { width: Dimensions.get('window').width };

export default function MyStoreTabView(props) {
  const [index, setIndex] = React.useState(0);
  const [isDashboardRefreshing, setIsDashboardRefreshing] = React.useState(false);
  const [isProductListRefreshing, setIsProductListRefreshing] = React.useState(false);
  const [productList, setProductList] = React.useState([]);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const {
    params: { logonUserId },
  } = useRoute();

  const onAddedNewProduct = (product) => {
    setProductList([product, ...productList]);
  };

  if (
    props.hasOwnProperty('productList') &&
    (productList.length === 0 || productList !== props.productList) &&
    props.productList.length !== 0
  ) {
    setProductList(props.productList);
  }

  const onProductListEndReached = async function () {
    setIsProductListRefreshing(true);
    const offset = productList[productList.length - 1].createdAt;
    const skip = productList.length;
    const limit = 20;
    const userId = await Preference.get('userId');
    APIprovider.getUserUploadProductList(userId, offset, skip, limit)
      .then(getAdditionalProductListCallback.bind(this))
      .catch((err) => {
        setIsProductListRefreshing(false);
        Alert.alert(
          Strings.FAILED_TO_LOAD_PRODUCTS,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  };

  const getAdditionalProductListCallback = function (data) {
    setProductList([...productList, ...data.productList]);
    setIsProductListRefreshing(false);
  };

  let tabs = [];
  tabs.push({ key: 'orders', title: Strings.ORDERS });
  tabs.push({ key: 'products', title: Strings.PRODUCTS });
  tabs.push({ key: 'revenues', title: Strings.REVENUES });

  const [routes] = React.useState(tabs);

  const renderScene = ({ route, jumpTo }) => {
    switch (route.key) {
      case 'orders':
        return OrdersTabScene(props);
      case 'products':
        return ProductsTabScene(
          props,
          productList,
          setProductList,
          isProductListRefreshing,
          onProductListEndReached,
          onAddedNewProduct,
          forceUpdate,
          logonUserId,
        );
      case 'revenues':
        return RevenuesTabScene(props);
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
          {...Constants.TAB_VIEW_STYLE_PROPS}
          tabStyle={{ width: 'auto', margin: -10 }}
          style={{ backgroundColor: Constants.TIER_COLORS.EXPLORER }}
          indicatorStyle={{ backgroundColor: Constants.TIER_COLORS.EXPLORER }}
          indicatorContainerStyle={{ borderBottomColor: Constants.TIER_COLORS.EXPLORER }}
          renderLabel={({ route, focused }) => {
            return (
              <View style={styles.tabBarLabelContainer(focused)}>
                <Text style={focused ? styles.tabBarLabelFocused : styles.tabBarLabel}>
                  {route.title}
                </Text>
              </View>
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
  tabLabelStyle: {
    color: Constants.TIER_COLORS.ARTISAN,
  },
  tabBarLabelFocused: {
    color: Constants.COLOR_BACKGROUND_DARK,
    fontSize: moderateScale(16),
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
  tabBarLabel: {
    color: Constants.TIER_COLORS.OPERATOR,
    fontSize: moderateScale(16),
    fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM,
  },
  divider: {
    height: 0,
    backgroundColor: '#ccc',
    marginTop: 10,
  },
  addingProductButtonContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 20,
    right: 20,
  },
  addingProductButton: {
    width: 68,
    height: 68,
  },
  addingProductButtonIcon: {
    position: 'absolute',
    width: 42,
    height: 42,
  },
  emptyMessageContainer: {
    flex: 1,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  emptyMessage: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 18,
  },
  tabBarLabelContainer: (focused) => ({
    backgroundColor: focused ? Constants.COLOR_POINT_BLUE : Constants.TIER_COLORS.EXPLORER,
    width: focused ? '150%' : '100%',
    paddingVertical: 10,
    paddingHorizontal: 20,
  }),
});
