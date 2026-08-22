// iOS 릴리스에서 네이티브 Preference 모듈이 응답하지 않는 사례가 반복돼
// (saveGatePreferences·MainDrawerNavigator prefGet과 동일한 배경),
// ops 인증 체인에서 쓰는 저장소 접근을 타임아웃 레이스로 감싼다.
// 응답이 없으면 기본값으로 진행한다 — 저장 실패가 화면 멈춤보다 낫다.
import Preference from 'react-native-default-preference';

const TIMED_OUT = Symbol('pref-timeout');

function race(promise, ms) {
  let timer = null;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), ms);
  });
  return Promise.race([Promise.resolve().then(() => promise), timeout]).then(
    (value) => {
      if (timer) {
        clearTimeout(timer);
      }
      return value;
    },
    () => {
      if (timer) {
        clearTimeout(timer);
      }
      return TIMED_OUT;
    },
  );
}

export async function prefGetSafe(key, ms = 1500) {
  const value = await race(Preference.get(key), ms);
  return value === TIMED_OUT ? null : value;
}

export async function prefSetSafe(key, value, ms = 2000) {
  const result = await race(Preference.set(key, value), ms);
  return result !== TIMED_OUT;
}
