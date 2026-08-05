import React, { useEffect, useState } from 'react';
import { Alert, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import APIprovider from '../../Components/APIprovider';
import utils from '../../Components/utils';
import { StyleSheet } from 'react-native';
export default function RewardUse({ context, KRWPerUSD }) {
  const [availableReward, setAvailableReward] = useState(0);
  const [reward, setReward] = useState('');
  const [disable, setDisable] = useState(false);
  const [originalReward, setOriginalReward] = useState(0);

  const [certifiedReviewerReward, setCertifiedReviewerReward] = useState(0);
  const [entireReward, setEntireReward] = useState(0);

  const {
    user: { data: user },
  } = useSelector((state) => state.user);

  const convertKRWUSD = (price) => {
    return utils.convertKRWUSD(price, context?.context?.state?.region, KRWPerUSD);
  };

  const displayPriceNumber = (price) => {
    return utils.displayPriceNumber(price, context?.context?.state?.region, KRWPerUSD);
  };

  const checkIsNumber = (number) => {
    if (Math.round(number) === number) {
      return true;
    }

    return false;
  };

  const convertPrice = (price) => {
    // convertUSDToKRW는 toFixed 문자열을 반환 — 숫자로 강제하지 않으면
    // "9" >= "80.00" 같은 사전식 문자열 비교가 되어 검증이 우회된다
    return Number(
      context?.context?.state?.region === 'us'
        ? utils.convertUSDToKRW(price, KRWPerUSD)
        : price,
    );
  };

  useEffect(() => {
    if (user) {
      APIprovider.getUserAvailableReward(user?._id).then((res) => {
        if (res && res.success) {
          const {
            availableCertifiedReviewerReward,
            certifiedReviewerReward: crr,
            totalReward,
          } = res;

          setAvailableReward(displayPriceNumber(totalReward + availableCertifiedReviewerReward));
          setOriginalReward(totalReward + availableCertifiedReviewerReward);
          setCertifiedReviewerReward(availableCertifiedReviewerReward);
          setEntireReward(crr + totalReward);

          if (totalReward + availableCertifiedReviewerReward < 500) {
            setDisable(true);
          }
        }
      });
    }
    // user 변경 시에만 재계산하는 의도
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleChangeReward = (value) => {
    if (isNaN(value) || typeof +value !== 'number') {
      Alert.alert(
        Strings.WITHDRAWAL_INPUT_ERROR_TITLE,
        Strings.WITHDRAWAL_INPUT_ERROR_CONTENT,
        [{ text: Strings.OK }],
        { cancelable: true },
      );
      return;
    }

    if (availableReward < +value) {
      setReward(availableReward.toString());
      return;
    }

    if (+value > displayPriceNumber(context.state.price - context.state.promotionDiscount)) {
      setReward(
        displayPriceNumber(context.state.price - context.state.promotionDiscount).toString(),
      );
      return;
    }

    const [number, decimalPoint] = value.split('.');
    if (decimalPoint) {
      setReward(number + '.' + decimalPoint.slice(0, 2));
      return;
    }

    setReward(value);
  };

  const handlePressApplyReward = () => {
    const finalPrice = convertPrice(context.state.price - context.state.promotionDiscount);
    const minimumUseReward = convertPrice(500);

    console.log('reward', finalPrice, minimumUseReward, reward);

    if (+reward >= finalPrice) {
      handleChangeReward(finalPrice.toString());
      return context.setState({
        // rewardUse: convertKRWUSD(+finalPrice),
        rewardUse: context.state.price - context.state.promotionDiscount,
      });
    }

    if (finalPrice > minimumUseReward && +reward < minimumUseReward) {
      // 최소 사용액 미만 입력을 "최소액 적용"으로 바꿔치기하면 입력액보다 많은
      // 리워드가 차감된다 — 적용을 거부한다
      Alert.alert(
        Strings.WITHDRAWAL_INPUT_ERROR_TITLE,
        Strings.WITHDRAWAL_INPUT_ERROR_CONTENT,
        [{ text: Strings.OK }],
        { cancelable: true },
      );
      return context.setState({ rewardUse: 0 });
    }

    handleChangeReward(reward);
    if (certifiedReviewerReward > reward) {
      return context.setState({ certifiedReviewerRewardUse: reward, rewardUse: 0 });
    } else if (certifiedReviewerReward < reward) {
      return context.setState({
        certifiedReviewerRewardUse: convertKRWUSD(+certifiedReviewerReward),
        rewardUse: convertKRWUSD(reward - certifiedReviewerReward),
      });
    }
  };

  const handlePressApplyAllReward = () => {
    const productPrice = convertPrice(context.state.price - context.state.promotionDiscount);
    const reward = convertPrice(originalReward);

    if (reward <= productPrice) {
      handleChangeReward(reward.toString());
      return context.setState({
        certifiedReviewerRewardUse: convertKRWUSD(+certifiedReviewerReward),
        // 두 값 모두 동일 단위로 환산 — 합계가 전체 보유 리워드와 일치하도록
        rewardUse: convertKRWUSD(+originalReward) - convertKRWUSD(+certifiedReviewerReward),
      });
    }

    handleChangeReward(productPrice.toString());
    if (certifiedReviewerReward > productPrice) {
      return context.setState({
        certifiedReviewerRewardUse: convertKRWUSD(+productPrice),
        rewardUse: 0,
      });
    } else if (certifiedReviewerReward < productPrice) {
      return context.setState({
        certifiedReviewerRewardUse: convertKRWUSD(+certifiedReviewerReward),
        // 기존 코드는 전액을 rewardUse에 다시 넣어 인증리뷰어 리워드가 이중 차감
        // (합계 > 상품가 → 음수 결제)됐다 — 인증리뷰어 사용분을 제외한 잔액만 차감
        rewardUse:
          context.state.price -
          context.state.promotionDiscount -
          convertKRWUSD(+certifiedReviewerReward),
      });
    }
  };

  return (
    <View style={{ marginVertical: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text
          style={{
            color: Constants.TIER_COLORS.ARTISAN,
            fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM,
            fontSize: 15,
          }}
        >
          {Strings.REVIEW_REWARDS}
        </Text>
        <Switch
          trackColor={{
            false: Constants.TIER_COLORS.ARTISAN,
            true: Constants.COLOR_POINT_BLUE,
          }}
          thumbColor={
            context.state.isUseReward
              ? Constants.TIER_COLORS.PIONEER
              : Constants.TIER_COLORS.EXPLORER
          }
          ios_backgroundColor={Constants.TIER_COLORS.ARTISAN}
          onValueChange={(value) => {
            context.setState({ isUseReward: value });

            if (!value) {
              context.setState({ rewardUse: 0, certifiedReviewerRewardUse: 0, isUseReward: value });
              setReward('');
            }
          }}
          value={context.state.isUseReward}
        />
      </View>

      {context.state.isUseReward ? (
        <View>
          <View style={{ flexDirection: 'row', marginTop: 20, marginBottom: 14 }}>
            <TextInput
              editable={!disable}
              placeholder={disable ? Strings.INSUFFICIENT_REWARDS : Strings.ENTER_REWARD}
              placeholderTextColor={
                disable ? Constants.TIER_COLORS.PIONEER : Constants.TIER_COLORS.STRIVER
              }
              style={{
                backgroundColor: disable
                  ? Constants.TIER_COLORS.OPERATOR
                  : Constants.TIER_COLORS.PIONEER,
                ...styles.rewardPlaceHolder,
              }}
              keyboardType="numeric"
              value={reward}
              onChangeText={(value) => {
                handleChangeReward(value);
              }}
            />
            <TouchableOpacity
              onPress={() => handlePressApplyReward()}
              disabled={!reward}
              style={{
                backgroundColor: !reward
                  ? Constants.TIER_COLORS.STRIVER
                  : Constants.TIER_COLORS.GIVER,
                ...styles.rewardApplyButton,
              }}
            >
              <Text style={styles.rewardApplyButtonText}>{Strings.APPLY}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={disable}
              onPress={() => handlePressApplyAllReward()}
              style={{
                backgroundColor: disable
                  ? Constants.TIER_COLORS.STRIVER
                  : Constants.TIER_COLORS.GIVER,
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4,
                ...styles.rewardApplyButton,
              }}
            >
              <Text style={styles.rewardApplyButtonText}>{Strings.APPLY_ENTIRE}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.rewardUseDescription}>
            {Strings.AVAILABLE_REWARDS}: {availableReward} ( {Strings.MINIMUM_AVAILABLE_REWARDS}:{' '}
            {displayPriceNumber(500)} )
          </Text>
          {reward ? (
            <Text style={styles.rewardUseDescription}>
              {Strings.REMAINING_REWARDS_AFTER_USE}:{' '}
              {checkIsNumber(entireReward - reward)
                ? convertPrice(entireReward - reward)
                : (convertPrice(entireReward) - reward).toFixed(2)}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rewardPlaceHolder: {
    fontSize: 11,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
    width: '60%',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomLeftRadius: 4,
    borderTopLeftRadius: 4,
  },
  rewardApplyButton: {
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    width: '20%',
    borderRightColor: Constants.TIER_COLORS.PIONEER,
    borderRightWidth: 0.5,
  },
  rewardApplyButtonText: {
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
    fontSize: 13,
    textAlign: 'center',
    color: Constants.TIER_COLORS.ARTISAN,
  },
  rewardUseDescription: {
    color: Constants.TIER_COLORS.STRIVER,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM,
    fontSize: 13,
    textAlign: 'right',
  },
});
