import React from 'react';
import { StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';

export default function CancelBadgeView({ containerStyle = {} }) {
  const icCancel = (
    <FastImage
      style={styles.deleteButton}
      source={require('../../Resources/img/icHeaderSearchDelete12W.png')}
    />
  );

  return <View style={[styles.cancelIconContainer, containerStyle]}>{icCancel}</View>;
}

const styles = StyleSheet.create({
  cancelIconContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  deleteButton: {
    width: 12,
    height: 12,
  },
});
