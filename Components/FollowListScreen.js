import React, { Component } from 'react';
import { StyleSheet, SafeAreaView, Alert } from 'react-native';

import Constants from './Constants';
import APIprovider from './APIprovider';
import FollowListTabView from './FollowListTabView';
import Strings from './Strings';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import { moderateScale } from './utils/scailing';

export default class FollowListScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      followerList: [],
      followingList: [],
      isFollowerListRefreshing: false,
      isFollowingListRefreshing: false,
    };
  }

  componentDidMount() {
    const { navigation } = this.props;

    navigation.setOptions({
      title: Strings.FOLLOWS,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerLeft: () => HeaderLeftBackButton({ navigation }),
    });

    this.loadList(0);
  }

  showAlertFailedToLoadData(err) {
    this.setState({
      isFollowerListRefreshing: false,
      isFollowingListRefreshing: false,
    });
    Alert.alert(
      Strings.FAILED_TO_LOAD_DATA,
      err.errorMsg ? err.errorMsg : '',
      [{ text: Strings.OK }],
      { cancelable: true },
    );
  }

  onRefresh(index) {
    const userId = this.props.route.params.targetUserId
      ? this.props.route.params.targetUserId
      : this.props.route.params.logonUserId;
    if (index === 0) {
      APIprovider.getFollowerList(userId)
        .then((newList) => {
          this.setState({
            followerList: newList,
          });
        })
        .catch(this.showAlertFailedToLoadData);
    } else if (index === 1) {
      APIprovider.getFollowingList(userId)
        .then((newList) => {
          this.setState({
            followingList: newList,
          });
        })
        .catch(this.showAlertFailedToLoadData);
    }
  }

  loadList(index) {
    const userId = this.props.route.params.targetUserId
      ? this.props.route.params.targetUserId
      : this.props.route.params.logonUserId;
    if (index === 0 && this.state.followerList.length === 0) {
      APIprovider.getFollowerList(userId)
        .then((newList) => {
          this.setState({
            followerList: newList,
          });
        })
        .catch(this.showAlertFailedToLoadData);
    } else if (index === 1 && this.state.followingList.length === 0) {
      APIprovider.getFollowingList(userId)
        .then((newList) => {
          this.setState({
            followingList: newList,
          });
        })
        .catch(this.showAlertFailedToLoadData);
    }
  }

  onListEndReached(index) {
    const userId = this.props.route.params.targetUserId
      ? this.props.route.params.targetUserId
      : this.props.route.params.logonUserId;
    if (index === 0) {
      // Video
      this.setState({
        isFollowerListRefreshing: true,
      });
      const offset = this.state.followerList[this.state.followerList.length - 1].createdAt;
      APIprovider.getFollowerList(userId, offset, this.state.followerList.length)
        .then((newList) => {
          this.setState({
            followerList: [...this.state.followerList, ...newList],
            isFollowerListRefreshing: false,
          });
        })
        .catch((err) => {
          this.showAlertFailedToLoadData(err);
          this.setState({
            isFollowerListRefreshing: false,
          });
        });
    } else if (index === 1) {
      // Product
      this.setState({
        isFollowingListRefreshing: true,
      });
      const offset = this.state.followingList[this.state.followingList.length - 1].createdAt;
      APIprovider.getFollowingList(userId, offset, this.state.followingList.length)
        .then((newList) => {
          this.setState({
            followingList: [...this.state.followingList, ...newList],
            isFollowingListRefreshing: false,
          });
        })
        .catch((err) => {
          this.showAlertFailedToLoadData(err);
          this.setState({
            isFollowerListRefreshing: false,
          });
        });
    }
  }

  render() {
    return (
      <SafeAreaView style={styles.container} contentContainerStyle={{ flex: 1 }}>
        <FollowListTabView
          navigation={this.props.navigation}
          followerList={this.state.followerList}
          followingList={this.state.followingList}
          onIndexChanged={this.loadList.bind(this)}
          onRefresh={this.onRefresh.bind(this)}
          onListEndReached={this.onListEndReached.bind(this)}
          isFollowerListRefreshing={this.state.isFollowerListRefreshing}
          isFollowingListRefreshing={this.state.isFollowingListRefreshing}
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
