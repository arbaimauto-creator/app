import { useRoute, useScrollToTop } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { ScrollView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { Shadow } from 'react-native-shadow-2';
import { SectionGrid } from 'react-native-super-grid';
import { SceneMap, TabBar, TabView } from 'react-native-tab-view';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMoreProducts,
  fetchMoreStoreMain,
  fetchProducts,
  fetchStoreMain,
} from '../slices/product';
import Header from './Common/Header';
import Constants from './Constants';
import StoreBanner from './CustomComponents/EventBanner/StoreBanner';
import ProductListItemView from './ProductListItemView.js';
import Strings, { getLanguage } from './Strings';
import SortingKeywordSelector, {
  PRODUCT_SORTING_KEYWORD_LIST,
} from './Views/SortingKeywordSelector';
import { horizontalScale, moderateScale, verticalScale } from './utils/scailing';
import { getKRWPerUSD } from './utils';

const sortDownIcon = require('../Resources/img/iconRenewal/icSortDown22.png');
const sortUpIcon = require('../Resources/img/iconRenewal/icSortUp22.png');

const eventTypeObject = {
  [Constants.PRODUCT_LIST_PROMOTION_EVENT]: 'refund',
  [Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT]: Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT,
};

export default function StoreScreenWrapper(props) {
  const ref = React.useRef(null);
  useScrollToTop(ref);
  return <NewStoreScreen {...props} scrollRef={ref} />;
}

function StoreMainHeaderCategories({ productMain, navigation, logonUserId }) {
  const [categories, setCategories] = useState([]);
  function sortCategory() {
    const categorieObjects = [];
    Object.keys(productMain.data.category).forEach((category, index) => {
      if (category === 'undefined' || productMain.data?.category[category].entireCount === 0) {
        return null;
      }
      const categoryObject = Constants.CATEGORY_LIST.find((c) => c.key === category);
      const categoryIndex = Constants.CATEGORY_LIST.findIndex((c) => c.key === category);

      if (!categoryObject) {
        return;
      }
      categorieObjects.push({ index: categoryIndex, category, categoryObject: categoryObject });
    });
    const sortedCategorieObjects = categorieObjects.sort((a, b) => a.index - b.index);

    setCategories(sortedCategorieObjects);
  }

  useEffect(() => {
    sortCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView
      showsHorizontalScrollIndicator={false}
      horizontal
      style={{
        marginHorizontal: horizontalScale(20),
        height: verticalScale(85),
      }}
    >
      {categories.map(({ category, categoryObject }, index) => {
        return (
          <View key={category.key + '-' + index} style={{ marginRight: horizontalScale(20) }}>
            <TouchableOpacity
              style={{ height: 54, width: 54, backgroundColor: Constants.COLOR_BACKGROUND_DARK }}
              onPress={() =>
                navigation.navigate('ProductList', {
                  listOf: Constants.PRODUCT_LIST_CATEGORY,
                  categoryCode: category,
                  logonUserId,
                  // productList: productMain.data?.category[category].productList,
                  // productCount: productMain.data?.category[category].entireCount,
                })
              }
            >
              <View
                style={{
                  borderRadius: 14,
                  // borderWidth: 1,
                  borderColor: '#3a3a3a',
                  justifyContent: 'center',
                  width: 54,
                  height: 54,
                }}
              >
                <FastImage
                  style={{
                    alignSelf: 'center',
                    width: moderateScale(24),
                    height: moderateScale(24),
                  }}
                  source={categoryObject?.deactiveIcon}
                />
              </View>

              <Text
                style={{
                  textAlign: 'center',
                  color: Constants.TIER_COLORS.ARTISAN,
                  fontSize: moderateScale(13),
                  fontFamily: Constants.CUSTOM_FONTS.SCDREAM.LIGHT_3,
                  // paddingTop: 5,
                }}
              >
                {categoryObject?.title}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

function StoreMainProductBoxMoreButton({ listTitle, setIndex }) {
  const findTabIndex = () => {
    const tabIndex = storeIndex.findIndex((store) => store === listTitle);
    return tabIndex !== -1 ? tabIndex : 0;
  };

  return (
    <TouchableOpacity
      onPress={() => {
        const tabIndex = findTabIndex();
        setIndex(tabIndex);
      }}
    >
      <Shadow
        distance={0.5}
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          height: verticalScale(45),
          borderRadius: 14,
          backgroundColor: 'white',
        }}
        containerStyle={{
          marginTop: verticalScale(0),
          marginBottom: horizontalScale(30),
          marginHorizontal: horizontalScale(20),
        }}
        stretch={true}
      >
        <Text
          style={{
            fontSize: moderateScale(16),
            fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
            color: Constants.TIER_COLORS.ARTISAN,
          }}
        >
          {Strings.MORE}
        </Text>
      </Shadow>
    </TouchableOpacity>
  );
}

function StoreMainProductBox({
  listTitle,
  productList,
  setIndex,
  navigation,
  fetchDataStoreMain,
  fetchMoreDataStoreMain,
  logonUserId,
  KRWPerUSD,
}) {
  const route = useRoute();

  return (
    <View>
      <SectionGrid
        listKey={listTitle}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        style={{
          marginHorizontal: 10,
        }}
        itemDimension={Constants.VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_2}
        spacing={moderateScale(Constants.VIDEO_LIST_SPACING)}
        sections={[
          {
            title: 'ProductList',
            data: productList,
          },
        ]}
        renderSectionHeader={() => {
          return (
            <View
              style={{
                ...styles.sectionContainer,
                marginBottom: verticalScale(20),
                marginHorizontal: horizontalScale(10),
              }}
            >
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                onPress={() => {
                  const tabIndex = storeIndex.findIndex((store) => store === listTitle);
                  setIndex(tabIndex);
                }}
              >
                <Text
                  style={{
                    fontSize: moderateScale(20),
                    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
                    color: Constants.TIER_COLORS.ARTISAN,
                  }}
                >
                  {listTitle}
                </Text>
                <FastImage
                  style={styles.sectionTitleMoreIcon}
                  source={require('../Resources/img/iconRenewal/icCommonTitle20W.png')}
                />
              </TouchableOpacity>
            </View>
          );
        }}
        renderItem={({ item, idx }) => {
          return (
            <ProductListItemView
              route={route}
              key={item._id + idx}
              navigation={navigation}
              data={item}
              style={{
                height: Constants.PRODUCT_GRID_LIST_ITEM_VIEW_HEIGHT,
                marginTop: -10,
              }}
              type={'grid'}
              fetchData={() => fetchDataStoreMain()}
              logonUserId={logonUserId}
              KRWPerUSD={KRWPerUSD}
            />
          );
        }}
        keyExtractor={(item) => item._id}
      />
      <StoreMainProductBoxMoreButton listTitle={listTitle} setIndex={setIndex} />
    </View>
  );
}

const StoreHome = ({ route }) => {
  const {
    navigation,
    route: {
      params: { logonUserId },
    },
  } = route.props;

  const dispatch = useDispatch();
  const productMain = useSelector((state) => state?.product.productMain);

  const [KRWPerUSD, setKRWPerUSD] = useState(1300);
  useEffect(() => {
    async function getCurrency() {
      const currency = await getKRWPerUSD();
      setKRWPerUSD(currency);
    }

    getCurrency();
  }, []);
  useEffect(() => {
    dispatch(fetchStoreMain());
  }, [dispatch]);

  function fetchDataStoreMain() {
    dispatch(fetchStoreMain());
  }

  function fetchMoreDataStoreMain({ screenType, listType, sortType, skip, eventType }) {
    dispatch(fetchMoreStoreMain({ screenType, listType, sortType, skip, limit: 8, eventType }));
  }

  if (productMain?.error) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.FlatList
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor={Constants.TIER_COLORS.ARTISAN}
            refreshing={productMain.loading}
            onRefresh={() => {
              dispatch(fetchStoreMain());
            }}
          />
        }
        ListHeaderComponent={
          !productMain?.loading ? (
            <View style={{ marginBottom: verticalScale(80) }}>
              <StoreBanner
                navigation={navigation}
                props={route.props}
                eventBanner={productMain.data.eventBanner}
                setIndex={route.setIndex}
              />
              <StoreMainHeaderCategories
                productMain={productMain}
                navigation={navigation}
                logonUserId={logonUserId}
              />
              {/* 240206 TODO: server side control needed */}
              {/* {productMain.data[Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT] &&
              productMain.data[Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT].length ? (
                <StoreMainProductBox
                  logonUserId={logonUserId}
                  setIndex={route.setIndex}
                  listTitle={Strings.STORE_SCREEN_CATEGORIES.GOOGLE_PROMOTION_EVENT}
                  productList={productMain.data[
                    Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT
                  ].filter((product) => {
                    return product.seller.sellerStatus === Constants.SELLER_STATUS.APPROVED;
                  })}
                  navigation={navigation}
                  fetchMoreDataStoreMain={() =>
                    fetchMoreDataStoreMain({
                      screenType: Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT,
                      listType: Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT,
                      skip: productMain.data[Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT].length,
                      eventType: Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT,
                    })
                  }
                  fetchDataStoreMain={() => {
                    fetchDataStoreMain();
                    fetchData({
                      dispatch,
                      screenType: Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT,
                      listType: Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT,
                      eventType: Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT,
                    });
                  }}
                />
              ) : null} */}
              {/*  240608 대표님 요청 100% 환불 주석처리 */}
              {/* {productMain.data[Constants.PRODUCT_LIST_PROMOTION_EVENT] &&
              productMain.data[Constants.PRODUCT_LIST_PROMOTION_EVENT].length ? (
                <StoreMainProductBox
                  logonUserId={logonUserId}
                  setIndex={route.setIndex}
                  listTitle={Strings.STORE_SCREEN_CATEGORIES.REFUND_EVENT}
                  productList={productMain.data[Constants.PRODUCT_LIST_PROMOTION_EVENT].filter(
                    (product) => {
                      return product.seller.sellerStatus === Constants.SELLER_STATUS.APPROVED;
                    },
                  )}
                  navigation={navigation}
                  fetchMoreDataStoreMain={() =>
                    fetchMoreDataStoreMain({
                      screenType: Constants.PRODUCT_LIST_PROMOTION_EVENT,
                      listType: Constants.PRODUCT_LIST_PROMOTION_EVENT,
                      skip: productMain.data[Constants.PRODUCT_LIST_PROMOTION_EVENT].length,
                      eventType: 'refund',
                    })
                  }
                  fetchDataStoreMain={() => {
                    fetchDataStoreMain();
                    fetchData({
                      dispatch,
                      screenType: Constants.PRODUCT_LIST_PROMOTION_EVENT,
                      listType: Constants.PRODUCT_LIST_PROMOTION_EVENT,
                      eventType: 'refund',
                    });
                  }}
                  KRWPerUSD={KRWPerUSD}
                />
              ) : null} */}
              {productMain?.data[Constants?.PRODUCT_LIST_NEW] &&
              productMain?.data[Constants?.PRODUCT_LIST_NEW].length ? (
                <StoreMainProductBox
                  logonUserId={logonUserId}
                  setIndex={route.setIndex}
                  listTitle={Strings.STORE_SCREEN_CATEGORIES.NEW}
                  productList={
                    productMain?.data[Constants?.PRODUCT_LIST_NEW] !== undefined
                      ? productMain?.data[Constants?.PRODUCT_LIST_NEW].filter((product) => {
                          return product.seller?.sellerStatus === Constants.SELLER_STATUS.APPROVED;
                        })
                      : []
                  }
                  navigation={navigation}
                  fetchDataStoreMain={() => {
                    fetchDataStoreMain();
                    fetchData({
                      dispatch,
                      screenType: Constants.PRODUCT_LIST_NEW,
                      listType: Constants.PRODUCT_LIST_NEW,
                    });
                  }}
                  fetchMoreDataStoreMain={() =>
                    fetchMoreDataStoreMain({
                      screenType: Constants.PRODUCT_LIST_NEW,
                      listType: Constants.PRODUCT_LIST_NEW,
                      sortType: Constants.PRODUCT_LIST_SORT_TYPE.RECENT,
                      skip: productMain.data[Constants.PRODUCT_LIST_NEW].length,
                    })
                  }
                  KRWPerUSD={KRWPerUSD}
                />
              ) : null}
              {productMain.data[Constants.PRODUCT_LIST_SPECIAL_PRICE] &&
              productMain.data[Constants.PRODUCT_LIST_SPECIAL_PRICE].length ? (
                <StoreMainProductBox
                  logonUserId={logonUserId}
                  setIndex={route.setIndex}
                  listTitle={Strings.PROMOTIONS}
                  productList={productMain.data[Constants.PRODUCT_LIST_SPECIAL_PRICE].filter(
                    (product) => {
                      return product.seller.sellerStatus === Constants.SELLER_STATUS.APPROVED;
                    },
                  )}
                  navigation={navigation}
                  fetchDataStoreMain={() => {
                    fetchDataStoreMain();
                    fetchData({
                      dispatch,
                      screenType: Constants.PRODUCT_LIST_SPECIAL_PRICE,
                      listType: Constants.PRODUCT_LIST_SPECIAL_PRICE,
                    });
                  }}
                  fetchMoreDataStoreMain={() =>
                    fetchMoreDataStoreMain({
                      screenType: Constants.PRODUCT_LIST_SPECIAL_PRICE,
                      listType: Constants.PRODUCT_LIST_SPECIAL_PRICE,
                      skip: productMain.data[Constants.PRODUCT_LIST_SPECIAL_PRICE].length,
                    })
                  }
                  KRWPerUSD={KRWPerUSD}
                />
              ) : null}
              {productMain.data[Constants.PRODUCT_LIST_BEST_SELLING] &&
              productMain.data[Constants.PRODUCT_LIST_BEST_SELLING].length ? (
                <StoreMainProductBox
                  logonUserId={logonUserId}
                  setIndex={route.setIndex}
                  listTitle={Strings.BEST_SELLING_PRODUCTS}
                  productList={productMain.data[Constants.PRODUCT_LIST_BEST_SELLING].filter(
                    (product) => {
                      return product.seller.sellerStatus === Constants.SELLER_STATUS.APPROVED;
                    },
                  )}
                  navigation={navigation}
                  fetchDataStoreMain={() => {
                    fetchDataStoreMain();
                    fetchData({
                      dispatch,
                      screenType: Constants.PRODUCT_LIST_BEST_SELLING,
                      listType: Constants.PRODUCT_LIST_BEST_SELLING,
                    });
                  }}
                  fetchMoreDataStoreMain={() =>
                    fetchMoreDataStoreMain({
                      screenType: Constants.PRODUCT_LIST_BEST_SELLING,
                      listType: Constants.PRODUCT_LIST_BEST_SELLING,
                      sortType: Constants.PRODUCT_LIST_SORT_TYPE.SELL_COUNT,
                      skip: productMain.data[Constants.PRODUCT_LIST_BEST_SELLING].length,
                    })
                  }
                  KRWPerUSD={KRWPerUSD}
                />
              ) : null}
              {productMain.data[Constants.PRODUCT_LIST_MANY_REVIEWS] &&
              productMain.data[Constants.PRODUCT_LIST_MANY_REVIEWS].length ? (
                <StoreMainProductBox
                  logonUserId={logonUserId}
                  setIndex={route.setIndex}
                  listTitle={Strings.MANY_REVIEWS_PRODUCTS}
                  productList={productMain.data[Constants.PRODUCT_LIST_MANY_REVIEWS].filter(
                    (product) => {
                      return product.seller.sellerStatus === Constants.SELLER_STATUS.APPROVED;
                    },
                  )}
                  navigation={navigation}
                  fetchDataStoreMain={() => {
                    fetchDataStoreMain();
                    fetchData({
                      dispatch,
                      screenType: Constants.PRODUCT_LIST_MANY_REVIEWS,
                      listType: Constants.PRODUCT_LIST_MANY_REVIEWS,
                    });
                  }}
                  fetchMoreDataStoreMain={() =>
                    fetchMoreDataStoreMain({
                      screenType: Constants.PRODUCT_LIST_MANY_REVIEWS,
                      listType: Constants.PRODUCT_LIST_MANY_REVIEWS,
                      sortType: Constants.PRODUCT_LIST_SORT_TYPE.REVIEW_COUNT,
                      skip: productMain.data[Constants.PRODUCT_LIST_MANY_REVIEWS].length,
                    })
                  }
                  KRWPerUSD={KRWPerUSD}
                />
              ) : null}
            </View>
          ) : null
        }
      />
    </View>
  );
};

const SortedProduct = ({
  navigation,
  listTitle,
  productList,
  entireCount,
  isRefresh,
  _fetchData,
  _fetchMoreData,
  sortType,
  setSortType,
  activeSortingItem,
  setActiveSortingItem,
  isShownFilterSelector,
  setShownFilterSelector,
  isPromotion,
  dispatch,
  logonUserId,
  KRWPerUSD,
}) => {
  const sectionGridRef = useRef(null);
  const route = useRoute();

  const [onEndReachedCalledDuringMomentum, setOnEndReachedCalledDuringMomentum] = useState(false);

  return (
    <View style={{ ...styles.container, marginTop: verticalScale(18) }}>
      <SectionGrid
        ref={sectionGridRef}
        refreshControl={
          <RefreshControl
            tintColor={Constants.TIER_COLORS.ARTISAN}
            refreshing={isRefresh}
            onRefresh={() => {
              _fetchData({ _sortType: sortType });
            }}
          />
        }
        listKey={listTitle}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        style={{ marginHorizontal: 10 }}
        itemDimension={Constants.VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_2}
        spacing={moderateScale(Constants.VIDEO_LIST_SPACING)}
        sections={[
          {
            title: 'productList',
            // data: productList,
            data: productList.filter((product) => {
              return product.seller?.sellerStatus === Constants.SELLER_STATUS.APPROVED;
            }),
          },
        ]}
        renderSectionHeader={({ section }) => {
          if (!entireCount && !isPromotion) {
            return <View style={{ marginTop: 10 }} />;
          } else {
            return (
              <View
                style={{
                  backgroundColor: Constants.COLOR_BACKGROUND_DARK,
                  paddingHorizontal: 10,
                  paddingBottom: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text
                  style={{
                    fontSize: moderateScale(20),
                    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
                    color: Constants.TIER_COLORS.ARTISAN,
                  }}
                >
                  {listTitle}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShownFilterSelector(!isShownFilterSelector);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      style={{
                        fontSize: 15,
                        color: Constants.COLOR_POINT_BLUE,
                        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
                      }}
                    >
                      {activeSortingItem}
                    </Text>
                    <FastImage source={isShownFilterSelector ? sortUpIcon : sortDownIcon} />
                  </View>
                </TouchableOpacity>
              </View>
            );
          }
        }}
        renderItem={({ item, idx }) => {
          return (
            <ProductListItemView
              route={route}
              key={item._id + idx}
              navigation={navigation}
              data={item}
              style={{
                height: Constants.PRODUCT_GRID_LIST_ITEM_VIEW_HEIGHT,
                marginTop: -10,
              }}
              type={'grid'}
              isShownFilterSelector={isShownFilterSelector}
              fetchData={() => {
                dispatch(fetchStoreMain());
                _fetchData({ _sortType: sortType });
              }}
              logonUserId={logonUserId}
              KRWPerUSD={KRWPerUSD}
            />
          );
        }}
        keyExtractor={(item) => item._id}
        onEndReachedThreshold={0.1}
        onMomentumScrollBegin={() => setOnEndReachedCalledDuringMomentum(false)}
        onEndReached={async ({ distanceFromEnd }) => {
          if (
            productList.length > 10 &&
            productList.length < entireCount &&
            !onEndReachedCalledDuringMomentum
          ) {
            console.log('onEndReached', productList.length, entireCount, 'sortType');
            _fetchMoreData();
            setOnEndReachedCalledDuringMomentum(true);
          }
        }}
      />
      {isShownFilterSelector && (
        <SortingKeywordSelector
          top={28}
          items={PRODUCT_SORTING_KEYWORD_LIST}
          activeItem={activeSortingItem}
          onItemPress={(selectedItem) => {
            setActiveSortingItem(selectedItem);
            setShownFilterSelector(false);

            const selectedSortType =
              selectedItem === Strings.SORTING_KEYWORD_DISCOUNT_RATE
                ? Constants.PRODUCT_LIST_SORT_TYPE.DISCOUNT_RATE
                : selectedItem === Strings.SORTING_KEYWORD_SELL_COUNT
                  ? Constants.PRODUCT_LIST_SORT_TYPE.SELL_COUNT
                  : selectedItem === Strings.SORTING_KEYWORD_REVIEW_COUNT
                    ? Constants.PRODUCT_LIST_SORT_TYPE.REVIEW_COUNT
                    : selectedItem === Strings.SORTING_KEYWORD_RECENT
                      ? Constants.PRODUCT_LIST_SORT_TYPE.RECENT
                      : undefined;

            sectionGridRef?.current?.scrollToLocation({
              sectionIndex: 0,
              itemIndex: 0,
            });

            _fetchData({ _sortType: selectedSortType });
            setSortType(selectedSortType);
          }}
        />
      )}
    </View>
  );
};

function fetchData({ dispatch, sortType, screenType, listType, eventType }) {
  dispatch(
    fetchProducts({
      screenType,
      listType,
      sortType,
      skip: 0,
      limit: 16,
      eventType,
    }),
  );
}

function fetchMoreData({ dispatch, sortType, screenType, skip, listType, eventType }) {
  dispatch(
    fetchMoreProducts({
      screenType,
      listType,
      sortType,
      skip,
      limit: 16,
      eventType,
    }),
  );
}

function CategoryProducts({ route }) {
  const sortTypeByRouteKey = {
    [Constants.PRODUCT_LIST_SPECIAL_PRICE]: Constants.PRODUCT_LIST_SORT_TYPE.DISCOUNT_RATE,
    [Constants.PRODUCT_LIST_NEW]: Constants.PRODUCT_LIST_SORT_TYPE.RECENT,
    [Constants.PRODUCT_LIST_BEST_SELLING]: Constants.PRODUCT_LIST_SORT_TYPE.SELL_COUNT,
    [Constants.PRODUCT_LIST_MANY_REVIEWS]: Constants.PRODUCT_LIST_SORT_TYPE.REVIEW_COUNT,
  };

  const {
    navigation,
    route: {
      params: { logonUserId },
    },
  } = route.props;

  const dispatch = useDispatch();
  const categoryProduct = useSelector((state) => state.product[route.key]);

  const [activeSortingItem, setActiveSortingItem] = useState(Strings.SORTING_KEYWORD_RECENT);
  const [isShownFilterSelector, setShownFilterSelector] = useState(false);
  const [sortType, setSortType] = useState(sortTypeByRouteKey[route.key]);
  const [KRWPerUSD, setKRWPerUSD] = useState(1300);

  useEffect(() => {
    if (!categoryProduct.data?.length) {
      fetchData({
        dispatch,
        screenType: route.key,
        sortType,
        eventType: eventTypeObject[route.key] || '',
      });
    }
  }, [dispatch, categoryProduct, route.key, sortType]);

  useEffect(() => {
    async function getCurrency() {
      const currency = await getKRWPerUSD();
      setKRWPerUSD(currency);
    }

    getCurrency();
  }, []);

  if (!categoryProduct.data?.length) {
    return null;
  }

  return (
    <SortedProduct
      logonUserId={logonUserId}
      dispatch={dispatch}
      navigation={navigation}
      listTitle={route.title}
      productList={categoryProduct.data}
      entireCount={categoryProduct.count}
      isRefresh={categoryProduct.loading}
      _fetchData={({ _sortType }) =>
        fetchData({
          dispatch,
          listType: route.key,
          screenType: route.key,
          sortType: _sortType,
          eventType: eventTypeObject[route.key] || '',
        })
      }
      sortType={sortType}
      setSortType={setSortType}
      activeSortingItem={activeSortingItem}
      setActiveSortingItem={setActiveSortingItem}
      isShownFilterSelector={isShownFilterSelector}
      setShownFilterSelector={setShownFilterSelector}
      _fetchMoreData={() =>
        fetchMoreData({
          dispatch,
          listType: route.key,
          screenType: route.key,
          sortType,
          skip: categoryProduct.data.length,
          eventType: eventTypeObject[route.key] || '',
        })
      }
      KRWPerUSD={KRWPerUSD}
    />
  );
}

const renderScene = SceneMap({
  [Constants.PRODUCT_LIST_HOME]: StoreHome,
  [Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT]: CategoryProducts,
  [Constants.PRODUCT_LIST_NEW]: CategoryProducts,
  [Constants.PRODUCT_LIST_PROMOTION_EVENT]: CategoryProducts,
  [Constants.PRODUCT_LIST_BEST_SELLING]: CategoryProducts,
  [Constants.PRODUCT_LIST_SPECIAL_PRICE]: CategoryProducts,
  [Constants.PRODUCT_LIST_MANY_REVIEWS]: CategoryProducts,
});

// 탭 5개 → 3개 (Home/NEW/Best) — Promotions·Popular 콘텐츠는 Home 섹션에 이미 존재
const storeIndexOrigin = [
  '',
  // Strings.STORE_SCREEN_CATEGORIES.GOOGLE_PROMOTION_EVENT,
  // 240608 대표님 요청 100% 환불 주석처리
  // Strings.STORE_SCREEN_CATEGORIES.REFUND_EVENT,
  Strings.STORE_SCREEN_CATEGORIES.NEW,
  Strings.BEST_SELLING_PRODUCTS,
];

let storeIndex = [...storeIndexOrigin];

const getStoreRoutesOrigin = (props, setIndex) => [
  {
    key: Constants.PRODUCT_LIST_HOME,
    title: Strings.STORE_SCREEN_CATEGORIES.HOME,
    props,
    setIndex,
  },
  // {
  //   key: Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT,
  //   title: Strings.STORE_SCREEN_CATEGORIES.GOOGLE_PROMOTION_EVENT,
  //   props,
  // },
  // 240608 대표님 요청 100% 환불 주석처리
  // {
  //   key: Constants.PRODUCT_LIST_PROMOTION_EVENT,
  //   title: Strings.STORE_SCREEN_CATEGORIES.REFUND_EVENT,
  //   props,
  // },
  { key: Constants.PRODUCT_LIST_NEW, title: Strings.STORE_SCREEN_CATEGORIES.NEW, props },
  // 탭 축소: SPECIAL_PRICE(Promotions)·MANY_REVIEWS(Popular) 탭 제거 — Home 섹션에서 접근
  {
    key: Constants.PRODUCT_LIST_BEST_SELLING,
    title: Strings.STORE_SCREEN_CATEGORIES.BEST_SELLING,
    props,
  },
];

function NewStoreScreen(props) {
  const layout = useWindowDimensions();

  const [index, setIndex] = React.useState(0);
  const [routes, setRoutes] = React.useState(getStoreRoutesOrigin(props, setIndex));
  // const [storeIndex, setStoreIndex] = useState(storeIndexOrigin);

  const productMain = useSelector((state) => state?.product.productMain);

  useEffect(() => {
    if (!productMain.loading && productMain.data) {
      if (
        !productMain.data[Constants.PRODUCT_LIST_PROMOTION_EVENT] ||
        !productMain.data[Constants.PRODUCT_LIST_PROMOTION_EVENT].length
      ) {
        setRoutes(routes.filter((route) => route.key !== Constants.PRODUCT_LIST_PROMOTION_EVENT));
        // splice는 (a) findIndex -1이면 마지막 원소를 지우고 (b) 재진입마다 배열이
        // 계속 줄어드는 문제가 있어 원본에서 filter로 다시 계산한다
        storeIndex = storeIndexOrigin.filter(
          (idx) => idx !== Strings.STORE_SCREEN_CATEGORIES.REFUND_EVENT,
        );
      } else if (
        !productMain.data[Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT] ||
        !productMain.data[Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT].length
      ) {
        setRoutes(
          routes.filter((route) => route.key !== Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT),
        );
        storeIndex = storeIndexOrigin.filter(
          (idx) => idx !== Strings.STORE_SCREEN_CATEGORIES.GOOGLE_PROMOTION_EVENT,
        );
      } else {
        setRoutes(getStoreRoutesOrigin(props, setIndex));
        // setStoreIndex(storeIndexOrigin);
        storeIndex = [...storeIndexOrigin];
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productMain.loading, productMain.data]);

  return (
    <SafeAreaView style={{ ...styles.container, backgroundColor: Constants.TIER_COLORS.GIVER }}>
      <View style={styles.container}>
        <Header
          navigation={props.navigation}
          screenTitle={Strings.STORE}
          titleSize={getLanguage() === 'en' ? { fontSize: 24 } : {}}
        />
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={(tabBarProps) => (
            <TabBar
              scrollEnabled
              {...tabBarProps}
              tabStyle={{ width: 'auto', margin: -10 }}
              style={{ backgroundColor: Constants.TIER_COLORS.EXPLORER }}
              indicatorStyle={{ backgroundColor: Constants.TIER_COLORS.EXPLORER }}
              indicatorContainerStyle={{ borderBottomColor: Constants.TIER_COLORS.EXPLORER }}
            />
          )}
          commonOptions={{
            label: ({ route, labelText, focused, color }) => {
              switch (route.key) {
                default:
                  return (
                    <View style={styles.tabBarLabelContainer(focused)}>
                      <Text style={focused ? styles.tabBarLabelFocused : styles.tabBarLabel}>
                        {route.title}
                      </Text>
                    </View>
                  );
              }
            },
          }}
        />

        <Shadow distance={50} stretch={true} containerStyle={{ zIndex: 100 }}>
          <View style={{ height: 0.1 }} />
        </Shadow>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },

  promotionSectionContainer: {
    marginTop: 5,
  },
  sectionContainer: {
    marginTop: 15, //35
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subSectionTitle: {
    marginLeft: 20,
    color: '#e6e6e6',
    fontSize: 14,
    fontWeight: 'bold',
  },
  categorySectionTitle: {
    marginLeft: 20,
    color: '#e6e6e6',
    fontSize: 16,
    // fontWeight: 'bold',
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
  sectionTitle: {
    marginLeft: 20,
    marginBottom: 5,
    // fontSize: 19,
    fontSize: 20,
    // fontWeight: 'bold',
    color: '#e6e6e6',
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
  sectionTitleMoreIcon: {
    marginLeft: 5,
    width: 12,
    height: 20,
  },
  sellerPageButton: {
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: Constants.COLOR_GREY,
    justifyContent: 'center',
    height: Constants.PRODUCT_HORIZONTAL_LIST_ITEM_VIEW_WIDTH / 2 - 10,
    marginVertical: 5,
    marginHorizontal: 20,
  },
  sellerButtonLabel: {
    color: '#e6e6e6',
    fontSize: 17,
    fontWeight: 'bold',
  },
  tabBarLabelFocused: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: moderateScale(14),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
  },
  tabBarLabel: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: moderateScale(14),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
  },
  tabBarLabelContainer: (focused) => ({
    backgroundColor: focused ? Constants.COLOR_POINT_BLUE : Constants.COLOR_BACKGROUND_DARK, //Constants.TIER_COLORS.EXPLORER,
    width: focused ? '150%' : '100%',
    paddingVertical: 7.5,
    paddingHorizontal: 20,
  }),
});
