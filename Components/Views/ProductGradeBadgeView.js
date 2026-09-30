import React from 'react';
import T from '../Constants/DesignTokens';
import { StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Constants from '../Constants';
import Strings from '../Strings';

export default function ProductGradeBadgeView({
  ratingScore,
  ratingCount = null,
  style = {},
  noCount = false,
  isRefundable,
  availableNumberToSale,
  isVertical,
}) {
  return (
    <View style={styles.ratingContainer({ isRefundable, isVertical })}>
      {isRefundable ? (
        <View style={styles.refundCountContainer({ isSoldOut: availableNumberToSale === 0 })}>
          <View>
            {availableNumberToSale && availableNumberToSale > 0 ? (
              <Text
                style={{
                  color: T.COLORS.INK,
                  fontSize: 12,
                  fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                }}
              >
                {Strings.PRODUCT_REMAINING_QUANTITY(availableNumberToSale)}
              </Text>
            ) : null}
          </View>
          {availableNumberToSale === 0 ? (
            <View
              style={{
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: Constants.CUSTOM_FONTS.SUIT.EXTRABOLD,
                  color: Constants.TIER_COLORS.PIONEER,
                  fontSize: 14,
                }}
              >
                Sold Out
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <View style={styles.ratingScoreContainer({ isRefundable, isVertical })}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FastImage
            style={styles.icon}
            source={require('../../Resources/img/iconRenewal/icBadgeStoreStarOn14.png')}
          />
          <Text style={styles.ratingScore}>
            {ratingCount !== null && ratingCount > 0 ? ratingScore : '-'}
          </Text>
        </View>
        {ratingCount !== null && !noCount && (
          <Text style={styles.reviewCount}>
            {Strings.REVIEWS} {ratingCount}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  refundCountContainer: ({ isSoldOut }) => ({
    backgroundColor: isSoldOut ? 'rgba(255, 0, 0, .3)' : 'rgba(176, 141, 87, .12)',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    height: '50%',
  }),
  ratingScoreContainer: ({ isRefundable, isVertical }) => ({
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: isVertical ? 20 : 0,
    height: isRefundable ? '50%' : '100%',
  }),
  ratingContainer: ({ isRefundable, isVertical }) => ({
    flexDirection: 'column',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    position: isVertical ? 'absolute' : 'relative',
    borderRadius: isVertical ? 12 : 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    left: 0,
    bottom: 0,
    height: isVertical ? (isRefundable ? '35%' : '18%') : '100%',
  }),
  reviewCount: {
    color: T.COLORS.INK,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM,
    fontSize: 13,
  },
  icon: {
    width: 14,
    height: 14,
    marginRight: 2,
  },
  ratingScore: {
    color: T.COLORS.INK,
    fontSize: 14,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.EXTRABOLD,
  },
});
