// 결제 웹뷰의 앱 전환 URL 처리 (2026-09-30, 토스 빌링)
// 국내 카드 인증은 카드사 앱(ISP·앱카드)을 여는 커스텀 스킴으로 넘어간다. 웹뷰가 이걸 페이지로 열면 흰 화면이 된다.
// Android는 intent://…#Intent;scheme=…;package=…;end 형식이라 스킴 URL로 바꾸고, 앱이 없으면 스토어로 보낸다.

const WEB_SCHEMES = /^(https?|about|data|blob|javascript):/i;

export function isWebUrl(url) {
  return typeof url === 'string' && WEB_SCHEMES.test(url);
}

// 웹뷰 밖(외부 앱)으로 열어야 하는 URL이면 { url, fallback }, 아니면 null
export function externalAppTarget(url) {
  if (typeof url !== 'string' || !url || isWebUrl(url)) {
    return null;
  }
  if (!/^intent:/i.test(url)) {
    return { url, fallback: null };
  }
  const [head, tail = ''] = url.split('#Intent;');
  const params = {};
  for (const part of tail.replace(/;?end;?$/, '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) {
      params[part.slice(0, i)] = part.slice(i + 1);
    }
  }
  const rest = head.replace(/^intent:(\/\/)?/i, '');
  const fallback = params['S.browser_fallback_url']
    ? decodeURIComponent(params['S.browser_fallback_url'])
    : params.package
      ? `market://details?id=${params.package}`
      : null;
  return {
    url: params.scheme ? `${params.scheme}://${rest}` : null,
    fallback,
  };
}
