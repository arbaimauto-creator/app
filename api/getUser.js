import axios from 'axios';
import qs from 'qs';
import Constants from '../Components/Constants';
import { getRequestHeader } from './common';
import { API_ROOT_URL } from '../Components/APIprovider';

axios.defaults.paramsSerializer = (params) => {
  return qs.stringify(params);
};

export async function getUser(userId) {
  const defaultParams = await getRequestHeader();
  return axios.get(API_ROOT_URL + '/users/' + userId, { headers: defaultParams.headers });
}
