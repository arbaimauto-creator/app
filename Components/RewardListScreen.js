import React from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Preference from 'react-native-default-preference';
import FastImage from 'react-native-fast-image';
import Animated from 'react-native-reanimated';
import IconFontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { connect } from 'react-redux';
import { Context } from '../Contexts/index.js';
import { setTotalRevenue, setTotalReward } from '../slices/user';
import APIprovider from './APIprovider';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton.js';
import ReviewRewardListItemView from './ReviewRewardListItemView.js';
import Strings, { getLanguage } from './Strings';
import SortingKeywordSelector, {
  REWARD_SORTING_KEYWORD_LIST,
} from './Views/SortingKeywordSelector.js';
import Utils from './utils';
import { moderateScale } from './utils/scailing.js';
import { REWARD_GUIDE_BANNER } from './Constants/index';

function TotalContributedSales({ amount, region, currencyRate }) {
  return (
    <View style={styles.totalAmountContainer}>
      <FastImage
        style={styles.bulletImage}
        source={require('../Resources/img/icObdCircleOn3.png')}
      />
      <Text style={styles.totalAmountTitle}>{Strings.TOTAL_CONTRIBUTED_SALES}</Text>
      <Text style={styles.totalAmountValue}>
        {Utils.displayPrice(amount, region, currencyRate)}
      </Text>
    </View>
  );
}

function TotalRewards({ amount, region, currencyRate }) {
  return (
    <View style={styles.totalAmountContainer}>
      <FastImage
        style={styles.bulletImage}
        source={require('../Resources/img/icObdCircleOn3.png')}
      />
      <Text style={styles.totalAmountTitle}>{Strings.TOTAL_REWARDS}</Text>
      <Text style={styles.totalAmountValue}>
        {Utils.displayPrice(amount, region, currencyRate)}
      </Text>
    </View>
  );
}

function Rewards({ amount, region, currencyRate }) {
  return (
    <View style={styles.totalAmountContainer}>
      <FastImage
        style={styles.bulletImage}
        source={require('../Resources/img/icObdCircleOn3.png')}
      />
      <Text style={styles.totalAmountTitle}>{Strings.REVIEW_REWARDS}</Text>
      <Text style={styles.totalAmountValue}>
        {Utils.displayPrice(amount, region, currencyRate)}
      </Text>
    </View>
  );
}
function UnearnedRewards({ amount, region, currencyRate }) {
  return (
    <View style={styles.totalAmountContainer}>
      <FastImage
        style={styles.bulletImage}
        source={require('../Resources/img/icObdCircleOn3.png')}
      />
      <Text style={styles.totalAmountTitle}>{Strings.UNREALIZED_REVENUE}</Text>
      <Text style={styles.totalAmountValue}>
        {Utils.displayPrice(amount, region, currencyRate)}
      </Text>
    </View>
  );
}

function WithdrawalRewards({ amount, region, currencyRate }) {
  return (
    <View style={styles.totalAmountContainer}>
      <FastImage
        style={styles.bulletImage}
        source={require('../Resources/img/icObdCircleOn3.png')}
      />
      <Text style={styles.totalAmountTitle}>{Strings.WITHDRAWAL_AMOUNT}</Text>
      <Text style={styles.totalAmountValue}>
        {Utils.displayPrice(amount, region, currencyRate)}
      </Text>
    </View>
  );
}

function HeaderTitle(navigation) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text
        style={{
          ...styles.headerTitle,
          color: Constants.TIER_COLORS.ARTISAN,
          fontSize: moderateScale(20),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
          marginRight: moderateScale(5),
        }}
      >
        {Strings.REVIEW_REWARDS}
      </Text>
      {getLanguage() === 'ko' ? (
        <TouchableOpacity
          onPress={() => {
            // navigation.push('RewardGuide');
            APIprovider.getRewardGuide().then((res) => {
              if (res && res.success) {
                navigation.push('NoticeDetail', {
                  title: res.rewardGuide.title[getLanguage()],
                  description: res.rewardGuide.description[getLanguage()],
                  shortImageUri: res.rewardGuide[getLanguage()],
                  imageUri: res.rewardGuide.imageUri[getLanguage()],
                  navigationParams: res.rewardGuide.navigationParams,
                  eventUrl: res.rewardGuide.eventUrl,
                  imageRatio: res.rewardGuide.imageRatio,
                });
              }
            });
          }}
        >
          <IconFontAwesome5
            name={'question-circle'}
            size={20}
            color={Constants.TIER_COLORS.GIVER}
            style={{ marginBottom: 2 }}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function RewardList({
  rewardList,
  isRefreshing,
  onListEndReached,
  onRefresh,
  currencyRate,
  region,
}) {
  return (
    <View>
      <Animated.FlatList
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        data={rewardList}
        renderItem={({ item }) => (
          <ReviewRewardListItemView data={item} region={region} currencyRate={currencyRate} />
        )}
        keyExtractor={(item, idx) => item._id + '_' + idx}
        onEndReached={() => {
          if (rewardList.length >= 10 && !isRefreshing) {
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

function CashOut({ agreementToTermsOfService, navigation, rewards, withdrawalAmount }) {
  return (
    <Pressable
      onPress={() => {
        if (JSON.parse(agreementToTermsOfService) !== true) {
          navigation.navigate('AgreementToWithdrawal', {
            user: this.props.user.user.data,
          });
        } else {
          navigation.navigate('Withdrawal', { rewards, withdrawalAmount });
        }
      }}
    >
      <Text
        style={{
          marginRight: 10,
          color: Constants.COLOR_POINT_BLUE,
          fontSize: 16,
          fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
        }}
      >
        {Strings.CASH_OUT}
      </Text>
    </Pressable>
  );
}

function AccumulatedRewards({ amount, region, currencyRate }) {
  return (
    <View style={styles.totalAmountContainer}>
      <FastImage
        style={styles.bulletImage}
        source={require('../Resources/img/icObdCircleOn3.png')}
      />
      <Text style={styles.totalAmountTitle}>{Strings.ACCUMULATED_REWARD}</Text>
      <Text style={styles.totalAmountValue}>
        {Utils.displayPrice(amount, region, currencyRate)}
      </Text>
    </View>
  );
}
class RewardListScreen extends React.Component {
  static contextType = Context;
  constructor(props) {
    super(props);

    this.state = {
      balance: 0,
      totalContributedSales: 0,
      rewards: 0,
      totalRewards: 0,
      rewardList: [],
      isRefreshing: false,
      unearnedProfit: 0,
      unearnedRevenue: 0,
      withdrawalAmount: 0,
      activeSortingItem: Strings.CATEGORY_ALL,
      isShownFilterSelector: false,
      sortType: undefined,
      region: 'kr',
      currencyRate: 1200,
      agreementToTermsOfService: false,
      userId: this.props.user.user.data._id,
      earnedProfit: 0,
      accumulatedRevenue: 0,
      rewardTypeSum: 0,
      rewardTypeCount: 0,
    };
  }

  componentDidMount() {
    const { navigation } = this.props;

    Preference.get('agreementToTermsOfService').then((agreementToTermsOfService) => {
      if (agreementToTermsOfService) {
        this.setState({ agreementToTermsOfService });
      }
    });

    APIprovider.getUserTotalReward(this.state.userId).then((userReward) => {
      if (userReward && userReward.success) {
        this.props.setReward(userReward.reward);

        this.setState({
          rewards: userReward.reward,
          totalRewards: userReward.totalReward,
          totalContributedSales: userReward.totalRevenue,
          withdrawalAmount: userReward.withdrawalAmount || 0,
          unearnedProfit: userReward.unearnedProfit,
          agreementToTermsOfService: userReward.userInfo.agreementToTermsOfService,
          earnedProfit: userReward.earnedProfit,
          accumulatedRevenue: userReward.accumulatedRevenue,
          isRefreshing: false,
        });

        navigation.setOptions({
          headerTitle: () => HeaderTitle(navigation),
          headerLeft: () => HeaderLeftBackButton({ navigation }),
          headerRight: () =>
            CashOut.bind(this)({
              agreementToTermsOfService: userReward.userInfo.agreementToTermsOfService,
              navigation,
              withdrawalAmount: userReward.withdrawalAmount || 0,
            }),
        });
      }
    });

    Preference.get('KRW/USD').then((currencyRate) => {
      this.setState({ currencyRate, region: getLanguage() === 'ko' ? 'kr' : 'en' });
    });

    this.loadData();
  }

  loadData() {
    if (this.state.isRefreshing) {
      return;
    }

    this.setState({ isRefreshing: true });
    APIprovider.getEntireReviewRewardList({ userId: this.state.userId })
      .then(this.getReviewRewardListCallback.bind(this))
      .catch((err) => {
        this.setState({
          isRefreshing: false,
        });

        console.log('getEntireReviewRewardList err', err);

        Alert.alert(
          Strings.FAILED_TO_LOAD_DATA,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  }

  fetchRevenueByRevenueType(revenueType) {
    if (this.state.isRefreshing) {
      return;
    }

    const user = this.props.user.user.data;

    APIprovider.getEntireReviewRewardList({ userId: user._id, revenueType })
      .then(this.getReviewRewardListCallback.bind(this))
      .catch((err) => {
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
  }

  getReviewRewardListCallback(data) {
    // console.log('getReviewRewardListCallback', data.length);
    const { rewardList, rewardTypeSum, rewardTypeCount } = data;

    // APIprovider.getUserTotalReward(this.state.userId).then((rewardResult) => {
    //   if (rewardResult.success) {
    //     this.props.setReward(rewardResult.reward);

    //     this.setState({ rewards: rewardResult.reward });
    //   }
    // });

    this.setState({
      rewardList,
      rewardTypeSum,
      rewardTypeCount,
    });
  }

  onListEndReached() {
    const { isRefreshing, rewardList } = this.state;
    const user = this.props.user.user.data;

    if (this.state.isRefreshing) {
      return;
    }

    this.setState({ isRefreshing: true });
    const list = this.state.rewardList;

    APIprovider.getEntireReviewRewardList({
      userId: user._id,
      // offset: rewardList[rewardList.length - 1].createdAt,
      revenueType: this.state.sortType,
      skip: list.length,
    })
      .then((newList) => {
        console.log(Object.keys(newList), newList.rewardList.length);
        this.setState({
          rewardList: [...list, ...newList.rewardList],
          isRefreshing: false,
        });
      })
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_TO_LOAD_ORDERS,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  }

  onItemPress(selectedItem) {
    const _sortType =
      selectedItem === Strings.POINT_TYPE.ATTENDANCE
        ? Constants.REWARD_TYPE.POINT.ATTENDANCE
        : selectedItem === Strings.POINT_TYPE.COMMENT
        ? Constants.REWARD_TYPE.POINT.COMMENT
        : selectedItem === Strings.POINT_TYPE.GRADE
        ? Constants.REWARD_TYPE.POINT.GRADE
        : selectedItem === Strings.POINT_TYPE.REVIEW
        ? Constants.REWARD_TYPE.POINT.REVIEW
        : selectedItem === Strings.POINT_TYPE.BUY_REWARD
        ? Constants.REWARD_TYPE.BUY_REWARD
        : selectedItem === Strings.POINT_TYPE.REWARD
        ? Constants.REWARD_TYPE.REWARD
        : selectedItem === Strings.POINT_TYPE.EVENT_REWARD
        ? Constants.REWARD_TYPE.EVENT_REWARD
        : selectedItem === Strings.POINT_TYPE.WITHDRAWAL
        ? Constants.REWARD_TYPE.WITHDRAWAL
        : selectedItem === Strings.POINT_TYPE.DEDUCT
        ? Constants.REWARD_TYPE.DEDUCT
        : selectedItem === Strings.POINT_TYPE.ROLLBACK
        ? Constants.REWARD_TYPE.ROLLBACK
        : // : selectedItem === Strings.POINT_TYPE.CERTIFIED_REVIEWER_REWARD
          // ? Constants.REWARD_TYPE.CERTIFIED_REVIEWER_REWARD
          undefined;

    this.setState({
      activeSortingItem: selectedItem,
      isShownFilterSelector: false,
      sortType: _sortType,
    });

    this.fetchRevenueByRevenueType(_sortType);
  }

  render() {
    // const { navigation } = this.props;
    const {
      rewardList,
      rewards,
      totalRewards,
      totalContributedSales,
      unearnedProfit,
      withdrawalAmount,
      activeSortingItem,
      isShownFilterSelector,
      isRefreshing,
      sortType,
      currencyRate,
      region,
      accumulatedRevenue,
    } = this.state;

    const sortDownIcon = require('../Resources/img/iconRenewal/icSortDown22.png');
    const sortUpIcon = require('../Resources/img/iconRenewal/icSortUp22.png');

    return (
      <SafeAreaView style={styles.container}>
        {isShownFilterSelector && (
          <SortingKeywordSelector
            top={200 - 40}
            marginRight={20}
            zIndex={1}
            items={REWARD_SORTING_KEYWORD_LIST}
            activeItem={activeSortingItem}
            onItemPress={this.onItemPress.bind(this)}
          />
        )}

        <Animated.FlatList
          refreshControl={
            <RefreshControl
              tintColor={Constants.TIER_COLORS.ARTISAN}
              refreshing={isRefreshing}
              onRefresh={() => {
                this.fetchRevenueByRevenueType(sortType);
              }}
            />
          }
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          ListHeaderComponentStyle={[styles.container, { paddingTop: 10 }]}
          ListHeaderComponent={
            <>
              {/* <TotalContributedSales
                amount={totalContributedSales}
                currencyRate={currencyRate}
                region={region}
              /> */}
              <Rewards amount={rewards} currencyRate={currencyRate} region={region} />
              <UnearnedRewards
                amount={unearnedProfit}
                currencyRate={currencyRate}
                region={region}
              />
              {/* <TotalRewards amount={totalRewards} currencyRate={currencyRate} region={region} /> */}
              {/* <WithdrawalRewards
                amount={withdrawalAmount}
                currencyRate={currencyRate}
                region={region}
              /> */}
              {/* <AccumulatedRewards
                amount={accumulatedRevenue}
                currencyRate={currencyRate}
                region={region}
              /> */}
              <View style={styles.divider} />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  marginRight: 30,
                  zIndex: 1,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    this.setState({ isShownFilterSelector: !isShownFilterSelector });
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      style={{
                        fontSize: moderateScale(15),
                        fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
                        color: Constants.COLOR_POINT_BLUE,
                      }}
                    >
                      {activeSortingItem}
                    </Text>
                    <FastImage
                      style={{ width: 24, height: 24 }}
                      source={isShownFilterSelector ? sortUpIcon : sortDownIcon}
                    />
                  </View>
                </TouchableOpacity>
                {/* {isShownFilterSelector && (
                  <SortingKeywordSelector
                    top={28}
                    items={REWARD_SORTING_KEYWORD_LIST}
                    activeItem={activeSortingItem}
                    onItemPress={this.onItemPress.bind(this)}
                  />
                )} */}
              </View>

              {/* {activeSortingItem !== Strings.CATEGORY_ALL ? (
                <View style={{ marginLeft: 20, marginBottom: 10 }}>
                  <Text>항목 수: {this.state?.rewardTypeCount || 0}</Text>
                  <Text>리워드 합계: {this.state?.rewardTypeSum || 0}</Text>
                </View>
              ) : null} */}

              <RewardList
                rewardList={rewardList}
                isRefreshing={this.state.isRefreshing}
                currencyRate={currencyRate}
                region={region}
                onListEndReached={this.onListEndReached.bind(this)}
                onRefresh={() => {
                  this.loadData();
                }}
              />
            </>
          }
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
  totalAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  bulletImage: {
    width: 3,
    height: 3,
    marginRight: 6,
  },
  totalAmountTitle: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 15,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
    marginRight: 6,
  },
  totalAmountValue: {
    color: Constants.COLOR_POINT_BLUE,
    fontSize: 15,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: Constants.TIER_COLORS.OPERATOR,
  },
});

const mapDispatchToProps = (dispatch) => ({
  setReward: (totalReward) => dispatch(setTotalReward({ totalReward })),
});

export default connect(
  (state) => ({
    user: state.user,
  }),
  mapDispatchToProps,
)(RewardListScreen);
