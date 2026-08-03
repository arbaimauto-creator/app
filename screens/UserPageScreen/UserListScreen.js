import React from 'react';
import {
  Alert,
  LayoutAnimation,
  NativeModules,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { SectionGrid } from 'react-native-super-grid';
import APIprovider from '../../Components/APIprovider';
import Constants from '../../Components/Constants';
import HeaderLeftBackButton from '../../Components/CustomComponents/headerBackButton/headerLeftBackButton';
import Strings from '../../Components/Strings';
import SortingKeywordSelector, {
  USER_SORTING_KEYWORD_LIST,
} from '../../Components/Views/SortingKeywordSelector';
import UserListItemView from '../UserPageScreen/UserListItemView';

const { UIManager } = NativeModules;
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default class UserListScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      totalCount: this.props.route.params.totalCount,
      userList: this.props.route.params.userList,
      isRefreshing: false,
      isShownFilterSelector: false,
      activeSortingItem: Strings.SORTING_KEYWORD_RECENT_ACCOUNT_CREATED,
      sortType: Constants.USER_LIST_SORT_TYPE.RECENT_ACCOUNT_CREATED,
      listOf: this.props.route.params.listOf || undefined,
      userEntireCount: this.props.route.params.userCount,
    };
  }

  loadData(listOf, sortType) {
    APIprovider.getUserList(listOf, sortType)
      .then(this.getUserListCallback.bind(this))
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_TO_LOAD_USERS,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  }

  componentDidMount() {
    let title = null;
    // let sortKeyword = Strings.SORTING_KEYWORD_RECENT_ACCOUNT_CREATED;
    switch (this.props.route.params.listOf) {
      case Constants.USER_LIST_LATEST_RECOMMENDED:
        title = Strings.HOT_REVIEWER;
        break;
      default:
        title = Strings.USER_LIST;
        break;
    }
    // this.setState({
    //   activeSortingItem: sortKeyword,
    //   listOf: this.props.route.params.listOf,
    // });
    this.loadData(this.props.route.params.listOf, this.state.sortType);
    this.props.navigation.setOptions({
      headerStyle: {
        backgroundColor: Constants.COLOR_BACKGROUND_DARK,
        // alignItems: 'center',
        height: 70,
        shadowOpacity: 0,
      },
      title: title,
      headerLeft: () => HeaderLeftBackButton({ navigation: this.props.navigation }),
    });
  }

  getUserListCallback(data) {
    this.setState({
      userList: data.userList,
      userEntireCount: data.entireCount,
    });
  }

  getAdditionalUserListCallback(data) {
    // console.log(data);
    this.setState({
      userList: [...this.state.userList, ...data.userList],
      isRefreshing: false,
    });
  }

  onListEndReached = function () {
    this.setState({ isRefreshing: true });
    const offset = this.state.userList[this.state.userList.length - 1].createdAt;
    const skip = this.state.userList.length;
    const limit = 20;
    // console.log(this.state.listOf, this.state.sortType, offset, skip, limit);
    APIprovider.getUserList(this.state.listOf, this.state.sortType, undefined, skip, limit)
      .then(this.getAdditionalUserListCallback.bind(this))
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_TO_LOAD_USERS,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
        this.setState({ isRefreshing: false });
      });
  };

  render() {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <SectionGrid
            stickySectionHeadersEnabled
            itemDimension={Constants.USER_GRID_LIST_ITEM_VIEW_WIDTH}
            spacing={Constants.USER_LIST_SPACING}
            sections={[
              {
                title: 'UserList',
                data: this.state.userList,
              },
            ]}
            renderSectionHeader={({ section }) => {
              const sortDownIcon = require('../../Resources/img/iconRenewal/icSortDown22.png');
              const sortUpIcon = require('../../Resources/img/iconRenewal/icSortUp22.png');
              // if(!this.state.userEntireCount) return <View style={{marginTop:10}}/>
              // else
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
                  <Text style={{ fontSize: 15, color: 'white' }}>
                    {Strings.DisplayEntireUserCount(this.state.userEntireCount)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      this.setState({
                        isShownFilterSelector: !this.state.isShownFilterSelector,
                      });
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 15, color: 'white' }}>
                        {this.state.activeSortingItem}
                      </Text>
                      <FastImage
                        source={this.state.isShownFilterSelector ? sortUpIcon : sortDownIcon}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              );
            }}
            renderItem={({ item, index }) => {
              return (
                <View style={{ marginBottom: 5 }}>
                  <UserListItemView
                    navigation={this.props.navigation}
                    user={item}
                    mode={'list_horizontal'}
                    backgroundBox
                  />
                </View>
              );
            }}
            keyExtractor={(item) => `userlist_${this.state.listOf ?? 'default'}_${item.userId}`}
            onRefresh={() => {}}
            onEndReached={({ distanceFromEnd }) => {
              if (
                this.state.userList.length > 10 &&
                this.state.userList.length < this.state.userEntireCount &&
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
              items={USER_SORTING_KEYWORD_LIST}
              activeItem={this.state.activeSortingItem}
              onItemPress={(selectedItem) => {
                this.setState({
                  activeSortingItem: selectedItem,
                  isShownFilterSelector: false,
                });
                const sortType =
                  selectedItem === Strings.SORTING_KEYWORD_RECENT_ACCOUNT_CREATED
                    ? Constants.USER_LIST_SORT_TYPE.RECENT_ACCOUNT_CREATED
                    : selectedItem === Strings.SORTING_KEYWORD_RECENT_REVIEW_UPLOADED
                    ? Constants.USER_LIST_SORT_TYPE.RECENT_REVIEW_UPLOADED
                    : selectedItem === Strings.SORTING_KEYWORD_REVIEW_COUNT
                    ? Constants.USER_LIST_SORT_TYPE.REVIEW_COUNT
                    : selectedItem === Strings.SORTING_KEYWORD_VIEW
                    ? Constants.USER_LIST_SORT_TYPE.VIEW_COUNT
                    : selectedItem === Strings.SORTING_KEYWORD_SCORE
                    ? Constants.USER_LIST_SORT_TYPE.SCORE
                    : selectedItem === Strings.SORTING_KEYWORD_REVENUE_AMOUNT
                    ? Constants.USER_LIST_SORT_TYPE.REVENUE_AMOUNT
                    : undefined;
                this.loadData(this.state.listOf, sortType);
                this.setState({ sortType: sortType });
                LayoutAnimation.easeInEaseOut();
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
  container: {
    padding: 10,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
});
