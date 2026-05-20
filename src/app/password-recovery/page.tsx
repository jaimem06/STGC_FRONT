"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Input from "@/components/Input";
import { toast } from "sonner";

export default function RecoveryPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/auth/password-recovery", { email });
      setSuccess(true);
      toast.success("Enlace enviado correctamente");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/50 backdrop-blur-xl rounded-[40px] shadow-2xl p-10 text-center border border-outline-variant/10 animate-fade-in-up">
          <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="font-headline text-3xl font-extrabold text-primary mb-3">¡Correo Enviado!</h1>
          <p className="font-body text-on-surface-variant mb-8 text-sm leading-relaxed">
            Si el correo <strong>{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña en breve.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-primary text-on-primary font-headline font-bold py-4 rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-95"
          >
            VOLVER AL LOGIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/50 backdrop-blur-xl rounded-[40px] shadow-2xl border border-outline-variant/10 overflow-hidden animate-fade-in-up">
        <div className="p-10">
          <button
            onClick={() => router.push("/login")}
            className="text-secondary hover:text-primary flex items-center gap-2 mb-8 transition-colors font-label text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft size={16} /> Volver
          </button>

          <h1 className="font-headline text-3xl font-extrabold text-primary mb-3">Recuperar Acceso</h1>
          <p className="font-body text-on-surface-variant mb-10 text-sm leading-relaxed">
            Ingresa tu correo institucional para recibir las instrucciones de restablecimiento.
          </p>

          <form onSubmit={handleRecovery} className="space-y-8">
            <Input
              label="Correo Electrónico"
              icon={Mail}
              type="email"
              required
              placeholder="ejemplo@terroir.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold py-4 rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <LoadingSpinner size={20} />
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
