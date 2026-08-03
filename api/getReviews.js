import axios from 'axios';
import qs from 'qs';
import Constants from '../Components/Constants';
import { getRequestHeader } from './common';
import { API_ROOT_URL } from '../Components/APIprovider';

axios.defaults.paramsSerializer = (params) => {
  return qs.stringify(params);
};

async function baseRequestReviews(
  { listType, sortType, searchKeyword, offset, skip, limit } = {
    listType,
    sortType: undefined,
    searchKeyword: '',
    offset: '',
    skip: 0,
    limit: 18,
  },
) {
  const defaultParams = await getRequestHeader();

  return axios.get(API_ROOT_URL + '/videos', {
    headers: defaultParams.headers,
    params: {
      ...defaultParams.params,
      listType,
      sortType,
      searchKeyword,
      offset,
      skip,
      limit,
    },
  });
}

async function baseRequestUesrs(
  { listOf, sortType, offset, skip, limit } = {
    listOf,
    sortType: undefined,
    offset: '',
    skip: 0,
    limit: 18,
  },
) {
  const defaultParams = await getRequestHeader();

  return axios.get(API_ROOT_URL + '/users', {
    headers: defaultParams.headers,
    params: {
      ...defaultParams.params,
      listOf,
      sortType,
      offset,
      skip,
      limit,
    },
  });
}

export async function getMainReviews(
  { sortType, searchKeyword, offset, skip, limit } = {
    sortType: undefined,
    searchKeyword: '',
    offset: '',
    skip: 0,
    limit: 4,
  },
) {
  const getMain = baseRequestReviews({
    listType: 'newMain',
    sortType,
    searchKeyword,
    offset,
    skip,
    limit,
  });
  // const getRising = baseRequestUesrs({
  //   listOf: Constants.USER_LIST_LATEST_RECOMMENDED,
  //   sortType,
  //   offset,
  //   skip,
  //   limit: 6,
  // });

  // const [
  //   {
  //     data: {
  //       trending: { videoList: trending },
  //       recent: { videoList: recent },
  //       following: { videoList: following },
  //       worstProduct: { videoList: worstProduct },
  //       abroad: { videoList: abroad },
  //     },
  //   },
  //   {
  //     data: { userList: hotReviewer },
  //   },
  // ] = await Promise.all([getMain, getRising]);

  // return { trending, recent, following, abroad, worstProduct, hotReviewer };

  const start = new Date();

  const {
    data: {
      trending: { videoList: trending },
      recent: { videoList: recent },
      following: { videoList: following },
      worstProduct: { videoList: worstProduct },
      abroad: { videoList: abroad },
      scoreEvent: { videoList: scoreEvent },
      eventBanner,
    },
  } = await getMain;

  const end = new Date();
  console.log(end - start);

  return {
    trending,
    recent,
    following,
    abroad,
    worstProduct,
    scoreEvent,
    hotReviewer: [],
    eventBanner,
  };
}

export async function getReviews({
  listType,
  sortType = undefined,
  searchKeyword,
  offset = '',
  skip = 0,
  limit = 18,
}) {
  const response = await baseRequestReviews({
    listType,
    sortType,
    searchKeyword,
    offset,
    skip,
    limit,
  });

  return {
    listType,
    reviews: response.data,
  };
}

export async function getUsers({ listOf, sortType, offset, skip, limit }) {
  const response = await baseRequestUesrs({
    listOf,
    sortType,
    offset,
    skip,
    limit,
  });

  return {
    listType: listOf,
    reviews: response.data,
  };
}
