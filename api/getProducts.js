import axios from 'axios';
import qs from 'qs';
import Constants from '../Components/Constants';
import { getRequestHeader } from './common';
import { API_ROOT_URL } from '../Components/APIprovider';

axios.defaults.paramsSerializer = (params) => {
  return qs.stringify(params);
};

async function baseRequestProducts(
  { listType, sortType, searchKeyword, offset, skip, limit, eventType } = {
    listType,
    sortType: undefined,
    searchKeyword: '',
    offset: '',
    skip: 0,
    limit: 18,
    eventType,
  },
) {
  const defaultParams = await getRequestHeader();

  return axios.get(API_ROOT_URL + '/products', {
    headers: defaultParams.headers,
    params: {
      ...defaultParams.params,
      offset,
      limit,
      listType,
      searchKeyword,
      sortType,
      skip,
      eventType,
    },
  });
}

export async function getStoreMain(limit = 4) {
  const getMain = baseRequestProducts({ listType: 'storeMain', limit: limit });
  const getNew = baseRequestProducts({ limit: limit });
  const getBestSell = baseRequestProducts({
    sortType: Constants.PRODUCT_LIST_SORT_TYPE.SELL_COUNT,
    limit: limit,
  });
  const getManyReviews = baseRequestProducts({
    sortType: Constants.PRODUCT_LIST_SORT_TYPE.REVIEW_COUNT,
    limit: limit,
  });
  const getRefunds = baseRequestProducts({
    eventType: 'refund',
    limit: limit,
  });
  const getGooglePromotions = baseRequestProducts({
    eventType: Constants.PRODUCT_LIST_GOOGLE_PROMOTION_EVENT,
    limit: limit,
  });

  const [storeMain, recent, bestSelling, manyReview, refunds, googlePromotions] = await Promise.all(
    [getMain, getNew, getBestSell, getManyReviews, getRefunds, getGooglePromotions],
  );

  return {
    storeMain: storeMain.data,
    recent: recent.data,
    bestSelling: bestSelling.data,
    manyReview: manyReview.data,
    refunds: refunds.data,
    googlePromotions: googlePromotions.data,
  };
}

export async function getProducts({
  screenType,
  listType,
  sortType,
  searchKeyword,
  offset,
  skip,
  limit,
  eventType,
}) {
  const response = await baseRequestProducts({
    screenType,
    listType,
    sortType,
    searchKeyword,
    offset,
    skip,
    limit,
    eventType,
  });

  // console.log(
  //   'getProducts reducer',
  //   screenType,
  //   listType,
  //   sortType,
  //   response.data.productList.length,
  //   response.data.entireCount,
  // );

  return {
    type: screenType,
    products: response.data,
  };
}

export async function getCategorizedProducts(
  { categoryCode, sortType, offset, skip, limit } = {
    categoryCode,
    sortType: undefined,
    offset: '',
    skip: 0,
    limit: 18,
  },
) {
  const response = await baseRequestProducts({
    categoryCode,
    sortType,
    offset,
    skip,
    limit,
  });

  console.log('getCategorizedProducts', response.data);
}
