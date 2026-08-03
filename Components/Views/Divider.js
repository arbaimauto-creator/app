import React from 'react';
import { View, StyleSheet } from 'react-native';

const Divider = ({ color = '#e0e0e0', thickness = 1, marginVertical = 10 }) => (
  <View
    style={[
      styles.divider,
      { borderBottomColor: color, borderBottomWidth: thickness, marginVertical },
    ]}
  />
);

const styles = StyleSheet.create({
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginVertical: 10,
  },
});

export default Divider;
