// 자사몰 상품 링크 → 상품 정보 미리보기 (2026-10-14) — docs/product-proposal-2026-10-14.md §2-1
// greyd.app/propose 양식이 "불러오기"를 누르면 GET /api/public/product-preview?url=<자사몰 상품 URL> 로 부른다.
// ops(Next.js)에 app/api/public/product-preview/route.js 로 넣는다. 의존성 없음(Node 18+ fetch, dns).
//
// 뽑는 순서: JSON-LD Product → Open Graph / product:* 메타 → Cafe24·고도몰 meta → <title>.
// 쿠팡·네이버(스마트스토어·브랜드스토어·쇼핑)는 크롤링을 막고 약관상 허용되지 않아 받지 않는다(422 unsupported_site).
//
// 보안: 외부 URL을 서버가 대신 여는 기능이라 SSRF를 막는다 — https만, 사설·루프백·링크로컬 IP 거부(리다이렉트마다 재검사),
// 응답 2MB·8초 제한, HTML만 읽는다. 결과는 사용자가 확인·수정하는 초안일 뿐, 저장하지 않는다.
import { lookup } from 'node:dns/promises';
import net from 'node:net';

export const BLOCKED_HOSTS = [
  /(^|\.)coupang\.com$/i,
  /(^|\.)naver\.com$/i, // smartstore·brand·shopping·m.smartstore 전부
  /(^|\.)naver\.me$/i,
  /(^|\.)coupa\.ng$/i,
];

const MAX_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 4;

export class PreviewError extends Error {
  constructor(code, status = 422) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
    );
  }
  const v = ip.toLowerCase();
  return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80') ||
    (v.startsWith('::ffff:') && isPrivateIp(v.slice(7)));
}

export function checkUrl(raw) {
  let u;
  try {
    u = new URL(String(raw || '').trim());
  } catch (e) {
    throw new PreviewError('invalid_url');
  }
  if (u.protocol !== 'https:') {
    throw new PreviewError('https_only');
  }
  if (u.username || u.password || (u.port && u.port !== '443')) {
    throw new PreviewError('invalid_url');
  }
  if (BLOCKED_HOSTS.some((re) => re.test(u.hostname))) {
    throw new PreviewError('unsupported_site');
  }
  return u;
}

async function assertPublicHost(hostname) {
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new PreviewError('invalid_url');
    return;
  }
  const addrs = await lookup(hostname, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) {
    throw new PreviewError('invalid_url');
  }
}

async function fetchHtml(startUrl) {
  let url = checkUrl(startUrl);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url.hostname);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let res;
    try {
      res = await fetch(url, {
        redirect: 'manual',
        signal: ctrl.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; greydProductPreview/1.0; +https://greyd.app/propose)',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'ko-KR,ko;q=0.9',
        },
      });
    } catch (e) {
      clearTimeout(timer);
      throw new PreviewError('fetch_failed', 502);
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      clearTimeout(timer);
      url = checkUrl(new URL(res.headers.get('location'), url).toString()); // 리다이렉트 대상도 같은 검사
      continue;
    }
    if (!res.ok) {
      clearTimeout(timer);
      throw new PreviewError('fetch_failed', 502);
    }
    if (!/html/i.test(res.headers.get('content-type') || '')) {
      clearTimeout(timer);
      throw new PreviewError('not_html');
    }
    const reader = res.body.getReader();
    const chunks = [];
    let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > MAX_BYTES) {
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
    } finally {
      clearTimeout(timer);
    }
    const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    const charset = /charset=([\w-]+)/i.exec(res.headers.get('content-type') || '')?.[1] ||
      /<meta[^>]+charset=["']?([\w-]+)/i.exec(buf.toString('latin1').slice(0, 4096))?.[1] || 'utf-8';
    let html;
    try {
      html = new TextDecoder(charset.toLowerCase() === 'ks_c_5601-1987' ? 'euc-kr' : charset).decode(buf);
    } catch (e) {
      html = buf.toString('utf8');
    }
    return { html, finalUrl: url.toString() };
  }
  throw new PreviewError('too_many_redirects', 502);
}

// ── 파싱 ────────────────────────────────────────────────────────────
const decode = (s) =>
  String(s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ').trim();

function metaMap(html) {
  const map = {};
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    const key = /(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    const val = /content\s*=\s*(["'])([\s\S]*?)\1/i.exec(tag)?.[2];
    if (key && val !== undefined && !(key.toLowerCase() in map)) {
      map[key.toLowerCase()] = decode(val);
    }
  }
  return map;
}

function jsonLdProducts(html) {
  const out = [];
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data;
    try {
      data = JSON.parse(m[1].trim());
    } catch (e) {
      continue;
    }
    const walk = (n) => {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) return n.forEach(walk);
      const t = n['@type'];
      if (t === 'Product' || (Array.isArray(t) && t.includes('Product'))) out.push(n);
      if (n['@graph']) walk(n['@graph']);
    };
    walk(data);
  }
  return out;
}

const toPrice = (v) => {
  const n = Number(String(v ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};
const abs = (u, base) => {
  try {
    return u ? new URL(u, base).toString() : null;
  } catch (e) {
    return null;
  }
};

// 통화: JSON-LD → 메타 → 가격 옆 기호 → 한국 도메인·lang=ko. 근거가 없으면 null.
function detectCurrency(offer, meta, html, baseUrl) {
  const c = offer.priceCurrency || meta['product:price:currency'] || meta['og:price:currency'] || meta['product:sale_price:currency'];
  if (c && /^[A-Z]{3}$/i.test(c)) return c.toUpperCase();
  if (/[₩]|원<\/|원\s*<|"KRW"/.test(html)) return 'KRW';
  if (/\.(kr|co\.kr)$/i.test(new URL(baseUrl).hostname) || /<html[^>]+lang=["']ko/i.test(html)) return 'KRW';
  if (/\$\s?\d/.test(html) && !/[₩]/.test(html)) return 'USD';
  return null;
}
const httpsOnly = (u) => (u ? u.replace(/^http:\/\//i, 'https://') : null);

export function parseProduct(html, baseUrl) {
  const meta = metaMap(html);
  const ld = jsonLdProducts(html)[0] || null;
  const offer = ld ? (Array.isArray(ld.offers) ? ld.offers[0] : ld.offers) || {} : {};
  const pick = (v) => (Array.isArray(v) ? pick(v[0]) : v && typeof v === 'object' ? v.url || v.contentUrl || null : v || null);
  const ldImage = ld ? pick(ld.image) : null;
  const linkImage = /<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)/i.exec(html)?.[1];
  const title = decode(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]);

  const name = decode(ld?.name) || meta['og:title'] || meta['twitter:title'] || title || '';
  const price =
    toPrice(offer.price ?? offer.lowPrice) ??
    toPrice(meta['product:sale_price:amount']) ??
    toPrice(meta['product:price:amount']) ??
    toPrice(meta['og:price:amount']) ??
    null;
  const listPrice = toPrice(meta['product:original_price:amount']) ?? toPrice(meta['product:price:amount']) ?? price;

  const siteName = meta['og:site_name'] || new URL(baseUrl).hostname;
  // "상품명 - 몰이름", "상품명 | 몰이름" 꼬리는 떼어낸다
  const esc = siteName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const cleanName = name.replace(new RegExp(`\\s*[-|:·]\\s*${esc}\\s*$`, 'i'), '').trim() || name;
  return {
    name: cleanName,
    retailPrice: listPrice, // 소비자가(정가)
    salePrice: price, // 현재 판매가
    currency: detectCurrency(offer, meta, html, baseUrl), // 모르면 null — 'KRW'로 넘겨짚지 않는다
    imageUrl: httpsOnly(abs(ldImage || meta['og:image:secure_url'] || meta['og:image'] || meta['og:image:url'] || meta['twitter:image'] || meta['twitter:image:src'] || linkImage, baseUrl)),
    description: decode(ld?.description || meta['og:description'] || meta.description).slice(0, 300),
    brand: decode(typeof ld?.brand === 'string' ? ld.brand : ld?.brand?.name) || meta['product:brand'] || '',
    sku: decode(ld?.sku || ld?.mpn) || '',
    siteName,
    url: baseUrl,
  };
}

export async function previewProduct(url) {
  const { html, finalUrl } = await fetchHtml(url);
  const p = parseProduct(html, finalUrl);
  if (!p.name) throw new PreviewError('not_a_product');
  return p;
}

// ── Next.js App Router 라우트 (app/api/public/product-preview/route.js) ──
// 공개 API라 CORS는 greyd.app만 허용하고, IP당 분당 10회 정도로 제한한다(기존 레이트리밋 유틸 사용).
const ALLOW_ORIGIN = 'https://greyd.app';
const cors = { 'Access-Control-Allow-Origin': ALLOW_ORIGIN, 'Access-Control-Allow-Methods': 'GET, OPTIONS', Vary: 'Origin' };

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function GET(req) {
  const url = new URL(req.url).searchParams.get('url');
  try {
    const product = await previewProduct(url);
    return Response.json({ product }, { headers: { ...cors, 'Cache-Control': 'private, max-age=300' } });
  } catch (e) {
    const code = e instanceof PreviewError ? e.code : 'fetch_failed';
    const status = e instanceof PreviewError ? e.status : 502;
    return Response.json({ error: code }, { status, headers: cors });
  }
}
