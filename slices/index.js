import { combineReducers } from 'redux';
import review from './review';
import product from './product';
import user from './user';
import notification from './notification';
import common from './common';

const rootReducer = combineReducers({
  review,
  product,
  user,
  notification,
  common,
});

export default rootReducer;
