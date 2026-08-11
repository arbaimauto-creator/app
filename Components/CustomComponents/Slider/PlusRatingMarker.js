import React, { Component, useEffect, useState } from 'react';
import T from '../../Constants/DesignTokens';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { horizontalScale, moderateScale } from '../../utils/scailing';
import { Icon } from 'react-native-elements';
import Constants from '../../Constants';

const PlusRatingMarker = ({ labelText = 'Type', value = '0', plusClick, minusClick }) => {
  const [isPlusPressed, setIsPlusPressed] = useState(false);
  const [isMinusPressed, setIsMinusPressed] = useState(false);

  const handlePlusPressIn = () => {
    setIsPlusPressed(true);
  };

  const handlePlusPressOut = () => {
    setIsPlusPressed(false);
  };

  const handleMinusPressIn = () => {
    setIsMinusPressed(true);
  };

  const handleMinusPressOut = () => {
    setIsMinusPressed(false);
  };

  useEffect(() => {
    let intervalId;

    if (isPlusPressed) {
      intervalId = setInterval(plusClick, 100);
    } else if (isMinusPressed) {
      intervalId = setInterval(minusClick, 100);
    } else {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [isPlusPressed, isMinusPressed, plusClick, minusClick]);

  return (
    <View style={styles.mainContainer}>
      <TouchableOpacity
        style={styles.circle1}
        onPress={minusClick}
        onPressIn={handleMinusPressIn}
        onPressOut={handleMinusPressOut}
      >
        {/* <Text style={styles.plusbuttonText}>{'-'}</Text> */}
        <Icon type="entypo" name="minus" color={T.COLORS.INK} size={24} />
      </TouchableOpacity>
      <View style={styles.textContainer}>
        <Text style={styles.containText1}>{labelText}</Text>
        <Text style={styles.containText}>{value}</Text>
      </View>
      <TouchableOpacity
        style={styles.circle1}
        onPress={plusClick}
        onPressIn={handlePlusPressIn}
        onPressOut={handlePlusPressOut}
      >
        {/* <Text style={styles.plusbuttonText}>{'+'}</Text> */}
        <Icon type="entypo" name="plus" color={T.COLORS.INK} size={24} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    marginVertical: horizontalScale(8),
    alignItems: 'center',
  },
  textContainer: {
    marginHorizontal: horizontalScale(28),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle1: {
    width: horizontalScale(60),
    height: horizontalScale(36),
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    borderRadius: horizontalScale(18),
    // backgroundColor: T.COLORS.GREY,
  },
  plusbuttonText: {
    fontSize: moderateScale(26),
    fontWeight: '600',
    color: Constants.COLOR_BACKGROUND_DARK,
  },
  circle2: {
    width: horizontalScale(14),
    height: horizontalScale(14),
    borderRadius: horizontalScale(7),
    backgroundColor: '#4eaa37',
    position: 'absolute',
    justifyContent: 'center',
    alignSelf: 'center',
    zIndex: 1,
  },
  containText: {
    color: T.COLORS.INK,
    fontSize: moderateScale(18),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
  },
  containText1: {
    color: T.COLORS.INK,
    fontSize: moderateScale(14),
    // marginRight: horizontalScale(16),
    width: horizontalScale(80),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: horizontalScale(30),
    height: horizontalScale(30),
  },
});
export default React.memo(PlusRatingMarker);
