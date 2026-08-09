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

  // 단위 규칙:
  // - context.state.price / promotionDiscount / rewardUse / certifiedReviewerRewardUse: KRW 숫자
  // - reward(입력)와 finalPrice/productPrice(비교용): 지역 표시 통화 (kr=KRW, us=USD)
  // - certifiedReviewerReward / originalReward (API): KRW
  // 인증리뷰어 리워드를 우선 차감하고 잔액을 일반 리워드로 차감한다.
  const splitRewardUseKRW = (amountKRW) => {
    const clamped = Math.max(0, amountKRW);
    const certifiedUse = Math.min(certifiedReviewerReward, clamped);
    return { certifiedReviewerRewardUse: certifiedUse, rewardUse: clamped - certifiedUse };
  };

  const handlePressApplyReward = () => {
    const finalPriceKRW = context.state.price - context.state.promotionDiscount;
    const finalPrice = convertPrice(finalPriceKRW);
    const minimumUseReward = convertPrice(500);

    if (+reward >= finalPrice) {
      handleChangeReward(finalPrice.toString());
      return context.setState(splitRewardUseKRW(finalPriceKRW));
    }

    if (finalPrice >= minimumUseReward && +reward < minimumUseReward) {
      // 최소 사용액 미만 입력을 "최소액 적용"으로 바꿔치기하면 입력액보다 많은
      // 리워드가 차감된다 — 적용을 거부한다
      Alert.alert(
        Strings.WITHDRAWAL_INPUT_ERROR_TITLE,
        Strings.WITHDRAWAL_INPUT_ERROR_CONTENT,
        [{ text: Strings.OK }],
        { cancelable: true },
      );
      return context.setState({ rewardUse: 0, certifiedReviewerRewardUse: 0 });
    }

    handleChangeReward(reward);
    // 표시 통화 입력을 KRW로 환산해 같은 단위로 분배한다
    return context.setState(splitRewardUseKRW(convertKRWUSD(+reward)));
  };

  const handlePressApplyAllReward = () => {
    const finalPriceKRW = context.state.price - context.state.promotionDiscount;
    const productPrice = convertPrice(finalPriceKRW);
    const rewardDisplay = convertPrice(originalReward);

    if (originalReward <= finalPriceKRW) {
      handleChangeReward(rewardDisplay.toString());
      return context.setState(splitRewardUseKRW(originalReward));
    }

    handleChangeReward(productPrice.toString());
    return context.setState(splitRewardUseKRW(finalPriceKRW));
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
