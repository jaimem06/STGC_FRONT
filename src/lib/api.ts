import axios from "axios";

let API_URL = process.env.NEXT_PUBLIC_API_URL || "https://auth-service-w3lo.onrender.com/api/";
if (!API_URL.endsWith("/")) {
  API_URL += "/";
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add the token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor to handle errors (e.g., 401 logout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        
        // Only redirect if NOT already on login/recovery/reset pages
        const publicPaths = ["/login", "/password-recovery", "/reset-password"];
        if (!publicPaths.some(path => window.location.pathname.startsWith(path))) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);
