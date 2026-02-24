import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import postRoutes from "./routes/posts.routes.js";
import userRoutes from "./routes/user.routes.js";

/* =========================
   __dirname for ES Modules
========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   ENV CONFIG (Local Dev)
========================= */
dotenv.config({ path: path.join(__dirname, ".env") });


/* =========================
   DEBUG (Optional - Remove later)
========================= */
console.log("🔍 DEBUG - Environment Variables:");
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Not Set");
console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ Not Set");

/* =========================
   APP INIT
========================= */
const app = express();

/* =========================
   MIDDLEWARES
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: ["http://localhost:3000"], // frontend URL add kar sakta hai baad me
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors());

/* =========================
   ROOT + HEALTH ROUTES
========================= */
app.get("/", (req, res) => {
  res.send("🚀 ProLinka API is running");
});

app.get("/health", (req, res) => {
  res.status(200).json({ message: "SERVER RUNNING" });
});

/* =========================
   API ROUTES
========================= */
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);

/* =========================
   STATIC FILES
========================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   SERVER START
========================= */
const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");

    const PORT = process.env.PORT || 9090;

    app.listen(PORT, () => {
      console.log("🚀 Server is running on port", PORT);
    });
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
  }
};

start();
