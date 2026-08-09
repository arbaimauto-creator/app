import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView, Text, View } from 'react-native';

import NotificationItemView from './NotificationItemView';
import APIprovider from './APIprovider';
import NotificationNomalizer from './utils/NotificationNomalizer';
import Strings from './Strings';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import Animated from 'react-native-reanimated';
import { moderateScale } from './utils/scailing';

function Header() {
  return <View style={styles.header} />;
}

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
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
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
          style={{ marginTop: 20 }}
        />
      ) : (
        <View style={styles.emptyMessageContainer}>
          <Text style={styles.emptyMessage}>{Strings.EMPTY_NOTIFICATION_MESSAGE}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

export default NotificationListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  scene: {
    flex: 1,
  },
  tabLabelStyle: {
    color: Constants.TIER_COLORS.ARTISAN,
  },
  header: {
    padding: 5,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  tabBarLabelFocused: {
    color: 'white',
    fontSize: 21,
    fontWeight: 'bold',
  },
  tabBarLabel: {
    color: 'rgb(128, 128, 128)',
    fontSize: 21,
    fontWeight: 'bold',
  },
  divider: {
    height: 0,
    backgroundColor: '#ccc',
    marginTop: 10,
  },
  emptyMessageContainer: {
    flex: 1,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  emptyMessage: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 18,
  },
});
