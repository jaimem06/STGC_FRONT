import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ENDPOINTS } from "@/lib/endpoints";

interface RoleOut {
  id: string;
  name: string;
  description: string | null;
}

export type UserStatus = "ACTIVO" | "INACTIVO" | "SUSPENDIDO" | "PENDIENTE";

interface UserOut {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  identifier: string | null;
  phone_number: string | null;
  status: UserStatus;
  role: RoleOut;
}

interface AuthState {
  user: UserOut | null;
  token: string | null;
  setAuth: (user: UserOut, token: string) => void;
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
          const { api } = await import("@/lib/auth-service");
          const response = await api.get(ENDPOINTS.AUTH.ME);
          set({ user: response.data });
        } catch (error) {
          // Handle or ignore error silently for production
        }
      },
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          // Use a more Next.js friendly way if possible, but window.location.href works for hard reset
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
