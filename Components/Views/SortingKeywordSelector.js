import React from 'react';
import T from '../Constants/DesignTokens';
import { Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Constants from '../Constants';

import Strings from '../Strings';

export const PRODUCT_SORTING_KEYWORD_LIST = [
  Strings.SORTING_KEYWORD_RECENT,
  Strings.SORTING_KEYWORD_SELL_COUNT,
  Strings.SORTING_KEYWORD_REVIEW_COUNT,
  Strings.SORTING_KEYWORD_DISCOUNT_RATE,
];

export const USER_SORTING_KEYWORD_LIST = [
  Strings.SORTING_KEYWORD_RECENT_ACCOUNT_CREATED,
  Strings.SORTING_KEYWORD_RECENT_REVIEW_UPLOADED,
  Strings.SORTING_KEYWORD_REVIEW_COUNT,
  Strings.SORTING_KEYWORD_VIEW,
  Strings.SORTING_KEYWORD_SCORE,
  Strings.SORTING_KEYWORD_REVENUE_AMOUNT,
];

export const VIDEO_SORTING_KEYWORD_LIST = [
  Strings.SORTING_KEYWORD_RECENT,
  Strings.SORTING_KEYWORD_SCORE,
  Strings.SORTING_KEYWORD_VIEW,
];

export const REWARD_SORTING_KEYWORD_LIST = [
  Strings.CATEGORY_ALL,
  Strings.POINT_TYPE.ATTENDANCE,
  Strings.POINT_TYPE.COMMENT,
  Strings.POINT_TYPE.GRADE,
  Strings.POINT_TYPE.REVIEW,
  Strings.POINT_TYPE.BUY_REWARD,
  Strings.POINT_TYPE.REWARD,
  Strings.POINT_TYPE.EVENT_REWARD,
  Strings.POINT_TYPE.WITHDRAWAL,
  Strings.POINT_TYPE.DEDUCT,
  Strings.POINT_TYPE.ROLLBACK,
  // Strings.POINT_TYPE.CERTIFIED_REVIEWER_REWARD,
];

export default function SortingKeywordSelector({
  onItemPress,
  activeItem,
  items,
  top,
  marginRight = 0,
  zIndex = 0,
}) {
  return (
    <View style={{ position: 'absolute', right: -2, top, marginRight, zIndex }}>
      {items && items.length && (
        <View
          style={{
            borderWidth: 0.5,
            borderColor: T.COLORS.INK,
            borderRadius: 5,
            backgroundColor: 'white',
            paddingRight: 20,
            paddingLeft: 20,
            paddingVertical: 10,
            alignItems: 'flex-end',
          }}
        >
          {items.map((item, idx) => {
            return (
              <TouchableOpacity
                key={item + '_' + idx}
                onPress={() => {
                  if (onItemPress) {
                    onItemPress(item);
                  }
                }}
              >
                <Text
                  style={{
                    paddingVertical: 10,
                    fontSize: 15,
                    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
                    color:
                      activeItem === item ? Constants.COLOR_MAIN : T.COLORS.INK,
                  }}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
