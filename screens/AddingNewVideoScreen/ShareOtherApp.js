import React from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import styles from './styles';

export default function ShareOtherApp({ context }) {
  return (
    <View>
      {context.state.isAvailableInstagramToShare && (
        <View>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionTitleContainer}>
              <Text style={[styles.sectionTitle, { flex: 1 }]}>{Strings.AUTO_SHARE_TO}</Text>
            </View>
            <View style={{ ...styles.moveButtonContainer, marginTop: -5 }}>
              <Text style={{ ...styles.textInput, paddingHorizontal: 0, borderWidth: 0 }}>
                {Strings.SHARE_TO_INSTAGRAM}
              </Text>
              <Switch
                trackColor={{
                  false: Constants.TIER_COLORS.ARTISAN,
                  true: Constants.COLOR_POINT_BLUE,
                }}
                thumbColor={
                  context.state.shareTo === 'instagram'
                    ? Constants.TIER_COLORS.PIONEER
                    : Constants.TIER_COLORS.EXPLORER
                }
                ios_backgroundColor={Constants.TIER_COLORS.ARTISAN}
                onValueChange={(isShareToInstagram) => {
                  if (isShareToInstagram) {
                    context.setState({ shareTo: 'instagram' });
                    Alert.alert(
                      Strings.POPUP_TITLE_INSTAGRAM_SHARE,
                      Strings.POPUP_NOTICE_INSTAGRAM_SHARE,
                    );
                  } else {
                    context.setState({ shareTo: null });
                  }
                }}
                value={context.state.shareTo === 'instagram'}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
