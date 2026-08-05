import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getProducts, getStoreMain } from '../api/getProducts';
import Constants from '../Components/Constants';

const initialState = {
  productMain: {
    loading: true,
    error: null,
    data: {
      [Constants.PRODUCT_LIST_SPECIAL_PRICE]: [],
      [Constants.PRODUCT_LIST_NEW]: [],
      [Constants.PRODUCT_LIST_BEST_SELLING]: [],
      [Constants.PRODUCT_LIST_MANY_REVIEWS]: [],
      [Constants.PRODUCT_LIST_PROMOTION_EVENT]: [],
      [Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT]: [],
      category: {},
      eventBanner: [],
    },
  },
  [Constants.PRODUCT_LIST_NEW]: {
    data: [],
    count: 0,
    loading: true,
    error: null,
  },
  // add b2b product list
  [Constants.PRODUCT_LIST_B2B]: {
    data: [],
    count: 0,
    loading: true,
    error: null,
  },
  [Constants.PRODUCT_LIST_CATEGORY]: {
    data: [],
    count: 0,
    loading: true,
    error: null,
  },
  [Constants.PRODUCT_LIST_BEST_SELLING]: {
    data: [],
    count: 0,
    loading: true,
    error: null,
  },
  [Constants.PRODUCT_LIST_MANY_REVIEWS]: {
    data: [],
    count: 0,
    loading: true,
    error: null,
  },
  [Constants.PRODUCT_LIST_SPECIAL_PRICE]: {
    data: [],
    count: 0,
    loading: true,
    error: null,
  },
  [Constants.PRODUCT_LIST_PROMOTION_EVENT]: {
    success: false,
    data: [],
    count: 0,
    loading: true,
    error: null,
  },
  [Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT]: {
    success: false,
    data: [],
    count: 0,
    loading: true,
    error: null,
  },
};

export const fetchStoreMain = createAsyncThunk('product/fetchStoreMain', getStoreMain);
export const fetchMoreStoreMain = createAsyncThunk('product/fetchMoreStoreMain', getProducts);
export const fetchProducts = createAsyncThunk('product/fetchProducts', getProducts);
export const fetchMoreProducts = createAsyncThunk('product/fetchMoreProducts', getProducts);

const fetchMoreStoreMainFulfilledFunctions = {
  [Constants.PRODUCT_LIST_BEST_SELLING]: (state, { products: { productList } }) => {
    state.productMain.data[Constants.PRODUCT_LIST_BEST_SELLING] = [
      ...state.productMain.data[Constants.PRODUCT_LIST_BEST_SELLING],
      ...productList,
    ];
    state.productMain.loading = false;
  },
  [Constants.PRODUCT_LIST_NEW]: (state, { products: { productList } }) => {
    state.productMain.data[Constants.PRODUCT_LIST_NEW] = [
      ...state.productMain.data[Constants.PRODUCT_LIST_NEW],
      ...productList,
    ];
    state.productMain.loading = false;
  },
  [Constants.PRODUCT_LIST_MANY_REVIEWS]: (state, { products: { productList } }) => {
    state.productMain.data[Constants.PRODUCT_LIST_MANY_REVIEWS] = [
      ...state.productMain.data[Constants.PRODUCT_LIST_MANY_REVIEWS],
      ...productList,
    ];
    state.productMain.loading = false;
  },
  [Constants.PRODUCT_LIST_SPECIAL_PRICE]: (state, { products: { productList } }) => {
    state.productMain.data[Constants.PRODUCT_LIST_SPECIAL_PRICE] = [
      ...state.productMain.data[Constants.PRODUCT_LIST_SPECIAL_PRICE],
      ...productList,
    ];
    state.productMain.loading = false;
  },
  [Constants.PRODUCT_LIST_PROMOTION_EVENT]: (state, { products: { productList } }) => {
    state.productMain.data[Constants.PRODUCT_LIST_PROMOTION_EVENT] = [
      ...state.productMain.data[Constants.PRODUCT_LIST_PROMOTION_EVENT],
      ...productList,
    ];
    state.productMain.loading = false;
  },
  [Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT]: (state, { products: { productList } }) => {
    state.productMain.data[Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT] = [
      ...state.productMain.data[Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT],
      ...productList,
    ];
    state.productMain.loading = false;
  },
};

const fetchProductsFulfilledFunctions = {
  [Constants.PRODUCT_LIST_BEST_SELLING]: (state, { products: { productList, entireCount } }) => {
    state[Constants.PRODUCT_LIST_BEST_SELLING].data = productList;
    state[Constants.PRODUCT_LIST_BEST_SELLING].count = entireCount;
    state[Constants.PRODUCT_LIST_BEST_SELLING].loading = false;
  },
  [Constants.PRODUCT_LIST_NEW]: (state, { products: { productList, entireCount } }) => {
    state[Constants.PRODUCT_LIST_NEW].data = productList;
    state[Constants.PRODUCT_LIST_NEW].count = entireCount;
    state[Constants.PRODUCT_LIST_NEW].loading = false;
  },
  [Constants.PRODUCT_LIST_MANY_REVIEWS]: (state, { products: { productList, entireCount } }) => {
    state[Constants.PRODUCT_LIST_MANY_REVIEWS].data = productList;
    state[Constants.PRODUCT_LIST_MANY_REVIEWS].count = entireCount;
    state[Constants.PRODUCT_LIST_MANY_REVIEWS].loading = false;
  },
  [Constants.PRODUCT_LIST_SPECIAL_PRICE]: (state, { products: { productList, entireCount } }) => {
    state[Constants.PRODUCT_LIST_SPECIAL_PRICE].data = productList;
    state[Constants.PRODUCT_LIST_SPECIAL_PRICE].count = entireCount;
    state[Constants.PRODUCT_LIST_SPECIAL_PRICE].loading = false;
  },
  [Constants.PRODUCT_LIST_PROMOTION_EVENT]: (state, { products: { productList, entireCount } }) => {
    state[Constants.PRODUCT_LIST_PROMOTION_EVENT].data = productList;
    state[Constants.PRODUCT_LIST_PROMOTION_EVENT].count = entireCount;
    state[Constants.PRODUCT_LIST_PROMOTION_EVENT].loading = false;
    state[Constants.PRODUCT_LIST_PROMOTION_EVENT].success = true;
  },
  [Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT]: (
    state,
    { products: { productList, entireCount } },
  ) => {
    state[Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT].data = productList;
    state[Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT].count = entireCount;
    state[Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT].loading = false;
    state[Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT].success = true;
  },
  [Constants.PRODUCT_LIST_CATEGORY]: (state, { products: { productList, entireCount } }) => {
    state[Constants.PRODUCT_LIST_CATEGORY].data = [
      ...state[Constants.PRODUCT_LIST_CATEGORY].data, // Append existing data
      ...productList, // Add new products
    ];

    state[Constants.PRODUCT_LIST_CATEGORY].count = entireCount;
    state[Constants.PRODUCT_LIST_CATEGORY].loading = false;
  },
};

const fetchMoreProductsFulfilledFunctions = {
  [Constants.PRODUCT_LIST_BEST_SELLING]: (state, { products: { productList } }) => {
    state[Constants.PRODUCT_LIST_BEST_SELLING].data = [
      ...state[Constants.PRODUCT_LIST_BEST_SELLING].data,
      ...productList,
    ];
    state[Constants.PRODUCT_LIST_BEST_SELLING].loading = false;
  },
  [Constants.PRODUCT_LIST_NEW]: (state, { products: { productList } }) => {
    state[Constants.PRODUCT_LIST_NEW].data = [
      ...state[Constants.PRODUCT_LIST_NEW].data,
      ...productList,
    ];
    state[Constants.PRODUCT_LIST_NEW].loading = false;
  },
  [Constants.PRODUCT_LIST_MANY_REVIEWS]: (state, { products: { productList } }) => {
    state[Constants.PRODUCT_LIST_MANY_REVIEWS].data = [
      ...state[Constants.PRODUCT_LIST_MANY_REVIEWS].data,
      ...productList,
    ];
    state[Constants.PRODUCT_LIST_MANY_REVIEWS].loading = false;
  },
  [Constants.PRODUCT_LIST_SPECIAL_PRICE]: (state, { products: { productList } }) => {
    state[Constants.PRODUCT_LIST_SPECIAL_PRICE].data = [
      ...state[Constants.PRODUCT_LIST_SPECIAL_PRICE].data,
      ...productList,
    ];
    state[Constants.PRODUCT_LIST_SPECIAL_PRICE].loading = false;
  },
  [Constants.PRODUCT_LIST_PROMOTION_EVENT]: (state, { products: { productList } }) => {
    state[Constants.PRODUCT_LIST_PROMOTION_EVENT].data = [
      ...state[Constants.PRODUCT_LIST_PROMOTION_EVENT].data,
      ...productList,
    ];
    state[Constants.PRODUCT_LIST_PROMOTION_EVENT].loading = false;
    state[Constants.PRODUCT_LIST_PROMOTION_EVENT].success = true;
  },
  [Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT]: (state, { products: { productList } }) => {
    state[Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT].data = [
      ...state[Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT].data,
      ...productList,
    ];
    state[Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT].loading = false;
    state[Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT].success = true;
  },
};

function defaultFetchProductsFulfilled(state, { products: { entireCount, productList } }) {
  // console.log('defaultFetchProductsFulfilled', entireCount);
  state.recent = {
    loading: false,
    data: productList,
    count: entireCount,
  };
}

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStoreMain.pending.type, (state, action) => {
        // data 키를 날리면 로딩 중 접근하는 화면/fetchMore 핸들러가 크래시 — 기존 data 보존
        state.productMain = {
          loading: true,
          error: null,
          data: state.productMain?.data,
        };
      })
      .addCase(
        fetchStoreMain.fulfilled.type,
        (
          state,
          { payload: { storeMain, recent, bestSelling, manyReview, refunds, googlePromotions } },
        ) => {
          state.productMain = {
            loading: false,
            data: {
              [Constants.PRODUCT_LIST_SPECIAL_PRICE]: storeMain.specialPrice.productList,
              [Constants.PRODUCT_LIST_NEW]: recent.productList,
              [Constants.PRODUCT_LIST_BEST_SELLING]: bestSelling.productList,
              [Constants.PRODUCT_LIST_MANY_REVIEWS]: manyReview.productList,
              [Constants.PRODUCT_LIST_PROMOTION_EVENT]: refunds.productList,
              [Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT]: googlePromotions.productList,
              category: storeMain.category,
              eventBanner: storeMain.eventBanner,
            },
          };
        },
      )

      .addCase(fetchStoreMain.rejected.type, (state, action) => {
        console.error('fetchReviews.rejected', action);
        state.productMain = {
          loading: false,
          error: 'error',
          data: state.productMain?.data,
        };
      })
      .addCase(fetchProducts.fulfilled, (state, { payload }) => {
        console.log('Redux - Received payload:', payload);
        console.log('Redux - Current state before update:', state[payload.type]);

        if (payload.type === Constants.PRODUCT_LIST_CATEGORY) {
          console.log('Redux - Updating category data');
          state[Constants.PRODUCT_LIST_CATEGORY] = {
            data: payload.products.productList,
            count: payload.products.entireCount,
            loading: false,
            error: null,
          };
          console.log('Redux - Updated category state:', state[Constants.PRODUCT_LIST_CATEGORY]);
        } else {
          console.log('Redux - Using default handler for type:', payload.type);
          (fetchProductsFulfilledFunctions[payload.type] || defaultFetchProductsFulfilled)(
            state,
            payload,
          );
        }
      })
      .addCase(fetchProducts.pending, (state, action) => {
        const { listType } = action.meta.arg;
        if (state[listType]) {
          state[listType].loading = true;
          state[listType].error = null;
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        const { listType } = action.meta.arg;
        if (state[listType]) {
          state[listType].loading = false;
          state[listType].error = action.error.message;
        }
        console.error('fetchProducts.rejected', action);
      })
      .addCase(fetchMoreStoreMain.fulfilled, (state, { payload }) => {
        // 맵에 없는 type이면 TypeError — 폴백 가드
        fetchMoreStoreMainFulfilledFunctions[payload.type]?.(state, payload);
      })
      .addCase(fetchMoreProducts.fulfilled, (state, { payload }) => {
        fetchMoreProductsFulfilledFunctions[payload.type]?.(state, payload);
      });
  },
});

export default productSlice.reducer;
