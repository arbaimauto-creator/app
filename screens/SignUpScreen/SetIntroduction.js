import React from 'react';
import T from '../../Components/Constants/DesignTokens';
import { View, Text, TextInput } from 'react-native';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import styles from './styles';

export default function SetIntroduction({ context }) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.PROFILE_DESCRIPTION}</Text>
        <Text style={styles.count}>
          {context.state.introduction.length}/{Constants.MAX_LENGTH_USER_INTRODUCTION}
        </Text>
      </View>
      <TextInput
        multiline
        style={styles.textInput}
        placeholder={Strings.ADD_PROFILE_DESCRIPTION}
        placeholderTextColor={T.COLORS.GREY}
        onChangeText={(introduction) => context.setState({ introduction })}
        value={context.state.introduction}
        maxLength={Constants.MAX_LENGTH_USER_INTRODUCTION}
      />
    </View>
  );
}
