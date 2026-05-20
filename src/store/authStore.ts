import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  identifier?: string;
  phone_number?: string;
  suspended_from?: string;
  suspended_until?: string;
  role: {
    name: string;
    permissions: Array<{ name: string }>;
  };
  status: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  fetchMe: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
        }
        set({ user, token });
      },
      fetchMe: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const { api } = await import("@/lib/api");
          const response = await api.get("/auth/me");
          set({ user: response.data });
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // If it's a 401, the interceptor will handle logout
        }
      },
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
        set({ user: null, token: null });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
