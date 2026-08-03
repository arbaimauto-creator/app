import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Constants from './Constants';
import Utils from './utils';

function ReadingCheckCircle({ isRead }) {
  if (isRead === true) {
    return <View style={styles.readCircle} />;
  } else {
    return <View style={styles.unreadCircle} />;
  }
}

function ActionView({ actionParams, icon }) {
  const { actionType, actionIconUrl, actionIconEnableTitle, actionIconDisableTitle, onAction } =
    actionParams;
  // 알림 정보에 팔로우 중인지 아닌지 정보가 포함되어 있으면 그걸로 초기화 설정해도 좋음.
  const [buttonEnable, setButtonEnable] = useState(true);
  const [buttonTitle, setButtonTitle] = useState(actionIconEnableTitle);
  const [buttonStyle, setButtonStyle] = useState(styles.actionButtonIcon);
  const [buttonTitleStyle, setButtonTitleStyle] = useState(styles.buttonTitle);

  if (actionType === 'image') {
    return <FastImage style={styles.actionImageIcon} source={{ uri: actionIconUrl }} />;
  } else if (actionType === 'button') {
    // TODO: 버튼의 경우에는 임시코드로 추후 수정 필요, 초기화 및 Enable일 경우 버튼 입력을 막아야 함
    const handleAction = () => {
      if (onAction) {
        onAction();
      }
      setButtonTitle(actionIconDisableTitle);
      setButtonEnable(false);
      setButtonStyle(styles.actionButtonDisabledIcon);
      setButtonTitleStyle(styles.buttonDisableTitle);
      // 스타일 변경 필요
    };
    return <></>;
  }
}

function NotificationItemView({ item, user = undefined, navigation }) {
  // icon : {imageUrl, shape}, contents : {title, subtitle, action}, action : {actionType, actionIconUrl, onAction}
  const { isRead, icon, contents, timestamp, navigationParams } = item;
  const timeToAgo = Utils.timestampToAgo(timestamp);

  const handlePressItem = () => {
    if (navigationParams) {
      navigation.push(navigationParams.page, navigationParams.params);
    }
  };
  // isRead 값에 따른 연동 필요, 알림시간 랜더링 추가 필요.
  return (
    <Pressable onPress={handlePressItem} activeOpacity={0.9}>
      <View style={styles.notiContainer}>
        <ReadingCheckCircle isRead={item.isRead} />
        <Pressable
          onPress={(e) => {
            if (user !== undefined) {
              navigation.push('UserPage', {
                pageOwnerUserId: user.userId,
                pageOwnerUserName: user.name,
                pageOwnerUserProfilePicUrl: user.profilePicUrl,
              });
            } else {
              handlePressItem();
            }
          }}
        >
          <FastImage
            style={icon.shape === 'round' ? styles.roundIcon : styles.squareIcon}
            source={{ uri: icon.imageUrl }}
          />
        </Pressable>
        {contents.subTitle ? (
          <View style={styles.textBox}>
            <Text style={styles.title}>
              {contents.title} <Text style={styles.subTitle}>{timeToAgo}</Text>
            </Text>
            <Text ellipsizeMode="tail" style={styles.subTitle}>
              {contents.subTitle}
            </Text>
          </View>
        ) : (
          <View style={styles.textBox}>
            <Text style={styles.title}>
              {contents.title} <Text style={styles.subTitle}>{timeToAgo}</Text>
            </Text>
          </View>
        )}
        {contents.action ? <ActionView actionParams={contents.action} /> : null}
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
    paddingLeft: 10,
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
    backgroundColor: 'white',
    width: 70,
    color: 'black',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabledIcon: {
    height: 30,
    borderRadius: 4,
    borderColor: 'white',
    borderWidth: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    width: 70,
    color: 'white',
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
    color: 'black',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonDisableTitle: {
    color: 'white',
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
    color: Constants.TIER_COLORS.ARTISAN,
  },
  unreadCircle: {
    width: 5,
    height: 5,
    borderRadius: 5 / 2,
    backgroundColor: '#FC2A17',
    marginRight: 10,
  },
  readCircle: {
    width: 5,
    height: 5,
    borderRadius: 5 / 2,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    marginRight: 10,
  },
});

export default NotificationItemView;
