"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { usePosStore } from "@/store/posStore";
import { CreditCard, Banknote, Landmark, X, Receipt } from "lucide-react";
import { ENDPOINTS } from "@/lib/endpoints";
import { toast } from "@/lib/notifications";

interface CheckoutModalProps {
  total: number;
  onClose: () => void;
}

export default function CheckoutModal({ total, onClose }: CheckoutModalProps) {
  const { checkout, loading } = usePosStore();
  const [metodoPago, setMetodoPago] = useState<string>("EFECTIVO");
  const [montoRecibido, setMontoRecibido] = useState<string>(total.toFixed(2));
  const [successData, setSuccessData] = useState<{ pedidoId?: string; vuelto?: number } | null>(null);

  const handleCheckout = async () => {
    const monto = parseFloat(montoRecibido);
    if (isNaN(monto) || monto < total) {
      toast.error("El monto recibido no es válido o es insuficiente.");
      return;
    }
    const result = await checkout(metodoPago, monto);
    if (result.success) {
      setSuccessData(result);
    }
  };

  const methods = [
    { id: "EFECTIVO", name: "Efectivo", icon: Banknote },
    { id: "TARJETA_CREDITO", name: "Crédito", icon: CreditCard },
    { id: "TARJETA_DEBITO", name: "Débito", icon: CreditCard },
    { id: "TRANSFERENCIA", name: "Transferencia", icon: Landmark },
  ];

  if (successData) {
    return (
      <Dialog.Root open={true} onOpenChange={onClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-surface rounded-2xl shadow-xl z-50 p-6 flex flex-col items-center">
            <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8 text-secondary" />
            </div>
            <Dialog.Title className="text-2xl font-display font-bold text-primary mb-2">¡Pago Exitoso!</Dialog.Title>
            
            {successData.vuelto !== undefined && successData.vuelto > 0 && (
              <div className="bg-surface-container-high w-full p-4 rounded-xl text-center mb-6">
                <span className="block text-sm text-on-surface-variant mb-1">Vuelto a entregar</span>
                <span className="block text-3xl font-display font-bold text-primary">${successData.vuelto.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex gap-3 w-full">
              <a
                href={`${ENDPOINTS.POS_SERVICE.BASE_URL}/${ENDPOINTS.POS_SERVICE.PEDIDOS.COMPROBANTE(successData.pedidoId!)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-outline hover:bg-outline-variant text-white hover:text-on-surface text-center py-2.5 rounded-lg font-medium transition-colors"
                onClick={onClose}
              >
                Imprimir
              </a>
              <button
                onClick={onClose}
                className="flex-1 bg-primary hover:bg-primary-container text-on-primary py-2.5 rounded-lg font-medium transition-colors"
              >
                Nuevo Pedido
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface rounded-2xl shadow-xl z-50 p-6 flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-display font-bold text-primary">Procesar Pago</Dialog.Title>
            <Dialog.Close className="text-outline hover:text-error transition-colors">
              <X className="w-6 h-6" />
            </Dialog.Close>
          </div>

          <div className="bg-primary-container/10 border border-primary-container p-4 rounded-xl text-center mb-6">
            <span className="text-sm font-medium text-primary">Total a Cobrar</span>
            <div className="text-4xl font-display font-bold text-primary mt-1">${total.toFixed(2)}</div>
          </div>

          <div className="mb-6">
            <label className="text-sm font-semibold text-on-surface-variant mb-2 block">Método de Pago</label>
            <div className="grid grid-cols-2 gap-3">
              {methods.map((m) => {
                const Icon = m.icon;
                const isSelected = metodoPago === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMetodoPago(m.id);
                      if (m.id !== "EFECTIVO") setMontoRecibido(total.toFixed(2));
                    }}
                    className={`flex items-center gap-2 p-3 border rounded-xl transition-colors ${
                      isSelected 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-outline-variant hover:border-outline text-on-surface'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {metodoPago === "EFECTIVO" && (
            <div className="mb-6">
              <label className="text-sm font-semibold text-on-surface-variant mb-2 block">Monto Recibido</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">$</span>
                <input
                  type="number"
                  min={total}
                  step="0.01"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-surface-container text-lg font-medium rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              {parseFloat(montoRecibido) > total && (
                <div className="mt-2 text-sm text-secondary font-medium">
                  Vuelto calculado: ${(parseFloat(montoRecibido) - total).toFixed(2)}
                </div>
              )}
            </div>
          )}

          <div className="mt-auto pt-4 flex gap-3">
            <Dialog.Close className="flex-1 py-3 font-medium text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">
              Cancelar
            </Dialog.Close>
            <button
              onClick={handleCheckout}
              disabled={loading || parseFloat(montoRecibido) < total}
              className="flex-[2] bg-primary hover:bg-primary-container text-on-primary py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? "Procesando..." : "Confirmar Pago"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
