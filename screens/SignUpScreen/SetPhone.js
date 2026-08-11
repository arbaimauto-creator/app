import React from 'react';
import T from '../../Components/Constants/DesignTokens';
import { View, Text, TextInput } from 'react-native';
import Strings from '../../Components/Strings';
import IconFeather from 'react-native-vector-icons/Feather';
import styles from './styles';
import utils from '../../Components/utils';
import Constants from '../../Components/Constants';

export default function SetPhone({ context }) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.USER_PHONE}</Text>
      </View>
      <Text style={styles.fieldTitleGuidelines}>{Strings.PHONE_GUIDELINES}</Text>
      {context.state.warningPhone && (
        <Text style={styles.fieldTitleError}>
          <IconFeather name={'alert-circle'} size={14} color={'#a00'} />
          <Text />
          <Text>{Strings.CHECK_USER_PHONE}</Text>
        </Text>
      )}
      <TextInput
        keyboardType={'decimal-pad'}
        textContentType={'telephoneNumber'}
        style={styles.textInput}
        placeholder={Strings.CONDITION_USER_PHONE}
        placeholderTextColor={T.COLORS.GREY}
        onChangeText={(phone) => {
          context.setState({ phone });
          if (context.state.warningPhone) {
            const value = phone
              ? phone.length > 10
                ? phone
                    .match(/\d+/g)
                    .join('')
                    .replace(/(\d{3})\-?(\d{4})\-?(\d{1})/, '$1-$2-$3')
                : phone
                    .match(/\d+/g)
                    .join('')
                    .replace(/(\d{3})\-?(\d{3})\-?(\d{1})/, '$1-$2-$3')
              : '';
            const result = utils.checkTextFormat({ type: 'phone', value: value });
            if (result.code === 'success') {
              context.setState({ warningPhone: false });
            }
          }
        }}
        onEndEditing={(e) => {
          const phone = context.state.phone;
          const value = phone
            ? phone.length > 10
              ? phone
                  .match(/\d+/g)
                  .join('')
                  .replace(/(\d{3})\-?(\d{4})\-?(\d{1})/, '$1-$2-$3')
              : phone
                  .match(/\d+/g)
                  .join('')
                  .replace(/(\d{3})\-?(\d{3})\-?(\d{1})/, '$1-$2-$3')
            : '';
          context.setState({ phone: value });
          const result = utils.checkTextFormat({ type: 'phone', value: value });
          if (result.code === 'fail') {
            context.setState({ warningPhone: true });
          } else {
            context.setState({ warningPhone: false });
          }
        }}
        onFocus={() => {
          const phone = context.state.phone;
          const value = phone ? phone.match(/\d+/g).join('') : '';
          context.setState({ phone: value });
        }}
        value={context.state.phone}
        maxLength={Constants.MAX_LENGTH_USER_PHONE}
      />
    </View>
  );
}
