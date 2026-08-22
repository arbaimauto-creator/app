const mockOpsGet = jest.fn();

jest.mock('./opsClient', () => ({
  opsGet: (...args) => mockOpsGet(...args),
}));

import { DEV_MOCK_CAMPAIGN, fetchCampaignList } from './campaigns';

describe('campaign development fixture', () => {
  beforeEach(() => {
    mockOpsGet.mockReset();
  });

  it('keeps the mock campaign visible alongside live server campaigns in development', async () => {
    mockOpsGet.mockResolvedValue({
      campaigns: [{ id: 'server-campaign', title: 'Server campaign' }],
    });

    const campaigns = await fetchCampaignList();

    expect(campaigns.map((campaign) => campaign.id)).toEqual([
      DEV_MOCK_CAMPAIGN.id,
      'server-campaign',
    ]);
  });

  it('does not duplicate the fixture when the server already returns it', async () => {
    mockOpsGet.mockResolvedValue({ campaigns: [DEV_MOCK_CAMPAIGN] });

    const campaigns = await fetchCampaignList();

    expect(campaigns.filter((campaign) => campaign.id === DEV_MOCK_CAMPAIGN.id)).toHaveLength(1);
  });

  it('provides the fixture when the server is unavailable', async () => {
    mockOpsGet.mockRejectedValue(new Error('offline'));

    const campaigns = await fetchCampaignList();

    expect(campaigns).toContainEqual(DEV_MOCK_CAMPAIGN);
  });
});
