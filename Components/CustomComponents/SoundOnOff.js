import React, { useEffect } from 'react';
import { Text, TouchableNativeFeedback, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Constants from '../Constants';
import Strings from '../Strings';

export default function SoundOnOff({ isMuted, setMuted, style }) {
  return (
    <TouchableNativeFeedback
      onPress={() => {
        setMuted(!isMuted);
      }}
    >
      <View
        style={{
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        <FastImage
          source={
            isMuted
              ? require('../../Resources/img/iconRenewal/sound-off.png')
              : require('../../Resources/img/iconRenewal/sound-on.png')
          }
          style={{ width: 26, height: 26 }}
        />
      </View>
    </TouchableNativeFeedback>
  );
}
