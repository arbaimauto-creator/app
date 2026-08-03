import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { CustomMarker } from './CustomMarker';
import Constants from '../../Constants';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { horizontalScale, moderateScale } from '../../utils/scailing';

const CustomSlider = ({ sliderOneValue, labelText, onRatingChange }) => {
  // const [value, setValue] = useState(sliderOneValue);

  return (
    <View>
      {/* <Text
        style={{
          color: 'white',
          textAlign: 'center',
          marginBottom: 15,
          fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
          fontSize: 16,
        }}
      >
        {value}
      </Text> */}
      <View style={styles.maincontainer}>
        <View style={styles.container}>
          <View style={[styles.lineView, { top: '33%' }]} />
          <View style={[styles.lineView, { top: '66%' }]} />
        </View>
        <MultiSlider
          values={[sliderOneValue]}
          sliderLength={160}
          min={0}
          max={10}
          step={1}
          vertical
          // showStepMarkers
          // smoothSnapped
          enabledTwo={false}
          trackStyle={{
            height: horizontalScale(4),
          }}
          // allowOverlap
          // snapped
          onValuesChange={(changedValue) => {
            // setValue(changedValue[0]);
            onRatingChange(changedValue[0]);
          }}
          unselectedStyle={{
            backgroundColor: 'transperent',
          }}
          selectedStyle={{
            backgroundColor: Constants.COLOR_MAIN,
            borderRadius: moderateScale(10),
          }}
          touchDimensions={{
            height: moderateScale(50),
            width: moderateScale(50),
            borderRadius: moderateScale(50),
            slipDisplacement: moderateScale(50),
          }}
          containerStyle={{
            backgroundColor: 'transperent',
            paddingLeft: moderateScale(20),
            marginTop: moderateScale(20),
            height: moderateScale(20),
          }}
          customMarker={CustomMarker}
        />
        <View style={{ position: 'absolute', bottom: -25 }}>
          <Text numberOfLines={1} style={styles.textStyle}>
            {labelText.length > 2 ? labelText.slice(0, 3) : labelText}
            {/* {labelText} */}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  maincontainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    width: 50,
    marginHorizontal: 2.5,
  },
  container: {
    borderColor: '#6a6a6a',
    borderWidth: 2,
    borderRadius: 10,
    width: 8,
    height: 160,
    // alignItems: 'center',
    // justifyContent: 'center',
    // marginHorizontal: 10,
    position: 'absolute',
    bottom: 0,
  },
  lineView: { position: 'absolute', height: 1.5, width: 4, backgroundColor: '#a0a0a0', left: 0 },
  textStyle: {
    color: 'white',
    fontSize: 14,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
  },
  column: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    bottom: -20,
  },
  active: {
    textAlign: 'center',
    fontSize: 20,
    color: '#5e5e5e',
  },
  inactive: {
    textAlign: 'center',
    fontWeight: 'normal',
    color: '#bdc3c7',
  },
  line: {
    textAlign: 'center',
  },
});

export default React.memo(CustomSlider);
