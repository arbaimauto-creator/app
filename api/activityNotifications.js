// 캠페인 활동 알림 (기획서 §7 P2 "알림" 정보 구조 통합).
// 알림함(NotificationScreen)은 레거시 서버 알림(리뷰·주문·QnA 32종)만 알았고, 시딩 상태 변화(승인·발송·업로드 기한·
// 보상 확정/지급·취소·기한 만료)는 어디에도 쌓이지 않았다. 여기서 시딩 스탬프와 보상 원장에서 알림 항목을 파생해
// 알림함에 합치고, 캠페인 상세·Activity·보상 내역으로 딥링크한다. 읽음 상태는 "마지막으로 알림함을 연 시각" 하나로 관리.
import Codes from '../Components/Constants';
import Strings from '../Components/Strings';
import { SEEDING_STATUS } from './seedings';
import { prefGetSafe, prefSetSafe } from './prefSafe';
import { daysLeft } from '../screens/ActivityScreen/missionLogic';

const READ_KEY = 'activityNotiReadAtV1';
const CODE = Codes.NOTIFICATION_CODE;

// 스탬프 → 알림 코드. 순서는 시간순 정렬 전 기본 순서(같은 시각이면 뒤의 것이 최신).
const STAMP_RULES = [
  { at: 'approvedAt', code: 'CAMPAIGN_APPROVED', page: 'Activity' },
  { at: 'shippedAt', code: 'CAMPAIGN_SHIPPED', page: 'Activity' },
  { at: 'receivedAt', code: 'CAMPAIGN_UPLOAD_DUE', page: 'Activity' },
  { at: 'uploadedAt', code: 'CAMPAIGN_REVIEW_RECEIVED', page: 'RewardLedger' },
  { at: 'cancelledAt', code: 'CAMPAIGN_CANCELLED', page: 'CampaignDetailRoot' },
  { at: 'noShowAt', code: 'CAMPAIGN_NO_SHOW', page: 'Activity' },
];

function text(code, ctx) {
  const t = Strings[`NOTI_${code}_TITLE`];
  const b = Strings[`NOTI_${code}_BODY`];
  return {
    title: typeof t === 'function' ? t(ctx) : t || code,
    body: typeof b === 'function' ? b(ctx) : b || '',
  };
}

// → [{ id, code, createdAt, title, body, campaignId, campaign, page, params }] 최신순
export function buildActivityNotifications(seedings = {}, campaigns = [], now = new Date()) {
  const byId = Object.fromEntries((campaigns || []).map((c) => [c.id, c]));
  const items = [];
  for (const s of Object.values(seedings || {})) {
    const campaign = byId[s.campaignId];
    if (!campaign) {
      continue;
    }
    const ctx = {
      title: campaign.title,
      brand: campaign.brand,
      dayLeft: daysLeft(s, now),
      points: s.pointsGranted,
    };
    const push = (code, at, page, extra = {}) => {
      if (!at) {
        return;
      }
      const { title, body } = text(code, { ...ctx, ...extra });
      items.push({
        id: `act:${s.campaignId}:${code}`,
        code: CODE[code],
        codeKey: code,
        createdAt: at,
        title,
        body,
        campaignId: s.campaignId,
        campaign,
        page,
        params: page === 'CampaignDetailRoot' ? { campaign } : undefined,
      });
    };
    for (const rule of STAMP_RULES) {
      // 취소·기한 만료는 최종 상태일 때만(같은 시딩이 다시 진행되면 옛 스탬프는 무시)
      if (rule.code === 'CAMPAIGN_CANCELLED' && s.status !== SEEDING_STATUS.CANCELLED) {
        continue;
      }
      if (rule.code === 'CAMPAIGN_NO_SHOW' && s.status !== SEEDING_STATUS.NO_SHOW) {
        continue;
      }
      push(rule.code, s[rule.at], rule.page);
    }
    // 보상 확정·지급 — 시딩 상태가 아니라 원장 필드(pointsGranted·paidAt)에서
    if (s.status === SEEDING_STATUS.DONE && s.pointsGranted != null) {
      push('CAMPAIGN_REWARD_CONFIRMED', s.doneAt, 'RewardLedger');
    }
    if (s.paidAt) {
      push('CAMPAIGN_REWARD_PAID', s.paidAt, 'RewardLedger');
    }
  }
  return items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function countUnread(items, readAt) {
  if (!readAt) {
    return items.length;
  }
  return items.filter((i) => String(i.createdAt) > String(readAt)).length;
}

export async function getActivityNotiReadAt() {
  const v = await prefGetSafe(READ_KEY);
  return v || null;
}

export async function markActivityNotiRead(at = new Date().toISOString()) {
  await prefSetSafe(READ_KEY, at);
  return at;
}

// 알림함 리스트 아이템 형태(NotificationItemView 계약)로 변환
export function toNotiListItem(item, readAt) {
  return {
    id: item.id,
    local: true,
    notificationCode: item.code,
    isRead: !!readAt && String(item.createdAt) <= String(readAt),
    timestamp: item.createdAt,
    createdAt: item.createdAt,
    icon: { imageUrl: item.campaign?.thumbnailUrl || Codes.NO_USER_URL, shape: 'square' },
    contents: { title: item.title, subTitle: item.body },
    // Activity는 MainBottom 탭 안에 있어 루트 스택에서 직접 push할 수 없다
    navigationParams:
      item.page === 'Activity'
        ? { page: 'MainBottom', params: { screen: 'Activity' } }
        : { page: item.page, params: item.params },
  };
}
