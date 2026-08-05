import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchCampaignList, applyCampaign } from '../api/campaigns';

const initialState = {
  list: [],
  loading: false,
  error: null,
  // { [campaignId]: 'applied' | 'approved' | 'shipped' | 'reviewing' | 'done' }
  applications: {},
};

export const fetchCampaigns = createAsyncThunk('campaign/fetchList', () => fetchCampaignList());

export const applyToCampaign = createAsyncThunk(
  'campaign/apply',
  async ({ campaignId, userId }) => {
    await applyCampaign(campaignId, userId);
    return { campaignId };
  },
);

const campaignSlice = createSlice({
  name: 'campaign',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaigns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload ?? [];
      })
      .addCase(fetchCampaigns.rejected, (state) => {
        state.loading = false;
        state.error = 'campaign fetch error';
      })
      .addCase(applyToCampaign.fulfilled, (state, { payload }) => {
        state.applications[payload.campaignId] = 'applied';
      });
  },
});

export default campaignSlice.reducer;
export const selectCampaigns = (root) => root.campaign.list;
export const selectMyApplications = (root) => root.campaign.applications;
