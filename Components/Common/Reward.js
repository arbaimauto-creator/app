import React, { useEffect } from 'react';
import T from '../Constants/DesignTokens';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Constants from '../Constants';
import Strings from '../Strings';
import { changeCurrency, numberWithCommas } from '../utils';
import { setTotalReward } from '../../slices/user';

export default function Reward({ navigation }) {
  const dispatch = useDispatch();

  const {
    user: { data },
    totalReward,
    unearnedProfit,
    unearnedRevenue,
    currencyRate,
  } = useSelector((state) => state.user);

  useEffect(() => {
    if (totalReward && typeof totalReward === 'number') {
      dispatch(setTotalReward({ totalReward }));
    }
  }, [dispatch, totalReward]);

  return (
    <TouchableOpacity
      style={styles.myRewardContainer}
      onPress={
        () => navigation.navigate('RewardList', data)
        // navigation.navigate('RewardList', { unearnedProfit, unearnedRevenue, ...data })
      }
    >
      <Text style={styles.myRewardContent}>
        {/* {Strings.MY_REWARD}{' '} */}
        <Text style={{ fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5 }}>
          {numberWithCommas(changeCurrency({ current: totalReward, currencyRate }))}{' '}
          <Text style={{ color: '#0000ff' }}>R</Text>
        </Text>
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  myRewardContainer: {
    width: 'auto',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    // borderWidth: 0.5,
    borderColor: T.COLORS.INK,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  myRewardContent: {
    padding: 1,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.LIGHT_3,
    fontSize: 13,
    color: 'black',
  },
});
