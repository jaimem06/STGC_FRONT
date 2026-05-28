import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

export const applyInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      let token = localStorage.getItem("token")?.trim();
      
      if (!token) {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          try {
            const parsed = JSON.parse(authStorage);
            token = parsed.state?.token?.trim();
          } catch (e) {
            // Silently fail in production
          }
        }
      }

      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;

      if (status === 401 && typeof window !== "undefined" && !(error.config as any)?._skipAuthInterceptor) {
        const publicPages = ["/login", "/password-recovery", "/reset-password"];
        const pathname = window.location.pathname;

        if (!publicPages.some(page => pathname.startsWith(page))) {
          localStorage.removeItem("token");
          localStorage.removeItem("auth-storage");
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }
  );
};

export const createInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  });
  applyInterceptors(instance);
  return instance;
};
