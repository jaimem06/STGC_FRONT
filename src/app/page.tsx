"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard/users");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-surface gap-4">
      <LoadingSpinner size={52} />
      <p className="text-primary font-bold animate-pulse">Redirigiendo a STGC Tierra Fértil...</p>
    </div>
  );
}
