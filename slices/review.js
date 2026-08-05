import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getMainReviews, getReviews, getUsers } from '../api/getReviews';
import Constants from '../Components/Constants';
import { Alert } from 'react-native';
import Strings from '../Components/Strings';

const initialState = {
  isRefresh: false,
  reviewCategories: [],
  currentReviewCategory: Constants.VIDEO_LIST_HOME,
  reviewMain: {
    [Constants.VIDEO_LIST_RECENT]: [],
    [Constants.VIDEO_LIST_TRENDING]: [],
    [Constants.VIDEO_LIST_WORSTPRODUCT]: [],
    [Constants.VIDEO_LIST_ABROAD]: [],
    [Constants.VIDEO_LIST_FOLLOWING]: [],
    [Constants.VIDEO_LIST_HOT_REVIEWER]: [],
    [Constants.VIDEO_LIST_SCORE_EVENT]: [],
    eventBanner: [],
    loading: false,
    error: null,
  },
  [Constants.VIDEO_LIST_HOT_REVIEWER]: {
    data: [],
    count: 0,
    loading: false,
    error: null,
  },
  [Constants.VIDEO_LIST_RECENT]: {
    data: [],
    count: 0,
    loading: false,
    error: null,
  },
  [Constants.VIDEO_LIST_TRENDING]: {
    data: [],
    count: 0,
    loading: false,
    error: null,
  },
  [Constants.VIDEO_LIST_WORSTPRODUCT]: {
    data: [],
    count: 0,
    loading: false,
    error: null,
  },
  [Constants.VIDEO_LIST_ABROAD]: {
    data: [],
    count: 0,
    loading: false,
    error: null,
  },
  [Constants.VIDEO_LIST_FOLLOWING]: {
    data: [],
    count: 0,
    loading: false,
    error: null,
  },
  [Constants.VIDEO_LIST_SCORE_EVENT]: {
    data: [],
    count: 0,
    loading: false,
    error: null,
  },
};

export const fetchMoreMainUsers = createAsyncThunk('review/fetchMoreMainUsers', getUsers);
export const fetchMoreMainReviews = createAsyncThunk('review/fetchMoreMainReviews', getReviews);
export const fetchMainReviews = createAsyncThunk('review/fetchMainReviews', getMainReviews);

export const fetchReviews = createAsyncThunk('review/fetchReviews', getReviews);
export const fetchUsers = createAsyncThunk('review/fetchUsers', getUsers);
export const fetchMoreUsers = createAsyncThunk('review/fetchMoreUsers', getUsers);
export const fetchMoreReviews = createAsyncThunk('review/fetchMoreReviews', getReviews);

const fetchReviewsFulfilledFunctions = {
  [Constants.VIDEO_LIST_RECENT]: (state, { videoList, entireCount }) => {
    state[Constants.VIDEO_LIST_RECENT].data = videoList;
    state[Constants.VIDEO_LIST_RECENT].count = entireCount;
    state[Constants.VIDEO_LIST_RECENT].loading = false;
  },
  [Constants.VIDEO_LIST_TRENDING]: (state, { videoList, entireCount }) => {
    state[Constants.VIDEO_LIST_TRENDING].data = videoList;
    state[Constants.VIDEO_LIST_TRENDING].count = entireCount;
    state[Constants.VIDEO_LIST_TRENDING].loading = false;
  },
  [Constants.VIDEO_LIST_WORSTPRODUCT]: (state, { videoList, entireCount }) => {
    state[Constants.VIDEO_LIST_WORSTPRODUCT].data = videoList;
    state[Constants.VIDEO_LIST_WORSTPRODUCT].count = entireCount;
    state[Constants.VIDEO_LIST_WORSTPRODUCT].loading = false;
  },
  [Constants.VIDEO_LIST_ABROAD]: (state, { videoList, entireCount }) => {
    state[Constants.VIDEO_LIST_ABROAD].data = videoList;
    state[Constants.VIDEO_LIST_ABROAD].count = entireCount;
    state[Constants.VIDEO_LIST_ABROAD].loading = false;
  },
  [Constants.VIDEO_LIST_FOLLOWING]: (state, { videoList, entireCount }) => {
    state[Constants.VIDEO_LIST_FOLLOWING].data = videoList;
    state[Constants.VIDEO_LIST_FOLLOWING].count = entireCount;
    state[Constants.VIDEO_LIST_FOLLOWING].loading = false;
  },
  [Constants.VIDEO_LIST_SCORE_EVENT]: (state, { videoList, entireCount }) => {
    state[Constants.VIDEO_LIST_SCORE_EVENT].data = videoList;
    state[Constants.VIDEO_LIST_SCORE_EVENT].count = entireCount;
    state[Constants.VIDEO_LIST_SCORE_EVENT].loading = false;
  },
};

const fetchMoreReviewsFulfilledFunctions = {
  [Constants.VIDEO_LIST_RECENT]: (state, { videoList }) => {
    state[Constants.VIDEO_LIST_RECENT].data = [
      ...state[Constants.VIDEO_LIST_RECENT].data,
      ...videoList,
    ];
    state[Constants.VIDEO_LIST_RECENT].loading = false;
  },
  [Constants.VIDEO_LIST_TRENDING]: (state, { videoList }) => {
    state[Constants.VIDEO_LIST_TRENDING].data = [
      ...state[Constants.VIDEO_LIST_TRENDING].data,
      ...videoList,
    ];
    state[Constants.VIDEO_LIST_TRENDING].loading = false;
  },
  [Constants.VIDEO_LIST_WORSTPRODUCT]: (state, { videoList }) => {
    state[Constants.VIDEO_LIST_WORSTPRODUCT].data = [
      ...state[Constants.VIDEO_LIST_WORSTPRODUCT].data,
      ...videoList,
    ];
    state[Constants.VIDEO_LIST_WORSTPRODUCT].loading = false;
  },
  [Constants.VIDEO_LIST_ABROAD]: (state, { videoList }) => {
    state[Constants.VIDEO_LIST_ABROAD].data = [
      ...state[Constants.VIDEO_LIST_ABROAD].data,
      ...videoList,
    ];
    state[Constants.VIDEO_LIST_ABROAD].loading = false;
  },
  [Constants.VIDEO_LIST_FOLLOWING]: (state, { videoList }) => {
    state[Constants.VIDEO_LIST_FOLLOWING].data = [
      ...state[Constants.VIDEO_LIST_FOLLOWING].data,
      ...videoList,
    ];
    state[Constants.VIDEO_LIST_FOLLOWING].loading = false;
  },
  [Constants.VIDEO_LIST_SCORE_EVENT]: (state, { videoList }) => {
    state[Constants.VIDEO_LIST_SCORE_EVENT].data = [
      ...state[Constants.VIDEO_LIST_SCORE_EVENT].data,
      ...videoList,
    ];
    state[Constants.VIDEO_LIST_SCORE_EVENT].loading = false;
  },
};

const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {
    setReviewMain(state, { payload }) {
      if (!payload.following.length) {
        delete payload.following;
      }

      state.reviewMain = payload;
    },
    setRisingUsers(state, { payload }) {
      // initialState의 실제 키는 hotReviewer — 잘못된 경로(risingUser)로 쓰면 크래시
      state[Constants.VIDEO_LIST_HOT_REVIEWER].data = payload.userList;
      if (payload.entireCount) {
        state[Constants.VIDEO_LIST_HOT_REVIEWER].count = payload.entireCount;
      }
    },
    setRecents(state, { payload }) {
      state.recent.data = payload.videoList;
      if (payload.entireCount) {
        state.recent.count = payload.entireCount;
      }
    },
    setAbroads(state, { payload }) {
      state.abroad.data = payload.videoList;
      if (payload.entireCount) {
        state.abroad.count = payload.entireCount;
      }
    },
    setFollowings(state, { payload }) {
      state.following.data = payload.videoList;
      if (payload.entireCount) {
        state.following.count = payload.entireCount;
      }
    },
    setWorsts(state, { payload }) {
      // initialState의 실제 키는 worstProduct
      state[Constants.VIDEO_LIST_WORSTPRODUCT].data = payload.videoList;
      if (payload.entireCount) {
        state[Constants.VIDEO_LIST_WORSTPRODUCT].count = payload.entireCount;
      }
    },
    setTrendings(state, { payload }) {
      state.trending.data = payload.videoList;
      if (payload.entireCount) {
        state.trending.count = payload.entireCount;
      }
    },
    setReviewCategories(state, { payload }) {
      state.reviewCategories = payload;
    },
    setCurrentReviewCateogry(state, { payload }) {
      // console.log('setCurrentReviewCateogry', payload);
      state.currentReviewCategory = payload;
    },
    setScoreEvents(state, { payload }) {
      state.scoreEvent.data = payload.videoList;
      if (payload.entireCount) {
        state.scoreEvent.count = payload.entireCount;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending.type, (state, action) => {
        state.reviews = {
          loading: true,
          error: null,
          data: null,
        };
      })
      .addCase(fetchReviews.fulfilled.type, (state, { payload: { listType, reviews } }) => {
        // 맵에 없는 listType이면 리듀서 안에서 TypeError가 나므로 폴백 가드
        fetchReviewsFulfilledFunctions[listType]?.(state, reviews);
      })
      .addCase(fetchReviews.rejected.type, (state, action) => {
        console.error('fetchReviews.rejected', action);
        state.reviews = {
          loading: false,
          error: 'error',
        };
      })
      .addCase(
        fetchUsers.fulfilled.type,
        (
          state,
          {
            payload: {
              reviews: { userList, entireCount },
            },
          },
        ) => {
          state[Constants.VIDEO_LIST_HOT_REVIEWER].data = userList;
          state[Constants.VIDEO_LIST_HOT_REVIEWER].count = entireCount;
          state[Constants.VIDEO_LIST_HOT_REVIEWER].loading = false;
        },
      )
      .addCase(fetchMoreReviews.fulfilled.type, (state, { payload: { listType, reviews } }) => {
        fetchMoreReviewsFulfilledFunctions[listType]?.(state, reviews);
      })
      .addCase(fetchMoreUsers.fulfilled.type, (state, { payload: { reviews } }) => {
        state[Constants.VIDEO_LIST_HOT_REVIEWER].data = [
          ...state[Constants.VIDEO_LIST_HOT_REVIEWER].data,
          ...reviews.userList,
        ];
        state[Constants.VIDEO_LIST_HOT_REVIEWER].loading = false;
      })
      .addCase(fetchMainReviews.pending.type, (state, action) => {
        state.reviewMain = {
          loading: true,
          error: null,
          data: null,
        };
      })
      .addCase(fetchMainReviews.fulfilled.type, (state, { payload }) => {
        state.reviewMain = {
          [Constants.VIDEO_LIST_SCORE_EVENT]: payload[Constants.VIDEO_LIST_SCORE_EVENT],
          [Constants.VIDEO_LIST_RECENT]: payload[Constants.VIDEO_LIST_RECENT],
          [Constants.VIDEO_LIST_TRENDING]: payload[Constants.VIDEO_LIST_TRENDING],
          [Constants.VIDEO_LIST_WORSTPRODUCT]: payload[Constants.VIDEO_LIST_WORSTPRODUCT],
          [Constants.VIDEO_LIST_ABROAD]: payload[Constants.VIDEO_LIST_ABROAD],
          [Constants.VIDEO_LIST_FOLLOWING]: payload[Constants.VIDEO_LIST_FOLLOWING],
          [Constants.VIDEO_LIST_HOT_REVIEWER]: payload[Constants.VIDEO_LIST_HOT_REVIEWER],
          eventBanner: payload.eventBanner,
          loading: false,
        };
      })
      .addCase(fetchMainReviews.rejected.type, (state, action) => {
        console.error('fetchMainReviews.rejected', action);
        state.reviewMain = {
          loading: false,
          error: 'error',
        };
      })
      .addCase(fetchMoreMainReviews.fulfilled.type, (state, { payload }) => {
        // console.log('payload', payload);
        state.reviewMain[payload.listType] = [
          ...state.reviewMain[payload.listType],
          ...payload.reviews.videoList,
        ];

        if (payload.reviews.videoList.length < 1) {
          Alert.alert(Strings.NO_MORE_VIDEOS);
        }
      })
      .addCase(fetchMoreMainUsers.fulfilled.type, (state, { payload }) => {
        if (Constants.USER_LIST_LATEST_RECOMMENDED === payload.listType) {
          state.reviewMain[Constants.VIDEO_LIST_HOT_REVIEWER] = [
            ...state.reviewMain[Constants.VIDEO_LIST_HOT_REVIEWER],
            ...payload.reviews.userList,
          ];
        }
      });
  },
});

export default reviewSlice.reducer;
export const {
  setRisingUsers,
  setRecents,
  setAbroads,
  setFollowings,
  setWorsts,
  setTrendings,
  setReviewCategories,
  setCurrentReviewCateogry,
  setReviewMain,
  setScoreEvents,
} = reviewSlice.actions;
