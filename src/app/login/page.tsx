"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Lock, Mail, Loader2, Coffee } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("Iniciando login para:", email);

    try {
      const response = await api.post("/auth/login", { email, password });
      console.log("Respuesta de login exitosa:", response.data);
      const { access_token, user } = response.data;
      
      setAuth(user, access_token);
      toast.success("¡Bienvenido de nuevo!");
      router.push("/dashboard/users");
    } catch (err: any) {
      console.error("Error capturado en login:", err);
      if (err.response) {
        console.log("Datos del error (response.data):", err.response.data);
        console.log("Estado del error (response.status):", err.response.status);
      }

      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      switch (status) {
        case 401:
          toast.error("Credenciales inválidas. Verifica tu correo y contraseña.");
          break;
        case 403:
          toast.error("Usuario inactivo o suspendido. Contacta al administrador.");
          break;
        case 422:
          toast.error("Error de validación. Revisa los datos ingresados.");
          break;
        case 500:
          toast.error("Error interno del servidor. Intenta más tarde.");
          break;
        default:
          toast.error(detail || "Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-barium-yellow flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-marine-green">
        <div className="bg-marine-green p-8 text-center text-barium-yellow">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-deep-green rounded-full mb-4">
            <Coffee size={32} />
          </div>
          <h1 className="text-2xl font-bold">STGC Tierra Fértil</h1>
          <p className="opacity-80">Sistema de Trazabilidad y Gestión</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
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

          <div className="space-y-2">
            <label className="text-sm font-semibold text-deep-green flex items-center gap-2">
              <Lock size={16} /> Contraseña
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-marine-green focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => router.push("/password-recovery")}
              className="text-leather hover:text-sepia-e37 font-medium"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-marine-green hover:bg-deep-green text-barium-yellow font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "INICIAR SESIÓN"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
