// 공용 기본 배송지 mock 스텁 — 서버 연동 시 함수 본문만 교체 (api/creators.js 패턴).
import Preference from 'react-native-default-preference';

const KEY = 'savedAddressV2';

// address: { name, line, city, state, postalCode, phone }
export async function getSavedAddress() {
  const raw = await Preference.get(KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export async function saveSavedAddress(address) {
  await Preference.set(KEY, JSON.stringify(address));
  return address;
}

export async function clearSavedAddress() {
  await Preference.set(KEY, '');
}
