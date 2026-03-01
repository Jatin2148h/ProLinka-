import axios from "axios";

// ============================================
// PRODUCTION AXIOS CONFIG - PRO-LINKA
// ============================================

// Environment-based configuration
// Priority: NEXT_PUBLIC_API_URL > auto-detect > fallback
const getBaseUrl = () => {
  // 1. Check for explicit environment variable (Vercel/Render)
  // This is the PRIMARY method for production
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 2. Auto-detect based on window location (client-side only)
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocal = hostname === "localhost" || 
                    hostname === "127.0.0.1" ||
                    hostname.includes("localhost");
    
    if (isLocal) {
      // Local development - use local backend
      return "http://localhost:9090";
    }
  }
  
  // 3. Production fallback - NO localhost references
  // Only use this if env var is not set (should be set in production!)
  return "http://localhost:9090";
};

export const BASE_URL = getBaseUrl();

// Static exports URL helper - works for both SSR and CSR
export const getUploadUrl = (path) => {
  if (!path) return "/default.jpg";
  if (path.startsWith('http')) return path;
  if (path === "default.jpg" || path === "/default.jpg") return "/default.jpg";
  return `${BASE_URL}/uploads/${path}`;
};

// Debug log (only in browser console)
if (typeof window !== "undefined") {
  console.log("🔍 API Config - BASE_URL:", BASE_URL);
  console.log("🔍 API Config - Environment:", process.env.NEXT_PUBLIC_API_URL ? "Production (env)" : "Auto-detect");
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
  baseURL: `${BASE_URL}/api/users`,
  withCredentials: true,  // ✅ Required for cookies/auth
  timeout: 60000,         // 60s timeout (Render free tier is slow to wake)
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

// Post API client  
export const postClientServer = axios.create({
  baseURL: `${BASE_URL}/api/posts`,
  withCredentials: true,  // ✅ Required for cookies/auth
  timeout: 60000,         // 60s timeout
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});


// ============================================
// RESPONSE INTERCEPTOR - DEBUGGING
// ============================================
const setupInterceptors = (client, name) => {
  client.interceptors.response.use(
    response => {
      console.log(`✅ ${name} Success:`, response.config.url, response.status);
      return response;
    },
    error => {
      if (error.code === "ECONNABORTED") {
        console.error(`⏱️ ${name} Timeout - Render may be sleeping. Wait 30-60s and retry.`);
      } else if (error.code === "ERR_NETWORK") {
        console.error(`🌐 ${name} Network Error - Check CORS/backend:`, error.message);
        console.error(`   Request URL: ${error.config?.url}`);
        console.error(`   Base URL: ${BASE_URL}`);
      } else if (error.response?.status === 401) {
        console.error(`🔒 ${name} Unauthorized - Token may be expired`);
      } else {
        console.error(`🔴 ${name} API Error:`, error.response?.data?.message || error.message);
      }
      return Promise.reject(error);
    }
  );
};

setupInterceptors(clientServer, "UserAPI");
setupInterceptors(postClientServer, "PostAPI");
