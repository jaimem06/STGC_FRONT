"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuthStore();
  const { isSidebarCollapsed } = useUIStore();
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
  }, [user, router, logout]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-surface">
        <LoadingSpinner size={52} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      <Sidebar />
      {/* Main Content Area - Adapts to sidebar collapse state */}
      <div className={`transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "md:pl-20" : "md:pl-64"}`}>
        <main className="min-h-screen pt-16 p-4 md:pt-8 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
