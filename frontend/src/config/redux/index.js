import { combineReducers } from "redux";
import authReducer from "./reducer/authReducer";
import postReducer from "./reducer/postReducer";

const rootReducer = combineReducers({
  auth: authReducer,
  post: postReducer,
});

export default rootReducer;
