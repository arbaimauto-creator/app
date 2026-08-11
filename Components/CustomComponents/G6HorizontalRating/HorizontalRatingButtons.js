import React, { useState } from 'react';
import T from '../../Constants/DesignTokens';
import { Text, TouchableNativeFeedback, View } from 'react-native';
import Constants from '../../Constants';
import Strings from '../../Strings';

export default function HorizontalRatingButtons({ scoreTitle, scoreValue, onPress, idx }) {
  const [value, setValue] = useState(scoreValue);

  return (
    <View>
      <Text
        style={{
          fontSize: 14,
          fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Bold,
          marginHorizontal: 20,
          marginBottom: 5,
          color: 'black', //T.COLORS.INK,
          opacity: 1,

          // textShadowColor: 'rgba(0, 0, 0, 1)',
          // textShadowOffset: { width: 1.5, height: 1.5 },
          // textShadowRadius: 1,
        }}
      >
        {scoreTitle}
      </Text>
      <View
        style={{
          // width: '100%',
          justifyContent: 'space-between',
          flexDirection: 'row',
          marginHorizontal: 20,
        }}
      >
        {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
          <TouchableNativeFeedback
            key={Strings.G_SIX.AUTHENTIC + '_' + score}
            onPress={() => {
              onPress(score);
              setValue(score);
            }}
          >
            <View
              style={{
                backgroundColor:
                  value === score ? T.COLORS.AMBER : Constants.TIER_COLORS.PIONEER,
                borderRadius: 16,
                marginBottom: idx === 5 ? 0 : 10,
                height: 25,
                width: 25,
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Medium,
                }}
              >
                {score}
              </Text>
            </View>
          </TouchableNativeFeedback>
        ))}
      </View>
    </View>
  );
}
