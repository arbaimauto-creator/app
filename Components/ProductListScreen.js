import React from 'react';
import {
  Alert,
  LayoutAnimation,
  NativeModules,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { SectionGrid } from 'react-native-super-grid';
import APIprovider from './APIprovider';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import ProductListItemView from './ProductListItemView';
import Strings from './Strings';
import SortingKeywordSelector, {
  PRODUCT_SORTING_KEYWORD_LIST,
} from './Views/SortingKeywordSelector';
import { moderateScale } from './utils/scailing';


const { UIManager } = NativeModules;
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default class ProductListScreen extends React.Component {
  constructor(props) {
    super(props);

    const { storeUserId, totalProductCount = 0 } = this.props.route.params;

    let title = null;
    let sortType;
    let sortKeyword = Strings.SORTING_KEYWORD_RECENT;
    switch (this.props.route.params.listOf) {
      case Constants.PRODUCT_LIST_OF_SELLER:
        title = Strings.MORE_BY(this.props.route.params.sellerName);
        break;
      case Constants.PRODUCT_LIST_RELATED_TO_PRODUCT:
        title = Strings.YOU_MAY_ALSO_LIKE;
        break;
      case Constants.PRODUCT_LIST_CATEGORY:
        for (let i = 0; i < Constants.CATEGORY_LIST.length; i++) {
          if (this.props.route.params.categoryCode === Constants.CATEGORY_LIST[i].key) {
            title = Constants.CATEGORY_LIST[i].title;
          }
        }
        break;
      case Constants.PRODUCT_LIST_PROMOTION:
      case Constants.PRODUCT_LIST_RECOMMENDED:
      case Constants.PRODUCT_LIST_SPECIAL_PRICE:
        title = Strings.PROMOTIONS;
        break;
      case Constants.PRODUCT_LIST_NEW:
        title = Strings.NEW_PRODUCTS;
        sortType = Constants.PRODUCT_LIST_SORT_TYPE.RECENT;
        sortKeyword = Strings.SORTING_KEYWORD_RECENT;
        break;
      case Constants.PRODUCT_LIST_BEST_SELLING:
        title = Strings.BEST_SELLING_PRODUCTS;
        sortType = Constants.PRODUCT_LIST_SORT_TYPE.SELL_COUNT;
        sortKeyword = Strings.SORTING_KEYWORD_SELL_COUNT;
        break;
      case Constants.PRODUCT_LIST_MANY_REVIEWS:
        title = Strings.MANY_REVIEWS_PRODUCTS;
        sortType = Constants.PRODUCT_LIST_SORT_TYPE.REVIEW_COUNT;
        sortKeyword = Strings.SORTING_KEYWORD_REVIEW_COUNT;
        break;
      default:
        title = Strings.PRODUCT_LIST;
        break;
    }
    // this.setState({ sortType: sortType, activeSortingItem: sortKeyword });

    this.state = {
      listOf: this.props.route.params.listOf,
      totalCount: this.props.route.params.totalCount,
      productList: this.props.route.params.productList,
      sellerId: this.props.route.params.sellerId,
      sellerName: this.props.route.params.sellerName,
      productId: this.props.route.params.productId,
      searchKeyword: this.props.route.params.searchKeyword,
      isRefreshing: false,
      isShownFilterSelector: false,
      activeSortingItem: sortKeyword || Strings.SORTING_KEYWORD_RECENT,
      sortType,
      productEntireCount: this.props.route.params.productCount,
      title,
    };

    this.productListSectionGridRef = React.createRef();
  }
  loadData(sortType) {
    switch (this.props.route.params.listOf) {
      case Constants.PRODUCT_LIST_OF_SELLER:
        APIprovider.getUserUploadProductList(this.state.sellerId)
          .then(this.getProductListCallback.bind(this))
          .catch((err) => {
            Alert.alert(
              Strings.FAILED_TO_LOAD_PRODUCTS,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
          });
        break;
      case Constants.PRODUCT_LIST_RELATED_TO_PRODUCT:
        APIprovider.getProductListRelatedToProduct(this.state.productId)
          .then(this.getProductListCallback.bind(this))
          .catch((err) => {
            Alert.alert(
              Strings.FAILED_TO_LOAD_PRODUCTS,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
          });
        break;
      case Constants.PRODUCT_LIST_CATEGORY:
        APIprovider.getCategorizedProductList(this.props.route.params.categoryCode, sortType)
          .then(this.getProductListCallback.bind(this))
          .catch((err) => {
            Alert.alert(
              Strings.FAILED_TO_LOAD_PRODUCTS,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
          });
        break;
      case Constants.PRODUCT_LIST_PROMOTION:
      case Constants.PRODUCT_LIST_RECOMMENDED:
      case Constants.PRODUCT_LIST_SPECIAL_PRICE:
        APIprovider.getProductList(this.state.listOf, sortType, this.state.searchKeyword)
          .then(this.getProductListCallback.bind(this))
          .catch((err) => {
            Alert.alert(
              Strings.FAILED_TO_LOAD_PRODUCTS,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
          });
        break;
      case Constants.PRODUCT_LIST_NEW:
        APIprovider.getProductList(this.state.listOf, sortType, this.state.searchKeyword)
          .then(this.getProductListCallback.bind(this))
          .catch((err) => {
            Alert.alert(
              Strings.FAILED_TO_LOAD_PRODUCTS,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
          });
        break;
      default:
        APIprovider.getProductList(this.state.listOf, sortType, this.state.searchKeyword)
          .then(this.getProductListCallback.bind(this))
          .catch((err) => {
            Alert.alert(
              Strings.FAILED_TO_LOAD_PRODUCTS,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
          });
        break;
    }
  }

  componentDidMount() {
    // let title = null;
    // let sortType;
    // let sortKeyword = Strings.SORTING_KEYWORD_RECENT;
    // switch (this.props.route.params.listOf) {
    //   case Constants.PRODUCT_LIST_OF_SELLER:
    //     title = Strings.MORE_BY(this.props.route.params.sellerName);
    //     break;
    //   case Constants.PRODUCT_LIST_RELATED_TO_PRODUCT:
    //     title = Strings.YOU_MAY_ALSO_LIKE;
    //     break;
    //   case Constants.PRODUCT_LIST_CATEGORY:
    //     for (let i = 0; i < Constants.CATEGORY_LIST.length; i++) {
    //       if (this.props.route.params.categoryCode === Constants.CATEGORY_LIST[i].key) {
    //         title = Constants.CATEGORY_LIST[i].title;
    //       }
    //     }
    //     break;
    //   case Constants.PRODUCT_LIST_PROMOTION:
    //   case Constants.PRODUCT_LIST_RECOMMENDED:
    //   case Constants.PRODUCT_LIST_SPECIAL_PRICE:
    //     title = Strings.PROMOTIONS;
    //     break;
    //   case Constants.PRODUCT_LIST_NEW:
    //     title = Strings.NEW_PRODUCTS;
    //     sortType = Constants.PRODUCT_LIST_SORT_TYPE.RECENT;
    //     sortKeyword = Strings.SORTING_KEYWORD_RECENT;
    //     break;
    //   case Constants.PRODUCT_LIST_BEST_SELLING:
    //     title = Strings.BEST_SELLING_PRODUCTS;
    //     sortType = Constants.PRODUCT_LIST_SORT_TYPE.SELL_COUNT;
    //     sortKeyword = Strings.SORTING_KEYWORD_SELL_COUNT;
    //     break;
    //   case Constants.PRODUCT_LIST_MANY_REVIEWS:
    //     title = Strings.MANY_REVIEWS_PRODUCTS;
    //     sortType = Constants.PRODUCT_LIST_SORT_TYPE.REVIEW_COUNT;
    //     sortKeyword = Strings.SORTING_KEYWORD_REVIEW_COUNT;
    //     break;
    //   default:
    //     title = Strings.PRODUCT_LIST;
    //     break;
    // }
    // this.setState({ sortType: sortType, activeSortingItem: sortKeyword });

    if (!this.state.productList) {
      this.loadData(this.state.sortType);
    }
    this.props.navigation.setOptions({
      headerStyle: {
        backgroundColor: Constants.COLOR_BACKGROUND_DARK,
        height: 90, //70,
        shadowOpacity: 0,
      },
      title: this.state.title,
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
      headerLeft: () => HeaderLeftBackButton({ navigation: this.props.navigation }),
    });
  }

  getProductListCallback(data) {
    this.setState({
      productList: data.productList,
      productEntireCount: data.entireCount,
    });
  }

  getAdditionalProductListCallback(data) {
    this.setState({
      productList: [...this.state.productList, ...data.productList],
      isRefreshing: false,
    });
  }

  onListEndReached = function () {
    this.setState({ isRefreshing: true });
    const offset = this.state.productList[this.state.productList.length - 1].createdAt;
    const skip = this.state.productList.length;
    const limit = 20;
    switch (this.props.route.params.listOf) {
      case Constants.PRODUCT_LIST_OF_SELLER:
        APIprovider.getUserUploadProductList(this.state.sellerId, offset, skip, limit)
          .then(this.getAdditionalProductListCallback.bind(this))
          .catch((err) => {
            Alert.alert(
              Strings.FAILED_TO_LOAD_PRODUCTS,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
            this.setState({ isRefreshing: false });
          });
        break;
      case Constants.PRODUCT_LIST_RELATED_TO_PRODUCT:
        APIprovider.getProductListRelatedToProduct(
          this.state.productId,
          this.state.sortType,
          offset,
          skip,
          limit,
        )
          .then(this.getAdditionalProductListCallback.bind(this))
          .catch((err) => {
            Alert.alert(
              Strings.FAILED_TO_LOAD_PRODUCTS,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
            this.setState({ isRefreshing: false });
          });
        break;
      case Constants.PRODUCT_LIST_CATEGORY:
        APIprovider.getCategorizedProductList(
          this.props.route.params.categoryCode,
          this.state.sortType,
          offset,
          skip,
          limit,
        )
          .then(this.getAdditionalProductListCallback.bind(this))
          .catch((err) => {
            Alert.alert(
              Strings.FAILED_TO_LOAD_PRODUCTS,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
            this.setState({ isRefreshing: false });
          });
        break;
      case Constants.PRODUCT_LIST_PROMOTION:
      case Constants.PRODUCT_LIST_RECOMMENDED:
      case Constants.PRODUCT_LIST_SPECIAL_PRICE:
        APIprovider.getProductList(
          this.state.listOf,
          this.state.sortType,
          this.state.searchKeyword,
          offset,
          skip,
          limit,
        )
          .then(this.getAdditionalProductListCallback.bind(this))
          .catch((err) => {
            Alert.alert(
              Strings.FAILED_TO_LOAD_PRODUCTS,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
            this.setState({ isRefreshing: false });
          });
        break;
      default:
        APIprovider.getProductList(
          this.state.listOf,
          this.state.sortType,
          this.state.searchKeyword,
          offset,
          skip,
          limit,
        )
          .then(this.getAdditionalProductListCallback.bind(this))
          .catch((err) => {
            Alert.alert(
              Strings.FAILED_TO_LOAD_PRODUCTS,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
            this.setState({ isRefreshing: false });
          });
        break;
    }
  };

  render() {
    return (
      <SafeAreaView style={styles.safeAreaContainer}>
        <View style={styles.container}>
          <SectionGrid
            ref={this.productListSectionGridRef}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled
            itemDimension={Constants.PRODUCT_GRID_LIST_ITEM_VIEW_WIDTH}
            spacing={Constants.PRODUCT_LIST_SPACING}
            sections={[
              {
                title: 'ProductList',
                data: this.state.productList,
              },
            ]}
            renderSectionHeader={({ section }) => {
              const sortDownIcon = require('../Resources/img/iconRenewal/icSortDown22.png');
              const sortUpIcon = require('../Resources/img/iconRenewal/icSortUp22.png');
              if (!this.state.productEntireCount) {
                return <View style={{ marginTop: 10 }} />;
              } else {
                return (
                  <View
                    style={{
                      backgroundColor: Constants.COLOR_BACKGROUND_DARK,
                      paddingHorizontal: 10,
                      paddingBottom: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ fontSize: 15, color: Constants.TIER_COLORS.OPERATOR }}>
                      {Strings.DisplayEntireProductCount(this.state.productEntireCount)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        this.setState({
                          isShownFilterSelector: !this.state.isShownFilterSelector,
                        });
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 15, color: Constants.COLOR_POINT_BLUE }}>
                          {this.state.activeSortingItem}
                        </Text>
                        <FastImage
                          source={this.state.isShownFilterSelector ? sortUpIcon : sortDownIcon}
                        />
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              }
            }}
            renderItem={({ item, idx }) => (
              <ProductListItemView
                key={item._id + idx}
                navigation={this.props.navigation}
                data={item}
                style={{
                  height: Constants.PRODUCT_GRID_LIST_ITEM_VIEW_HEIGHT,
                  marginTop: -10,
                }}
                type={'grid'}
                logonUserId={this.props.route.params.logonUserId}
              />
            )}
            keyExtractor={(item) => item.productId}
            onRefresh={() => {}}
            onEndReached={({ distanceFromEnd }) => {
              if (
                this.state.productList &&
                this.state.productList.length > 10 &&
                this.state.productList.length < this.state.productEntireCount &&
                !this.state.isRefreshing
              ) {
                this.onListEndReached();
              }
            }}
            onScroll={() => {
              LayoutAnimation.easeInEaseOut();
              this.setState({
                isShownFilterSelector: false,
              });
            }}
            onEndReachedThreshold={2}
            refreshing={this.state.isRefreshing}
          />
          {this.state.isShownFilterSelector && (
            <SortingKeywordSelector
              items={PRODUCT_SORTING_KEYWORD_LIST}
              activeItem={this.state.activeSortingItem}
              onItemPress={(selectedItem) => {
                this.setState({
                  activeSortingItem: selectedItem,
                  isShownFilterSelector: false,
                });
                const sortType =
                  selectedItem === Strings.SORTING_KEYWORD_DISCOUNT_RATE
                    ? Constants.PRODUCT_LIST_SORT_TYPE.DISCOUNT_RATE
                    : selectedItem === Strings.SORTING_KEYWORD_SELL_COUNT
                    ? Constants.PRODUCT_LIST_SORT_TYPE.SELL_COUNT
                    : selectedItem === Strings.SORTING_KEYWORD_REVIEW_COUNT
                    ? Constants.PRODUCT_LIST_SORT_TYPE.REVIEW_COUNT
                    : selectedItem === Strings.SORTING_KEYWORD_RECENT
                    ? Constants.PRODUCT_LIST_SORT_TYPE.RECENT
                    : undefined;

                this.productListSectionGridRef?.current?.scrollToLocation({
                  sectionIndex: 0,
                  itemIndex: 0,
                });

                this.loadData(sortType);
                this.setState({ sortType: sortType });
                // LayoutAnimation.easeInEaseOut();
              }}
              top={38}
              marginRight={20}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  container: {
    padding: 10,
  },
});
