import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default: "default.jpg",
    },
    token: {
  type: String,
  default: "",
},
tokenExpiry: {
  type: Date,
},


    // ✅ ADD (account status control)
    isActive: {
      type: Boolean,
      default: true,
    },

    // ✅ ADD (connections feature support)
    connections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ✅ ADD (incoming connection requests)
    connectionRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ConnectionRequest",
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
    },

    // ✅ ADD (update tracking)
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // ✅ ADD (mongoose auto timestamps – safe)
    timestamps: true,
  }
);

export default mongoose.model("User", UserSchema);
