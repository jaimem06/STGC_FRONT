"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import CompactInput from "@/components/CompactInput";
import { Mail, Lock } from "lucide-react";

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
      
      // Pequeño retraso para asegurar que el estado se persista en móviles antes de navegar
      setTimeout(() => {
        router.push("/dashboard/users");
      }, 500);
    } catch (err: any) {
      console.error("Error capturado en login:", err);
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
    <div className="min-h-screen bg-surface selection:bg-secondary-container/30">
      <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
        {/* Left Column: Hero Editorial Imagery (Web) / Top Section (Mobile) */}
        <div className="relative w-full md:w-1/2 lg:w-3/5 h-[353px] md:h-screen overflow-hidden">
          <img
            alt="The Terroir Editorial Hero"
            className="absolute inset-0 w-full h-full object-cover object-center grayscale-[20%] sepia-[10%] contrast-110 transition-transform duration-[10s] hover:scale-105"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0O2HINoPNDmTDpTqaRGAFRdQczkOZ89NRfmAzWfOYhEo-BePNBBTtXKz1r9pqPZjNXAoKImt9quKxUU1VPRKbX7cVAhbluztY9FWPCbBTFRsGdR-qoIgiJCwlbEgUEr0yaHEDE6YBMBU6Otmb24lp-OzjshaTL03awkyJtWV7wZhIqk5jYcl1PEPW9bfQooFwNBqNn9wLdhT5ffg6AkxCqE1bHigAuM_Nk3UCb1xinWaOA3YWxruCjwRjXsKii2eW-hfpiuWem1eb"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-surface"></div>
          
          {/* Branding Overlay for Mobile */}
          <div className="absolute top-0 left-0 w-full p-8 md:hidden bg-gradient-to-b from-black/40 to-transparent">
            <h1 className="font-headline text-2xl font-extrabold text-white tracking-[0.2em] uppercase animate-fade-in-up">
              Tierra Fértil <span className="font-light">Sistema STGC</span>
            </h1>
          </div>
        </div>

        {/* Right Column: Login Interface */}
        <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center px-6 py-6 md:px-12 lg:px-16 bg-surface backdrop-blur-xl border-l border-white/10">
          {/* Header Section */}
          <header className="mb-6 space-y-2">
            <div className="hidden md:block">
              <h1 className="font-headline text-5xl md:text-5xl lg:text-6xl font-extrabold text-primary tracking-tighter leading-[0.85] mb-4 animate-fade-in-up stagger-1">
                <span className="block">STGC</span>
                <span className="block font-light text-primary/80 text-3xl md:text-4xl lg:text-5xl my-1">Cafetería</span>
                <span className="block">Tierra Fértil.</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 animate-fade-in-up stagger-2">
              <span className="h-px w-8 bg-primary/40"></span>
              <p className="font-label text-[10px] md:text-xs uppercase tracking-[0.2em] text-secondary font-semibold">
                Gestión de Origen & Calidad
              </p>
            </div>
          </header>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 max-w-sm">
            <div className="space-y-4">
              <CompactInput
                label="Correo Electrónico"
                icon={Mail}
                type="email"
                required
                placeholder="ejemplo@terroir.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="relative">
                <CompactInput
                  label="Contraseña"
                  icon={Lock}
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="mt-1 text-right">
                  <button
                    type="button"
                    onClick={() => router.push("/password-recovery")}
                    className="font-body text-[10px] md:text-xs text-secondary hover:text-primary transition-colors duration-300 decoration-secondary/30 underline-offset-4 underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2 animate-fade-in-up stagger-5">
              <button
                className="w-full bg-gradient-to-br from-primary to-primary/80 text-on-primary py-3 rounded-xl font-headline font-bold text-base hover:shadow-xl hover:shadow-primary/30 active:scale-[0.97] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-2"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size={20} />
                ) : (
                  "Iniciar Sesión"
                )}

              </button>
            </div>

            {/* Footer Meta - Centered and Compact */}
            <footer className="pt-4 opacity-40 text-center">
              <p className="font-body text-[9px] md:text-[10px] text-on-surface-variant">
                © 2026 STGC Tierra Fértil. Todos los derechos reservados.
              </p>
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
}
