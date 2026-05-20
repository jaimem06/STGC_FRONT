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
  const { user, logout, fetchMe } = useAuthStore();
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

      try {
        await fetchMe();
        setLoading(false);
      } catch (error) {
        logout();
      }
    };

    checkAuth();
  }, [router, logout, fetchMe]);

  if (loading) {
    return <LoadingSpinner size={52} fullPage />;
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
