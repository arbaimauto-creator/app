import React, { Component } from 'react';
import { StyleSheet, SafeAreaView, Alert } from 'react-native';

import Constants from './Constants';
import APIprovider from './APIprovider';
import BookmarkListTabView from './BookmarkListTabView';
import Strings from './Strings';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import { moderateScale } from './utils/scailing';

export default class BookmarkListScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bookmarkedVideoList: [],
      bookmarkedProductList: [],
      isVideoListRefreshing: false,
      isProductListRefreshing: false,
    };
  }

  componentDidMount() {
    const { navigation } = this.props;

    navigation.setOptions({
      title: Strings.BOOKMARKS,
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
      headerLeft: () => HeaderLeftBackButton({ navigation }),
    });

    this.loadBookmarkList(0);
  }

  showAlertFailedToLoadData(err) {
    Alert.alert(
      Strings.FAILED_TO_LOAD_DATA,
      err.errorMsg ? err.errorMsg : '',
      [{ text: Strings.OK }],
      { cancelable: true },
    );
  }

  onRefresh(index) {
    if (index === 0) {
      // Video
      APIprovider.getBookmarkedVideoList(this.props.route.params.logonUserId)
        .then((data) => {
          this.setState({
            bookmarkedVideoList: data,
          });
        })
        .catch(this.showAlertFailedToLoadData);
    } else if (index === 1) {
      // Product
      APIprovider.getBookmarkedProductList(this.props.route.params.logonUserId)
        .then((data) => {
          this.setState({
            bookmarkedProductList: data,
          });
        })
        .catch(this.showAlertFailedToLoadData);
    }
  }
  loadBookmarkList(index) {
    if (index === 0 && this.state.bookmarkedVideoList.length === 0) {
      // Video
      APIprovider.getBookmarkedVideoList(this.props.route.params.logonUserId)
        .then((data) => {
          this.setState({
            bookmarkedVideoList: data,
          });
        })
        .catch(this.showAlertFailedToLoadData);
    } else if (index === 1 && this.state.bookmarkedProductList.length === 0) {
      // Product
      APIprovider.getBookmarkedProductList(this.props.route.params.logonUserId)
        .then((data) => {
          this.setState({
            bookmarkedProductList: data,
          });
        })
        .catch(this.showAlertFailedToLoadData);
    }
  }

  onBookmarkListEndReached(index) {
    if (index === 0) {
      // Video
      this.setState({
        isVideoListRefreshing: true,
      });
      console.log(
        'bookmark',
        this.state.bookmarkedVideoList[this.state.bookmarkedVideoList.length - 1],
      );
      const offset =
        this.state.bookmarkedVideoList[this.state.bookmarkedVideoList.length - 1].createdAt;
      APIprovider.getBookmarkedVideoList(
        this.props.route.params.logonUserId,
        offset,
        this.state.bookmarkedVideoList.length,
      )
        .then((data) => {
          this.setState({
            bookmarkedVideoList: [...this.state.bookmarkedVideoList, ...data],
            isVideoListRefreshing: false,
          });
        })
        .catch((err) => {
          this.showAlertFailedToLoadData(err);
          this.setState({
            isVideoListRefreshing: false,
          });
        });
    } else if (index === 1) {
      // Product
      this.setState({
        isProductListRefreshing: true,
      });
      // const offset =
      //   userUploadList.productList[userUploadList.productList.length - 1].bookmark.createdAt;
      // const skip = userUploadList.productList.length;
      // APIprovider.getBookmarkedProductList(this.props.route.params.logonUserId, offset, skip)

      APIprovider.getBookmarkedProductList(this.props.route.params.logonUserId)
        .then((data) => {
          this.setState({
            bookmarkedProductList: [...this.state.bookmarkedProductList, ...data],
            isProductListRefreshing: false,
          });
        })
        .catch((err) => {
          this.showAlertFailedToLoadData(err);
          this.setState({
            isProductListRefreshing: false,
          });
        });
    }
  }

  render() {
    return (
      <SafeAreaView style={styles.container} contentContainerStyle={{ flex: 1 }}>
        <BookmarkListTabView
          navigation={this.props.navigation}
          videoList={this.state.bookmarkedVideoList}
          productList={this.state.bookmarkedProductList}
          onRefresh={this.onRefresh.bind(this)}
          onIndexChanged={this.loadBookmarkList.bind(this)}
          onListEndReached={this.onBookmarkListEndReached.bind(this)}
          isVideoListRefreshing={this.state.isVideoListRefreshing}
          isProductListRefreshing={this.state.isProductListRefreshing}
        />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
});
