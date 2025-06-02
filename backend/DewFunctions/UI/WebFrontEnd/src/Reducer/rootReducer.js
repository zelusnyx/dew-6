import dewMainReducer from './dewMainReducer'
import { combineReducers } from 'redux';

const rootReducer = combineReducers({
  dewMain: dewMainReducer //auth
})

export default rootReducer;