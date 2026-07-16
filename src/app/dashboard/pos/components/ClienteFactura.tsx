"use client";

import { usePosStore } from "@/store/posStore";
import { FileText, UserRound } from "lucide-react";

interface ClienteFacturaProps {
  /** Errores de validación campo → mensaje (los calcula el contenedor al confirmar). */
  errors?: Record<string, string>;
  /** Notifica cualquier cambio para que el contenedor limpie sus errores. */
  onChange?: () => void;
}

/**
 * Selector del tipo de venta para la factura: Consumidor Final (sin datos) o
 * factura con datos del cliente (nombre, apellido y cédula/RUC). El estado vive
 * en el store del POS, así que Cart y CheckoutModal quedan sincronizados.
 */
export default function ClienteFactura({ errors = {}, onChange }: ClienteFacturaProps) {
  const {
    facturaConDatos, setFacturaConDatos,
    clienteNombre, clienteApellido, clienteCedula, setCliente,
  } = usePosStore();

  const tabClass = (active: boolean) =>
    `flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
      active
        ? "bg-surface text-primary shadow-sm"
        : "text-on-surface-variant hover:text-on-surface"
    }`;

  const inputClass = (hasError: boolean) =>
    `w-full text-sm px-3 py-2 rounded-xl bg-surface-container-lowest border outline-none transition-colors ${
      hasError
        ? "border-error focus:border-error focus:ring-1 focus:ring-error/20"
        : "border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary/20"
    }`;

  const cambiarModo = (conDatos: boolean) => {
    if (conDatos !== facturaConDatos) {
      setFacturaConDatos(conDatos);
      onChange?.();
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1 p-1 bg-surface-container rounded-xl">
        <button type="button" onClick={() => cambiarModo(false)} className={tabClass(!facturaConDatos)}>
          <UserRound className="w-3.5 h-3.5" /> Consumidor Final
        </button>
        <button type="button" onClick={() => cambiarModo(true)} className={tabClass(facturaConDatos)}>
          <FileText className="w-3.5 h-3.5" /> Factura con datos
        </button>
      </div>

      {facturaConDatos ? (
        <div className="space-y-2 animate-fade-in">
          <div>
            <input
              type="text"
              placeholder="Nombres"
              autoComplete="off"
              className={inputClass(!!errors.nombre)}
              value={clienteNombre}
              onChange={(e) => { setCliente(e.target.value, clienteApellido, clienteCedula); onChange?.(); }}
            />
            {errors.nombre && <p className="text-[11px] font-medium text-error mt-1">{errors.nombre}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="text"
                placeholder="Apellidos"
                autoComplete="off"
                className={inputClass(!!errors.apellido)}
                value={clienteApellido}
                onChange={(e) => { setCliente(clienteNombre, e.target.value, clienteCedula); onChange?.(); }}
              />
              {errors.apellido && <p className="text-[11px] font-medium text-error mt-1">{errors.apellido}</p>}
            </div>
            <div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Cédula / RUC"
                autoComplete="off"
                maxLength={13}
                className={inputClass(!!errors.cedula)}
                value={clienteCedula}
                onChange={(e) => {
                  setCliente(clienteNombre, clienteApellido, e.target.value.replace(/\D/g, "").slice(0, 13));
                  onChange?.();
                }}
              />
              {errors.cedula && <p className="text-[11px] font-medium text-error mt-1">{errors.cedula}</p>}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-on-surface-variant font-medium px-1">
          La factura se emitirá a nombre de <span className="font-bold text-on-surface">Consumidor Final</span>, sin datos del cliente.
        </p>
      )}
    </div>
  );
}
