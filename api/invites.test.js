import { verifyInviteCode } from './invites';

describe('verifyInviteCode', () => {
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
});
