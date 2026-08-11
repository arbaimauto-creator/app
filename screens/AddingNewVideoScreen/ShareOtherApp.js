import React from 'react';
import T from '../../Components/Constants/DesignTokens';
import { View, Text, Switch, Alert } from 'react-native';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import styles from './styles';

export default function ShareOtherApp({ context }) {
  const { isAvailableInstagramToShare, isAvailableTiktokToShare } = context.state;

  if (!isAvailableInstagramToShare && !isAvailableTiktokToShare) {
    return <View />;
  }

  return (
    <View>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleContainer}>
          <Text style={[styles.sectionTitle, { flex: 1 }]}>{Strings.AUTO_SHARE_TO}</Text>
        </View>
        {isAvailableInstagramToShare && (
          <View style={{ ...styles.moveButtonContainer, marginTop: -5 }}>
            <Text style={{ ...styles.textInput, paddingHorizontal: 0, borderWidth: 0 }}>
              {Strings.SHARE_TO_INSTAGRAM}
            </Text>
            <Switch
              trackColor={{
                false: T.COLORS.INK,
                true: Constants.COLOR_POINT_BLUE,
              }}
              thumbColor={
                context.state.shareToInstagram
                  ? Constants.TIER_COLORS.PIONEER
                  : T.COLORS.LINE
              }
              ios_backgroundColor={T.COLORS.INK}
              onValueChange={(isShareToInstagram) => {
                if (isShareToInstagram) {
                  context.setState({ shareToInstagram: true });
                  Alert.alert(
                    Strings.POPUP_TITLE_INSTAGRAM_SHARE,
                    Strings.POPUP_NOTICE_INSTAGRAM_SHARE,
                  );
                } else {
                  context.setState({ shareToInstagram: false });
                }
              }}
              value={context.state.shareToInstagram}
            />
          </View>
        )}
        {isAvailableTiktokToShare && (
          <View style={{ ...styles.moveButtonContainer, marginTop: -5 }}>
            <Text style={{ ...styles.textInput, paddingHorizontal: 0, borderWidth: 0 }}>
              {Strings.SHARE_TO_TIKTOK}
            </Text>
            <Switch
              trackColor={{
                false: T.COLORS.INK,
                true: Constants.COLOR_POINT_BLUE,
              }}
              thumbColor={
                context.state.shareToTiktok
                  ? Constants.TIER_COLORS.PIONEER
                  : T.COLORS.LINE
              }
              ios_backgroundColor={T.COLORS.INK}
              onValueChange={(isShareToTiktok) => {
                if (isShareToTiktok) {
                  context.setState({ shareToTiktok: true });
                  Alert.alert(Strings.POPUP_TITLE_TIKTOK_SHARE, Strings.POPUP_NOTICE_TIKTOK_SHARE);
                } else {
                  context.setState({ shareToTiktok: false });
                }
              }}
              value={context.state.shareToTiktok}
            />
          </View>
        )}
      </View>
    </View>
  );
}
