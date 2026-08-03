import React from 'react';
import { View, Text, TextInput } from 'react-native';
import Strings from '../../Components/Strings';
import utils from '../../Components/utils';
import IconFeather from 'react-native-vector-icons/Feather';
import styles from './styles';
import Constants from '../../Components/Constants';

export default function SetEmail({ context }) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.USER_EMAIL}</Text>
      </View>
      {/* <Text style={styles.fieldTitleGuidelines}>{Strings.EMAIL_GUIDELINES}</Text> */}
      {context.state.warningEmail && (
        <Text style={styles.fieldTitleError}>
          <IconFeather name={'alert-circle'} size={14} color={'#a00'} />
          <Text />
          <Text>{Strings.CHECK_USER_EMAIL}</Text>
        </Text>
      )}
      <TextInput
        keyboardType={'email-address'}
        textContentType={'emailAddress'}
        autoComplete={'email'}
        style={styles.textInput}
        placeholder={Strings.CONDITION_USER_EMAIL}
        placeholderTextColor={Constants.TIER_COLORS.STRIVER}
        onChangeText={(email) => {
          context.setState({ email });
          if (context.state.warningEmail) {
            const result = utils.checkTextFormat({ type: 'email', value: email });
            if (result.code === 'success') {
              context.setState({ warningEmail: false });
            }
          }
        }}
        onEndEditing={(e) => {
          const result = utils.checkTextFormat({
            type: 'email',
            value: context.state.email,
          });
          if (result.code === 'fail') {
            context.setState({ warningEmail: true });
          } else {
            context.setState({ warningEmail: false });
          }
        }}
        value={context.state.email}
      />
    </View>
  );
}
