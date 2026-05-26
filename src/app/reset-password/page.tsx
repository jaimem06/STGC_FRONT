"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { api } from "@/lib/auth-service";
import { ENDPOINTS } from "@/lib/endpoints";
import { PasswordResetConfirmSchema, PasswordResetConfirmInput } from "@/lib/schemas";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import Input from "@/components/Input";
import { Lock, Save, AlertCircle } from "lucide-react";

function ResetPasswordForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { register, handleSubmit, setValue } = useForm<PasswordResetConfirmInput>();

  useEffect(() => {
    if (token) {
      setValue("token", token);
    }
  }, [token, setValue]);

  const onSubmit = async (data: PasswordResetConfirmInput) => {
    const result = PasswordResetConfirmSchema.safeParse(data);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      await api.post(ENDPOINTS.AUTH.RESET_PASSWORD, data);
      toast.success("Contraseña actualizada con éxito.");
      router.push("/login");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Error al restablecer la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-error-container/20 text-error rounded-full mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="font-headline text-2xl font-black text-primary">Token Inválido</h2>
        <p className="font-body text-sm text-on-surface-variant max-w-xs mx-auto">
          El enlace de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo.
        </p>
        <button
          onClick={() => router.push("/password-recovery")}
          className="w-full h-12 bg-primary text-on-primary rounded-xl font-bold text-xs uppercase tracking-widest mt-4"
        >
          SOLICITAR NUEVO ENLACE
        </button>
      </div>
    );
  }

  return (
    <>
      {loading && <LoadingSpinner fullPage message="Actualizando contraseña..." />}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="mb-8">
          <h1 className="font-headline text-3xl font-extrabold text-primary tracking-tight mb-2">Nueva Contraseña</h1>
          <p className="font-body text-sm text-on-surface-variant font-medium opacity-70">
            Crea una contraseña segura para proteger tu cuenta.
          </p>
        </div>

        <input type="hidden" {...register("token")} />
        
        <Input
          label="Nueva Contraseña"
          icon={Lock}
          type="password"
          placeholder="••••••••"
          {...register("new_password")}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-primary text-on-primary rounded-2xl font-headline font-bold text-base flex items-center justify-center gap-3 shadow-xl shadow-primary/10 hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all duration-300 disabled:opacity-50"
        >
          ACTUALIZAR CONTRASEÑA
          <Save size={18} />
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-xl border border-outline-variant/20 p-8 md:p-12 animate-fade-in-up">
        <Suspense fallback={<LoadingSpinner size={40} />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
