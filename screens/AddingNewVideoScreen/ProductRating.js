import React from 'react';
import { Text, Vibration, View } from 'react-native';
import Constants from '../../Components/Constants';
import CustomRating from '../../Components/CustomComponents/CustomRating';
import Strings from '../../Components/Strings';
import styles from './styles';

export default function ProductRating({ context }) {
  const { p6Score } = context.state;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.GRADE_PRODUCT}</Text>
      </View>

      <View style={styles.productRatingContainer}>
        {/* Brand Rating */}
        <Text style={styles.performanceRating}>{Strings.P6_BRAND}</Text>
        <CustomRating
          rated={context.state.p6Score.brand}
          totalCount={5}
          size={24}
          onIconTap={(position) => {
            context.setState({ p6Score: { ...p6Score, brand: position } });
            Vibration.vibrate(Constants.VIBRATION_USER_ACTION);
          }}
          type="custom"
          selectedIconImage={require('../../Resources/img/iconRenewal/icBadgeStoreStarOn14_.png')}
          emptyIconImage={require('../../Resources/img/iconRenewal/icBadgeStoreStarOff14.png')}
        />
        <Text
          style={[
            styles.productRating,
            {
              color: context.state.p6Score.brand
                ? Constants.TIER_COLORS.ARTISAN
                : Constants.TIER_COLORS.STRIVER,
            },
          ]}
        >
          {context.state.p6Score.brand ? context.state.p6Score.brand : 0}
        </Text>
      </View>

      <View style={styles.productRatingContainer}>
        {/* Merchantability Rating */}
        <Text style={styles.performanceRating}>{Strings.P6_MERCHANTABILITY}</Text>
        <CustomRating
          rated={context.state.p6Score.merchantability}
          totalCount={5}
          size={24}
          onIconTap={(position) => {
            context.setState({ p6Score: { ...p6Score, merchantability: position } });
            Vibration.vibrate(Constants.VIBRATION_USER_ACTION);
          }}
          type="custom"
          selectedIconImage={require('../../Resources/img/iconRenewal/icBadgeStoreStarOn14_.png')}
          emptyIconImage={require('../../Resources/img/iconRenewal/icBadgeStoreStarOff14.png')}
        />
        <Text
          style={[
            styles.productRating,
            {
              color: context.state.p6Score.merchantability
                ? Constants.TIER_COLORS.ARTISAN
                : Constants.TIER_COLORS.STRIVER,
            },
          ]}
        >
          {context.state.p6Score.merchantability ? context.state.p6Score.merchantability : 0}
        </Text>
      </View>

      <View style={styles.productRatingContainer}>
        {/* Practicality Rating */}
        <Text style={styles.performanceRating}>{Strings.P6_PRACTICALITY}</Text>
        <CustomRating
          rated={context.state.p6Score.practicality}
          totalCount={5}
          size={24}
          onIconTap={(position) => {
            context.setState({ p6Score: { ...p6Score, practicality: position } });
            Vibration.vibrate(Constants.VIBRATION_USER_ACTION);
          }}
          type="custom"
          selectedIconImage={require('../../Resources/img/iconRenewal/icBadgeStoreStarOn14_.png')}
          emptyIconImage={require('../../Resources/img/iconRenewal/icBadgeStoreStarOff14.png')}
        />
        <Text
          style={[
            styles.productRating,
            {
              color: context.state.p6Score.practicality
                ? Constants.TIER_COLORS.ARTISAN
                : Constants.TIER_COLORS.STRIVER,
            },
          ]}
        >
          {context.state.p6Score.practicality ? context.state.p6Score.practicality : 0}
        </Text>
      </View>

      <View style={styles.productRatingContainer}>
        {/* Convenience Rating */}
        <Text style={styles.performanceRating}>{Strings.P6_CONVENIENCE}</Text>
        <CustomRating
          rated={context.state.p6Score.convenience}
          totalCount={5}
          size={24}
          onIconTap={(position) => {
            context.setState({ p6Score: { ...p6Score, convenience: position } });
            Vibration.vibrate(Constants.VIBRATION_USER_ACTION);
          }}
          type="custom"
          selectedIconImage={require('../../Resources/img/iconRenewal/icBadgeStoreStarOn14_.png')}
          emptyIconImage={require('../../Resources/img/iconRenewal/icBadgeStoreStarOff14.png')}
        />
        <Text
          style={[
            styles.productRating,
            {
              color: context.state.p6Score.convenience
                ? Constants.TIER_COLORS.ARTISAN
                : Constants.TIER_COLORS.STRIVER,
            },
          ]}
        >
          {context.state.p6Score.convenience ? context.state.p6Score.convenience : 0}
        </Text>
      </View>

      <View style={styles.productRatingContainer}>
        {/* Design Rating */}
        <Text style={styles.performanceRating}>{Strings.P6_DESIGN}</Text>
        <CustomRating
          rated={context.state.p6Score.design}
          totalCount={5}
          size={24}
          onIconTap={(position) => {
            context.setState({ p6Score: { ...p6Score, design: position } });
            Vibration.vibrate(Constants.VIBRATION_USER_ACTION);
          }}
          type="custom"
          selectedIconImage={require('../../Resources/img/iconRenewal/icBadgeStoreStarOn14_.png')}
          emptyIconImage={require('../../Resources/img/iconRenewal/icBadgeStoreStarOff14.png')}
        />
        <Text
          style={[
            styles.productRating,
            {
              color: context.state.p6Score.design
                ? Constants.TIER_COLORS.ARTISAN
                : Constants.TIER_COLORS.STRIVER,
            },
          ]}
        >
          {context.state.p6Score.design ? context.state.p6Score.design : 0}
        </Text>
      </View>

      <View style={styles.productRatingContainer}>
        {/* Reasonability Rating */}
        <Text style={styles.performanceRating}>{Strings.P6_REASONABILITY}</Text>
        <CustomRating
          rated={context.state.p6Score.reasonable}
          totalCount={5}
          size={24}
          onIconTap={(position) => {
            context.setState({ p6Score: { ...p6Score, reasonable: position } });
            Vibration.vibrate(Constants.VIBRATION_USER_ACTION);
          }}
          type="custom"
          selectedIconImage={require('../../Resources/img/iconRenewal/icBadgeStoreStarOn14_.png')}
          emptyIconImage={require('../../Resources/img/iconRenewal/icBadgeStoreStarOff14.png')}
        />
        <Text
          style={[
            styles.productRating,
            {
              color: context.state.p6Score.reasonable
                ? Constants.TIER_COLORS.ARTISAN
                : Constants.TIER_COLORS.STRIVER,
            },
          ]}
        >
          {context.state.p6Score.reasonable ? context.state.p6Score.reasonable : 0}
        </Text>
      </View>
    </View>
  );
}
