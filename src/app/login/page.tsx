"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/auth-service";
import { ENDPOINTS } from "@/lib/endpoints";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/lib/notifications";
import LoadingSpinner from "@/components/LoadingSpinner";
import Input from "@/components/Input";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

import { getDefaultRoute } from "@/lib/rbac";
import { LoginSchema } from "@/lib/schemas";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const { setAuth, fetchMe } = useAuthStore();

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validation = LoginSchema.safeParse({ email, password });
    if (!validation.success) {
      const nextErrors: { email?: string; password?: string } = {};

      for (const issue of validation.error.issues) {
        const field = issue.path[0];
        if (field === "email" || field === "password") {
          nextErrors[field] = issue.message;
        }
      }

      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const response = await api.post(ENDPOINTS.AUTH.LOGIN, { email, password });
      
      const { access_token, user: userFromResponse } = response.data;
      
      // Guardar token primero para que fetchMe pueda usarlo
      setAuth(userFromResponse, access_token);
      
      let currentUser = userFromResponse;

      // Si la respuesta no trae el usuario o el rol, lo buscamos con /me antes de redirigir
      if (!currentUser?.role?.name) {
        const fetchedUser = await fetchMe();
        currentUser = fetchedUser ?? useAuthStore.getState().user;
      }

      if (!currentUser?.role?.name) {
        throw new Error("No se pudo determinar el rol del usuario autenticado");
      }

      // Iniciamos fase de redirección
      setIsRedirecting(true);
      toast.success("¡Bienvenido de nuevo!");
      
      const roleName = currentUser?.role?.name;
      const destination = getDefaultRoute(roleName);
      
      // Redirigir inmediatamente. No quitamos el loader.
      router.replace(destination);
    } catch (err: any) {
      console.error("Login error:", err);
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
      // Solo en caso de error volvemos a mostrar el formulario
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-secondary-container/30 relative">
      {/* 
        LOGICA PROFESIONAL: El loader cubre toda la pantalla si se está autenticando o redirigiendo.
        Esto evita que el usuario vea el formulario de nuevo mientras Next.js carga la nueva página.
      */}
      {(loading || isRedirecting) && (
        <div className="fixed inset-0 z-[100] bg-surface flex items-center justify-center animate-in fade-in duration-300">
          <LoadingSpinner 
            size={52}
            message={isRedirecting ? "Cargando tu panel de control..." : "Autenticando..."} 
          />
        </div>
      )}
      
      <div className={`min-h-screen flex flex-col md:flex-row overflow-hidden transition-opacity duration-500 ${isRedirecting ? 'opacity-0' : 'opacity-100'}`}>
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
          <form noValidate onSubmit={handleLogin} className="space-y-4 max-w-sm">
            <div className="space-y-4">
              <Input
                label="Correo Electrónico"
                icon={Mail}
                type="email"
                placeholder="ejemplo@terroir.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((current) => ({ ...current, email: undefined }));
                  }
                }}
                error={fieldErrors.email}
              />

              <div className="relative">
                <Input
                  label="Contraseña"
                  icon={Lock}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((current) => ({ ...current, password: undefined }));
                    }
                  }}
                  error={fieldErrors.password}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-outline hover:text-primary transition-colors focus:outline-none"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
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
                disabled={loading || isRedirecting}
              >
                {loading ? "Verificando..." : "Iniciar Sesión"}
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
