import { useRoute } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { Shadow } from 'react-native-shadow-2';
import APIprovider from '../../Components/APIprovider';
import Constants from '../../Components/Constants';
import HeaderLeftBackButton from '../../Components/CustomComponents/headerBackButton/headerLeftBackButton';
import Utils, { getKRWPerUSD, isGuestUser } from '../../Components/utils';
import { horizontalScale, moderateScale, verticalScale } from '../../Components/utils/scailing';
import { PricePrivate } from '../../Components/Views/ProductItemVerticalView';
import { Context } from '../../Contexts';
import { FlagButton } from 'react-native-country-picker-modal';
const getCategoryTitle = (categoryCode) => {
  for (let i = 0; i < Constants.CATEGORY_LIST.length; i++) {
    if (categoryCode === Constants.CATEGORY_LIST[i].key) {
      return Constants.CATEGORY_LIST[i].title;
    }
  }
  return '';
};

function B2BPrice({ product, style }) {
  const global = useContext(Context);
  const {
    params: { logonUserId, KRWPerUSD },
  } = useRoute();

  if (isGuestUser(logonUserId)) {
    return <PricePrivate style={style} />;
  }

  if (product.discountPrice > 0) {
    return (
      <View style={styles.priceContainer}>
        <View style={styles.discountPriceContainer}>
          <Text style={styles.discountRate}>-{(product.discountRate * 100).toFixed(0)}%</Text>
          <Text style={styles.discountPrice}>
            {Utils.displayPrice(product.discountPrice, global.state.region, KRWPerUSD)}
            <Text style={styles.originalPrice}>
              {Utils.displayPrice(product.price, global.state.region, KRWPerUSD)}
            </Text>
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Text style={styles.price}>
      {Utils.displayPrice(product.price, global.state.region, KRWPerUSD)}
    </Text>
  );
}

const HeaderRight = ({ navigation }) => (
  <TouchableOpacity style={{ marginRight: 26 }} onPress={() => navigation.navigate('Search')}>
    <FastImage
      style={{ width: 24, height: 24 }}
      source={require('../../Resources/img/iconRenewal/search-black.png')}
    />
  </TouchableOpacity>
);

function B2BProductListScreen({ navigation, route }) {
  const { categoryCode } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [KRWPerUSD, setKRWPerUSD] = useState(1300);
  const [productCount, setProductCount] = useState(0);

  const fetchAllProducts = useCallback(async () => {
    setLoading(true);
    setProducts([]);
    try {
      const initialResponse = await APIprovider.getCategorizedProductList(
        categoryCode,
        undefined,
        undefined,
        0,
        1,
      );

      const totalCount = initialResponse.entireCount;
      setProductCount(totalCount);

      if (totalCount === 0) {
        setHasMore(false);
        setProducts([]);
        return;
      }
      const batchSize = 20;
      const batchCount = Math.ceil(totalCount / batchSize);

      const fetchPromises = Array.from({ length: batchCount }, (_, index) => {
        const skip = index * batchSize;
        return APIprovider.getCategorizedProductList(
          categoryCode,
          undefined,
          undefined,
          skip,
          batchSize,
        );
      });

      const responses = await Promise.all(fetchPromises);
      const allProducts = responses.flatMap((response) => response.productList || []);
      const uniqueProducts = Array.from(
        new Map(allProducts.map((item) => [item._id, item])).values(),
      );

      setProducts(uniqueProducts);
      setHasMore(uniqueProducts.length < totalCount);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [categoryCode]);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      const rate = await getKRWPerUSD();
      setKRWPerUSD(rate);
    };
    fetchExchangeRate();
  }, []);

  useEffect(() => {
    const title = getCategoryTitle(categoryCode);
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: Constants.COLOR_BACKGROUND_DARK,
        height: 90,
        shadowOpacity: 0,
      },
      title: title,
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
      headerLeft: () => HeaderLeftBackButton({ navigation }),
      headerRight: () => <HeaderRight navigation={navigation} />,
    });
  }, [categoryCode, navigation]);

  useEffect(() => {
    if (categoryCode) {
      fetchAllProducts();
    }
  }, [categoryCode, fetchAllProducts]);

  const resetAndFetchProducts = async () => {
    setRefreshing(true);
    setProducts([]);
    setHasMore(true);
    try {
      await fetchAllProducts();
    } finally {
      setRefreshing(false);
    }
  };

  const onEndReached = async () => {
    if (loading || !hasMore || products.length >= productCount) return;
    await new Promise((resolve) => setTimeout(resolve, 300));
    await fetchAllProducts();
  };

  const renderFooter = () => {
    if (!loading || !hasMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Constants.TIER_COLORS.ARTISAN} />
      </View>
    );
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() =>
        navigation.navigate('B2BProductPage', {
          productId: item._id,
          logonUserId: route.params.logonUserId,
          KRWPerUSD,
        })
      }
    >
      <Shadow distance={3} style={styles.shadowContainer}>
        <FastImage
          style={styles.productImage}
          source={{ uri: item.thumbnailUrl }}
          resizeMode={FastImage.resizeMode.cover}
        />
        <View style={styles.flagContainer}>
          <FlagButton
            withCountryNameButton={false}
            countryCode={item.countryCode ?? 'KR'}
            flagSize={18}
          />
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.sellerName} numberOfLines={1}>
            {item.seller?.name}
          </Text>
          <B2BPrice product={item} />
        </View>
      </Shadow>
    </TouchableOpacity>
  );

  const keyExtractor = (item, index) => `${item._id}-${index}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={1}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={resetAndFetchProducts}
            tintColor={Constants.TIER_COLORS.ARTISAN}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={2}
        ListFooterComponent={loading ? renderFooter : null}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        initialNumToRender={10}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(15),
    borderBottomWidth: 1,
    borderBottomColor: Constants.COLOR_BACKGROUND_LIGHT,
  },
  flagContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    zIndex: 1,
  },
  backButton: {
    width: moderateScale(24),
    height: moderateScale(24),
  },
  headerText: {
    fontSize: moderateScale(18),
    color: Constants.TIER_COLORS.ARTISAN,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.BOLD,
  },
  headerRight: {
    width: moderateScale(24),
  },
  listContainer: {
    padding: moderateScale(10),
    alignItems: 'center',
  },
  productCard: {
    width: horizontalScale(320),
    height: verticalScale(320),
    marginVertical: moderateScale(15),
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  shadowContainer: {
    width: '100%',
    borderRadius: moderateScale(10),
    backgroundColor: Constants.COLOR_BACKGROUND_LIGHT,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '65%',
    backgroundColor: Constants.COLOR_BACKGROUND_LIGHT,
  },
  productInfo: {
    padding: moderateScale(10),
    height: '35%',
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: moderateScale(14),
    color: Constants.TIER_COLORS.ARTISAN,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    marginBottom: verticalScale(4),
  },
  sellerName: {
    fontSize: moderateScale(12),
    color: Constants.TIER_COLORS.ARTISAN,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.LIGHT_3,
    opacity: 0.8,
  },
  priceContainer: {
    marginTop: 4,
  },
  discountPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountRate: {
    color: Constants.COLOR_POINT_BLUE,
    fontSize: moderateScale(15),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.BOLD,
    marginRight: horizontalScale(6),
  },
  discountPrice: {
    fontSize: moderateScale(15),
    color: Constants.TIER_COLORS.ARTISAN,
    marginRight: horizontalScale(10),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.BOLD,
  },
  originalPrice: {
    fontSize: moderateScale(13),
    color: Constants.TIER_COLORS.OPERATOR,
    textDecorationLine: 'line-through',
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
  },
  price: {
    fontSize: moderateScale(15),
    color: Constants.TIER_COLORS.ARTISAN,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.BOLD,
    marginTop: 4,
  },
  footer: {
    padding: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default B2BProductListScreen;
