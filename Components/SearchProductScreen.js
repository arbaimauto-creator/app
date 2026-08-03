import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  LayoutAnimation,
  NativeModules,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, SearchBar } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import { ActivityIndicator } from 'react-native-paper';
import Animated from 'react-native-reanimated';
// import SearchResultTabView from './SearchResultTabView';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import APIprovider from './APIprovider';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import ProductListItemView from './ProductListItemView';
import Strings from './Strings';
import { getKRWPerUSD } from './utils';

const { UIManager } = NativeModules;
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default class SearchProductScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      typingSearchKeyword: '',
      searchKeyword: '',
      filterType: '',
      tabData: null,
      productList: [],
      isRefreshing: false,
      // isSearching: false,
      isSearching: true,
      typedSearchKeyword: '',
      isShowingExternalLinkGuide: true,
      KRWPerUSD: 1300,
    };
    this.onChangeText = this.onChangeText.bind(this);
  }

  componentDidMount() {
    this.props.navigation.setOptions({
      title: '',
      headerLeft: () => HeaderLeftBackButton({ navigation: this.props.navigation }),
    });

    // this.setState({ isSearching: true });
    APIprovider.getProductList()
      .then((data) => {
        this.getProductSearchCallback(data.productList);
      })
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_TO_LOAD_DATA,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
        this.setState({ isSearching: false });
      });
  }

  getProductSearchList(searchKeyword) {
    this.setState({ isSearching: true });
    APIprovider.getProductSearch(searchKeyword)
      .then((data) => {
        this.getProductSearchCallback(data.productList, searchKeyword);
      })
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_TO_LOAD_DATA,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
        this.setState({ isSearching: false });
      });
  }

  getProductSearchCallback(list, searchKeyword) {
    getKRWPerUSD().then((currency) => {
      this.setState({
        productList: list,
        isSearching: false,
        typedSearchKeyword: searchKeyword,
        KRWPerUSD: currency,
      });
    });

    // this.setState({
    //   productList: list,
    //   isSearching: false,
    //   typedSearchKeyword: searchKeyword,
    // });
  }

  onProductListEndReached() {
    this.setState({ isRefreshing: true });
    const offset = this.state.productList[this.state.productList.length - 1].createdAt;
    const skip = this.state.productList.length;
    const limit = 20;
    APIprovider.getProductSearch(this.state.searchKeyword, offset, skip, limit)
      .then((data) => {
        this.setState({
          productList: [...this.state.productList, ...data.productList],
          isRefreshing: false,
        });
      })
      .catch((err) => {
        console.log(err);
        Alert.alert(
          Strings.FAILED_TO_LOAD_PRODUCTS,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  }

  static navigationOptions = {
    header: Strings.SEARCH_PRODUCT,
  };

  onChangeText(typingSearchKeyword) {
    this.setState({
      typingSearchKeyword,
    });
  }

  onSearchSubmit() {
    const { typingSearchKeyword } = this.state;
    if (typingSearchKeyword.trim() !== '') {
      this.getProductSearchList(typingSearchKeyword);
    }
  }

  onSelected(product) {
    this.props.navigation.push('ProductPage', {
      mode: 'select_to_link',
      productId: product.productId,
      onSelectedToLink: () => {
        this.props.route.params.onSelected(product);
        this.props.navigation.pop();
      },
    });
    return false;
  }

  onPressAddExternalLinkButton() {
    this.props.navigation.navigate('AddExternalProductLink', {
      onAddedExternalProductLink: (product) => {
        this.props.route.params.onSelected(product);
        this.props.navigation.pop();
      },
    });
  }

  // renderSearchResultTab() {
  //   if (this.state.tabData) {
  //     return (
  //       <SearchResultTabView
  //         navigation={this.props.navigation}
  //         tabData={this.state.tabData}
  //         onSelected={this.onSelected.bind(this)}
  //       />
  //     );
  //   }
  // }

  render() {
    const { searchKeyword } = this.state;

    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          style={styles.container}
        >
          <View style={styles.header}>
            <TouchableWithoutFeedback
              onPress={() => {
                this.props.navigation.pop(); // Go back to the previous screen
              }}
            >
              <FastImage
                source={require('../Resources/img/iconRenewal/icHeaderClose22.png')}
                style={styles.closeIcon}
              />
            </TouchableWithoutFeedback>
            <View style={{ flex: 1, paddingLeft: 10 }}>
              <SearchBar
                {...Constants.SEARCH_BAR_COMMON_PROPS}
                ref={(search) => (this.search = search)}
                placeholder={Strings.PRODUCT_SEARCH_GUIDE}
                searchIcon={{
                  icon: 'search',
                  color: Constants.TIER_COLORS.ARTISAN,
                  size: 20,
                  style: {
                    marginLeft: 10,
                    alignSelf: 'center',
                  },
                }}
                cancelIcon={{
                  iconProps: {
                    color: Constants.TIER_COLORS.ARTISAN,
                  },
                }}
                cancelButtonProps={{
                  buttonTextStyle: { display: 'none' },
                  buttonStyle: { marginRight: -10 },
                }}
                showCancel={Platform.OS === 'ios'}
                platform={Platform.OS === 'ios' ? 'ios' : 'default'}
                containerStyle={{
                  width: '100%',
                  backgroundColor: Constants.COLOR_BACKGROUND_DARK,
                  borderWidth: 1,
                  borderColor: Constants.TIER_COLORS.ARTISAN,
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  height: 36,
                  justifyContent: 'center',
                  ...(Platform.OS === 'android'
                    ? {
                        elevation: 2,
                        overflow: 'hidden',
                        marginVertical: 2,
                      }
                    : {}),
                }}
                inputContainerStyle={{
                  backgroundColor: Constants.COLOR_BACKGROUND_DARK,
                  borderBottomWidth: 0,
                  paddingLeft: 8,
                  height: 36,
                  minHeight: 36,
                  alignItems: 'center',
                  ...(Platform.OS === 'android'
                    ? {
                        paddingTop: 0,
                        paddingBottom: 0,
                      }
                    : {}),
                }}
                inputStyle={{
                  color: Constants.TIER_COLORS.ARTISAN,
                  fontSize: 14,
                  height: 36,
                  textAlignVertical: 'center',
                  ...(Platform.OS === 'android'
                    ? {
                        paddingTop: 0,
                        paddingBottom: 0,
                      }
                    : {}),
                }}
                onChangeText={this.onChangeText}
                value={this.state.typingSearchKeyword}
                onCancel={() => {
                  this.props.navigation.pop();
                }}
                onSubmitEditing={this.onSearchSubmit.bind(this)}
              />
            </View>
          </View>
          {this.state.isShowingExternalLinkGuide &&
            this.state.productList.length > 0 &&
            this.state.searchKeyword === '' && (
              <View style={styles.guideContainer}>
                <View style={styles.guideText}>
                  <Text style={styles.guideText}>{Strings.EXTERNAL_LINK_GUIDE_1}</Text>
                  <Text style={styles.guideText}>{Strings.EXTERNAL_LINK_GUIDE_2}</Text>
                </View>
                <Pressable onPress={this.onPressAddExternalLinkButton.bind(this)}>
                  <View
                    style={{
                      padding: 10,
                      paddingRight: 25,
                      borderRadius: 10,
                    }}
                  >
                    <Text style={styles.guideActionText}>{Strings.EXTERNAL_PRODUCT_LINK}</Text>
                  </View>
                </Pressable>
                <Pressable
                  style={styles.removeButton}
                  onPress={() => {
                    LayoutAnimation.linear();
                    this.setState({ isShowingExternalLinkGuide: false });
                  }}
                >
                  <FastImage source={require('../Resources/img/icHeaderSearchCancle16W.png')} />
                </Pressable>
              </View>
            )}
          {this.state.productList.length > 0 ? (
            <Animated.FlatList
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              itemDimension={Constants.PRODUCT_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT + 14}
              data={this.state.productList}
              renderItem={({ item, idx }) => (
                <ProductListItemView
                  key={item._id + idx}
                  navigation={this.props.navigation}
                  data={item}
                  style={{
                    height: Constants.PRODUCT_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT + 14,
                    paddingVertical: 7,
                    paddingHorizontal: 20,
                  }}
                  type={'list_vertical'}
                  onPress={this.onSelected.bind(this)}
                  logonUserId={this.props.route.params.logonUserId}
                  KRWPerUSD={this.state.KRWPerUSD}
                />
              )}
              keyExtractor={(item) => item.productId}
              onRefresh={() => {}}
              onEndReached={({ distanceFromEnd }) => {
                if (
                  distanceFromEnd >= 0 &&
                  this.state.productList.length >= 10 &&
                  !this.state.isRefreshing
                ) {
                  this.onProductListEndReached();
                }
              }}
              onEndReachedThreshold={0.5}
              refreshing={this.state.isRefreshing}
            />
          ) : this.state.isSearching !== true ? (
            <View style={styles.noResultMessageContainer}>
              <Text style={styles.noResultMessage}>
                {this.state.typedSearchKeyword !== ''
                  ? Strings.NO_PRODUCT_SEARCH_RESULT(this.state.typedSearchKeyword)
                  : Strings.PLEASE_ADD_EXTERNAL_PRODUCT_LINK}
              </Text>
              <Button
                title={Strings.NEW_EXTERNAL_PRODUCT_LINK}
                type="solid"
                onPress={this.onPressAddExternalLinkButton.bind(this)}
                titleStyle={{ color: Constants.COLOR_BACKGROUND_DARK }}
                buttonStyle={{
                  backgroundColor: 'rgb(42, 42, 42)',
                  borderRadius: 44,
                  paddingVertical: 11,
                  paddingHorizontal: 33,
                }}
                containerStyle={{ marginTop: 20 }}
              />
            </View>
          ) : (
            <View style={styles.noResultMessageContainer}>
              <ActivityIndicator size="large" color={Constants.COLOR_MAIN} />
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  noResultMessageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultMessage: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  closeIcon: {
    width: 28,
    height: 28,
  },
  guideContainer: {
    marginTop: -5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Constants.TIER_COLORS.STRIVER,
    paddingVertical: 5,
    paddingHorizontal: 15,
    marginHorizontal: 20,
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guideText: {
    color: Constants.TIER_COLORS.OPERATOR,
    fontSize: 14,
    flexDirection: 'column',
  },
  guideActionText: {
    color: Constants.COLOR_POINT_BLUE,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  removeButton: {
    position: 'absolute',
    right: 4,
    top: 4,
    width: 18,
    height: 18,
  },
});
