import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView, Text, View } from 'react-native';

import NotificationItemView from './NotificationItemView';
import APIprovider from './APIprovider';
import NotificationNomalizer from './utils/NotificationNomalizer';
import Strings from './Strings';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import Animated from 'react-native-reanimated';
import T from './Constants/DesignTokens';

const { COLORS, FONT, TYPE } = T;

function NotificationListScreen(props) {
  const [notificationList, setNotificationList] = useState([]);
  const [isRefreshing, setRefreshing] = useState(false);

  const getNotification = useCallback(async () => {
    const notiList = await APIprovider.getNotificationList(props.route.params.logonUserId);
    if (Array.isArray(notiList)) {
      setNotificationList(notiList);
    }
  }, [props.route.params.logonUserId]);

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
    return () => {
      APIprovider.readAllNotifications();
    };
  }, [getNotification, props.navigation]);
  return (
    <SafeAreaView style={styles.container} contentContainerStyle={{ flex: 1 }}>
      {notificationList.length > 0 ? (
        <Animated.FlatList
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          data={notificationList}
          renderItem={({ item }) => {
            const user = item.eventMakerId ? item.eventMakerId : undefined;
            return (
              <NotificationItemView
                {...props}
                user={user}
                item={NotificationNomalizer.getNomalizedNotiItem(item)}
              />
            );
          }}
          keyExtractor={(item) => item.id}
          onRefresh={() => {
            getNotification();
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
