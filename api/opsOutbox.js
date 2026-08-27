import { prefGetSafe, prefSetSafe } from './prefSafe';
import { opsPost } from './opsClient';

export const __KEY = 'opsOutboxV1';
const MAX_TRIES = 5;
const BACKOFF_BASE_MS = 60 * 1000;

async function load() {
  try {
    const raw = await prefGetSafe(__KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

const save = (items) => prefSetSafe(__KEY, JSON.stringify(items));

async function trySend(item) {
  try {
    await opsPost(item.path, item.body);
    return true;
  } catch (e) {
    item.tries += 1;
    item.lastTriedAt = Date.now();
    if (e?.status === 401 || (e?.status >= 400 && e?.status < 500 && item.tries >= 2)) {
      item.parked = true;
    }
    return false;
  }
}

let flushing = false;
export async function flush() {
  if (flushing) {
    return;
  }
  flushing = true;
  try {
    const items = await load();
    const now = Date.now();
    const keep = [];
    for (const item of items) {
      const backoff = item.tries ? BACKOFF_BASE_MS * 2 ** (item.tries - 1) : 0;
      const eligible =
        !item.parked && item.tries < MAX_TRIES && now - (item.lastTriedAt || 0) >= backoff;
      if (!eligible) {
        keep.push(item);
      } else if (!(await trySend(item))) {
        keep.push(item);
      }
    }
    await save(keep);
  } finally {
    flushing = false;
  }
}

export async function enqueue(kind, campaignId, path, body) {
  const items = (await load()).filter(
    (item) => !(item.kind === kind && item.campaignId === campaignId),
  );
  const item = {
    id: `${kind}:${campaignId}`,
    kind,
    campaignId,
    path,
    body,
    tries: 0,
    lastTriedAt: 0,
    parked: false,
  };
  if (!(await trySend(item))) {
    items.push(item);
  }
  await save(items);
}

export const sendOrQueue = enqueue;
