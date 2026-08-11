import React from 'react';
import T from '../Constants/DesignTokens';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Constants from '../Constants';

export default function ReloadBadgeView({ size = 22, containerStyle = {} }) {
  const icReload = (
    <Icon name={'refresh-outline'} size={size} color={T.COLORS.INK} />
  );

  return <View style={[styles.cancelIconContainer, containerStyle]}>{icReload}</View>;
}

const styles = StyleSheet.create({
  cancelIconContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  deleteButton: {
    width: 12,
    height: 12,
  },
});
