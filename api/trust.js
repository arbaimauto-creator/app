// 프로필 완성도 · 신뢰 구성요소 (기획서 §5.4).
// 불투명한 점수 하나 대신 "무엇으로 이루어졌는지"와 "어디에 쓰이는지"를 보여준다. 순수 함수.
import { SEEDING_STATUS } from './seedings';

// 추천·선정에 실제로 쓰이는 프로필 항목 (api/recommend, ops 매칭 골든 레코드와 동일)
export const PROFILE_FIELDS = [
  { key: 'country', usedFor: 'shipping' },
  { key: 'handleUrl', usedFor: 'selection' },
  { key: 'primaryPlatform', usedFor: 'selection' },
  { key: 'followerBand', usedFor: 'selection' },
  { key: 'contentCategories', usedFor: 'recommend' },
  { key: 'ageBand', usedFor: 'segment' },
  { key: 'gender', usedFor: 'segment' },
  { key: 'skinType', usedFor: 'segment' },
];

const filled = (v) => {
  if (v == null) {
    return false;
  }
  if (Array.isArray(v)) {
    return v.length > 0;
  }
  if (typeof v === 'string') {
    return v.trim().length > 0;
  }
  return true;
};

// → { percent, missing: [field keys] }
export function profileCompleteness(profile) {
  const missing = PROFILE_FIELDS.filter((f) => !filled(profile?.[f.key])).map((f) => f.key);
  const done = PROFILE_FIELDS.length - missing.length;
  return { percent: Math.round((done / PROFILE_FIELDS.length) * 100), missing };
}

// 신뢰 구성요소 — 완주·기한 준수·응답 품질·본인확인. 각각 근거가 되는 숫자를 함께 준다.
export function trustComponents(profile, seedings = {}) {
  const list = Object.values(seedings);
  const done = list.filter((s) => s.status === SEEDING_STATUS.DONE).length;
  const noShow = list.filter((s) => s.status === SEEDING_STATUS.NO_SHOW).length;
  const finished = done + noShow;
  const onTimeRate = finished > 0 ? Math.round((done / finished) * 100) : null;
  const surveys = list.filter((s) => s.fgiSurvey).length;
  const graceUsed = list.filter(
    (s) => s.status === SEEDING_STATUS.DONE && (s.graceUsed || s.grace),
  ).length;
  return {
    completed: profile?.completedCount ?? done,
    strikes: profile?.strikes ?? noShow,
    onTimeRate,
    graceUsed,
    surveys,
    identityVerified: Boolean(profile?.identityVerifiedAt),
  };
}
