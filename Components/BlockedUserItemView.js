import React, { useState } from 'react';
import T from './Constants/DesignTokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import APIprovider from './APIprovider';
import Constants from './Constants';
import Strings from './Strings';

function BlockedUserItemView({ item, navigation }) {
  const [isBlocked, setBlock] = useState(true);
  const [buttonTitle, setButtonTitle] = useState(Strings.UNBLOCK);
  const [buttonStyle, setButtonStyle] = useState(styles.actionButtonIcon);
  const [buttonTitleStyle, setButtonTitleStyle] = useState(styles.buttonTitle);

  const handleAction = (e) => {
    //alert
    if (isBlocked) {
      APIprovider.unblockUser(item._id).then((res) => {
        if (res.result === 1) {
          setBlock(false);
          setButtonTitle(Strings.UNBLOCKED);
          setButtonStyle(styles.actionButtonDisabledIcon);
          setButtonTitleStyle(styles.buttonDisableTitle);
        } else if (res.result === -1) {
          setBlock(false);
          setButtonTitle(Strings.UNBLOCKED);
          setButtonStyle(styles.actionButtonDisabledIcon);
          setButtonTitleStyle(styles.buttonDisableTitle);
        }
      });
    }
  };
  function BlockButtonView() {
    return (
      <Pressable disabled={!isBlocked} onPress={handleAction} style={buttonStyle}>
        <Text style={buttonTitleStyle}>{buttonTitle}</Text>
      </Pressable>
    );
  }

  const handlePressItem = () => {
    navigation.push('UserPage', {
      pageOwnerUserId: item._id,
      pageOwnerUserName: item.name,
    });
  };
  return (
    <Pressable onPress={handlePressItem} activeOpacity={0.9}>
      <View style={styles.notiContainer}>
        <FastImage
          style={styles.roundIcon}
          source={{
            uri: item.profilePicUrl ? item.profilePicUrl : Constants.NO_USER_URL,
          }}
        />
        <View style={styles.textBox}>
          <Text style={styles.title}>{item.name}</Text>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.subTitle}>
            {item.introduction}
          </Text>
        </View>
        <View
          onStartShouldSetResponder={(event) => true}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
        >
          <BlockButtonView />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  notiContainer: {
    flex: 1,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 20,
    paddingLeft: 25,
  },
  textBox: {
    overflow: 'hidden',
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 12,
    paddingRight: 12,
  },
  actionImageIcon: {
    height: 50,
    width: 50,
    borderRadius: 4,
  },
  actionButtonIcon: {
    height: 30,
    borderRadius: 4,
    backgroundColor: T.COLORS.INK,
    width: 105,
    color: 'black',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabledIcon: {
    height: 30,
    borderRadius: 4,
    borderColor: T.COLORS.INK,
    borderWidth: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    width: 105,
    color: T.COLORS.INK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundIcon: {
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    width: 50,
  },
  squareIcon: {
    height: 50,
    width: 50,
    overflow: 'hidden',
    borderRadius: 4,
  },
  buttonTitle: {
    color: Constants.TIER_COLORS.PIONEER,
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonDisableTitle: {
    color: T.COLORS.INK,
    fontSize: 14,
    fontWeight: 'bold',
  },
  subTitle: {
    color: '#888',
    fontSize: 14,
  },
  title: {
    fontSize: 15,
    lineHeight: 18,
    color: T.COLORS.INK,
  },
});

export default BlockedUserItemView;
