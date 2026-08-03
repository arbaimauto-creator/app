import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';

export default function QuestionToReviewer({ context, navigation }) {
  return (
    <TouchableOpacity
      style={styles.buttonContanier}
      onPress={() => {
        navigation.push('UserPage', {
          pageOwnerUserId: context.state.video.author.userId,
          pageOwnerUserName: context.state.video.author.name,
          isQuestion: true,
        });
      }}
    >
      <FastImage
        style={styles.buttonIcon}
        source={require('../../Resources/img/iconRenewal/question-to-reviewer.png')}
      />
      <Text style={styles.buttonText}>{Strings.QUESTION_TO_REVIEWER}</Text>
      <View />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContanier: {
    marginTop: 20,
    marginHorizontal: 20,
    paddingHorizontal: 20,
    backgroundColor: Constants.COLOR_POINT_BLUE,
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonIcon: { width: 30, height: 30 },
  buttonText: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 18,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
  },
});
