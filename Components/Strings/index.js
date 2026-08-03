import { Platform, NativeModules } from 'react-native';
import Strings_Eng from './eng';
import Strings_Kor from './kor';

const deviceLanguage =
  Platform.OS === 'ios'
    ? NativeModules.SettingsManager.settings.AppleLocale ||
      NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
    : NativeModules.I18nManager.localeIdentifier;

export function getLanguage() {
  return deviceLanguage.substring(0, 2);
}

export default deviceLanguage.substring(0, 2) === 'ko' ? Strings_Kor : Strings_Eng;
