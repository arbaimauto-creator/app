import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Constants from '../../Components/Constants';
import CustomRating from '../../Components/CustomComponents/CustomRating';
import Strings, { getLanguage } from '../../Components/Strings';

const width = Dimensions.get('window').width;
const RatingSection = React.memo(({ label, ratingScore, selectedIcon, emptyIcon }) => (
  <View style={styles.ratingSectionContainer}>
    <Text style={styles.performanceRating} numberOfLines={1}>
      {label}
    </Text>
    <CustomRating
      rated={ratingScore}
      totalCount={5}
      size={20}
      type="custom"
      selectedIconImage={selectedIcon}
      emptyIconImage={emptyIcon}
    />
    <Text
      style={[
        styles.reviewerRating,
        {
          color: ratingScore ? Constants.TIER_COLORS.ARTISAN : Constants.TIER_COLORS.STRIVER,
        },
      ]}
    >
      {ratingScore ? ratingScore : 0}
    </Text>
  </View>
));

function ReviewerRating({ context }) {
  const { video } = context.state;

  const defaultRating = 5;
  // Rendering the P6 ratings if they exist

  return (
    <View style={styles.reviewerRatingContainer}>
      {video.p6Score ? (
        <>
          <RatingSection
            label={Strings.P6_BRAND}
            ratingScore={video?.p6Score?.brand || defaultRating}
            selectedIcon={require('../../Resources/img/iconRenewal/icBadgeStoreStarOn14_.png')}
            emptyIcon={require('../../Resources/img/iconRenewal/icBadgeStoreStarOff14.png')}
          />
          <RatingSection
            label={Strings.P6_MERCHANTABILITY}
            ratingScore={video?.p6Score?.merchantabilityRating || defaultRating}
            selectedIcon={require('../../Resources/img/iconRenewal/icBadgeStoreStarOn14_.png')}
            emptyIcon={require('../../Resources/img/iconRenewal/icBadgeStoreStarOff14.png')}
          />
          <RatingSection
            label={Strings.P6_PRACTICALITY}
            ratingScore={video?.p6Score?.practicality || defaultRating}
            selectedIcon={require('../../Resources/img/iconRenewal/icBadgeStoreStarOn14_.png')}
            emptyIcon={require('../../Resources/img/iconRenewal/icBadgeStoreStarOff14.png')}
          />
          <RatingSection
            label={Strings.P6_CONVENIENCE}
            ratingScore={video?.p6Score?.convenience || defaultRating}
            selectedIcon={require('../../Resources/img/iconRenewal/icBadgeStoreStarOn14_.png')}
            emptyIcon={require('../../Resources/img/iconRenewal/icBadgeStoreStarOff14.png')}
          />
          <RatingSection
            label={Strings.P6_DESIGN}
            ratingScore={video?.p6Score?.design || defaultRating}
            selectedIcon={require('../../Resources/img/iconRenewal/icBadgeStoreStarOn14_.png')}
            emptyIcon={require('../../Resources/img/iconRenewal/icBadgeStoreStarOff14.png')}
          />
          <RatingSection
            label={Strings.P6_REASONABILITY}
            ratingScore={video?.p6Score?.reasonabilityRating || defaultRating}
            selectedIcon={require('../../Resources/img/iconRenewal/icBadgeStoreStarOn14_.png')}
            emptyIcon={require('../../Resources/img/iconRenewal/icBadgeStoreStarOff14.png')}
          />
        </>
      ) : (
        <View style={styles.simpleRatingContainer}>
          <CustomRating
            rated={video?.linkedProduct?.uploaderRating}
            totalCount={5}
            size={14}
            type="custom"
            selectedIconImage={require('../../Resources/img/iconRenewal/icBadgeStoreStarOn14_.png')}
            emptyIconImage={require('../../Resources/img/iconRenewal/icBadgeStoreStarOff14.png')}
          />
          <Text style={styles.reviewerRating}>{video?.linkedProduct?.uploaderRating}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  reviewerRatingContainer: {
    width: width - 40,
    marginVertical: 30,
    marginHorizontal: 20,
    alignSelf: 'flex-start',
  },
  ratingSectionContainer: {
    width: width - 40,
    flexDirection: 'row',
    marginVertical: 4,
  },
  performanceRating: {
    marginRight: 8,
    marginBottom: 8,
    width: getLanguage() === 'ko' ? '15%' : '30%',
    fontSize: 16,
    color: Constants.TIER_COLORS.ARTISAN,
    fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Medium,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerRating: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Medium,
    fontSize: 16,
    marginLeft: 8,
  },
  simpleRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ReviewerRating;
