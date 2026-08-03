import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { CustomMarker } from './CustomMarker';
import Constants from '../../Constants';

const Scale = () => {
  return (
    <View style={styles.maintainer}>
      <View style={styles.container}>
        <Text style={[styles.textStyle, { top: '-2%' }]}>{'10'}</Text>
        <View style={[styles.lineView, { top: '20%' }]} />
        <Text style={[styles.textStyle, { top: '18%' }]}>{'8'}</Text>
        <View style={[styles.lineView, { top: '40%' }]} />
        <Text style={[styles.textStyle, { top: '38%' }]}>{'6'}</Text>
        <View style={[styles.lineView, { top: '60%' }]} />
        <Text style={[styles.textStyle, { top: '58%' }]}>{'4'}</Text>
        <View style={[styles.lineView, { top: '80%' }]} />
        <Text style={[styles.textStyle, { top: '78%' }]}>{'2'}</Text>
        <Text style={[styles.textStyle, { top: '98%' }]}>{'0'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  maintainer: { marginHorizontal: 4 },
  container: {
    borderColor: 'white',
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    width: 12,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineView: { position: 'absolute', height: 1, width: 10, backgroundColor: 'white' },
  textStyle: {
    color: 'white',
    fontSize: 10,
    right: -24,
    width: 16,
    position: 'absolute',
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
export default Scale;
