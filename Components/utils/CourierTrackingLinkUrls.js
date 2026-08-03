import { NativeModules, Platform } from 'react-native';

const deviceLanguage =
  Platform.OS === 'ios'
    ? NativeModules.SettingsManager.settings.AppleLocale ||
      NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
    : NativeModules.I18nManager.localeIdentifier;

const CourierTrackingLinkUrls = new Map([
  [
    'CJ대한통운',
    'https://www.doortodoor.co.kr/parcel/doortodoor.do?fsp_action=PARC_ACT_002&fsp_cmd=retrieveInvNoACT&invc_no=',
  ],
  [
    '한진택배',
    'https://www.hanjin.co.kr/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText=&wblnum=',
  ],
  ['롯데택배', 'https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo='],
  ['우체국택배', 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1='],
  ['로젠택배', 'https://www.ilogen.com/web/personal/trace/'],
  ['CU 편의점택배', 'https://www.cupost.co.kr/postbox/delivery/localResult.cupost?invoice_no='],
  ['GS Postbox 택배', 'https://www.cvsnet.co.kr/invoice/tracking.do?invoice_no='],
  ['기타', ''],
]);

export default CourierTrackingLinkUrls;
