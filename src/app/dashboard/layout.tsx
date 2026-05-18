"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, setAuth, logout } = useAuthStore();
  const [loading, setLoading] = useState(!user);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      if (!user) {
        try {
          setLoading(false);
        } catch (error) {
          logout();
        }
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [user, router, setAuth, logout]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-barium-yellow">
        <Loader2 className="animate-spin text-marine-green" size={48} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
