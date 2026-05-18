"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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
    <div className="h-screen w-full flex flex-col items-center justify-center bg-barium-yellow gap-4">
      <Loader2 className="animate-spin text-marine-green" size={48} />
      <p className="text-deep-green font-bold animate-pulse">Redirigiendo a STGC Tierra Fértil...</p>
    </div>
  );
}
