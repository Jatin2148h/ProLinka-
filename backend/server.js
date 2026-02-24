import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ FIX: Load .env from parent directory (root folder) - .env is in ProLinka/ not ProLinka/backend/
dotenv.config({ path: path.join(__dirname, '..', '.env') });


// DEBUG: Check if env variables are loaded
console.log("🔍 DEBUG - Environment Variables:");
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Not Set");
console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ Not Set");

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import postRoutes from "./routes/posts.routes.js";
import userRoutes from "./routes/user.routes.js";



const app = express();

/* =========================
   BODY PARSER (REQUIRED)
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   CORS FIX (MAIN BUG)
========================= */
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

/* =========================
   PREFLIGHT FIX
========================= */
app.options("*", cors());

/* =========================
   HEALTH CHECK (ADD)
========================= */
app.get("/health", (req, res) => {
  return res.status(200).json({ message: "SERVER RUNNING" });
});

/* =========================
   ROUTES WITH BASE PATH
========================= */
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);


/* =========================
   STATIC FILES (IMPROVED)
========================= */

// ❌ original kept
app.use(express.static("uploads"));

// ✅ ADD: explicit uploads path (frontend safe)
// Note: __dirname is already defined at the top of the file
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


/* =========================
   SERVER START
========================= */
const start = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || // ✅ ADD (preferred)
        "mongodb+srv://agrawaljatin157_db_user:XMq7PbAI0uMO5lca@prolinka.wcwhmzh.mongodb.net/ProLinka"
    );

    console.log("MongoDB Connected");

    app.listen(9090, () => {
      console.log("Server is running on port 9090");


    });
  } catch (error) {
    console.log("MongoDB connection error:", error.message);
  }
};

start();
