import { createSlice } from "@reduxjs/toolkit";
import { getAllComments, getAllPosts,postComment } from "../../action/postAction";

const initialState = {
  posts: [],
  comments: [],
  postId: "",
  isError: false,
  postFetched: false,
  isloading: false,
  message: "",
};


const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    // 🔹 Reset state to original values
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* --- GET ALL POSTS --- */
      .addCase(getAllPosts.pending, (state) => {
        state.isloading = true;
      })
      .addCase(getAllPosts.fulfilled, (state, action) => {
        state.isloading = false;
        state.postFetched = true;
        state.posts = action.payload.posts;
      })
      .addCase(getAllPosts.rejected, (state, action) => {
        state.isloading = false;
        state.isError = true;
        state.message = action.payload;
      })

      /* --- GET ALL COMMENTS (Load existing) --- */
      .addCase(getAllComments.fulfilled, (state, action) => {
        state.postId = action.payload.post_id;
        state.comments = action.payload.comments;
      })

      /* --- POST COMMENT LOGIC (Add new) --- */
      .addCase(postComment.fulfilled, (state, action) => {
  if (action.payload && action.payload.comment) {
    // Naya comment (jo populate hokar aaya hai) use list ke upar add karo
    state.comments = [action.payload.comment, ...state.comments];
  }
});
  },
});

export const { reset } = postSlice.actions;
export default postSlice.reducer;
