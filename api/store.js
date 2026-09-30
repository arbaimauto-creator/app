import { opsGet, opsPost } from './opsClient';
import { OPS_API_BASE } from './opsRuntimeConfig';

export const storeOrigin = OPS_API_BASE.replace(/\/api\/mobile\/?$/, '');
export function storeTokenFromLink(input) {
  const text = String(input || '').trim();
  if (/^[A-Za-z0-9_-]{32}$/.test(text)) {
    return text;
  }
  const prefix = `${storeOrigin}/portal/store/`;
  if (!text.startsWith(prefix)) {
    return null;
  }
  const match = /^([A-Za-z0-9_-]{32})(?:[?#].*)?$/.exec(text.slice(prefix.length));
  return match ? match[1] : null;
}
export function isStorePortalUrl(url) {
  return (
    typeof url === 'string' &&
    url.startsWith(`${storeOrigin}/portal/store/`) &&
    !!storeTokenFromLink(url)
  );
}
export const listStores = () => opsGet('/store');
export const connectStore = (token) => opsPost('/store/connect', { token });
export const sellerProducts = (campaignId) =>
  opsGet(`/store/products?campaignId=${encodeURIComponent(campaignId)}`);
export const catalog = (id) => opsGet(`/store/catalog${id ? `/${encodeURIComponent(id)}` : ''}`);
export const storeOrders = () => opsGet('/store/orders');
export const startStoreCheckout = (body) => opsPost('/store/checkout', body);
