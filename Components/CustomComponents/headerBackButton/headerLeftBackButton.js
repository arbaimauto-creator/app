import React from 'react';
import T from '../../Constants/DesignTokens';
import { StatusBar } from 'react-native';
import { Platform, Pressable } from 'react-native';
import FastImage from 'react-native-fast-image';
import Constants from '../../Constants';

export default function HeaderLeftBackButton({ navigation }) {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'ios') {
          StatusBar.setBackgroundColor(T.COLORS.INK);
          StatusBar.setBarStyle('default', true);
        }

        navigation.pop();
      }}
    >
      <FastImage
        style={{
          width: 30,
          height: 30,
          marginLeft: 20,
        }}
        source={require('../../../Resources/img/iconRenewal/backward.png')}
      />
    </Pressable>
  );
}
