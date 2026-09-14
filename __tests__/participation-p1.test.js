import { classifyError, describeError, ERROR_KIND } from '../api/opsErrors';
import {
  isFgiEnabled,
  estimatedMinutes,
  closedReason,
  uploadDays,
  daysToDeadline,
} from '../api/campaignMeta';
import { draftHasContent, draftKey } from '../api/drafts';

describe('submission error classification (plan §5.2)', () => {
  test('network failures have no status and ask for a retry', () => {
    const d = describeError(new Error('Network request failed'));
    expect(d.kind).toBe(ERROR_KIND.NETWORK);
    expect(d.action).toBe('retry');
  });
  test('closed / full / duplicate are told apart by status and body', () => {
    expect(classifyError({ status: 404, body: { error: 'campaign_not_found' } })).toBe(
      ERROR_KIND.DEADLINE,
    );
    expect(classifyError({ status: 409, body: { error: 'sold_out' } })).toBe(ERROR_KIND.SOLD_OUT);
    expect(classifyError({ status: 409, body: { error: 'already_applied' } })).toBe(
      ERROR_KIND.DUPLICATE,
    );
    expect(describeError({ status: 409, body: { error: 'sold_out' } }).action).toBe('browse');
    expect(describeError({ status: 409, body: { error: 'already_applied' } }).action).toBe(
      'activity',
    );
  });
  test('local state guards count as condition mismatch, 5xx as server', () => {
    expect(classifyError(new Error('invalid_seeding_status'))).toBe(ERROR_KIND.CONDITION);
    expect(classifyError({ status: 500 })).toBe(ERROR_KIND.SERVER);
    expect(classifyError({ status: 401 })).toBe(ERROR_KIND.AUTH);
  });
});

describe('campaign meta (plan §5.1 card info, §2.1 optional FGI)', () => {
  test('FGI requires explicit campaign opt-in', () => {
    expect(isFgiEnabled({})).toBe(false);
    expect(isFgiEnabled(null)).toBe(false);
    expect(isFgiEnabled({ fgiEnabled: 'false' })).toBe(false);
    expect(isFgiEnabled({ fgiEnabled: true })).toBe(true);
    expect(isFgiEnabled({ fgiEnabled: false })).toBe(false);
  });
  test('estimated time falls back to a composed estimate', () => {
    expect(estimatedMinutes({ estimatedMinutes: 40 })).toBe(40);
    expect(estimatedMinutes({ fgiEnabled: true })).toBe(25);
    expect(estimatedMinutes({ fgiEnabled: false })).toBe(15);
  });
  test('closed reason distinguishes deadline from sold out', () => {
    const now = new Date('2026-09-10T00:00:00.000Z');
    expect(
      closedReason({ status: 'open', remaining: 3, deadline: '2026-09-01T00:00:00.000Z' }, now),
    ).toBe('deadline');
    expect(
      closedReason({ status: 'open', remaining: 0, deadline: '2026-09-30T00:00:00.000Z' }, now),
    ).toBe('full');
    expect(closedReason({ status: 'closed', remaining: 5 }, now)).toBe('full');
    expect(
      closedReason({ status: 'open', remaining: 5, deadline: '2026-09-30T00:00:00.000Z' }, now),
    ).toBeNull();
    expect(daysToDeadline({ deadline: '2026-09-12T00:00:00.000Z' }, now)).toBe(2);
    expect(uploadDays({})).toBe(14);
  });
});

describe('drafts', () => {
  test('only drafts with real input count as restorable', () => {
    expect(draftHasContent(null, ['url'])).toBe(false);
    expect(draftHasContent({ url: '   ' }, ['url'])).toBe(false);
    expect(draftHasContent({ url: 'instagram.com/x' }, ['url'])).toBe(true);
    expect(draftHasContent({ scores: {} }, ['scores'])).toBe(false);
    expect(draftHasContent({ scores: { a: 3 } }, ['scores'])).toBe(true);
    expect(draftKey('fgi', 'cmp-1')).toBe('draftV1:fgi:cmp-1');
  });
});
