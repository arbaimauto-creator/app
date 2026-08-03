import React from 'react';
import { Text, TextInput, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import IconFeather from 'react-native-vector-icons/Feather';
import APIprovider from '../../Components/APIprovider';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import utils from '../../Components/utils';
import styles from './styles';

export default function SetName({ context }) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.USER_ID}</Text>
        <Text style={styles.count}>
          {context.state.name.length}/{Constants.MAX_LENGTH_USER_ID}
        </Text>
        <FastImage
          source={require('../../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <Text style={styles.fieldTitleGuidelines}>{Strings.ID_GUIDELINES}</Text>
      {context.state.warningUserId && (
        <Text style={styles.fieldTitleError}>
          <IconFeather name={'alert-circle'} size={14} color={'#a00'} />
          <Text />
          <Text>{context.state.wrongIdReason}</Text>
        </Text>
      )}
      <TextInput
        style={styles.textInput}
        placeholder={Strings.CONDITION_USER_ID}
        placeholderTextColor={Constants.TIER_COLORS.STRIVER}
        onChangeText={(name) => {
          context.setState({ name });
          if (context.state.warningUserId) {
            const result = utils.checkTextFormat({ type: 'id', value: name });
            if (result.code === 'success') {
              context.setState({ warningUserId: false });
            }
          }
        }}
        onEndEditing={async (e) => {
          const result = utils.checkTextFormat({
            type: 'id',
            value: context.state.name,
          });

          const { success } = await APIprovider.checkDuplicateId(context.state.name);

          if (result.code === 'fail' || !success) {
            if (!success) {
              context.setState({ warningUserId: true, wrongIdReason: Strings.USER_ID_DUPLICATED });
            } else {
              context.setState({ warningUserId: true, wrongIdReason: Strings.CHECK_USER_ID });
            }
          } else {
            context.setState({ warningUserId: false });
          }
        }}
        value={context.state.name}
        maxLength={Constants.MAX_LENGTH_USER_ID}
      />
    </View>
  );
}
