import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    likes: {
      type: Number,
      default: 0,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    // ❌ original typo kept (NO REMOVE)
    updateAt: {
      type: Date,
      default: Date.now,
    },

    // ✅ ADD: correct field used by mongoose / controllers
    updatedAt: {
      type: Date,
      default: Date.now,
    },

    media: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
    fileType: {
      type: String,
      default: "",
    },

    // ✅ ADD: comment system support (future-safe)
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  {
    // ✅ ADD: auto timestamps (safe + no conflict)
    timestamps: true,
  }
);

const Post = mongoose.model("Post", postSchema);
export default Post;
