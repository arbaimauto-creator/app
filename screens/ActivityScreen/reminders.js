// v2 §3-⑦ 리마인더 시퀀스 — 수령 확인(D0) 기준 로컬 알림.
// D+7(중간) / D-3(연장 안내) / D-1(손실 프레임) / 마감 / 유예 종료 전.
// 서버 푸시 도입 전까지 로컬 스케줄로 대체한다. 연장 시 재스케줄, 업로드 시 전체 취소.
import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import Codes from '../../Components/Constants/Codes';
import Strings from '../../Components/Strings';
import { UPLOAD_DAYS, GRACE_DAYS, EXTENSION_DAYS } from './missionLogic';

// campaignId → 고정 숫자 베이스 (알림 id는 문자열 숫자여야 함)
function baseId(campaignId) {
  // 32비트 int 범위 안에서 최대한 넓게(×10 후 < 2^31) — 10만 모듈로는 캠페인끼리 쉽게 충돌했다
  let h = 0;
  const id = String(campaignId || '');
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) % 200000000;
  }
  return h * 10;
}

// react-native-push-notification은 항상 정밀 알람(setExact)을 쓴다. Android 14+
// (API 34)는 SCHEDULE_EXACT_ALARM이 기본 거부라 SecurityException으로 수령 확인
// 흐름 전체가 죽는다(실측). 12~13은 매니페스트 선언으로 허용되므로 예약하고,
// 14+는 건너뛴다 — 리마인더는 보조 수단이고 수령 상태 저장이 정본이다.
const CAN_SCHEDULE = Platform.OS !== 'android' || Platform.Version < 34;

function scheduleOne(id, date, title, message) {
  if (!CAN_SCHEDULE || date.getTime() <= Date.now()) {
    return;
  }
  try {
    PushNotification.localNotificationSchedule({
      channelId: Codes.NOTIFICATION_CHENNEL_ID,
      id: String(id),
      title,
      message,
      date,
      allowWhileIdle: false,
    });
  } catch (e) {
    // 알림 예약 실패가 수령 확인을 막아선 안 된다.
  }
}

export function scheduleUploadReminders(campaignId, campaignTitle, receivedAtIso, extensionUsed) {
  cancelUploadReminders(campaignId);
  const received = new Date(receivedAtIso);
  const totalDays = UPLOAD_DAYS + (extensionUsed ? EXTENSION_DAYS : 0);
  const dayMs = 24 * 3600 * 1000;
  const deadline = new Date(received.getTime() + totalDays * dayMs);
  const at = (daysFromReceive) => new Date(received.getTime() + daysFromReceive * dayMs);
  const id = baseId(campaignId);

  scheduleOne(id + 1, at(7), Strings.REM_MID_T, Strings.REM_MID_B(campaignTitle));
  scheduleOne(id + 2, at(totalDays - 3), Strings.REM_D3_T, Strings.REM_D3_B(campaignTitle));
  scheduleOne(id + 3, at(totalDays - 1), Strings.REM_D1_T, Strings.REM_D1_B(campaignTitle));
  scheduleOne(id + 4, deadline, Strings.REM_DUE_T, Strings.REM_DUE_B(campaignTitle));
  scheduleOne(
    id + 5,
    new Date(deadline.getTime() + (GRACE_DAYS - 0.5) * dayMs),
    Strings.REM_GRACE_T,
    Strings.REM_GRACE_B(campaignTitle),
  );
}

export function cancelUploadReminders(campaignId) {
  const id = baseId(campaignId);
  for (let i = 1; i <= 5; i++) {
    PushNotification.cancelLocalNotification(String(id + i));
  }
}
