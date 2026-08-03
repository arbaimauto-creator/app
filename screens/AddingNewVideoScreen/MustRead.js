import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Text, TouchableNativeFeedback, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import { CheckBox } from '../../Components/Views';
import styles from './styles';

export default function MustRead({ context }) {
  const navigation = useNavigation();

  return (
    <View style={styles.sectionContainer}>
      <TouchableNativeFeedback
        onPress={() => {
          navigation.push('MustReadDetail', { context });
        }}
      >
        <View style={styles.sectionTitleContainer}>
          <FastImage
            source={require('../../Resources/img/icGreydSplashSymbol126.png')}
            style={{ width: 20, height: 20, marginRight: 10 }}
          />
          <Text
            style={{
              fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
              fontSize: 16,
              marginRight: 10,
            }}
          >
            {Strings.MUST_READ}
          </Text>
          <CheckBox
            value={context.state.isRead}
            onChanged={() => {
              navigation.push('MustReadDetail', { context });
            }}
          />
        </View>
      </TouchableNativeFeedback>
    </View>
  );
}
