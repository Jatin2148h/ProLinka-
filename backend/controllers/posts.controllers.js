import Profile from "../models/profile.model.js";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";            // already used
import Comment from "../models/comments.model.js";     // already used
import bcrypt from "bcryptjs";                         // kept (NO REMOVE)

/* =================================================
   ADD (SAFE): default export to avoid ESM edge cases
================================================== */
export default {};

/* ================= ACTIVE CHECK ================= */
export const activeCheck = async (req, res) => {
  return res.status(200).json({
    message: "RUNNING",
  });
};

/* ================= CREATE POST ================= */
export const createPost = async (req, res) => {
  const { token } = req.body;
  try {
    // FIX: mongoose syntax already correct
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // FIX: correct Post creation
    const post = new Post({
      userId: user._id,
      body: req.body.body,
      media: req.file ? req.file.path : null,
      fileType: req.file ? req.file.mimetype.split("/") [0] : null,
      likes: 0,
      createdAt: new Date(),
    });

    await post.save();

    return res.status(201).json({
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating post",
      error: error.message,
    });
  }
};

/* ================= GET ALL POSTS ================= */
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("userId", "username profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Posts fetched successfully",
      posts,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching posts",
      error: error.message,
    });
  }
};

/* ================= DELETE POST ================= */
export const deletePost = async (req, res) => {
  const { post_id, token } = req.body;
  try {
    const user = await User.findOne({ token: token }).select("_id");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const post = await Post.findOne({
      _id: post_id,
      userId: user._id,
    });

    if (!post) {
      return res.status(404).json({
        message: "Post not found or unauthorized",
      });
    }

    await Post.deleteOne({ _id: post_id });

    return res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error deleting post",
      error: error.message,
    });
  }
};

/* ================= COMMENT POST ================= */
/* ================= COMMENT POST (FINAL FIX) ================= */
export const commentPost = async (req, res) => {
  const { post_id, token, commentBody } = req.body;
  try {
    const user = await User.findOne({ token: token });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Comment Save Karo
    const comment = new Comment({
      userId: user._id,
      postId: post_id,
      body: commentBody,
      createdAt: new Date(),
    });
    await comment.save();

    // 2. 🔥 CRITICAL STEP: Save karne ke baad user info ke saath 'populate' karke wapas bhejo
    const fullComment = await Comment.findById(comment._id)
      .populate("userId", "name username profilePicture");

    return res.status(200).json({
      message: "Comment added successfully",
      comment: fullComment, // Ab isme name/photo dono hain
    });
  } catch (error) {
    return res.status(500).json({ message: "Error", error: error.message });
  }
};


/* ================= GET COMMENTS BY POST (100% WORKING) ================= */
/* ================= GET COMMENTS BY POST ================= */
export const get_comments_by_post = async (req, res) => {
  const { post_id } = req.query; // ✅ Frontend params bhej raha hai toh query se uthayein

  try {
    if (!post_id) return res.status(400).json({ message: "Post ID required" });

    const comments = await Comment.find({ postId: post_id })
      .populate("userId", "name username profilePicture") 
      .sort({ createdAt: -1 });

    return res.status(200).json({ comments });
  } catch (error) {
    return res.status(500).json({ message: "Error", error: error.message });
  }
};
/* ================= DELETE COMMENT ================= */
/* ================= DELETE COMMENT (REPAIRED) ================= */
export const delete_comment_of_user = async (req, res) => {
  // Query parameters se data nikaalein
  const { comment_id, token } = req.query;

  try {
    // 1. User check karein token se
    const user = await User.findOne({ token: token }).select("_id");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Comment dhoondein aur check karein ki kya ye isi user ka hai
    const comment = await Comment.findOne({
      _id: comment_id,
      userId: user._id, // Authorization check
    });

    if (!comment) {
      return res.status(404).json({ 
        message: "Comment not found or you don't have permission to delete this." 
      });
    }

    // 3. Delete karein
    await Comment.deleteOne({ _id: comment_id });

    return res.status(200).json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error deleting comment",
      error: error.message,
    });
  }
};

/* ================= LIKE POST ================= */
/* ================= LIKE POST (FIXED & SYNCED) ================= */
export const increment_likes = async (req, res) => {
  const { post_id } = req.body;
  try {
    // 1. Database mein 'likes' field ko $inc (increment) se +1 badhayein
    // { new: true } lagane se humein updated document wapas milta hai
    const updatedPost = await Post.findByIdAndUpdate(
      post_id,
      { $inc: { likes: 1 } }, 
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    // 2. Updated likes ke saath response bhejein
    return res.status(200).json({
      message: "Post liked successfully",
      likes: updatedPost.likes, // Ye total likes hain jo sabko dikhenge
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error liking post",
      error: error.message,
    });
  }
};