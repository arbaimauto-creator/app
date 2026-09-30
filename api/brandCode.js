// 판매자(브랜드) 코드 검증 (2026-09-23) — 마이 탭 "판매자 모드"에서 아르바임 제공 코드를 입력받아 검증.
// invites.js(초대 코드) 패턴 미러링: LIVE_OPS_API면 ops가 정본, 서버 도달 실패 시 dev만 mock 폴백.
// 코드가 유효하면 inviteRole=brand + userIsSeller 로 승격한다(셀러 승인 = 그레이드 허락).
import Preference from 'react-native-default-preference';
import { opsPost, setOpsToken } from './opsClient';
import { getGreydAppId } from './opsBridge';

const MOCK_BRAND_CODES = [{ code: 'ARBAIM-SELLER', brandName: 'ARBAIM 데모 셀러' }];

// 반환: { success, brandId?, brandName? } | { success:false, reason? }
export async function verifyBrandCode(rawCode) {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) {
    return { success: false, reason: 'empty' };
  }
  try {
    const greydAppId = await getGreydAppId();
    const res = await opsPost('/brand/verify-code', { brandCode: code, greydAppId });
    if (res?.ok) {
      if (res.token) {
        await setOpsToken(res.token);
      }
      return { success: true, brandId: res.brandId, brandName: res.brandName };
    }
    return { success: false };
  } catch (e) {
    if (e?.status === 401) {
      return { success: false, reason: e?.body?.error };
    }
    if (!__DEV__) {
      return { success: false, reason: 'service_unavailable' };
    }
    console.log('ops brand verify unreachable, fallback to mock offline');
  }
  const found = MOCK_BRAND_CODES.find((c) => c.code === code);
  return found ? { success: true, brandName: found.brandName } : { success: false };
}

// 검증 성공 후 판매자 모드로 승격. 셸은 부팅 시 inviteRole을 읽으므로 재시작 시 브랜드 셸로 시작.
export async function enterSellerMode({ brandName, brandId } = {}) {
  await Preference.set('inviteRole', 'brand');
  await Preference.set('userIsSeller', 'true');
  if (brandName) {
    await Preference.set('sellerBrandName', brandName);
  }
  if (brandId) {
    await Preference.set('sellerBrandId', String(brandId));
  }
}
