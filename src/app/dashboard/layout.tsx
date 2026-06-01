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
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // Only fetch if we don't have a user yet
        if (!user) {
          await fetchMe();
        }
        
        // After fetching user (or if we already had one), check permissions
        // We use a small delay or wait for the store update if needed
        setLoading(false);
      } catch (error) {
        logout();
      }
    };

    checkAuth();
  }, [router, logout, fetchMe, user]);

  // Handle route protection after loading user
  useEffect(() => {
    if (!loading && user) {
      const roleName = user?.role?.name;
      const hasAccess = canAccess(roleName, pathname);
      
      console.log(`LAYOUT DEBUG - Path: "${pathname}", Role: "${roleName}", HasAccess: ${hasAccess}`);
      
      if (!hasAccess) {
        const destination = getDefaultRoute(roleName);
        console.log(`LAYOUT DEBUG - ACCESS DENIED. Redirecting to: "${destination}"`);
        router.push(destination);
      }
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return <LoadingSpinner size={52} fullPage />;
  }

  // Double check access before rendering children to prevent flickering of restricted content
  const currentRoleName = user?.role?.name;
  if (user && !canAccess(currentRoleName, pathname)) {
    console.log("LAYOUT DEBUG - Blocking render and showing redirect spinner");
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
