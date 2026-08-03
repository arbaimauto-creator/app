import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Triangle from 'react-native-triangle';

const RADIUS = 5;
const POINT_HEIGHT = 15;
const POINT_WIDTH = 20;
const POINT_POSITION = 0.35;

const SpeechBubbleView = (props) => {
  const { width = 230, height = 80, backgroundColor = '#2a2a2a', direction = 'right' } = props;
  const { bottom, right } = props.style;

  useEffect(() => {}, []);

  return (
    <Pressable
      onPress={() => {
        if (props.onPress && typeof props.onPress === 'function') {
          props.onPress();
        }
      }}
    >
      <View style={{ ...styles.container, bottom, right }}>
        <View
          style={{
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.8)',
            width,
            minHeight: height,
            backgroundColor,
            ...styles.messageContainer,
          }}
        >
          <Text style={styles.message}>{props.children}</Text>
        </View>
        <View
          style={{
            ...styles.point,
            top: height * POINT_POSITION - 1,
            left: width - 2,
          }}
        >
          <Triangle
            width={POINT_HEIGHT + 2}
            height={POINT_WIDTH + 2}
            color={'rgba(255,255,255,0.8)'}
            direction={direction}
          />
        </View>
        <View
          style={{
            ...styles.point,
            top: height * POINT_POSITION,
            left: width - 4,
          }}
        >
          <Triangle
            width={POINT_HEIGHT}
            height={POINT_WIDTH}
            color={backgroundColor}
            direction={direction}
          />
        </View>
      </View>
    </Pressable>
  );
};

export default SpeechBubbleView;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    opacity: 1,
  },
  messageContainer: {
    position: 'absolute',
    borderRadius: RADIUS,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  message: {
    opacity: 1,
    color: 'white',
    fontSize: 16,
    lineHeight: 21,
  },
  point: {
    position: 'absolute',
  },
});
