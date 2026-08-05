import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getUser } from '../api/getUser';
// import { getLanguage } from '../Components/Strings';

const initialState = {
  user: {
    loading: true,
    error: null,
    data: null,
  },
  isGuest: false,
  totalReward: 0,
  totalRevenue: 0,
  unearnedProfit: 0,
  unearnedRevenue: 0,
  currencyRate: 0,
  countryCode: null,
};

export const fetchUser = createAsyncThunk('user/getUser', getUser);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUnearnedProfit(state, { payload: { unearnedProfit } }) {
      state.unearnedProfit = unearnedProfit;
    },
    setUnearnedRevenue(state, { payload: { unearnedRevenue } }) {
      state.unearnedRevenue = unearnedRevenue;
    },
    setTotalReward(state, { payload: { totalReward } }) {
      state.totalReward = totalReward;
    },
    setTotalRevenue(state, { payload: { totalRevenue } }) {
      state.totalRevenue = totalRevenue;
    },
    changeReward(state, { payload: { reward } }) {
      console.log(reward);
      state.totalReward += reward;
    },
    setUser(state, { payload: { user } }) {
      state.user.data = user;
    },
    setCurrencyRate(state, { payload: { currencyRate } }) {
      state.currencyRate = currencyRate;
    },
    setGuest(state, { payload: { isGuest } }) {
      console.log('setGuest reducer', isGuest);
      state.isGuest = isGuest;
    },
    setCountryCode(state, { payload: { countryCode } }) {
      console.log('countryCode', countryCode);
      state.countryCode = countryCode;
    },
  },
  extraReducers: (builder) => {
    // 기존 코드는 존재하지 않는 state.reviews에 쓰고 fulfilled에서 저장을 안 해
    // user.loading이 영원히 true로 남았음 — user 경로에 올바르게 반영한다.
    builder
      .addCase(fetchUser.pending.type, (state) => {
        state.user.loading = true;
        state.user.error = null;
      })
      .addCase(fetchUser.fulfilled.type, (state, { payload }) => {
        state.user.loading = false;
        state.user.data = payload ?? state.user.data;
      })
      .addCase(fetchUser.rejected.type, (state, action) => {
        console.error('fetchUser.rejected', action);
        state.user.loading = false;
        state.user.error = 'user fetch error';
      });
  }
});

export default userSlice.reducer;
export const {
  setTotalReward,
  setTotalRevenue,
  setUnearnedProfit,
  setUnearnedRevenue,
  setUser,
  setCurrencyRate,
  changeReward,
  setGuest,
  setCountryCode,
} = userSlice.actions;
