import reducer, {
  fetchCampaigns,
  applyToCampaign,
  selectCampaigns,
  selectMyApplications,
} from '../slices/campaign';

const initial = reducer(undefined, { type: '@@INIT' });

describe('campaign slice', () => {
  it('초기 상태: 빈 목록, 로딩 false', () => {
    expect(initial.list).toEqual([]);
    expect(initial.loading).toBe(false);
    expect(initial.applications).toEqual({});
  });

  it('fetchCampaigns.pending → loading true', () => {
    const next = reducer(initial, { type: fetchCampaigns.pending.type });
    expect(next.loading).toBe(true);
  });

  it('fetchCampaigns.fulfilled → 목록 저장, loading false', () => {
    const list = [{ id: 'c1', title: '테스트', status: 'open' }];
    const next = reducer(initial, { type: fetchCampaigns.fulfilled.type, payload: list });
    expect(next.list).toEqual(list);
    expect(next.loading).toBe(false);
  });

  it('applyToCampaign.fulfilled → applications에 상태 기록', () => {
    const next = reducer(initial, {
      type: applyToCampaign.fulfilled.type,
      payload: { campaignId: 'c1' },
    });
    expect(next.applications.c1).toBe('applied');
  });

  it('셀렉터가 올바른 경로를 읽는다', () => {
    const root = { campaign: { ...initial, list: [{ id: 'x' }], applications: { x: 'applied' } } };
    expect(selectCampaigns(root)).toEqual([{ id: 'x' }]);
    expect(selectMyApplications(root)).toEqual({ x: 'applied' });
  });
});
