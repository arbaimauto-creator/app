import { combineReducers } from 'redux';
import review from './review';
import product from './product';
import user from './user';
import notification from './notification';
import common from './common';
import campaign from './campaign';

const rootReducer = combineReducers({
  review,
  product,
  user,
  notification,
  common,
  campaign,
});

export default rootReducer;
