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

export const fetchUser = createAsyncThunk('user/getUser', getUser);

const notificationSlice = createSlice({
  name: 'user',
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
