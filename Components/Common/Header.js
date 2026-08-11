import { useRoute } from '@react-navigation/native';
import T from '../Constants/DesignTokens';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Constants from '../Constants';
import { isGuestUser } from '../utils';
import { horizontalScale, moderateScale, verticalScale } from '../utils/scailing';
import Reward from './Reward';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Header({ screenTitle, navigation, titleSize = {} }) {
  const {
    params: { logonUserId },
  } = useRoute();

  const { top } = useSafeAreaInsets();

  return (
    <View style={{ ...styles.headerContainer, paddingTop: Platform.OS === 'android' ? top : 0 }}>
      <Text style={{ ...styles.headerTitle, ...titleSize }}>{screenTitle}</Text>
      <View style={styles.alignRightReward}>
        {!isGuestUser(logonUserId) ? <Reward navigation={navigation} /> : null}
        <ActionButton
          renderItem={
            <FastImage
              style={styles.headerButton}
              source={require('../../Resources/img/iconRenewal/search-black.png')}
            />
          }
          onPress={() => {
            navigation.navigate('Search');
          }}
        />
      </View>
    </View>
  );
}

function ActionButton({ renderItem, onPress = () => {} }) {
  if (Platform.OS === 'android') {
    return (
      <View>
        <TouchableNativeFeedback
          onPress={() => onPress()}
          background={TouchableNativeFeedback.Ripple('#777', true)}
        >
          <View style={styles.actionButton}>{renderItem}</View>
        </TouchableNativeFeedback>
      </View>
    );
  } else {
    return (
      <View>
        <TouchableOpacity onPress={() => onPress()} activeOpacity={0.7} style={styles.actionButton}>
          {renderItem}
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  headerContainer: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: 20,
    // padding: 20,
    paddingBottom: 7,
    alignItems: 'center',
    backgroundColor: T.COLORS.AMBER,
  },
  headerTitle: {
    fontSize: moderateScale(24),
    color: Constants.TIER_COLORS.PIONEER,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.BOLD_7,
  },
  headerButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 24,
    height: 24,
  },

  myRewardContainer: {
    width: 'auto',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 0.5,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  myRewardContent: { fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM, fontSize: 14, color: 'white' },
  alignRightReward: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    borderRadius: 40,
    width: horizontalScale(44),
    height: verticalScale(44),
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
