import axios from "axios";

// ============================================
// PRODUCTION FIX: Proper BASE_URL configuration
// ============================================
// 
// Issue: window.location.hostname check fails on Vercel SSR
// Fix: Use explicit environment variable or fallback to production Render URL
//
// For Vercel: Set NEXT_PUBLIC_API_URL in Vercel dashboard
// For local dev: Use localhost
// ============================================

// Check if we're in development (explicit localhost check)
const isLocalhost = typeof window !== "undefined" && 
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

// Use environment variable if set, otherwise use production Render URL
// For local development: http://localhost:9090
// For production: https://prolinka-1.onrender.com (your Render URL)
export const BASE_URL = isLocalhost 
  ? "http://localhost:9090" 
  : (process.env.NEXT_PUBLIC_API_URL || "https://prolinka-1.onrender.com");

console.log("🔍 API Config - Current BASE_URL:", BASE_URL);
console.log("🔍 API Config - Is Localhost:", isLocalhost);

// ============================================
// AXIOS CLIENT CONFIG
// ============================================
// 
// CRITICAL: withCredentials: true requires:
// 1. Backend CORS must have credentials: true
// 2. Backend CORS must NOT use wildcard origin "*"
// 3. Frontend and Backend must be on same secure context OR proper CORS
// ============================================

// User API client (for user routes)
export const clientServer = axios.create({
  baseURL: BASE_URL + "/api/users",
  withCredentials: true,  // Required for cookies/auth
  timeout: 30000,          // 30 second timeout for Render cold starts
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

// Post API client (for post routes)
export const postClientServer = axios.create({
  baseURL: BASE_URL + "/api/posts",
  withCredentials: true,  // Required for cookies/auth
  timeout: 30000,         // 30 second timeout for Render cold starts
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

// ============================================
// RESPONSE INTERCEPTOR (Optional - for debugging)
// ============================================
clientServer.interceptors.response.use(
  response => response,
  error => {
    console.error("🔴 API Error:", error.message);
    if (error.code === "ECONNABORTED") {
      console.error("Timeout - Render may be sleeping. Try again in 30-60 seconds.");
    }
    return Promise.reject(error);
  }
);
