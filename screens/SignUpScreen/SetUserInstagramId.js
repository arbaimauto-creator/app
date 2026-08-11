import React from 'react';
import T from '../../Components/Constants/DesignTokens';
import { Text, TextInput, View } from 'react-native';
import Strings from '../../Components/Strings';
import styles from './styles';
import Constants from '../../Components/Constants';

export default function SetUserInstagramId({ context }) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.USER_INSTAGRAM_ID}</Text>
      </View>
      {/* <Text style={styles.fieldTitleGuidelines}>{Strings.INSTAGRAM_ID_GUIDELINES}</Text> */}
      <TextInput
        style={styles.textInput}
        placeholder={Strings.CONDITION_USER_INSTAGRAM_ID}
        placeholderTextColor={T.COLORS.GREY}
        onChangeText={(value) => {
          context.setState({ instagramId: value });
        }}
        value={context.state.instagramId}
      />
    </View>
  );
}
