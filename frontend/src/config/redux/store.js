import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./reducer/authSlice";
import postReducer from "./reducer/postReducer";

const store = configureStore({
  reducer: {
    auth: authSlice,
    post: postReducer,
  },
});

export default store;
