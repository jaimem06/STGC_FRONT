"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { PasswordResetRequestSchema, PasswordResetRequestInput } from "@/lib/schemas";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import Input from "@/components/Input";
import { Mail, ArrowLeft, Send } from "lucide-react";

export default function PasswordRecoveryPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const { register, handleSubmit } = useForm<PasswordResetRequestInput>();

  const onSubmit = async (data: PasswordResetRequestInput) => {
    const result = PasswordResetRequestSchema.safeParse(data);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      await api.post("auth/password-recovery", data);
      setSent(true);
      toast.success("Si el correo existe, recibirás un enlace pronto.");
    } catch (err: any) {
      toast.error("Ocurrió un error. Intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {loading && <LoadingSpinner fullPage message="Enviando correo..." />}
      
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-xl border border-outline-variant/20 p-8 md:p-12 animate-fade-in-up">
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-2 text-outline hover:text-primary transition-colors mb-8 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Volver</span>
        </button>

        <div className="mb-8">
          <h1 className="font-headline text-3xl font-extrabold text-primary tracking-tight mb-2">Recuperar Acceso</h1>
          <p className="font-body text-sm text-on-surface-variant font-medium opacity-70 leading-relaxed">
            {sent 
              ? "Revisa tu bandeja de entrada. Te hemos enviado las instrucciones para restablecer tu contraseña."
              : "Ingresa tu correo corporativo y te enviaremos un enlace para restablecer tu contraseña."
            }
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Correo Corporativo"
              icon={Mail}
              type="email"
              placeholder="usuario@tierrafertil.com"
              {...register("email")}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary text-on-primary rounded-2xl font-headline font-bold text-base flex items-center justify-center gap-3 shadow-xl shadow-primary/10 hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all duration-300 disabled:opacity-50"
            >
              ENVIAR ENLACE
              <Send size={18} />
            </button>
          </form>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="w-full h-14 bg-surface-container text-primary rounded-2xl font-headline font-bold text-base flex items-center justify-center hover:bg-surface-container-high transition-all"
          >
            VOLVER AL LOGIN
          </button>
        )}
      </div>
    </div>
  );
}
