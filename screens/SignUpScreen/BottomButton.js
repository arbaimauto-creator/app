import React from 'react';
import { Button } from 'react-native';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import styles from './styles';

export default function BottomButton({ context }) {
  return (
    <Button
      containerStyle={styles.bottomButtonContainer}
      buttonStyle={{
        height: 54,
      }}
      color={Constants.COLOR_POINT_BLUE}
      titleStyle={styles.bottomButtonTitle}
      title={Strings.CREATE_NEW_ACCOUNT}
      onPress={() => {
        context.onPressSubmitButton();
      }}
      disabled={
        context.state.warningEmail ||
        context.state.warningUserId ||
        context.state.warningPhone ||
        !context.state.countryCode ||
        context.state.name.length < Constants.MIN_LENGTH_USER_ID ||
        context.state.name.length > Constants.MAX_LENGTH_USER_ID ||
        context.state.isSubmitting
      }
    />
  );
}
