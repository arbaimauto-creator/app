import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Constants from '../Constants';
import Strings, { getLanguage } from '../Strings';

const helpScreenType = {
  main: [
    {
      text: Strings.HELP_BUBBLE_MAIN_1,
      top: '15%',
      left: '20%',
    },
    {
      text: Strings.HELP_BUBBLE_MAIN_2,
      top: '50%',
      left: '5%',
    },
    {
      text: Strings.HELP_BUBBLE_MAIN_3,
      top: '80%',
      left: '15%',
    },
  ],
  video: [
    {
      text: Strings.HELP_BUBBLE_VIDEO_1,
      top: '70%',
      left: '10%',
    },
  ],
  addingNewVideo: [
    {
      text: Strings.HELP_BUBBLE_ADDING_NEW_VIDEO_1,
      top: '8%',
      left: '20%',
    },
    {
      text: Strings.HELP_BUBBLE_ADDING_NEW_VIDEO_2,
      top: '50%',
      left: '12%',
    },
    {
      text: Strings.HELP_BUBBLE_ADDING_NEW_VIDEO_3,
      top: '60%',
      left: '20%',
    },
  ],
  tierGuide: [
    {
      text: Strings.HELP_BUBBLE_TIER_GUIDE_1,
      top: '40%',
      left: '10%',
    },
  ],
};

export default function HelpBubble({ type, helpBubbleIndex, onPress }) {
  const [top, setTop] = useState(0);
  const [left, setLeft] = useState(0);
  const [text, setText] = useState('');

  useEffect(() => {
    if (helpScreenType[type]) {
      const bubbleObject = helpScreenType[type][helpBubbleIndex];
      if (bubbleObject) {
        setTop(bubbleObject.top);
        setLeft(bubbleObject.left);
        setText(bubbleObject.text);
      } else {
        setText('');
      }
    }
  }, [type, helpBubbleIndex]);

  if (getLanguage() === 'en' || !text) {
    return null;
  }

  return (
    <>
      <TouchableOpacity style={styles.container({ top, left })} onPress={() => onPress()}>
        <Text style={{ fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4, fontSize: 15 }}>
          {text}
        </Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  container: ({ top, left }) => ({
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,.85)',
    borderRadius: 16,
    borderColor: 'blue',
    padding: 20,
    top: top || '50%',
    left: left || '50%',
  }),
});
