import React, { useState } from 'react';
import T from '../Constants/DesignTokens';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import Constants from '../Constants';
import { moderateScale } from '../utils/scailing';
import Strings from '../Strings';
import { useDispatch } from 'react-redux';
import { setMainScreenType } from '../../slices/common';

const MAIN_SCREEN_TAB_INDEX = {
  MAIN: 0,
  REVIEW: 1,
};

export default function ToggleTextButton({ screenType, setScreenType }) {
  const dispatch = useDispatch();

  return (
    <View style={styles.circuletabview}>
      <Pressable
        style={[
          styles.lefttabstyle,
          {
            backgroundColor:
              screenType === MAIN_SCREEN_TAB_INDEX.MAIN
                ? T.COLORS.AMBER
                : Constants.COLOR_BACKGROUND_DARK,
            zIndex: screenType === MAIN_SCREEN_TAB_INDEX.MAIN ? 1 : 0,
            borderRadius: screenType === MAIN_SCREEN_TAB_INDEX.MAIN ? 20 : 0,
          },
        ]}
        onPress={() => {
          // setFocusedTab(MAIN_SCREEN_TAB_INDEX.MAIN);
          setScreenType(MAIN_SCREEN_TAB_INDEX.MAIN);
          if (Platform.OS !== 'ios') {
            StatusBar.setBackgroundColor(T.COLORS.INK);
            StatusBar.setBarStyle('default', true);
          }
          dispatch(setMainScreenType({ screenType: MAIN_SCREEN_TAB_INDEX.MAIN }));
        }}
      >
        <Text
          style={[
            styles.tabTextstyle,
            {
              color: T.COLORS.INK,
              // screenType === MAIN_SCREEN_TAB_INDEX.MAIN
              //   ? Constants.COLOR_BACKGROUND_DARK
              //   : T.COLORS.INK,
            },
          ]}
        >
          {Strings.REVIEW}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => {
          // setFocusedTab(MAIN_SCREEN_TAB_INDEX.REVIEW);
          setScreenType(MAIN_SCREEN_TAB_INDEX.REVIEW);
          if (Platform.OS !== 'ios') {
            StatusBar.setBackgroundColor(T.COLORS.AMBER);
            StatusBar.setBarStyle('default', true);
          }
          dispatch(setMainScreenType({ screenType: MAIN_SCREEN_TAB_INDEX.REVIEW }));
        }}
        style={[
          styles.righttabstyle,
          {
            backgroundColor:
              screenType === MAIN_SCREEN_TAB_INDEX.REVIEW
                ? T.COLORS.AMBER
                : Constants.COLOR_BACKGROUND_DARK,
            zIndex: screenType === MAIN_SCREEN_TAB_INDEX.REVIEW ? 1 : 0,
            borderRadius: screenType === MAIN_SCREEN_TAB_INDEX.REVIEW ? 20 : 0,
          },
        ]}
      >
        <Text
          style={[
            styles.tabTextstyle,
            {
              color: T.COLORS.INK,
              // screenType === MAIN_SCREEN_TAB_INDEX.REVIEW
              //   ? Constants.COLOR_BACKGROUND_DARK
              //   : T.COLORS.INK,
            },
          ]}
        >
          {Strings.ALL}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  circuletabview: {
    flexDirection: 'row',
  },
  lefttabstyle: {
    borderWidth: 0.5,
    paddingHorizontal: 20,
    height: 26,
    // borderRadius: 20,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    justifyContent: 'center',
  },
  righttabstyle: {
    borderWidth: 0.5,
    marginLeft: -10,
    paddingHorizontal: 20,
    height: 26,
    // borderRadius: 20,
    borderTopEndRadius: 20,
    borderBottomEndRadius: 20,
    justifyContent: 'center',
  },
  tabTextstyle: {
    fontSize: moderateScale(11),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
  },
});
