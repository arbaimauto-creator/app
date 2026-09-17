import { Platform, NativeModules } from 'react-native';
import Preference from 'react-native-default-preference';
import Strings_Eng from './eng';
import Strings_Kor from './kor';

const iosSettings = NativeModules.SettingsManager?.settings;
const deviceLanguage =
  (Platform.OS === 'ios'
    ? iosSettings?.AppleLocale || iosSettings?.AppleLanguages?.[0]
    : NativeModules.I18nManager?.localeIdentifier) || 'en_US';

const TABLES = { ko: Strings_Kor, en: Strings_Eng };

let currentLanguage = deviceLanguage.substring(0, 2) === 'ko' ? 'ko' : 'en';

// default export는 모든 화면이 정적 import로 붙잡는 객체다 — 참조를 유지한 채
// 내용만 갈아끼워야 언어 전환이 다음 렌더부터 반영된다.
const Strings = { ...TABLES[currentLanguage] };

function apply(lang) {
  const table = TABLES[lang] || TABLES.en;
  Object.keys(Strings).forEach((key) => delete Strings[key]);
  Object.assign(Strings, table);
  currentLanguage = TABLES[lang] ? lang : 'en';
}

export function getLanguage() {
  return currentLanguage;
}

// 앱 부트스트랩에서 한 번 호출 — 설정에서 고른 언어를 기기 언어보다 우선한다
export async function initLanguage() {
  try {
    const saved = await Preference.get('appLanguage');
    if (saved && TABLES[saved] && saved !== currentLanguage) {
      apply(saved);
    }
  } catch (e) {
    // 저장값을 못 읽으면 기기 언어 그대로
  }
}

// 설정 화면의 인앱 언어 전환 (2026-09-17) — 모듈 스코프에 문자열을 복사해 둔
// 화면은 다시 열어야 적용된다.
export async function setLanguage(lang) {
  if (!TABLES[lang] || lang === currentLanguage) {
    return;
  }
  apply(lang);
  try {
    await Preference.set('appLanguage', lang);
  } catch (e) {
    // 저장 실패해도 이번 세션에는 적용된 상태 유지
  }
}

export default Strings;
