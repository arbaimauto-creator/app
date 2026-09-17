// 리뷰 자동 번역 (2026-09-17) — 한국어↔영어만 다룬다.
// 감지는 문자 범위로(한글 음절 비율), 번역은 무인증 공개 엔드포인트를 쓰고 실패하면
// 원문을 그대로 둔다(번역은 장식 — 흐름을 막지 않는다). 정식 번역 API 키가 정해지면
// TRANSLATE_URL만 교체하면 된다.
const cache = new Map();
const MAX_CACHE = 200;

export function detectLang(text) {
  const value = String(text || '');
  if (!value.trim()) {
    return null;
  }
  const hangul = (value.match(/[가-힣]/g) || []).length;
  const latin = (value.match(/[a-zA-Z]/g) || []).length;
  if (hangul === 0 && latin === 0) {
    return null;
  }
  return hangul >= latin ? 'ko' : 'en';
}

// 앱 언어와 리뷰 언어가 다를 때만 번역 대상
export function needsTranslation(text, appLang) {
  const lang = detectLang(text);
  return !!lang && !!appLang && lang !== appLang;
}

export async function translate(text, target, fetcher = fetch) {
  const key = `${target}:${text}`;
  if (cache.has(key)) {
    return cache.get(key);
  }
  try {
    const url =
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&dt=t' +
      `&tl=${encodeURIComponent(target)}&q=${encodeURIComponent(String(text).slice(0, 1500))}`;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 5000) : null;
    const res = await fetcher(url, controller ? { signal: controller.signal } : undefined);
    if (timer) {
      clearTimeout(timer);
    }
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    const translated = Array.isArray(data?.[0])
      ? data[0]
          .map((seg) => seg?.[0] || '')
          .join('')
          .trim()
      : null;
    if (!translated) {
      return null;
    }
    if (cache.size >= MAX_CACHE) {
      cache.delete(cache.keys().next().value);
    }
    cache.set(key, translated);
    return translated;
  } catch (e) {
    return null;
  }
}
