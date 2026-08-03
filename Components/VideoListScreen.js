import React from 'react';
import {
  Alert,
  LayoutAnimation,
  NativeModules,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { SectionGrid } from 'react-native-super-grid';
import APIprovider from './APIprovider';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import Strings from './Strings';
import VideoListItemView from './VideoListItemView';
import SortingKeywordSelector, { VIDEO_SORTING_KEYWORD_LIST } from './Views/SortingKeywordSelector';
import { moderateScale } from './utils/scailing';

const { UIManager } = NativeModules;
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default class VideoListScreen extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      listOf: this.props.route.params.listOf,
      totalCount: this.props.route.params.totalCount,
      videoList: [],
      isRefreshing: false,
      isShownFilterSelector: false,
      activeSortingItem: Strings.SORTING_KEYWORD_RECENT,
      sortType: undefined,
      videoEntireCount: undefined,
      focusedVideoIndex: 0,
    };
    this.sectionListRef = null;
  }

  loadData(sortType) {
    if (this.props.route.params.listOf === Constants.VIDEO_LIST_LINKED_PRODUCT) {
      APIprovider.getLinkedVideoListOfProduct(this.props.route.params.productId, sortType)
        .then(this.onListLoaded.bind(this))
        .catch(this.onListLoadError.bind(this));
    } else if (this.props.route.params.listOf === Constants.VIDEO_LIST_RELAYING) {
      APIprovider.getRelayingVideoList(this.props.route.params.videoId, sortType)
        .then(this.onListLoaded.bind(this))
        .catch(this.onListLoadError.bind(this));
    } else if (this.props.route.params.listOf === Constants.VIDEO_LIST_TRENDING) {
      APIprovider.getVideoList(Constants.VIDEO_LIST_TRENDING, sortType)
        .then(this.onListLoaded.bind(this))
        .catch(this.onListLoadError.bind(this));
    } else if (this.props.route.params.listOf === Constants.VIDEO_LIST_FOLLOWING) {
      APIprovider.getVideoList(Constants.VIDEO_LIST_FOLLOWING, sortType)
        .then(this.onListLoaded.bind(this))
        .catch(this.onListLoadError.bind(this));
    } else if (this.props.route.params.listOf === Constants.VIDEO_LIST_ABROAD) {
      APIprovider.getVideoList(Constants.VIDEO_LIST_ABROAD, sortType)
        .then(this.onListLoaded.bind(this))
        .catch(this.onListLoadError.bind(this));
    } else if (this.props.route.params.listOf === Constants.VIDEO_LIST_WORSTPRODUCT) {
      APIprovider.getVideoList(Constants.VIDEO_LIST_WORSTPRODUCT, sortType)
        .then(this.onListLoaded.bind(this))
        .catch(this.onListLoadError.bind(this));
    } else if (this.props.route.params.listOf === Constants.VIDEO_LIST_CATEGORY) {
      APIprovider.getCategorizedVideoList(this.props.route.params.categoryCode, sortType)
        .then(this.onListLoaded.bind(this))
        .catch(this.onListLoadError.bind(this));
    } else {
      APIprovider.getVideoList(this.props.route.params.listOf, sortType)
        .then(this.onListLoaded.bind(this))
        .catch(this.onListLoadError.bind(this));
    }
  }

  componentDidMount() {
    let title = null;
    if (this.props.route.params.listOf === Constants.VIDEO_LIST_LINKED_PRODUCT) {
      title = Strings.LINKED_REVIEWS;
    } else if (this.props.route.params.listOf === Constants.VIDEO_LIST_RELAYING) {
      title = Strings.RELAY_REVIEWS;
    } else if (this.props.route.params.listOf === Constants.VIDEO_LIST_TRENDING) {
      title = Strings.TRENDING_REVIEWS;
    } else if (this.props.route.params.listOf === Constants.VIDEO_LIST_FOLLOWING) {
      title = Strings.FOLLOWING_REVIEWS;
    } else if (this.props.route.params.listOf === Constants.VIDEO_LIST_ABROAD) {
      title = Strings.ABROAD_REVIEWS;
    } else if (this.props.route.params.listOf === Constants.VIDEO_LIST_WORSTPRODUCT) {
      title = Strings.WORSTPRODUCT_REVIEWS;
    } else if (this.props.route.params.listOf === Constants.VIDEO_LIST_CATEGORY) {
      // title = Constants.CATEGORY_LIST[this.props.route.params.categoryCode];
      title = this.props.route.params.category;
    } else {
      if (this.props.route.params.listOf === Constants.VIDEO_LIST_RECENT) {
        title = Strings.NEWEST_REVIEWS;
      } else if (
        Constants.CATEGORY_LIST.find((item) => item.key === this.props.route.params.listOf)
      ) {
        title = Constants.CATEGORY_LIST.find(
          (item) => item.key === this.props.route.params.listOf,
        ).title;
      } else {
        title = Strings.REVIEW_LIST;
      }
    }
    this.loadData();
    this.props.navigation.setOptions({
      headerStyle: {
        backgroundColor: Constants.COLOR_BACKGROUND_DARK,
        height: 90, //70
        shadowOpacity: 0,
      },
      title: title,
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
      headerLeft: () => HeaderLeftBackButton({ navigation: this.props.navigation }),
    });
  }

  onListLoadedLegacy = function (videoList) {
    this.setState({
      videoList: videoList,
    });
  };

  onListLoaded = function ({ videoList, entireCount }) {
    this.setState({
      videoList: videoList,
      videoEntireCount: entireCount,
    });
  };

  onListLoadError = function (err) {
    Alert.alert(
      Strings.LOAD_REVIEW_LIST,
      err.errorMsg ? err.errorMsg : '',
      [{ text: Strings.OK }],
      { cancelable: true },
    );
    this.setState({ isRefreshing: false });
  };

  onListAddedLegacy = function (data) {
    this.setState({
      videoList: [...this.state.videoList, ...data],
      isRefreshing: false,
    });
  };

  onListAdded = function (data) {
    this.setState({
      videoList: [...this.state.videoList, ...data.videoList],
      isRefreshing: false,
    });
  };

  onListEndReached = function () {
    this.setState({ isRefreshing: true });
    const offset = this.state.videoList[this.state.videoList.length - 1].createdAt;
    const sortType = this.state.sortType;
    const limit = 15;
    if (this.props.route.params.listOf === Constants.VIDEO_LIST_LINKED_PRODUCT) {
      APIprovider.getLinkedVideoListOfProduct(
        this.props.route.params.productId,
        sortType,
        offset,
        this.state.videoList.length,
        limit,
      )
        .then(this.onListAdded.bind(this))
        .catch(this.onListLoadError.bind(this));
    } else if (this.props.route.params.listOf === Constants.VIDEO_LIST_RELAYING) {
      APIprovider.getRelayingVideoList(
        this.props.route.params.videoId,
        sortType,
        offset,
        this.state.videoList.length,
        limit,
      )
        .then(this.onListAdded.bind(this))
        .catch(this.onListLoadError.bind(this));
    } else if (this.props.route.params.listOf === Constants.VIDEO_LIST_TRENDING) {
      APIprovider.getVideoList(
        Constants.VIDEO_LIST_TRENDING,
        sortType,
        null,
        offset,
        this.state.videoList.length,
        limit,
      )
        .then(this.onListAdded.bind(this))
        .catch(this.onListLoadError.bind(this));
    } else if (this.props.route.params.listOf === Constants.VIDEO_LIST_FOLLOWING) {
      // TOCHECK: following의 경우 데이터 받아오는 형식이 다름, 일관되게 변경 필요.
      APIprovider.getVideoList(
        Constants.VIDEO_LIST_FOLLOWING,
        sortType,
        null,
        offset,
        this.state.videoList.length,
        limit,
      )
        .then(this.onListAdded.bind(this))
        .catch(this.onListLoadError.bind(this));
    } else if (this.props.route.params.listOf === Constants.VIDEO_LIST_CATEGORY) {
      APIprovider.getCategorizedVideoList(
        this.props.route.params.categoryCode,
        sortType,
        offset,
        this.state.videoList.length,
        limit,
      )
        .then(this.onListAdded.bind(this))
        .catch(this.onListLoadError.bind(this));
    } else {
      APIprovider.getVideoList(
        this.props.route.params.listOf,
        sortType,
        null,
        offset,
        this.state.videoList.length,
        limit,
      )
        .then(this.onListAdded.bind(this))
        .catch(this.onListLoadError.bind(this));
    }
  };

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <SectionGrid
          ref={(ref) => {
            this.sectionListRef = ref;
          }}
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          itemDimension={Constants.VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_2}
          spacing={Constants.VIDEO_LIST_SPACING}
          sections={[
            {
              title: 'VideoList',
              data: this.state.videoList,
            },
          ]}
          renderSectionHeader={({ section }) => {
            const sortDownIcon = require('../Resources/img/iconRenewal/icSortDown22.png');
            const sortUpIcon = require('../Resources/img/iconRenewal/icSortUp22.png');
            if (!this.state.videoEntireCount) {
              return <View style={{ marginTop: 10 }} />;
            } else {
              return (
                <View
                  style={{
                    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
                    paddingHorizontal: 10,
                    paddingBottom: 10,
                    paddingTop: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ fontSize: 15, color: Constants.TIER_COLORS.ARTISAN }}>
                    {Strings.DisplayEntireReviewCount(this.state.videoEntireCount)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      this.setState({
                        isShownFilterSelector: !this.state.isShownFilterSelector,
                      });
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 15, color: Constants.TIER_COLORS.ARTISAN }}>
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
          renderItem={({ item }) => (
            <VideoListItemView
              style={{
                // height: Constants.VIDEO_GRID_LIST_ITEM_VIEW_HEIGHT_2 - 20,
                // marginTop: -10,
                height: Constants.PRODUCT_GRID_LIST_ITEM_VIEW_HEIGHT,
                marginTop: -10,
              }}
              navigation={this.props.navigation}
              data={item}
              dataType={this.props.route.params.listOf}
              dataSortType={this.state.sortType}
              dataList={this.state.videoList}
              onVideoListChanged={(videoList) => {
                this.setState({
                  videoList: videoList,
                });
              }}
              onVideoIndexChanged={(index) => {
                setTimeout(() => {
                  this.sectionListRef?.scrollToLocation({
                    sectionIndex: 0,
                    itemIndex: Math.floor(index / 2) + 1,
                  });
                }, 0);
                this.setState({
                  focusedVideoIndex: index,
                });
              }}
            />
          )}
          keyExtractor={(item) => item.videoId}
          onRefresh={() => {}}
          refreshControl={<RefreshControl refreshing={false} tintColor={'white'} />}
          onEndReached={({ distanceFromEnd }) => {
            if (
              this.state.videoList.length > 10 &&
              this.state.videoList.length < this.state.videoEntireCount &&
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
          style={{ marginHorizontal: 10 }}
        />
        {this.state.isShownFilterSelector && (
          <SortingKeywordSelector
            items={VIDEO_SORTING_KEYWORD_LIST}
            activeItem={this.state.activeSortingItem}
            onItemPress={(selectedItem) => {
              this.setState({
                activeSortingItem: selectedItem,
                isShownFilterSelector: false,
              });
              const sortType =
                selectedItem === Strings.SORTING_KEYWORD_SCORE
                  ? Constants.VIDEO_LIST_SORT_TYPE.SCORE
                  : selectedItem === Strings.SORTING_KEYWORD_VIEW
                  ? Constants.VIDEO_LIST_SORT_TYPE.VIEW
                  : selectedItem === Strings.SORTING_KEYWORD_RECENT
                  ? Constants.VIDEO_LIST_SORT_TYPE.RECENT
                  : undefined;
              this.loadData(sortType);
              this.setState({ sortType: sortType });
              LayoutAnimation.easeInEaseOut();
            }}
            top={28}
            marginRight={20}
          />
        )}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
});
