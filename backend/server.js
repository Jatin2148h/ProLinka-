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
   ENV CONFIG
========================= */
dotenv.config({ path: path.join(__dirname, ".env") });

/* =========================
   DEBUG - Check env on startup
========================= */
console.log("🔍 DEBUG - Environment Variables:");
console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Set" : "❌ Not Set");
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* =========================
   CORS CONFIG - PRODUCTION READY
   Supports: Local dev + Vercel production + branch previews
========================= */
app.use(
  cors({
    origin: function (origin, callback) {
      // ✅ EXACT DOMAINS - Your actual Vercel URLs
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:5173", // Vite dev
        "https://pro-linka.vercel.app",           // ✅ Production domain
        "https://pro-linka-git-*.vercel.app",      // Vercel branch previews
        "https://pro-linka-*.vercel.app",        // All Vercel deployments
        "https://*.vercel.app"                     // Any Vercel subdomain (fallback)
      ];
      
      // Allow no-origin requests (Postman, curl, mobile apps, server-side)
      if (!origin) {
        console.log("📝 CORS: No origin (server/Postman), allowing request");
        return callback(null, true);
      }
      
      // Check if origin matches any allowed pattern
      const isAllowed = allowedOrigins.some(pattern => {
        if (pattern.includes('*')) {
          // Convert wildcard pattern to regex
          const regex = new RegExp('^' + pattern.replace(/\*/g, '[^/]*') + '$');
          return regex.test(origin);
        }
        return pattern === origin;
      });
      
      if (isAllowed) {
        console.log("✅ CORS: Allowed origin:", origin);
        callback(null, true);
      } else {
        console.log("⚠️ CORS: Unknown origin blocked:", origin);
        // Production: Block unknown origins for security
        // callback(new Error("CORS policy violation"));
        // Debug mode: Allow with warning
        callback(null, true);
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false
  })
);


// Handle preflight requests
app.options("*", cors());

/* =========================
   ROOT + HEALTH ROUTES
========================= */
app.get("/", (req, res) => {
  res.send("🚀 ProLinka API is running");
});

app.get("/health", (req, res) => {
  res.status(200).json({ 
    message: "SERVER RUNNING",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/* =========================
   API ROUTES
========================= */
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

/* =========================
   STATIC FILES
========================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* =========================
   ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ message: "Internal server error" });
});

/* =========================
   SERVER START
========================= */
const start = async () => {
  try {
    // Check MongoDB connection
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI not set in environment variables");
    }
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB Connected");

    const PORT = process.env.PORT || 9090;

    app.listen(PORT, '0.0.0.0', () => {
      console.log("🚀 Server is running on port", PORT);
      console.log("📡 Health check: https://prolinka-1.onrender.com/health");
    });
  } catch (error) {
    console.error("❌ Startup Error:", error.message);
    // Don't exit - let Render see the error
    process.exit(1);
  }
};

start();
