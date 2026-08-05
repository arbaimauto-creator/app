import messaging from '@react-native-firebase/messaging';
import PushNotification, { Importance } from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import Preference from 'react-native-default-preference';

import NotificationProvider from '../utils/NotificationProvider';
import Codes from '../Constants';
import { store } from '../../redux/store';
import {
  setCurrentPushedNotification,
  setCurrentPushedQnaId,
  setInitialNotification,
} from '../../slices/notification';
import { capitalizeFirstLetter } from '../utils';
import * as Sentry from '@sentry/react-native';

// Must be outside of any component LifeCycle (such as `componentDidMount`).
// ex: notificationHandler
// const notificationHandler = msg => {
//   const msgIdObj = JSON.parse(msg.data.messageId);
//   const paramsObj = JSON.parse(msg.data.parameters);
//   Linking.openURL(paramsObj.link);
// }

let notificationHandler;

const getDeviceToken = async () => {
  const deviceToken = await messaging().getToken();
  return deviceToken;
};

const setNotificationHandler = (onNotification) => {
  if (onNotification) {
    notificationHandler = onNotification;
  }
};

const configure = async (onNotification) => {
  PushNotification.createChannel(
    {
      channelId: Codes.NOTIFICATION_CHENNEL_ID, // (required)
      channelName: Codes.NOTIFICATION_CHENNEL_NAME, // (required)
      channelDescription: 'A channel to categorise your notifications', // (optional) default: undefined.
      playSound: false, // (optional) default: true
      soundName: 'default', // (optional) See `soundName` parameter of `localNotification` function
      importance: Importance.HIGH, // (optional) default: Importance.HIGH. Int value of the Android notification importance
      vibrate: true, // (optional) default: true. Creates the default vibration pattern if true.
    },
    (created) => console.log(`createChannel returned '${created}'`), // (optional) callback returns whether the channel was created, false means it already existed.
  );

  if (onNotification) {
    notificationHandler = onNotification;
  }

  PushNotification.configure({
    // (optional) Called when Token is generated (iOS and Android)
    onRegister: function (token) {
      console.log('TOKEN:', token);
      //Preference.set('fcmDeviceToken', token.token);
    },

    // (required) Called when a remote is received or opened, or local notification is opened
    onNotification: function (notification) {
      console.log('ON NOTIFICATION:', notification, notificationHandler);

      // process the notification
      if (notificationHandler) {
        notificationHandler(notification);
      } else {
        store.dispatch(
          setInitialNotification({
            notification: {
              qnaId: notification.data?.qnaId,
              type: notification.data.type,
            },
          }),
        );
      }

      // (required) Called when a remote is received or opened, or local notification is opened
      notification.finish(PushNotificationIOS.FetchResult.NoData);
    },

    // (optional) Called when Registered Action is pressed and invokeApp is false, if true onNotification will be called (Android)
    onAction: function (notification) {
      console.log('ACTION:', notification.action);
      console.log('NOTIFICATION:', notification);

      // process the action
    },

    // (optional) Called when the user fails to register for remote notifications. Typically occurs when APNS is having issues, or the device is a simulator. (iOS)
    onRegistrationError: function (err) {
      console.error(err.message, err);
      Sentry.captureException(err);
    },

    // IOS ONLY (optional): default: all - Permissions to register.
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },

    // Should the initial notification be popped automatically
    // default: true
    popInitialNotification: true,

    /**
     * (optional) default: true
     * - Specified if permissions (ios) and token (android and ios) will requested or not,
     * - if not, you must call PushNotificationsHandler.requestPermissions() later
     * - if you are not using remote notification or do not have Firebase installed, use this:
     *     requestPermissions: Platform.OS === 'ios'
     */
    requestPermissions: true,
  });

  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Message handled in the background! setBackgroundMessageHandler', remoteMessage);
    //  remoteMessage.data로 메세지에 접근가능
    //  remoteMessage.from 으로 topic name 또는 message identifier
    //  remoteMessage.messageId 는 메시지 고유값 id
    //  remoteMessage.notification 메시지와 함께 보내진 추가 데이터
    //  remoteMessage.sentTime 보낸시간

    if (remoteMessage.data?.isServerSide) {
      PushNotification.localNotification({
        channelId: Codes.NOTIFICATION_CHENNEL_ID,
        autoCancel: true,
        title: remoteMessage.data.title,
        message: remoteMessage.data.message,
        vibrate: true,
        vibration: 300,
        playSound: true,
        soundName: 'default',
        userInfo: {
          isTouchEvent: true,
          navigationParams: JSON.parse(remoteMessage.data.navigationParams),
        },
      });

      return;
    }

    if (!remoteMessage.data?.messageCode) {
      return;
    }

    const msgCode = JSON.parse(remoteMessage.data.messageCode);
    const paramsObj = JSON.parse(remoteMessage.data.parameters);

    // message structure example : const message = {messageId: {messageType:'NEW_COMMENT_ON_UPLOADED_REVIEW', messageCode: 103}, parameters: params};

    // TODO: remoteMessage 에 따라서 포맷 수정하도록 api 만들 것
    const contents = NotificationProvider.getNotificationByCode(msgCode);

    let notificationType = '';

    if (msgCode === 501) {
      store.dispatch(setCurrentPushedQnaId({ qnaId: paramsObj?.qnaId }));
    }

    if ([502, 503].includes(msgCode)) {
      notificationType = 'qna';
    }

    if (!contents) {
      return;
    }
    PushNotification.localNotification({
      channelId: Codes.NOTIFICATION_CHENNEL_ID,
      autoCancel: true,
      bigText: contents.body ? contents.body(paramsObj) : '',
      title: contents.title(paramsObj),
      message: contents.body ? contents.body(paramsObj) : '',
      largeIcon: 'notification_icon', // (optional) default: "ic_launcher"
      largeIconUrl: contents.image(paramsObj),
      bigLargeIcon: 'notification_icon', // (optional) default: "ic_launcher"
      bigLargeIconUrl: contents.image(paramsObj),
      vibrate: true,
      vibration: 300,
      playSound: true,
      soundName: 'default',
      data: {
        type: notificationType ? notificationType : 'notification',
        qnaId: paramsObj?.qnaId,
      },
      userInfo: {
        type: 'notification',
      },
    });
  });

  messaging().onMessage((remoteMessage) => {
    console.log('Message handled in the foreground! onMessage', remoteMessage);
    //  remoteMessage.data로 메세지에 접근가능
    //  remoteMessage.from 으로 topic name 또는 message identifier
    //  remoteMessage.messageId 는 메시지 고유값 id
    //  remoteMessage.notification 메시지와 함께 보내진 추가 데이터
    //  remoteMessage.sentTime 보낸시간

    // message structure example : const message = {messageId: {messageType:'NEW_COMMENT_ON_UPLOADED_REVIEW', messageCode: 103}, parameters: params};

    if (remoteMessage.data?.isServerSide) {
      PushNotification.localNotification({
        channelId: Codes.NOTIFICATION_CHENNEL_ID,
        autoCancel: true,
        title: remoteMessage.data.title,
        message: remoteMessage.data.message,
        vibrate: true,
        vibration: 300,
        playSound: true,
        soundName: 'default',
        userInfo: {
          isTouchEvent: true,
          navigationParams: JSON.parse(remoteMessage.data.navigationParams),
        },
      });

      return;
    }

    if (!remoteMessage.data?.messageCode) {
      // data-only(사일런트) 메시지면 notification이 없을 수 있다 — 널 가드
      if (!remoteMessage.notification) {
        return;
      }
      PushNotification.localNotification({
        channelId: Codes.NOTIFICATION_CHENNEL_ID,
        autoCancel: true,
        title: remoteMessage.notification.title,
        message: remoteMessage.notification.body,
        data: {
          type: remoteMessage.data?.type,
        },
        vibrate: true,
        vibration: 300,
        playSound: true,
        soundName: 'default',
      });
      return;
    }

    const msgCode = JSON.parse(remoteMessage.data?.messageCode);
    const paramsObj = JSON.parse(remoteMessage.data?.parameters);

    // TODO: remoteMessage 에 따라서 포맷 수정하도록 api 만들 것
    const contents = NotificationProvider.getNotificationByCode(msgCode);

    let notificationType = '';

    if (msgCode === 501) {
      store.dispatch(setCurrentPushedQnaId({ qnaId: paramsObj?.qnaId }));
    }

    if ([502, 503].includes(msgCode)) {
      notificationType = 'qna';

      store.dispatch(
        setCurrentPushedNotification({
          notification: {
            type: 'qna',
            qnaId: paramsObj?.qnaId,
          },
        }),
      );
    }

    if (!contents) {
      return;
    }
    PushNotification.localNotification({
      channelId: Codes.NOTIFICATION_CHENNEL_ID,
      autoCancel: true,
      bigText: contents.body ? contents.body(paramsObj) : '',
      title: contents.title(paramsObj),
      message: contents.body ? contents.body(paramsObj) : '',
      largeIcon: 'notification_icon', // (optional) default: "ic_launcher"
      largeIconUrl: contents.image(paramsObj),
      bigLargeIcon: 'notification_icon', // (optional) default: "ic_launcher"
      bigLargeIconUrl: contents.image(paramsObj),
      vibrate: true,
      vibration: 300,
      playSound: true,
      soundName: 'default',
      data: {
        type: notificationType ? notificationType : 'notification',
        qnaId: paramsObj?.qnaId,
      },
      userInfo: {
        type: 'notification',
      },
    });

    if (msgCode === Codes.NOTIFICATION_CODE.APPROVAL_SELLER_REGISTER) {
      Preference.set('userIsSeller', paramsObj.sellerStatus);
    }
  });
};

export { configure, getDeviceToken, setNotificationHandler };
