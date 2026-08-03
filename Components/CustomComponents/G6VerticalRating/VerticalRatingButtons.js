import React, { useState } from 'react';
import { View, Text, TouchableNativeFeedback } from 'react-native';
import Strings, { getLanguage } from '../../Strings';
import Constants from '../../Constants';

export default function VerticalRatingButtons({ scoreTitle, scoreValue, onPress }) {
  const [value, setValue] = useState(scoreValue);

  return (
    <View style={{ flexDirection: 'column' }}>
      <View style={{ alignItems: 'center' }}>
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
                  value === score ? Constants.TIER_COLORS.GIVER : Constants.TIER_COLORS.PIONEER,
                borderRadius: 16,
                marginBottom: 4,
                height: 30,
                width: 30,
                justifyContent: 'center',
                alignItems: 'center',
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
        <Text
          style={{
            marginTop: 10,
            fontSize: 16,
            width: 40,
            fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Bold,
            textAlign: 'center',
          }}
        >
          {getLanguage() === 'ko' ? scoreTitle : scoreTitle.slice(0, 4)}
        </Text>
      </View>
    </View>
  );
}
