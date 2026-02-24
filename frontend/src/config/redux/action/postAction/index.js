import { postClientServer } from "@/config";

import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAllPosts = createAsyncThunk(
  "post/getAllPosts",
  async (_, thunkAPI) => {
    try {
      const response = await postClientServer.get("/posts");

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data);
    }
  }
);

export const createPost = createAsyncThunk(
  "post/createPost",
  async (formData, thunkAPI) => {
    try {
      // Direct formData bhejna hai kyunki Dashboard se formData hi aa raha hai
      const response = await postClientServer.post("/post", formData, {

        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data);
    }
  }
);

export const deletePost = createAsyncThunk(
  "post/deletePost",
  async (post_id, thunkAPI) => {
    try {
      const response = await postClientServer.delete("/post", {

        data: {
          token: localStorage.getItem("token"),
          post_id: post_id, // Ab ye sahi format mein jayega
        },
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data);
    }
  }
);

export const incrementPostLike = createAsyncThunk(
  "post/incrementLike",
  async (post, thunkAPI) => {
    try {
      const response = await postClientServer.post("/increment_post_likes", { // Route name check karlein

        post_id: post.post_id
      });
      
      // 🔥 SUCCESS: Like ke baad posts list refresh karein taaki database sync ho jaye
      thunkAPI.dispatch(getAllPosts()); 
      
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data);
    }
  }
);

// GET ALL COMMENTS FIX
export const getAllComments = createAsyncThunk(
  "post/getAllComments",
  async (postData, thunkAPI) => {
    try {
      const response = await postClientServer.get("/get_comments", {

        params: { post_id: postData.post_id } 
      });
      return {
        comments: response.data.comments, 
        post_id: postData.post_id,
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data);
    }
  }
);

/* ================= POST COMMENT (FIXED & SYNCED) ================= */
export const postComment = createAsyncThunk(
  "post/postComment",
  async (commentData, thunkAPI) => {
    try {
      const response = await postClientServer.post("/comment", {

        token: localStorage.getItem("token"),
        post_id: commentData.post_id,
        commentBody: commentData.body,
      });

      // 🔥 FIXED: Comment aate hi list ko refresh karo taaki sabko dikhe
      thunkAPI.dispatch(getAllComments({ post_id: commentData.post_id }));

      return response.data; 
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data);
    }
  }
);

/* ================= DELETE COMMENT ACTION (FIXED) ================= */
export const deleteComment = createAsyncThunk(
  "post/deleteComment",
  async (data, thunkAPI) => {
    try {
      const response = await postClientServer.delete("/delete_comment", {

        // Axios delete mein params query string bhejta hai
        params: {
          token: localStorage.getItem("token"),
          comment_id: data.comment_id
        }
      });

      // 🔥 Delete successful hone par list ko refresh karein
      if (data.post_id) {
        thunkAPI.dispatch(getAllComments({ post_id: data.post_id }));
      }
      
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data);
    }
  }
);
