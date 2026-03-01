import { Router } from "express";
import {
  activeCheck,
  createPost,
  getAllPosts,
  deletePost,
  commentPost,
  get_comments_by_post,
  delete_comment_of_user,
  increment_likes,
} from "../controllers/posts.controllers.js";

const router = Router();

/* ================= CLOUDINARY UPLOAD ================= */
import { uploadPost } from "../config/cloudinary.js";

// DEBUG: Log when upload middleware is used
console.log("🔍 DEBUG - Posts Routes Loaded, uploadPost middleware ready");

/* ================= ROUTES ================= */

// Get all posts - must be BEFORE the root "/" route
router.get("/posts", getAllPosts);


// Create post with Cloudinary upload - with DEBUG
router.post("/post", (req, res, next) => {
  console.log("🔍 DEBUG - POST /post route hit");
  console.log("🔍 DEBUG - Content-Type:", req.headers['content-type']);
  console.log("🔍 DEBUG - Has file?", !!req.file);
  next();
}, (req, res, next) => uploadPost.single("media")(req, res, next), (req, res, next) => {
  console.log("🔍 DEBUG - After upload middleware");
  console.log("🔍 DEBUG - File object:", req.file);
  if (req.file) {
    console.log("🔍 DEBUG - File path:", req.file.path);
    console.log("🔍 DEBUG - File filename:", req.file.filename);
    console.log("🔍 DEBUG - File originalname:", req.file.originalname);
  }
  next();
}, createPost);








// Delete post
router.delete("/post", deletePost);

// Comment on post
router.post("/comment", commentPost);

// Get comments of post
router.get("/get_comments", get_comments_by_post);

// Delete comment
router.delete("/delete_comment", delete_comment_of_user);

// ❌ original kept (NO REMOVE)
router.post("/increment__post_likes", increment_likes);

// ✅ ADD: correct & frontend-friendly alias
router.post("/increment_post_likes", increment_likes);

// ✅ ADD: health / active check (MUST be after parameterized routes)
router.get("/", activeCheck);

export default router;
