import React from 'react';
import T from '../Constants/DesignTokens';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Constants from '../Constants';
import Strings from '../Strings';
export default function LoadingView({ message = Strings.LOADING, opacity = 1 }) {
  return (
    <View style={{ ...styles.container, opacity: opacity }}>
      <ActivityIndicator size="large" color={Constants.COLOR_MAIN} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.COLORS.INK,
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  message: {
    color: Constants.TIER_COLORS.PIONEER,
    marginTop: 20,
    fontSize: 20,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
    textAlign: 'center',
  },
});
