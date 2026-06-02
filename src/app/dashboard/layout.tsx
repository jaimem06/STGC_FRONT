"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import LoadingSpinner from "@/components/LoadingSpinner";
import { canAccess, getDefaultRoute } from "@/lib/rbac";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, fetchMe } = useAuthStore();
  const { isSidebarCollapsed } = useUIStore();
  const [loading, setLoading] = useState(!user);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      
      if (!token) {
        router.push("/login");
        return;
      }

      if (!user) {
        try {
          await fetchMe();
        } catch (error) {
          logout();
          return;
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router, logout, fetchMe, user]);

  // Handle route protection
  useEffect(() => {
    if (!loading && user) {
      const roleName = user?.role?.name;
      if (!canAccess(roleName, pathname)) {
        const destination = getDefaultRoute(roleName);
        if (pathname !== destination) {
          router.push(destination);
        }
      }
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return <LoadingSpinner size={52} fullPage />;
  }

  // Double check access before rendering children
  const currentRoleName = user?.role?.name;
  if (user && !canAccess(currentRoleName, pathname)) {
    return <LoadingSpinner size={52} fullPage message="Redirigiendo..." />;
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
