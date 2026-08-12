import { Platform, NativeModules } from 'react-native';
import Strings_Eng from './eng';
import Strings_Kor from './kor';

const iosSettings = NativeModules.SettingsManager?.settings;
const deviceLanguage =
  (Platform.OS === 'ios'
    ? iosSettings?.AppleLocale || iosSettings?.AppleLanguages?.[0]
    : NativeModules.I18nManager?.localeIdentifier) || 'en_US';

export function getLanguage() {
  return deviceLanguage.substring(0, 2);
}

export default deviceLanguage.substring(0, 2) === 'ko' ? Strings_Kor : Strings_Eng;
