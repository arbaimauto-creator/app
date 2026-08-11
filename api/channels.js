// D29: 3채널(IG·TikTok·YouTube) 핸들 수집 — ops Influencer의 igHandle/ttHandle/ytHandle에 대응.
// 모바일 타이핑은 오타가 잦고 ops 지표 수집기는 정확한 핸들을 요구하므로,
// URL을 붙여넣어도 핸들만 뽑아 정규화한다.

export const CHANNELS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
];

// 팔로워 밴드 — 자가신고(v2 §6). ops 매칭의 티어 추정 입력
export const FOLLOWER_BANDS = [
  { key: 'nano', label: '< 10K' },
  { key: 'micro', label: '10K–100K' },
  { key: 'mid', label: '100K–1M' },
  { key: 'macro', label: '1M+' },
];

const HOST_PATTERNS = [
  /(?:instagram\.com|instagr\.am)\/+([^/?#]+)/i,
  /(?:tiktok\.com)\/+@?([^/?#]+)/i,
  /(?:youtube\.com)\/+(?:@|c\/|channel\/|user\/)?([^/?#]+)/i,
  /(?:youtu\.be)\/+([^/?#]+)/i,
];

/**
 * 입력을 핸들로 정규화. URL·@접두어·공백·후행 슬래시를 모두 흡수한다.
 * 반환은 '@' 없는 순수 핸들 (ops 저장 형식) — 표시할 때만 @를 붙인다.
 */
export function normalizeHandle(raw) {
  let v = (raw || '').trim();
  if (!v) {
    return '';
  }
  for (const re of HOST_PATTERNS) {
    const m = re.exec(v);
    if (m) {
      v = m[1];
      break;
    }
  }
  v = v.replace(/^@+/, '').replace(/\/+$/, '').trim();
  // 핸들에 쓰이지 않는 문자가 남아 있으면 잘못 붙여넣은 것으로 본다
  return /^[A-Za-z0-9._-]{1,80}$/.test(v) ? v : '';
}

/** 채널 입력 3종 → ops 동기화용 구조. 빈 채널은 제외한다. */
export function toChannelPayload(channels) {
  const out = {};
  CHANNELS.forEach(({ key }) => {
    const handle = normalizeHandle(channels?.[key]?.handle);
    if (handle) {
      out[key] = { handle, followerBand: channels[key]?.followerBand ?? null };
    }
  });
  return out;
}
