import React from 'react';
import T from './Constants/DesignTokens';
import { Alert, StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated from 'react-native-reanimated';
import APIprovider from './APIprovider';
import Constants from './Constants';
import RevenueListItemView from './RevenueListItemView.js';
import Strings from './Strings';
import Utils from './utils';

function TotalRevenues({ amount }) {
  return (
    <View style={styles.totalAmountContainer}>
      <FastImage
        style={styles.bulletImage}
        source={require('../Resources/img/icObdCircleOn3.png')}
      />
      <Text style={styles.totalAmountTitle}>{Strings.TOTAL_REVENUES}</Text>
      <Text style={styles.totalAmountValue}>{Utils.displayPrice(amount)}</Text>
    </View>
  );
}

function RevenueList({
  revenueList,
  navigation,
  sellerId,
  isRefreshing,
  onListEndReached,
  onRefresh,
}) {
  return (
    <View>
      <Animated.FlatList
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        data={revenueList}
        renderItem={({ item, index }) => (
          <RevenueListItemView
            key={item._id + index}
            data={item}
            navigation={navigation}
            sellerId={sellerId}
          />
        )}
        keyExtractor={(item) => item._id} // item.purchaseId}
        onEndReached={({ distanceFromEnd }) => {
          if (distanceFromEnd > 0 && revenueList.length >= 10 && !isRefreshing) {
            onListEndReached();
          }
        }}
        onEndReachedThreshold={0.5}
        onRefresh={onRefresh}
        refreshing={isRefreshing}
      />
    </View>
  );
}

export default class RevenueListScreen extends React.Component {
  //    headerMenuWidthdraw() {
  //      Alert.alert(
  //          Strings.WIDTHDRAW,
  //          Strings.NOT_SUPPORTED_YET,
  //          [ { text: Strings.OK }],
  //          { cancelable: true }
  //      )
  //    }

  constructor(props) {
    super(props);

    this.state = {
      balance: 0,
      totalRevenues: 0,
      totalProfits: 0,
      revenueList: [],
      isRefreshing: false,
    };
    //      props.navigation.setOptions({
    //        title: Strings.REVENUES
    //      })
  }

  componentDidMount() {
    this.loadData();
  }

  loadData() {
    if (this.state.isRefreshing) {
      return;
    }
    this.setState({ isRefreshing: true });
    APIprovider.getRevenueList()
      .then(this.getRevenueListCallback.bind(this))
      .catch((err) => {
        console.error('getRevenueList error', err);
        this.setState({
          isRefreshing: false,
        });
        Alert.alert(
          Strings.FAILED_TO_LOAD_DATA,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
    APIprovider.getUserDetails(this.props.route.params.logonUserId)
      .then(this.getUserDetailsCallback.bind(this))
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_TO_LOAD_DATA,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  }

  getRevenueListCallback(data) {
    this.setState({
      revenueList: data,
      isRefreshing: false,
    });
  }

  onListEndReached() {
    this.setState({ isRefreshing: true });
    const list = this.state.revenueList;
    APIprovider.getRevenueList(list[list.length - 1].createdAt)
      .then((newList) => {
        this.setState({
          revenueList: [...list, ...newList],
          isRefreshing: false,
        });
      })
      .catch((err) => {
        this.setState({ isRefreshing: false });
        Alert.alert(
          Strings.FAILED_TO_LOAD_ORDERS,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  }

  getUserDetailsCallback(data) {
    this.setState({
      totalProfits: data.store.profitAmount,
      totalRevenues: data.store.revenueAmount,
      balance: data.balance,
    });
  }

  render() {
    const { navigation } = this.props;
    const { revenueList, totalProfits } = this.state;
    const { logonUserId } = this.props.route.params;

    return (
      <View style={[styles.container, { paddingTop: 10 }]}>
        <TotalRevenues amount={totalProfits} />
        <View style={styles.divider} />
        <RevenueList
          revenueList={revenueList}
          navigation={navigation}
          sellerId={logonUserId}
          isRefreshing={this.state.isRefreshing}
          onListEndReached={this.onListEndReached.bind(this)}
          onRefresh={this.loadData.bind(this)}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  totalAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  bulletImage: {
    width: 3,
    height: 3,
    marginRight: 6,
  },
  totalAmountTitle: {
    color: T.COLORS.INK,
    fontSize: 15,
    marginRight: 6,
  },
  totalAmountValue: {
    color: Constants.COLOR_POINT_BLUE,
    fontSize: 15,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: T.COLORS.GREY,
  },
});
