"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { usePosStore } from "@/store/posStore";
import { Store, X } from "lucide-react";
import Confirm from "@/components/Confirm";
import { useRouter } from "next/navigation";

interface RegisterModalProps {
  type: "OPEN" | "CLOSE";
  onClose: () => void;
}

export default function RegisterModal({ type, onClose }: RegisterModalProps) {
  const { abrirCaja, cerrarCaja, loading } = usePosStore();
  const [monto, setMonto] = useState("");
  const router = useRouter();

  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; message: string; action: () => void } | null>(null);

  const handleSubmit = async () => {
    const amount = parseFloat(monto);
    if (isNaN(amount) || amount < 0) return;

    const confirmMsg = type === "OPEN" 
      ? "¿Seguro que deseas aperturar la caja con este monto?"
      : "¿Seguro que deseas cerrar la caja con este monto de efectivo físico?";
    
    setConfirmState({
      open: true,
      title: type === "OPEN" ? "Apertura de Caja" : "Cierre de Caja",
      message: confirmMsg,
      action: async () => {
        if (type === "OPEN") {
          const success = await abrirCaja(amount);
          if (success) onClose();
        } else {
          const success = await cerrarCaja(amount);
          if (success) onClose();
        }
      }
    });
  };

  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-surface rounded-2xl shadow-xl z-50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${type === 'OPEN' ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>
                <Store className="w-6 h-6" />
              </div>
              <Dialog.Title className="text-xl font-display font-bold text-on-surface">
                {type === "OPEN" ? "Apertura de Caja" : "Cierre de Caja"}
              </Dialog.Title>
            </div>
            {type === "CLOSE" && (
              <Dialog.Close className="text-outline hover:text-error transition-colors">
                <X className="w-6 h-6" />
              </Dialog.Close>
            )}
          </div>

          <p className="text-sm text-on-surface-variant mb-6">
            {type === "OPEN" 
              ? "Ingresa el monto base en efectivo con el que inicias tu turno."
              : "Ingresa el monto total en efectivo que tienes físicamente en caja para realizar el cuadre."
            }
          </p>

          <div className="mb-6">
            <label className="text-sm font-semibold text-on-surface-variant mb-2 block">
              {type === "OPEN" ? "Monto Inicial" : "Monto Físico"}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-surface-container-lowest text-lg font-medium rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            {type === "CLOSE" && (
              <Dialog.Close className="flex-1 py-3 font-medium text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">
                Cancelar
              </Dialog.Close>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading || !monto}
              className={`flex-[2] py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex justify-center items-center ${
                type === 'OPEN' 
                ? 'bg-secondary hover:bg-secondary-container text-on-secondary hover:text-on-surface' 
                : 'bg-error hover:bg-error-container text-on-error hover:text-error'
              }`}
            >
              {loading ? "Procesando..." : type === "OPEN" ? "Abrir Caja" : "Cerrar Caja"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      {confirmState && (
        <Confirm
          open={confirmState.open}
          onOpenChange={(open) => !open && setConfirmState(null)}
          title={confirmState.title}
          description={confirmState.message}
          confirmText="CONFIRMAR"
          variant="warning"
          onConfirm={() => {
            setConfirmState(null);
            confirmState.action();
          }}
        />
      )}
    </Dialog.Root>
  );
}
