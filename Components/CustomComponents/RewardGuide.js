import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Constants from '../Constants';
import { moderateScale } from '../utils/scailing';
import HeaderLeftBackButton from './headerBackButton/headerLeftBackButton';
import Strings from '../Strings';
import APIprovider from '../APIprovider';

export default function RewardGuide() {
  const navigation = useNavigation();
  const [rewardTypes, setRewardTypes] = useState({
    REVIEW: 100,
    GRADE: 20,
    COMMENT: 5,
    ATTENDANCE: 20,
    EVENT_REVIEW: 3000,
    MAX: 500,
  });

  useEffect(() => {
    navigation.setOptions({
      title: Strings.REWARD_GUIDE,
      headerLeft: () => HeaderLeftBackButton({ navigation }),
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
    });

    APIprovider.getRewardTypes()
      .then((_rewardTypes) => setRewardTypes(_rewardTypes))
      .catch((err) => console.error('getrewardtypes error', err));
  }, [navigation]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: Constants.COLOR_BACKGROUND_DARK,
        marginTop: 30,
        marginHorizontal: 20,
        flexDirection: 'column',
        justifyContent: 'space-between',
        marginBottom: 100,
      }}
    >
      <View>
        <Text
          style={{
            ...styles.textTitle,
            fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
            fontSize: 18,
          }}
        >
          {Strings.REWARD_GUIDE_INTRO_TITLE}
        </Text>
        <Text style={{ ...styles.textContent, marginLeft: 0 }}>
          {Strings.REWARD_GUIDE_INTRO_BODY_PRE}
          <Text style={{ ...styles.rewardText, fontSize: 14 }}>
            {rewardTypes.MAX}
            <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>R</Text>
          </Text>
          {Strings.REWARD_GUIDE_INTRO_BODY_POST}
        </Text>
      </View>
      <View>
        <Text style={styles.textTitle}>
          {Strings.REWARD_GUIDE_SECTION_1_TITLE_PRE}
          <Text style={styles.rewardText}>
            {rewardTypes.ATTENDANCE}
            <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>R</Text>
          </Text>
          {Strings.REWARD_GUIDE_TITLE_POST}
        </Text>
        <Text style={styles.textContent}>
          {Strings.REWARD_GUIDE_SECTION_1_BODY(rewardTypes.ATTENDANCE)}
        </Text>
      </View>
      <View>
        <Text style={styles.textTitle}>
          {Strings.REWARD_GUIDE_SECTION_2_TITLE_PRE}
          <Text style={styles.rewardText}>
            {rewardTypes.EVENT_REVIEW ? rewardTypes.EVENT_REVIEW : rewardTypes.REVIEW}
            <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>R</Text>
          </Text>
          {Strings.REWARD_GUIDE_TITLE_POST}
        </Text>
        <Text style={styles.textContent}>
          {Strings.REWARD_GUIDE_SECTION_2_BODY(
            rewardTypes.EVENT_REVIEW ? rewardTypes.EVENT_REVIEW : rewardTypes.REVIEW,
          )}
        </Text>
      </View>
      <View>
        <Text style={styles.textTitle}>
          {Strings.REWARD_GUIDE_SECTION_3_TITLE_PRE}
          <Text style={styles.rewardText}>
            {rewardTypes.GRADE}
            <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>R</Text>
          </Text>
          {Strings.REWARD_GUIDE_TITLE_POST}
        </Text>
        <Text style={styles.textContent}>
          {Strings.REWARD_GUIDE_SECTION_3_BODY(rewardTypes.GRADE)}
        </Text>
      </View>
      <View>
        <Text style={styles.textTitle}>
          {Strings.REWARD_GUIDE_SECTION_4_TITLE_PRE}
          <Text style={styles.rewardText}>
            {rewardTypes.COMMENT}
            <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>R</Text>
          </Text>
          {Strings.REWARD_GUIDE_TITLE_POST}
        </Text>
        <Text style={styles.textContent}>
          {Strings.REWARD_GUIDE_SECTION_4_BODY(rewardTypes.COMMENT)}
        </Text>
      </View>
      <Text
        style={{
          ...styles.textContent,
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.LIGHT_3,
          textAlign: 'right',
        }}
      >
        {Strings.REWARD_GUIDE_EXPIRY}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  textTitle: {
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    fontSize: 16,
    marginBottom: 10,
    color: Constants.TIER_COLORS.ARTISAN,
  },
  textContent: {
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
    fontSize: 12,
    marginLeft: 20,
    color: Constants.TIER_COLORS.ARTISAN,
  },
  rewardText: {
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
    color: Constants.TIER_COLORS.GIVER,
  },
});
