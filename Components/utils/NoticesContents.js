import Codes from '../Constants/Codes';
import Strings from '../Strings';
import { Platform, NativeModules } from 'react-native';

const deviceLanguage =
  Platform.OS === 'ios'
    ? NativeModules.SettingsManager.settings.AppleLocale ||
      NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
    : NativeModules.I18nManager.localeIdentifier;

const getContentImage = (code) => {
  if (code === Codes.NOTICE_CODE.LAUNCH_PROMOTION) {
    if (deviceLanguage.substring(0, 2) === 'ko') {
      return require('../../Resources/notice/promotionKor.png');
    } else {
      return require('../../Resources/notice/promotionEng.png');
    }
  } else if (code === Codes.NOTICE_CODE.GRADING_REVIEW_PROMOTION_1) {
    if (deviceLanguage.substring(0, 2) === 'ko') {
      return { uri: 'https://intro.greyd.app/resources/giftEvent1-1.png' };
    } else {
      return { uri: 'https://intro.greyd.app/resources/giftEventEng1-1.png' };
    }
  } else if (code === Codes.NOTICE_CODE.GRADING_REVIEW_PROMOTION_RESULT_1) {
    if (deviceLanguage.substring(0, 2) === 'ko') {
      return { uri: 'https://intro.greyd.app/resources/giftEventResult1-0.png' };
    } else {
      return { uri: 'https://intro.greyd.app/resources/giftEventResult1-0.png' };
    }
  }
};

const NoticesContents = new Map([
  [
    Codes.NOTICE_CODE.LAUNCH_PROMOTION,
    {
      id: Codes.NOTICE_CODE.LAUNCH_PROMOTION,
      buttonTitle: Strings.GO_TO_CHECK,
      contentImage: getContentImage(Codes.NOTICE_CODE.LAUNCH_PROMOTION),
    },
  ],
  [
    Codes.NOTICE_CODE.GRADING_REVIEW_PROMOTION_1,
    {
      id: Codes.NOTICE_CODE.GRADING_REVIEW_PROMOTION_1,
      buttonTitle: Strings.GO_TO_EVENT,
      buttonSubTitle: Strings.GO_TO_EVENT_DESCRIPTION,
      contentImage: getContentImage(Codes.NOTICE_CODE.GRADING_REVIEW_PROMOTION_1),
    },
  ],
  [
    Codes.NOTICE_CODE.GRADING_REVIEW_PROMOTION_RESULT_1,
    {
      id: Codes.NOTICE_CODE.GRADING_REVIEW_PROMOTION_RESULT_1,
      buttonTitle: Strings.GO_TO_CHECK,
      contentImage: getContentImage(Codes.NOTICE_CODE.GRADING_REVIEW_PROMOTION_RESULT_1),
    },
  ],
]);

export default NoticesContents;
