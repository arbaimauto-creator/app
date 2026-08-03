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
          리워드 적립 방법
        </Text>
        <Text style={{ ...styles.textContent, marginLeft: 0 }}>
          그레이드 앱에서 현금처럼 사용 할 수 있는 화폐입니다. {'\n'}20,000 리워드 이상이 쌓였을
          경우, 본인의 계좌로 출금할 수 있습니다. (1일 최대{' '}
          <Text style={{ ...styles.rewardText, fontSize: 14 }}>
            {rewardTypes.MAX}
            <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>R</Text>
          </Text>{' '}
          적립가능 - 리뷰 적립 제외)
        </Text>
      </View>
      <View>
        <Text style={styles.textTitle}>
          1. 출석 체크시{' '}
          <Text style={styles.rewardText}>
            {rewardTypes.ATTENDANCE}
            <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>R</Text>
          </Text>{' '}
          적립
        </Text>
        <Text style={styles.textContent}>
          하루에 한 번 최초 접속시 자동으로 {rewardTypes.ATTENDANCE}R 지급됩니다.
        </Text>
      </View>
      <View>
        <Text style={styles.textTitle}>
          2. 리뷰 업로드시 최대{' '}
          <Text style={styles.rewardText}>
            {rewardTypes.EVENT_REVIEW ? rewardTypes.EVENT_REVIEW : rewardTypes.REVIEW}
            <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>R</Text>
          </Text>{' '}
          적립
        </Text>
        <Text style={styles.textContent}>
          리뷰 컨텐츠를 업로드 할 때마다 최대{' '}
          {rewardTypes.EVENT_REVIEW ? rewardTypes.EVENT_REVIEW : rewardTypes.REVIEW}R 적립됩니다.
        </Text>
      </View>
      <View>
        <Text style={styles.textTitle}>
          3. 리뷰 영상에 G6 점수 줄 시{' '}
          <Text style={styles.rewardText}>
            {rewardTypes.GRADE}
            <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>R</Text>
          </Text>{' '}
          적립
        </Text>
        <Text style={styles.textContent}>
          리뷰어들이 올린 리뷰 영상에 G6 점수주기를 완료하면 {rewardTypes.GRADE}R 지급됩니다. 한번
          준 점수는 취소할 수 없습니다.
        </Text>
      </View>
      <View>
        <Text style={styles.textTitle}>
          4. 댓글 작성시{' '}
          <Text style={styles.rewardText}>
            {rewardTypes.COMMENT}
            <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>R</Text>
          </Text>{' '}
          적립
        </Text>
        <Text style={styles.textContent}>
          다른 사람의 리뷰 영상에 댓글을 달면 {rewardTypes.COMMENT}R 지급됩니다.
        </Text>
      </View>
      <Text
        style={{
          ...styles.textContent,
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.LIGHT_3,
          textAlign: 'right',
        }}
      >
        적립식 리워드는 지급일로부터 6개월 후 소멸됩니다. {'\n\n'}
        단, 이벤트로 적립된 리워드는 1개월 후 소멸됩니다.
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
