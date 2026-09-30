import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Utils from './utils';
import T from './Constants/DesignTokens';

const { COLORS, RADIUS, FONT, TYPE } = T;

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
  const { isRead, icon, contents, navigationParams } = item;
  // 정규화기는 createdAt만 주므로 timestamp가 없으면 createdAt으로 — 없던 시간 표기가 이제 보인다
  const stamp = item.timestamp || item.createdAt;
  const timeToAgo = stamp ? Utils.timestampToAgo(stamp) : '';

  const handlePressItem = () => {
    if (!navigationParams?.page) {
      return;
    }
    // 캠페인 활동 알림(local)은 탭·루트 라우트로 가므로 navigate(중첩 params 지원). 레거시는 기존 push 유지
    if (item.local) {
      navigation.navigate(navigationParams.page, navigationParams.params);
    } else {
      navigation.push(navigationParams.page, navigationParams.params);
    }
  };
  return (
    <Pressable onPress={handlePressItem} activeOpacity={0.9}>
      <View style={[styles.notiContainer, isRead !== true && styles.notiContainerUnread]}>
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
            style={icon?.shape === 'round' ? styles.roundIcon : styles.squareIcon}
            source={icon?.imageUrl ? { uri: icon.imageUrl } : undefined}
          />
        </Pressable>
        {contents.subTitle ? (
          <View style={styles.textBox}>
            <Text style={styles.title}>
              {contents.title} <Text style={styles.time}>{timeToAgo}</Text>
            </Text>
            <Text ellipsizeMode="tail" style={styles.subTitle}>
              {contents.subTitle}
            </Text>
          </View>
        ) : (
          <View style={styles.textBox}>
            <Text style={styles.title}>
              {contents.title} <Text style={styles.time}>{timeToAgo}</Text>
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
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.CARD,
    paddingVertical: 12,
    paddingHorizontal: 12,
    ...T.SHADOW_CARD,
  },
  notiContainerUnread: {
    backgroundColor: COLORS.AMBER_FAINT,
  },
  textBox: {
    overflow: 'hidden',
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 11,
    paddingRight: 8,
    gap: 2,
  },
  actionImageIcon: {
    height: 46,
    width: 46,
    borderRadius: RADIUS.FIELD,
  },
  actionButtonIcon: {
    height: 30,
    borderRadius: RADIUS.BTN_SM,
    backgroundColor: COLORS.INK,
    width: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabledIcon: {
    height: 30,
    borderRadius: RADIUS.BTN_SM,
    borderColor: COLORS.LINE,
    borderWidth: 1.5,
    backgroundColor: COLORS.SURFACE,
    width: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundIcon: {
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    width: 46,
    backgroundColor: COLORS.LINE,
  },
  squareIcon: {
    height: 46,
    width: 46,
    overflow: 'hidden',
    borderRadius: RADIUS.FIELD,
    backgroundColor: COLORS.LINE,
  },
  buttonTitle: {
    ...TYPE.BTN,
    fontSize: 11.5,
  },
  buttonDisableTitle: {
    fontFamily: FONT.Bold,
    fontSize: 11.5,
    color: COLORS.GREY,
  },
  subTitle: {
    fontFamily: FONT.Regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: COLORS.GREY,
  },
  time: {
    fontFamily: FONT.Regular,
    fontSize: 11,
    color: COLORS.GREY,
  },
  title: {
    fontFamily: FONT.Regular,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.INK,
  },
  unreadCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.AMBER,
    marginRight: 8,
  },
  readCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
    marginRight: 8,
  },
});

export default NotificationItemView;
