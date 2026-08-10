import { NativeModules, Platform } from 'react-native';
import Strings from '../Strings';

const deviceLanguage =
  Platform.OS === 'ios'
    ? NativeModules.SettingsManager.settings.AppleLocale ||
      NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
    : NativeModules.I18nManager.localeIdentifier;

const CourierTrackingLinkUrls = new Map([
  [
    Strings.COURIER_CJ,
    'https://www.doortodoor.co.kr/parcel/doortodoor.do?fsp_action=PARC_ACT_002&fsp_cmd=retrieveInvNoACT&invc_no=',
  ],
  [
    Strings.COURIER_HANJIN,
    'https://www.hanjin.co.kr/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText=&wblnum=',
  ],
  [Strings.COURIER_LOTTE, 'https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo='],
  [Strings.COURIER_EPOST, 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1='],
  [Strings.COURIER_LOGEN, 'https://www.ilogen.com/web/personal/trace/'],
  [Strings.COURIER_CU, 'https://www.cupost.co.kr/postbox/delivery/localResult.cupost?invoice_no='],
  [Strings.COURIER_GS, 'https://www.cvsnet.co.kr/invoice/tracking.do?invoice_no='],
  [Strings.COURIER_OTHERS, ''],
]);

export default CourierTrackingLinkUrls;
