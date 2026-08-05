import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getUser } from '../api/getUser';

const initialState = {
  notification: {
    type: '',
    qnaId: '',
  },
  currentPushedNotification: {
    type: '',
    qnaId: '',
  },
  qnaList: {
    othersOriginal: [],
    others: [],
    myOriginal: [],
    mine: [],
  },
  currentPushedQnaId: '',
};

// typePrefix가 user 슬라이스의 fetchUser('user/getUser')와 겹치면
// 한쪽 thunk가 다른 슬라이스의 extraReducers를 오발화시킨다 — 고유 prefix 사용
export const fetchUser = createAsyncThunk('notification/getUser', getUser);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setInitialNotification(state, { payload: { notification } }) {
      console.log('redux!', notification);
      state.notification = notification;
    },
    setCurrentPushedNotification(state, { payload: { notification } }) {
      state.currentPushedNotification = notification;
    },
    setQnaList(state, { payload: { qnaList } }) {
      state.qnaList = {
        othersOriginal: state.qnaList.othersOriginal,
        others: state.qnaList.others,
        myOriginal: state.qnaList.myOriginal,
        mine: state.qnaList.mine,
        ...qnaList,
      };
    },
    setCurrentPushedQnaId(state, { payload: { qnaId } }) {
      state.currentPushedQnaId = qnaId;
    },
  },
});

export default notificationSlice.reducer;
export const {
  setInitialNotification,
  setCurrentPushedNotification,
  setQnaList,
  setCurrentPushedQnaId,
} = notificationSlice.actions;
