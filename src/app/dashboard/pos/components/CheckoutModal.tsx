"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { usePosStore, PagoInput } from "@/store/posStore";
import { CreditCard, Banknote, Landmark, X, Receipt, Wallet, Smartphone } from "lucide-react";
import { ENDPOINTS } from "@/lib/endpoints";
import { toast } from "@/lib/notifications";

interface CheckoutModalProps {
  total: number;
  onClose: () => void;
}

const PAYMENT_METHODS = [
  { id: "EFECTIVO", name: "Efectivo", icon: Banknote },
  { id: "TARJETA_CREDITO", name: "Tarjeta Crédito", icon: CreditCard },
  { id: "TARJETA_DEBITO", name: "Tarjeta Débito", icon: CreditCard },
  { id: "TRANSFERENCIA", name: "Transferencia", icon: Landmark },
  { id: "DE_UNA", name: "De Una", icon: Smartphone },
  { id: "AHORITA", name: "Ahorita", icon: Wallet },
];

const ELECTRONIC_METHODS = ["TRANSFERENCIA", "TARJETA_CREDITO", "TARJETA_DEBITO", "DE_UNA", "AHORITA"];

export default function CheckoutModal({ total, onClose }: CheckoutModalProps) {
  const { checkout, loading } = usePosStore();
  const [pagos, setPagos] = useState<PagoInput[]>([{ metodoPago: "EFECTIVO", monto: total }]);
  const [successData, setSuccessData] = useState<{ pedidoId?: string } | null>(null);

  const sumaMontos = pagos.reduce((acc, p) => acc + (p.monto || 0), 0);
  const diferencia = Math.round((total - sumaMontos) * 100) / 100;
  const isComplete = diferencia === 0 && pagos.length > 0;

  const addPago = (metodoPago: string) => {
    if (pagos.some(p => p.metodoPago === metodoPago)) {
      toast.warning("Ese método de pago ya está agregado");
      return;
    }
    const restante = Math.round((total - sumaMontos) * 100) / 100;
    setPagos([...pagos, { metodoPago, monto: restante > 0 ? restante : 0, referencia: "" }]);
  };

  const updatePago = (index: number, field: string, value: any) => {
    const nuevos = [...pagos];
    (nuevos[index] as any)[field] = field === "monto" ? parseFloat(value) || 0 : value;
    setPagos(nuevos);
  };

  const removePago = (index: number) => {
    setPagos(pagos.filter((_, i) => i !== index));
  };

  const handleCheckout = async () => {
    if (!isComplete) {
      toast.error("La suma de los montos debe coincidir exactamente con el total");
      return;
    }

    // Validate electronic methods have referencia (HU009-CA5)
    for (const pago of pagos) {
      if (ELECTRONIC_METHODS.includes(pago.metodoPago) && !pago.referencia?.trim()) {
        toast.error(`Debe registrar el número de comprobante para ${PAYMENT_METHODS.find(m => m.id === pago.metodoPago)?.name}`);
        return;
      }
    }

    const result = await checkout(pagos);
    if (result.success) {
      setSuccessData(result);
    }
  };

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
            <p className="text-sm text-on-surface-variant mb-6 text-center">El comprobante fue generado con éxito</p>

            <div className="flex gap-3 w-full">
              <a
                href={`${ENDPOINTS.POS_SERVICE.BASE_URL}${ENDPOINTS.POS_SERVICE.PEDIDOS.COMPROBANTE(successData.pedidoId!)}`}
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

  const usedMethods = pagos.map(p => p.metodoPago);
  const availableMethods = PAYMENT_METHODS.filter(m => !usedMethods.includes(m.id));

  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface rounded-2xl shadow-xl z-50 p-6 flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-display font-bold text-primary">Procesar Pago</Dialog.Title>
            <Dialog.Close className="text-outline hover:text-error transition-colors">
              <X className="w-6 h-6" />
            </Dialog.Close>
          </div>

          <div className="bg-primary-container/10 border border-primary-container p-4 rounded-xl text-center mb-4">
            <span className="text-sm font-medium text-primary">Total a Cobrar</span>
            <div className="text-4xl font-display font-bold text-primary mt-1">${total.toFixed(2)}</div>
          </div>

          {/* Payment Methods List */}
          <div className="space-y-3 mb-4 max-h-[50vh] overflow-auto">
            {pagos.map((pago, index) => {
              const method = PAYMENT_METHODS.find(m => m.id === pago.metodoPago)!;
              const Icon = method.icon;
              const isElectronic = ELECTRONIC_METHODS.includes(pago.metodoPago);

              return (
                <div key={index} className="bg-surface-container-low rounded-xl p-3 border border-outline-variant">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">{method.name}</span>
                    </div>
                    {pagos.length > 1 && (
                      <button onClick={() => removePago(index)} className="text-error text-xs hover:underline">Eliminar</button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-on-surface-variant">Monto</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={pago.monto || ""}
                        onChange={(e) => updatePago(index, "monto", e.target.value)}
                        className="w-full p-2 text-sm rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface"
                      />
                    </div>
                    {isElectronic && (
                      <div className="flex-[2]">
                        <label className="text-xs text-on-surface-variant">N° Comprobante</label>
                        <input
                          type="text"
                          value={pago.referencia || ""}
                          onChange={(e) => updatePago(index, "referencia", e.target.value)}
                          placeholder="Obligatorio"
                          className="w-full p-2 text-sm rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Payment Method */}
          {availableMethods.length > 0 && (
            <div className="mb-4">
              <label className="text-sm font-semibold text-on-surface-variant mb-2 block">Agregar método de pago</label>
              <div className="flex flex-wrap gap-2">
                {availableMethods.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => addPago(m.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-outline-variant rounded-lg hover:border-primary hover:text-primary transition-colors font-medium"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Balance Indicator */}
          <div className={`p-3 rounded-xl mb-4 text-sm font-medium ${isComplete ? "bg-success-container/20 text-success" : "bg-error/10 text-error"}`}>
            <div className="flex justify-between">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Ingresado:</span>
              <span>${sumaMontos.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold mt-1 pt-1 border-t border-inherit">
              <span>{diferencia <= 0 ? "Pendiente:" : "Excede:"}</span>
              <span>${Math.abs(diferencia).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Dialog.Close className="flex-1 py-3 font-medium text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">
              Cancelar
            </Dialog.Close>
            <button
              onClick={handleCheckout}
              disabled={loading || !isComplete}
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
