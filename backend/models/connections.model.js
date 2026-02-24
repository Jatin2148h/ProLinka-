import mongoose from "mongoose";

/* ================= CONNECTION SCHEMA ================= */
const connectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    connectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/* ================= SAFE MODEL EXPORT ================= */
const Connection =
  mongoose.models.Connection ||
  mongoose.model("Connection", connectionSchema);

export default Connection;
