"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import CompactInput from "@/components/CompactInput";
import { toast } from "sonner";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      toast.error("Token de recuperación no encontrado. Solicita uno nuevo.");
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", { 
        token, 
        new_password: newPassword 
      });
      setSuccess(true);
      toast.success("¡Contraseña actualizada!");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : "El enlace es inválido o ha expirado");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md w-full bg-white/50 backdrop-blur-xl rounded-[40px] shadow-2xl p-10 text-center border border-outline-variant/10 animate-fade-in-up">
        <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="font-headline text-3xl font-extrabold text-primary mb-3">¡Éxito!</h1>
        <p className="font-body text-on-surface-variant mb-8 text-sm leading-relaxed">
          Tu contraseña ha sido actualizada. Ahora puedes volver a entrar al sistema.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="w-full bg-primary text-on-primary font-headline font-bold py-4 rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-95"
        >
          IR AL LOGIN
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full bg-white/50 backdrop-blur-xl rounded-[40px] shadow-2xl border border-outline-variant/10 overflow-hidden animate-fade-in-up">
      <div className="p-10">
        <h1 className="font-headline text-3xl font-extrabold text-primary mb-3">Nueva Contraseña</h1>
        <p className="font-body text-on-surface-variant mb-10 text-sm leading-relaxed">
          Crea una clave segura para proteger tu acceso a la plataforma STGC.
        </p>

        <form onSubmit={handleReset} className="space-y-6">
          <CompactInput
            label="Nueva Contraseña"
            icon={Lock}
            type="password"
            required
            disabled={!token}
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <CompactInput
            label="Confirmar Contraseña"
            icon={Lock}
            type="password"
            required
            disabled={!token}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold py-4 rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <LoadingSpinner size={20} />
            ) : (
              "REABLECER CONTRASEÑA"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Suspense fallback={<LoadingSpinner size={52} fullPage />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
