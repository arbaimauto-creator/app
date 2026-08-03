import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  mainScreen: {
    screenType: 0,
  },
};

const notificationSlice = createSlice({
  name: 'common',
  initialState,
  reducers: {
    setMainScreenType(state, { payload: { screenType } }) {
      state.mainScreen.screenType = screenType;
    },
  },
});

export default notificationSlice.reducer;
export const { setMainScreenType } = notificationSlice.actions;
