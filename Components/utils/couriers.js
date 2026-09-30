// 공동구매 배송 추적 (2026-09-30) — 브랜드가 택배사 + 송장번호를 넣으면 구매자가 추적 페이지로 간다.
// 기존 CourierTrackingLinkUrls는 언어별 문자열을 키로 써서 서버와 주고받을 수 없다 → 언어 무관 코드로 따로 둔다.
// 국가: KR(국내), JP(일본). 추적 URL은 송장번호를 끝에 붙이는 형식만 쓴다.

export const COURIERS = [
  {
    code: 'CJ',
    country: 'KR',
    ko: 'CJ대한통운',
    en: 'CJ Logistics',
    url: 'https://www.doortodoor.co.kr/parcel/doortodoor.do?fsp_action=PARC_ACT_002&fsp_cmd=retrieveInvNoACT&invc_no=',
  },
  {
    code: 'HANJIN',
    country: 'KR',
    ko: '한진택배',
    en: 'Hanjin',
    url: 'https://www.hanjin.co.kr/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText=&wblnum=',
  },
  {
    code: 'LOTTE',
    country: 'KR',
    ko: '롯데택배',
    en: 'Lotte Global Logistics',
    url: 'https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=',
  },
  {
    code: 'EPOST',
    country: 'KR',
    ko: '우체국택배',
    en: 'Korea Post',
    url: 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=',
  },
  {
    code: 'LOGEN',
    country: 'KR',
    ko: '로젠택배',
    en: 'Logen',
    url: 'https://www.ilogen.com/web/personal/trace/',
  },
  {
    code: 'CU',
    country: 'KR',
    ko: 'CU 편의점택배',
    en: 'CU Post',
    url: 'https://www.cupost.co.kr/postbox/delivery/localResult.cupost?invoice_no=',
  },
  {
    code: 'GS',
    country: 'KR',
    ko: 'GS 편의점택배',
    en: 'GS Postbox',
    url: 'https://www.cvsnet.co.kr/invoice/tracking.do?invoice_no=',
  },
  {
    code: 'YAMATO',
    country: 'JP',
    ko: '야마토운수',
    en: 'Yamato Transport',
    url: 'https://toi.kuronekoyamato.co.jp/cgi-bin/tneko?number00=1&number01=',
  },
  {
    code: 'SAGAWA',
    country: 'JP',
    ko: '사가와급편',
    en: 'Sagawa Express',
    url: 'https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=',
  },
  {
    code: 'JAPANPOST',
    country: 'JP',
    ko: '일본우편',
    en: 'Japan Post',
    url: 'https://trackings.post.japanpost.jp/services/srv/search/direct?reqCodeNo1=',
  },
  { code: 'OTHER', country: null, ko: '기타', en: 'Other', url: '' },
];

const BY_CODE = new Map(COURIERS.map((c) => [c.code, c]));

export function courierOf(code) {
  return BY_CODE.get(code) || null;
}

export function courierName(code, lang = 'ko') {
  const c = courierOf(code);
  if (!c) {
    return code || '';
  }
  return lang === 'ko' ? c.ko : c.en;
}

// 해당 국가 택배사 + 기타. 국가가 없으면 전부.
export function couriersFor(country) {
  return COURIERS.filter((c) => !country || !c.country || c.country === country);
}

// 송장번호는 숫자·영문·하이픈만, 6~30자. 공백·하이픈은 저장 전에 정리한다.
export function normalizeTrackingNumber(input) {
  return String(input || '')
    .replace(/[\s-]/g, '')
    .toUpperCase();
}

export function isValidTrackingNumber(input) {
  return /^[0-9A-Z]{6,30}$/.test(normalizeTrackingNumber(input));
}

// 추적 페이지 URL. 모르는 택배사·기타·잘못된 번호면 null(화면은 번호만 보여준다).
export function trackingUrl(code, number) {
  const c = courierOf(code);
  const n = normalizeTrackingNumber(number);
  if (!c || !c.url || !isValidTrackingNumber(n)) {
    return null;
  }
  return `${c.url}${encodeURIComponent(n)}`;
}
