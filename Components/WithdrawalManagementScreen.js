import React, { useContext, useEffect, useState } from 'react';
import T from './Constants/DesignTokens';
import {
  Alert,
  Dimensions,
  NativeModules,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated from 'react-native-reanimated';
import IconMaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Context } from '../Contexts';
import APIprovider from './APIprovider';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import Strings from './Strings';
import Utils from './utils';
import { useSelector } from 'react-redux';
import { moderateScale } from './utils/scailing';
function isRequestedWithdrawal({ withdrawalList }) {
  let result = false;

  if (withdrawalList.length > 0) {
    withdrawalList.forEach((item) => {
      if (
        item.status === Constants.WITHDRAWAL_STATUS_CODE.REQUESTED ||
        item.status === Constants.WITHDRAWAL_STATUS_CODE.ACCEPTED
      ) {
        result = true;
      }
    });
  }

  return result;
}

function WithdrawalRequestButton({
  isDisabled = false,
  navigation,
  onAddedNewRequest,
  user,
  rewards,
}) {
  return (
    <TouchableNativeFeedback
      background={TouchableNativeFeedback.Ripple('#777', true)}
      onPress={() => {
        if (isDisabled) {
          Alert.alert(
            Strings.WITHDRAWAL_PROCEEDING_ALERT_TITLE,
            Strings.WITHDRAWAL_PROCEEDING_ALERT_BODY,
          );
        } else {
          navigation.navigate('WithdrawalRequest', {
            onAddedNewRequest,
            user,
            rewards,
          });
        }
      }}
    >
      <View style={styles.addingProductButtonContainer}>
        <FastImage
          style={styles.addingProductButton}
          resizeMode={'contain'}
          source={require('../Resources/img/icBtnCircle68Y.png')}
        />
        <IconMaterialCommunityIcons
          name={'plus'}
          size={42}
          color={'black'}
          style={styles.addingProductButtonIcon}
        />
      </View>
    </TouchableNativeFeedback>
  );
}

function AvailableRewards({ amount, withdrawalAmount }) {
  return (
    <>
      <View style={styles.totalAmountContainer}>
        <Text style={styles.totalAmountTitle}>{Strings.AVAILABLE_BALANCE}</Text>
        <Text style={styles.totalAmountValue}>{Utils.displayPrice(amount)}</Text>
      </View>
      <View style={styles.totalAmountContainer}>
        <Text style={styles.totalAmountTitle}>{Strings.WITHDRAWAL_AMOUNT}</Text>
        <Text style={styles.totalAmountValue}>{Utils.displayPrice(withdrawalAmount)}</Text>
      </View>
    </>
  );
}

function WithdrawalList({ data }) {
  return (
    <Animated.FlatList
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      data={data}
      renderItem={WithdrawalItem}
      keyExtractor={(item) => item._id}
    />
  );
}

function WithdrawalItem({ item }) {
  const deviceLanguage =
    Platform.OS === 'ios'
      ? NativeModules.SettingsManager.settings.AppleLocale ||
        NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
      : NativeModules.I18nManager.localeIdentifier;
  const locale = deviceLanguage.substring(0, 2);
  return (
    <View style={styles.blockContainer}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.defaultMessage}>{`${Utils.timestampToDatetime(
          item.createdAt,
          locale,
        )}`}</Text>
        <Text style={styles.highlightedMessage}>{Strings.WITHDRAWAL_STATUS[item.status]}</Text>
      </View>
      <View style={{ marginVertical: 3 }} />
      <Text style={styles.defaultMessage}>{`${Utils.displayPrice(item.requestedAmount)}`}</Text>
      <View style={{ marginVertical: 1 }} />
      <Text
        style={{
          ...styles.defaultMessage,
          color: T.COLORS.GREY,
        }}
      >{`${Strings.SETTLEMENT_ACCOUNT(item.accountHolderName)} (${item.bankName}, ${
        item.bankAccount
      })`}</Text>
    </View>
  );
}

function WithdrawalManagementScreen(props) {
  // const global = useContext(Context);
  // const user = global.state.user;
  const {
    user: { data: user },
    totalReward,
  } = useSelector((state) => state.user);

  const [withdrawalList, setWithdrawalList] = useState([]);

  useEffect(() => {
    console.log('WithdrawalManagementScreen totalReward', totalReward);

    props.navigation.setOptions({
      title: Strings.REWARD_SETTLEMENT,
      headerTintColor: T.COLORS.INK,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
      headerLeft: () => HeaderLeftBackButton({ navigation: props.navigation }),
    });

    APIprovider.getWithdrawalRequests(user._id)
      .then((result) => {
        if (result.success) {
          setWithdrawalList(result.withdrawalRequests);
        }
      })
      .catch((err) => {
        console.log(err);
        Alert.alert('', Strings.WITHDRAWAL_REQUESTS_LOADING_FAILED_MESSAGE);
      });
    // totalReward는 이 효과가 갱신하는 값 — deps에 넣으면 루프
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.navigation, user._id]);

  return (
    <SafeAreaView style={styles.container} contentContainerStyle={{ flex: 1 }}>
      {/* <AvailableRewards amount={user.profitAmount - user?.certifiedReviewerReward} /> */}
      <AvailableRewards
        amount={totalReward}
        withdrawalAmount={props.route.params.withdrawalAmount}
      />
      {withdrawalList.length > 0 ? (
        <Animated.FlatList
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          ListHeaderComponentStyle={[styles.container, { paddingTop: 10 }]}
          ListHeaderComponent={
            <>
              <WithdrawalList data={withdrawalList} />
            </>
          }
          // <ScrollView style={[styles.container, { paddingTop: 10 }]}>
          //   <WithdrawalList data={withdrawalList} />
          // </ScrollView>
        />
      ) : (
        <View style={styles.emptyMessageContainer}>
          <Text style={styles.emptyMessage}>{Strings.REQUEST_REWARD_WITHDRAWAL_GUIDE1}</Text>
          <Text style={styles.emptyMessage}>{Strings.REQUEST_REWARD_WITHDRAWAL_GUIDE2}</Text>
        </View>
      )}
      <WithdrawalRequestButton
        user={user}
        navigation={props.navigation}
        rewards={totalReward}
        isDisabled={isRequestedWithdrawal({ withdrawalList })}
        onAddedNewRequest={(request) => {
          setWithdrawalList([request, ...withdrawalList]);
        }}
      />
    </SafeAreaView>
  );
}

export default WithdrawalManagementScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  blockContainer: {
    backgroundColor: Constants.TIER_COLORS.PIONEER,
    alignSelf: 'center',
    justifyContent: 'center',
    // borderWidth: 1,
    borderRadius: 10,
    width: Dimensions.get('window').width - 40,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  emptyMessageContainer: {
    flex: 1,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  emptyMessage: {
    color: 'black',
    fontSize: 18,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
    marginVertical: 5,
  },
  defaultMessage: {
    fontSize: 14,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
    alignItems: 'center',
    color: T.COLORS.INK,
    lineHeight: 17,
  },
  highlightedMessage: {
    fontSize: 14,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    alignItems: 'center',
    color: Constants.COLOR_MAIN,
  },
  totalAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    paddingTop: 10,
  },
  totalAmountTitle: {
    color: T.COLORS.INK,
    fontSize: 15,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    marginRight: 6,
  },
  totalAmountValue: {
    color: Constants.COLOR_POINT_BLUE,
    fontSize: 15,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
  },
  addingProductButtonContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 20,
    right: 20,
  },
  addingProductButton: {
    width: 68,
    height: 68,
  },
  addingProductButtonIcon: {
    position: 'absolute',
    width: 42,
    height: 42,
  },
});
