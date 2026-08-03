import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

function SideTouchCoverView({ context, onPress, onPressLeftSide, onPressRightSide }) {
  return (
    <View style={[context.getPlayerStyle(), styles.customVideoControl]}>
      <View style={{ flex: 1, height: '100%', alignItems: 'center' }}>
        <TouchableOpacity
          style={{ flex: 1, width: '100%' }}
          onPress={() => {
            if (onPressLeftSide) {
              onPressLeftSide();
            } else if (onPress) {
              onPress();
            }
          }}
        />
      </View>
      <View style={{ flex: 2, width: '100%' }}>
        <TouchableOpacity
          style={{ flex: 1, width: '100%' }}
          onPress={() => {
            if (onPress) {
              onPress();
            }
          }}
        />
      </View>
      <View style={{ flex: 1, height: '100%', alignItems: 'center' }}>
        <TouchableOpacity
          style={{ flex: 1, width: '100%' }}
          onPress={() => {
            if (onPressRightSide) {
              onPressRightSide();
            } else if (onPress) {
              onPress();
            }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  customVideoControl: {
    position: 'absolute',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 70,
  },
});

export default SideTouchCoverView;
