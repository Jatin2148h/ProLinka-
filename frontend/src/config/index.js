import axios from "axios";

// Production: Render backend URL | Development: Localhost
export const BASE_URL = typeof window !== "undefined" && window.location.hostname === "localhost" 
  ? "http://localhost:9090" 
  : "https://prolinka-1.onrender.com"





// User API client (for user routes)
export const clientServer = axios.create({
  baseURL:BASE_URL + "/api/users",
  withCredentials: true,
});

// Post API client (for post routes)
export const postClientServer = axios.create({
  baseURL:BASE_URL + "/api/posts",
  withCredentials: true,
});
