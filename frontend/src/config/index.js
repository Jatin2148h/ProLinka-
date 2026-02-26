import axios from "axios";

// ============================================
// PRODUCTION AXIOS CONFIG - PRO-LINKA
// ============================================

// Your actual production URLs
const PRODUCTION_API_URL = "https://prolinka-1.onrender.com";
const LOCAL_DEV_URL = "http://localhost:9090";

// Check if we're in development
const isLocalhost = typeof window !== "undefined" && 
  (window.location.hostname === "localhost" || 
   window.location.hostname === "127.0.0.1" ||
   window.location.hostname.includes("localhost"));

// Use local for dev, production for live
export const BASE_URL = isLocalhost ? LOCAL_DEV_URL : PRODUCTION_API_URL;

// Debug log (only in browser console)
if (typeof window !== "undefined") {
  console.log("🔍 API Config - BASE_URL:", BASE_URL);
  console.log("🔍 API Config - Is Localhost:", isLocalhost);
}

// ============================================
// AXIOS CLIENT - WITH CREDENTIALS
// ============================================
// 
// CRITICAL for cookies/auth:
// - withCredentials: true is REQUIRED
// - Backend CORS must have credentials: true
// - No wildcard origin "*" in backend CORS
// ============================================

// User API client
export const clientServer = axios.create({
  baseURL: BASE_URL + "/api/users",
  withCredentials: true,  // ✅ Required for authentication
  timeout: 60000,         // 60s timeout (Render free tier is slow to wake)
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

// Post API client  
export const postClientServer = axios.create({
  baseURL: BASE_URL + "/api/posts",
  withCredentials: true,  // ✅ Required for authentication
  timeout: 60000,         // 60s timeout
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

// ============================================
// RESPONSE INTERCEPTOR - DEBUGGING
// ============================================
clientServer.interceptors.response.use(
  response => {
    console.log("✅ API Success:", response.config.url, response.status);
    return response;
  },
  error => {
    if (error.code === "ECONNABORTED") {
      console.error("⏱️ Timeout - Render may be sleeping. Wait 30-60s and retry.");
    } else if (error.code === "ERR_NETWORK") {
      console.error("🌐 Network Error - Check if backend is running.");
    } else {
      console.error("🔴 API Error:", error.message);
    }
    return Promise.reject(error);
  }
);
