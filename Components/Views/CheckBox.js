import React from 'react';
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
// import FastImage from 'react-native-fast-image';
import FastImage from '../utils/SafeFastImage.tsx';

export default function CheckBox({ value, onChanged, style, type = 'check' }) {
  return (
    <View style={style}>
      <TouchableWithoutFeedback
        onPress={() => {
          onChanged(!value);
        }}
      >
        {value ? (
          type === 'radio' ? (
            <FastImage
              source={require('../../Resources/img/icCommonRadioOn20.png')}
              style={styles.checkImage}
            />
          ) : (
            <FastImage
              source={require('../../Resources/img/icCommonCheckOn20.png')}
              style={styles.checkImage}
            />
          )
        ) : (
          <FastImage
            source={require('../../Resources/img/icCommonCheckOff20.png')}
            style={styles.checkImage}
          />
        )}
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  checkImage: {
    width: 20,
    height: 20,
  },
});
