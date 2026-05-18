"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      setError("Token de recuperación no encontrado. Solicita uno nuevo.");
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/reset-password", { 
        token, 
        new_password: newPassword 
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "El enlace es inválido o ha expirado");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-marine-green">
        <CheckCircle2 className="mx-auto text-marine-green mb-4" size={64} />
        <h1 className="text-2xl font-bold text-deep-green mb-2">¡Contraseña Cambiada!</h1>
        <p className="text-gray-600 mb-8">
          Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar sesión con tus nuevas credenciales.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="w-full bg-marine-green hover:bg-deep-green text-barium-yellow font-bold py-3 rounded-lg transition-colors"
        >
          IR AL LOGIN
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-marine-green">
      <div className="p-8">
        <h1 className="text-2xl font-bold text-deep-green mb-2">Nueva Contraseña</h1>
        <p className="text-gray-600 mb-8">
          Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.
        </p>

        <form onSubmit={handleReset} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm flex gap-3 items-start">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-deep-green flex items-center gap-2">
              <Lock size={16} /> Nueva Contraseña
            </label>
            <input
              type="password"
              required
              disabled={!token}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-marine-green focus:border-transparent outline-none transition-all disabled:bg-gray-100"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-deep-green flex items-center gap-2">
              <Lock size={16} /> Confirmar Contraseña
            </label>
            <input
              type="password"
              required
              disabled={!token}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-marine-green focus:border-transparent outline-none transition-all disabled:bg-gray-100"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-marine-green hover:bg-deep-green text-barium-yellow font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
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
    <div className="min-h-screen bg-barium-yellow flex items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="animate-spin text-marine-green" size={48} />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
