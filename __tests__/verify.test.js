// 본인확인 모듈 (2026-09-16, 기획서 §5.4)
jest.mock('../Components/Constants/Features', () => ({ LIVE_OPS_API: true }));

const mockOpsGet = jest.fn();
const mockOpsPost = jest.fn();
jest.mock('../api/opsClient', () => ({
  opsGet: (...args) => mockOpsGet(...args),
  opsPost: (...args) => mockOpsPost(...args),
}));

import {
  VERIFY_ERROR,
  confirmVerify,
  getVerifyStatus,
  isValidEmail,
  startVerify,
} from '../api/verify';

beforeEach(() => {
  mockOpsGet.mockReset();
  mockOpsPost.mockReset();
});

test('이메일 형식을 판별한다', () => {
  expect(isValidEmail('name@example.com')).toBe(true);
  expect(isValidEmail('  NAME@Example.co ')).toBe(true);
  expect(isValidEmail('name@')).toBe(false);
  expect(isValidEmail('name example.com')).toBe(false);
});

test('잘못된 이메일은 서버에 보내지 않는다', async () => {
  await expect(startVerify('nope')).rejects.toMatchObject({ code: VERIFY_ERROR.BAD_EMAIL });
  expect(mockOpsPost).not.toHaveBeenCalled();
});

test('코드 발송은 소문자로 정리한 이메일로 요청한다', async () => {
  mockOpsPost.mockResolvedValue({ ok: true });

  await startVerify('  Name@Example.com ');

  expect(mockOpsPost).toHaveBeenCalledWith('/verify', {
    action: 'start',
    email: 'name@example.com',
  });
});

test('서버 오류 코드를 화면이 아는 코드로 옮긴다', async () => {
  mockOpsPost.mockRejectedValue({ body: { error: 'too_soon' } });
  await expect(startVerify('a@b.co')).rejects.toMatchObject({ code: VERIFY_ERROR.TOO_SOON });

  mockOpsPost.mockRejectedValue({ body: { error: 'mismatch', attemptsLeft: 2 } });
  await expect(confirmVerify('12-34-56')).rejects.toMatchObject({
    code: VERIFY_ERROR.MISMATCH,
    attemptsLeft: 2,
  });

  mockOpsPost.mockRejectedValue(new Error('network down'));
  await expect(confirmVerify('123456')).rejects.toMatchObject({ code: VERIFY_ERROR.OFFLINE });
});

test('코드는 숫자만 남겨 보낸다', async () => {
  mockOpsPost.mockResolvedValue({ ok: true, verifiedAt: '2026-09-16T00:00:00.000Z' });

  await confirmVerify('12 34 56');

  expect(mockOpsPost).toHaveBeenCalledWith('/verify', { action: 'confirm', code: '123456' });
});

test('상태 조회가 실패해도 화면은 미완료로 뜬다', async () => {
  mockOpsGet.mockRejectedValue(new Error('offline'));

  await expect(getVerifyStatus()).resolves.toEqual({ verifiedAt: null, pending: null });
});
