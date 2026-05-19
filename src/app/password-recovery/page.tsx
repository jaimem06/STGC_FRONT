"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function RecoveryPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/password-recovery", { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-barium-yellow flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-marine-green">
          <CheckCircle2 className="mx-auto text-marine-green mb-4" size={64} />
          <h1 className="text-2xl font-bold text-deep-green mb-2">¡Correo Enviado!</h1>
          <p className="text-gray-600 mb-8">
            Si el correo <strong>{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-marine-green hover:bg-deep-green text-barium-yellow font-bold py-3 rounded-lg transition-colors"
          >
            VOLVER AL LOGIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-barium-yellow flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-marine-green">
        <div className="p-8">
          <button
            onClick={() => router.push("/login")}
            className="text-marine-green hover:text-deep-green flex items-center gap-2 mb-6 transition-colors font-medium"
          >
            <ArrowLeft size={18} /> Volver
          </button>

          <h1 className="text-2xl font-bold text-deep-green mb-2">Recuperar Contraseña</h1>
          <p className="text-gray-600 mb-8">
            Ingresa tu correo electrónico y te enviaremos un enlace para que puedas crear una nueva contraseña.
          </p>

          <form onSubmit={handleRecovery} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-deep-green flex items-center gap-2">
                <Mail size={16} /> Correo Electrónico
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-marine-green focus:border-transparent outline-none transition-all"
                placeholder="ejemplo@finca.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-marine-green hover:bg-deep-green text-barium-yellow font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <LoadingSpinner size={24} />
              ) : (
                "ENVIAR ENLACE"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
