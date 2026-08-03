import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Constants from '../Constants';
import { moderateScale } from '../utils/scailing';

const types = {
  REVIEW_ON: 'review_on',
  REVIEW_OFF: 'review_off',
  USER: 'user',
};

export default function ReviewGradeBadgeView({
  ratingScore,
  ratingCount,
  g6AvgRatingScore,
  g6RatingCount,
  type = types.REVIEW_OFF,
  containerStyle = {},
  titleStyle = {},
}) {
  const icGrade =
    type === types.USER ? (
      <FastImage
        style={styles.reviewRatingIcon}
        // source={require('../../Resources/img/icBadgeGreydBlack12.png')}
        // source={require('../../Resources/img/icBadgeGreydOff12.png')}
        source={require('../../Resources/img/icBadgeGreydOn12.png')}
      />
    ) : type === types.REVIEW_ON || (type === 'main' && g6RatingCount > 0) ? (
      <FastImage
        style={styles.reviewRatingIcon}
        source={require('../../Resources/img/icBadgeGreydOn12.png')}
      />
    ) : (
      <FastImage
        style={styles.reviewRatingIcon}
        // source={require('../../Resources/img/icBadgeGreydOff12.png')}
        source={require('../../Resources/img/icBadgeGreydOn12.png')}
      />
    );

  const reviewRatingContainerStyle =
    type === types.USER
      ? styles.reviewRatingContainerUser(type)
      : type === types.REVIEW_ON
      ? styles.reviewRatingContainerReviewOn
      : type === 'main' && g6RatingCount > 0
      ? styles.reviewRatingContainerMain
      : styles.reviewRatingContainerReviewOff;

  const reviewRatingTitleStyle =
    type === types.USER
      ? styles.reviewRatingUser(type)
      : type === types.REVIEW_ON || (type === 'main' && g6RatingCount > 0)
      ? styles.reviewRatingReviewOn
      : styles.reviewRatingReviewOff;

  return (
    <View style={[reviewRatingContainerStyle, containerStyle]}>
      {icGrade}
      <Text style={reviewRatingTitleStyle}>{g6RatingCount > 0 ? g6AvgRatingScore : 0} </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  reviewRatingContainerUser: (type) => ({
    // backgroundColor: type === types.USER ? Constants.COLOR_POINT_BLUE : Constants.COLOR_MAIN,
    marginTop: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: Constants.COLOR_BACKGROUND_DARK,
  }),
  reviewRatingContainerReviewOn: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    // borderWidth: 2,
    borderColor: Constants.COLOR_MAIN,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  reviewRatingContainerMain: {
    // backgroundColor: 'rgba(31, 31, 31, 0.5)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', //'rgba(255, 255, 255, 0.5)',
    // borderWidth: 1,
    // borderColor: Constants.COLOR_MAIN,
    borderRadius: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  reviewRatingContainerReviewOff: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  reviewRatingIcon: {
    width: moderateScale(16),
    height: moderateScale(16),
    marginRight: 4,
  },
  reviewRatingReviewOn: {
    // color: Constants.COLOR_MAIN,
    color: Constants.TIER_COLORS.PIONEER,
    fontSize: moderateScale(16),
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
  reviewRatingReviewOff: {
    color: 'white',
    fontSize: 13,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
  reviewRatingUser: (type) => ({
    color: type === types.USER ? Constants.COLOR_BACKGROUND_DARK : 'black',
    fontSize: 13,
    fontWeight: 'bold',
  }),
});
