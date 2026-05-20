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

  return <LoadingSpinner size={52} fullPage />;
}
