import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { horizontalScale } from '../../utils/scailing';

export class CustomMarker extends Component {
  render() {
    return <View style={styles.circle1} />;
  }
}

const styles = StyleSheet.create({
  circle1: {
    width: horizontalScale(18),
    height: horizontalScale(18),
    justifyContent: 'center',
    borderRadius: horizontalScale(18) / 2,
    backgroundColor: 'orange',
    marginTop: horizontalScale(4),
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
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: horizontalScale(30),
    height: horizontalScale(30),
  },
});
