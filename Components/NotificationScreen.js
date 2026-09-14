import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView, Text, View } from 'react-native';

import NotificationItemView from './NotificationItemView';
import APIprovider from './APIprovider';
import NotificationNomalizer from './utils/NotificationNomalizer';
import Strings from './Strings';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import Animated from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import T from './Constants/DesignTokens';
import { selectCampaigns } from '../slices/campaign';
import { getSeedings } from '../api/seedings';
import {
  buildActivityNotifications,
  getActivityNotiReadAt,
  markActivityNotiRead,
  toNotiListItem,
} from '../api/activityNotifications';

const { COLORS, FONT, TYPE } = T;

function NotificationListScreen(props) {
  const [notificationList, setNotificationList] = useState([]);
  const [activityList, setActivityList] = useState([]);
  const [isRefreshing, setRefreshing] = useState(false);
  const campaigns = useSelector(selectCampaigns);

  // 레거시 서버 알림 — 서버 미도달·파싱 실패는 빈 목록으로 (캠페인 활동 알림은 계속 보인다)
  const getNotification = useCallback(async () => {
    try {
      const notiList = await APIprovider.getNotificationList(props.route?.params?.logonUserId);
      if (Array.isArray(notiList)) {
        setNotificationList(notiList);
      }
    } catch (e) {
      // 서버 알림 실패는 화면을 막지 않는다
    }
  }, [props.route?.params?.logonUserId]);

  // 캠페인 활동 알림(P2) — 시딩 스탬프에서 파생, 읽음은 마지막 열람 시각 기준
  const getActivity = useCallback(async () => {
    try {
      const [seedings, readAt] = await Promise.all([getSeedings(), getActivityNotiReadAt()]);
      setActivityList(
        buildActivityNotifications(seedings, campaigns).map((it) => toNotiListItem(it, readAt)),
      );
    } catch (e) {
      setActivityList([]);
    }
  }, [campaigns]);

  const onListEndReached = async () => {
    if (notificationList.length === 0) {
      return;
    }
    const offset = notificationList[notificationList.length - 1].createdAt;
    setRefreshing(true);
    try {
      const additionalNotificationList = await APIprovider.getNotificationList(
        props.route.params.logonUserId,
        offset,
      );
      if (Array.isArray(additionalNotificationList)) {
        setNotificationList([...notificationList, ...additionalNotificationList]);
      }
    } finally {
      setRefreshing(false);
    }
  };

  // props.navigation.setOptions({
  //   title: Strings.NOTIFICATIONS_TITLE,
  // });

  useEffect(() => {
    props.navigation.setOptions({
      title: Strings.NOTIFICATIONS_TITLE,
      headerTintColor: COLORS.INK,
      headerStyle: { backgroundColor: COLORS.BG, elevation: 0, shadowOpacity: 0 },
      headerTitleStyle: {
        fontSize: 18,
        fontFamily: FONT.ExtraBold,
        color: COLORS.INK,
        letterSpacing: -0.2,
      },
      headerLeft: () => HeaderLeftBackButton({ navigation: props.navigation }),
    });

    getNotification();
    getActivity();
    return () => {
      // 화면을 떠날 때 전부 읽음 처리 — 서버 알림은 API, 캠페인 활동 알림은 로컬 열람 시각
      try {
        APIprovider.readAllNotifications();
      } catch (e) {
        // 서버 읽음 처리 실패는 무시
      }
      markActivityNotiRead().catch(() => {});
    };
  }, [getNotification, getActivity, props.navigation]);

  // 서버 알림 + 캠페인 활동 알림을 시간순으로 합친다
  const merged = [
    ...activityList,
    ...notificationList.map((raw) => ({ raw, createdAt: raw.createdAt, id: raw._id || raw.id })),
  ].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

  return (
    <SafeAreaView style={styles.container} contentContainerStyle={{ flex: 1 }}>
      {merged.length > 0 ? (
        <Animated.FlatList
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          data={merged}
          renderItem={({ item }) => {
            if (item.local) {
              return <NotificationItemView {...props} item={item} />;
            }
            const raw = item.raw;
            const user = raw.eventMakerId ? raw.eventMakerId : undefined;
            return (
              <NotificationItemView
                {...props}
                user={user}
                item={NotificationNomalizer.getNomalizedNotiItem(raw)}
              />
            );
          }}
          keyExtractor={(item, index) => String(item.id || index)}
          onRefresh={() => {
            getNotification();
            getActivity();
          }}
          onEndReached={({ distanceFromEnd }) => {
            if (notificationList.length >= 10 && isRefreshing === false) {
              onListEndReached();
            }
          }}
          onEndReachedThreshold={2}
          refreshing={isRefreshing}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyMessageContainer}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyTitle}>{Strings.EMPTY_NOTIFICATION_MESSAGE}</Text>
          <Text style={styles.emptyDesc}>{Strings.NOTI_EMPTY_DESC}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

export default NotificationListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
  },
  emptyMessageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 34,
  },
  emptyTitle: {
    fontFamily: FONT.ExtraBold,
    fontSize: 15,
    color: COLORS.INK,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  emptyDesc: {
    ...TYPE.SUB,
    textAlign: 'center',
    lineHeight: 17,
  },
});
