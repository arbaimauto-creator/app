import { verifyInviteCode } from './invites';

const mockOpsPost = jest.fn();
const mockSetOpsToken = jest.fn();

jest.mock('./opsClient', () => ({
  opsPost: (...args) => mockOpsPost(...args),
  setOpsToken: (...args) => mockSetOpsToken(...args),
}));

jest.mock('./opsBridge', () => ({
  getGreydAppId: jest.fn().mockResolvedValue('test-device'),
}));

describe('verifyInviteCode', () => {
  beforeEach(() => {
    mockOpsPost.mockReset();
    mockSetOpsToken.mockReset();
    mockOpsPost.mockRejectedValue(new Error('offline'));
  });

  it.each(['GREYD1', 'greyd1', ' GREYD1 '])('accepts the GREYD1 invite code: %s', async (code) => {
    await expect(verifyInviteCode(code, { country: 'KR' })).resolves.toMatchObject({
      success: true,
      role: 'influencer',
    });
  });

  it('accepts the creator referral code', async () => {
    await expect(verifyInviteCode('CREW26', { country: 'KR' })).resolves.toMatchObject({
      success: true,
      role: 'influencer',
    });
  });

  it('rejects an unknown code', async () => {
    await expect(verifyInviteCode('BAD001', { country: 'KR' })).resolves.toEqual({
      success: false,
    });
  });

  it('accepts a server-issued code that is not in the local demo list', async () => {
    mockOpsPost.mockResolvedValue({ token: 'server-token', role: 'influencer' });

    await expect(verifyInviteCode('REAL26', { country: 'KR' })).resolves.toEqual({
      success: true,
      role: 'influencer',
    });
    expect(mockOpsPost).toHaveBeenCalledWith('/auth', {
      inviteCode: 'REAL26',
      greydAppId: 'test-device',
      handle: null,
      country: 'KR',
    });
    expect(mockSetOpsToken).toHaveBeenCalledWith('server-token');
  });

  it('does not fall back after an authoritative server rejection', async () => {
    mockOpsPost.mockRejectedValue({ status: 401, body: { error: 'used' } });

    await expect(verifyInviteCode('GREYD1', { country: 'KR' })).resolves.toEqual({
      success: false,
      reason: 'used',
    });
  });
});
