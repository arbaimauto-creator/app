import React, { useEffect, useState } from 'react';
import { Alert, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import APIprovider from '../../Components/APIprovider';
import { StyleSheet } from 'react-native';

export default function PromotionCode({ context, cartItems }) {
  const [isUseCode, setIsUseCode] = useState(false);
  const [code, setCode] = useState('');
  const [discounted, setDiscounted] = useState([]);
  const [currentCode, setCurrentCode] = useState('');

  const [appliedDiscountCodeId, setAppliedDiscountCodeId] = useState('');
  const [userId, setUserId] = useState('');

  const handleChangeCode = (value) => {
    setCode(value);
  };

  const checkPromotionCodeAndApply = async () => {
    if (currentCode === code) {
      Alert.alert('이미 적용된 코드입니다');
      return;
    }

    const discountInfo = [];
    let messages = [];

    for (const cartItem of cartItems) {
      let check;
      try {
        check = await APIprovider.checkAvailablePromotionCode({
          promotionCode: code,
          userId: cartItem.buyer._id,
          productId: cartItem.product._id,
        });
      } catch (err) {
        messages.push(err?.errorMsg || Strings.RETRY_GUIDELINES);
        continue;
      }

      if (check && check.success) {
        cartItem.discountAmount = Math.round(
          (cartItem.price * cartItem.number * check.discountCode.percentage) / 100,
        );

        discountInfo.push({
          percentage: check.discountCode.percentage,
          // 수량(number)을 곱하지 않으면 화면 표시·차감액이 수량배만큼 적게 계산된다
          discountAmount: Math.round(
            (cartItem.price * cartItem.number * check.discountCode.percentage) / 100,
          ),
          productTitle: cartItem.product.title,
          discountCode: check.discountCode._id,
          code: check.discountCode.code,
        });

        setAppliedDiscountCodeId(check.discountCode._id);
        // 사용/취소 API는 문자열 id를 기대 — 객체 전체를 넣으면 서버 기록이 조용히 실패한다
        setUserId(cartItem.buyer._id);
        context.setState({ rewardAvailable: check.discountCode.rewardAvailable });
      } else {
        // check가 null(네트워크 오류 등)일 수 있다
        messages.push(check?.message || Strings.RETRY_GUIDELINES);
      }
    }

    // 카트가 비었거나 모든 항목이 실패한 경우 아래 discountInfo[0] 접근 방지
    if (!discountInfo.length) {
      if (messages.length) {
        Alert.alert(messages[0]);
      }
      return;
    }

    if (context.state.isUseReward && context.state.rewardUse && discountInfo.length) {
      Alert.alert(
        Strings.REWARD_ALREADY_IN_USE_TITLE,
        Strings.REWARD_ALREADY_IN_USE_MESSAGE,
        [
          {
            text: Strings.CANCEL,
            style: 'cancel',
          },
          {
            text: Strings.OK,
            onPress: async () => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              await APIprovider.usePromotionCode({
                promotionCode: discountInfo[0].discountCode,
                userId: cartItems[0].buyer._id,
              });

              setDiscounted(discountInfo);
              // setCurrentCode(code);
              setCurrentCode(discountInfo[0].code);

              context.setState({
                discountCode: discountInfo[0].discountCode,
                promotionDiscount: discountInfo.reduce((acc, cur) => acc + cur.discountAmount, 0),
                isUseReward: false,
                rewardUse: 0,
              });
            },
          },
        ],
        {
          cancelable: true,
        },
      );
    } else {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await APIprovider.usePromotionCode({
        promotionCode: discountInfo[0].discountCode,
        userId: cartItems[0].buyer._id,
      });

      setDiscounted(discountInfo);
      // setCurrentCode(code);
      setCurrentCode(discountInfo[0].code);
      context.setState({
        discountCode: discountInfo[0].discountCode,
        promotionDiscount: discountInfo.reduce((acc, cur) => acc + cur.discountAmount, 0),
      });
    }
  };

  useEffect(() => {
    // console.log('cartItems', cartItems);
  }, []);

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
          {Strings.DISCOUNT_CODE}
        </Text>
        <Switch
          trackColor={{
            false: Constants.TIER_COLORS.ARTISAN,
            true: Constants.COLOR_POINT_BLUE,
          }}
          thumbColor={isUseCode ? Constants.TIER_COLORS.PIONEER : Constants.TIER_COLORS.EXPLORER}
          ios_backgroundColor={Constants.TIER_COLORS.ARTISAN}
          onValueChange={(value) => {
            setIsUseCode(value);

            if (!value) {
              context.setState({ promotionDiscount: 0, discountCode: '', rewardAvailable: true });
              setCode('');
              setDiscounted([]);
              setCurrentCode('');
            }
          }}
          value={isUseCode}
        />
      </View>

      {isUseCode ? (
        <View>
          <View style={{ flexDirection: 'row', marginTop: 20, marginBottom: 14 }}>
            <TextInput
              placeholder={Strings.DISCOUNT_CODE_PLACEHOLDER}
              placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              style={styles.codePlaceHolder}
              value={code}
              onChangeText={(value) => {
                handleChangeCode(value);
              }}
            />
            <TouchableOpacity
              onPress={() => {
                checkPromotionCodeAndApply().catch((err) =>
                  console.log('checkPromotionCodeAndApply error', err),
                );
              }}
              disabled={!code}
              style={{
                backgroundColor: !code
                  ? Constants.TIER_COLORS.STRIVER
                  : Constants.TIER_COLORS.GIVER,
                ...styles.codeApplyButton,
              }}
            >
              <Text style={styles.codeApplyButtonText}>{Strings.APPLY}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                await APIprovider.removePromotionCodeUsage({
                  userId,
                  promotionCode: appliedDiscountCodeId,
                });

                setAppliedDiscountCodeId('');
                setDiscounted([]);
                setCurrentCode('');
                context.setState({
                  discountCode: '',
                  promotionDiscount: 0,
                  rewardAvailable: true,
                });
              }}
              disabled={!currentCode}
              style={{
                backgroundColor: !currentCode
                  ? Constants.TIER_COLORS.STRIVER
                  : Constants.TIER_COLORS.GIVER,
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4,
                ...styles.codeApplyButton,
              }}
            >
              <Text style={styles.codeApplyButtonText}>{Strings.CANCEL}</Text>
            </TouchableOpacity>
          </View>
          {discounted.length ? (
            <View>
              <Text style={styles.discountedDescription}>
                {Strings.DISCOUNT_CODE}: {currentCode}
              </Text>
              {discounted.map((discount, idx) => (
                <Text key={discount.productTitle + '_' + idx} style={styles.discountedDescription}>
                  {Strings.APPLIED_DISCOUNT_CODE_DETAIL_MESSAGE({
                    productTitle: discount.productTitle,
                    percentage: discount.percentage,
                    discountAmount: discount.discountAmount,
                  })}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  codePlaceHolder: {
    fontSize: 11,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
    backgroundColor: Constants.TIER_COLORS.PIONEER,
    width: '60%',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomLeftRadius: 4,
    borderTopLeftRadius: 4,
  },
  codeApplyButton: {
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    width: '20%',
    borderRightColor: Constants.TIER_COLORS.PIONEER,
    borderRightWidth: 0.5,
  },
  codeApplyButtonText: {
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
    fontSize: 13,
    textAlign: 'center',
    color: Constants.TIER_COLORS.ARTISAN,
  },
  discountedDescription: {
    color: Constants.TIER_COLORS.STRIVER,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM,
    fontSize: 13,
    textAlign: 'right',
  },
});
