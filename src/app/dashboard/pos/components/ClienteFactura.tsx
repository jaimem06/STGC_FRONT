"use client";

import { useEffect, useRef, useState } from "react";
import { usePosStore } from "@/store/posStore";
import { FileText, UserRound, Loader2, AlertTriangle } from "lucide-react";
import { posService, ClienteSugerido } from "@/lib/pos-service";

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
 *
 * Al tipear, busca clientes ya facturados antes (por cédula o nombre) para que
 * el cajero pueda reutilizar sus datos con un clic en vez de volver a digitarlos.
 */
export default function ClienteFactura({ errors = {}, onChange }: ClienteFacturaProps) {
  const {
    facturaConDatos, setFacturaConDatos,
    clienteNombre, clienteApellido, clienteCedula, setCliente,
  } = usePosStore();

  const [sugerencias, setSugerencias] = useState<ClienteSugerido[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Evita que, justo tras elegir una sugerencia, la búsqueda se dispare de
  // nuevo con esos mismos datos y reabra el desplegable.
  const ignorarProximaBusqueda = useRef(false);

  useEffect(() => {
    if (!facturaConDatos) {
      setSugerencias([]);
      return;
    }
    if (ignorarProximaBusqueda.current) {
      ignorarProximaBusqueda.current = false;
      return;
    }

    // Busca por lo que tenga contenido más útil: cédula si ya se tipearon al
    // menos 2 dígitos; si no, nombre o apellido.
    const query = clienteCedula.trim().length >= 2
      ? clienteCedula.trim()
      : clienteNombre.trim().length >= 2
        ? clienteNombre.trim()
        : clienteApellido.trim();

    if (query.length < 2) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setBuscando(true);
      setErrorBusqueda(false);
      try {
        const resultados = await posService.buscarClientes(query);
        setSugerencias(resultados);
        setMostrarSugerencias(resultados.length > 0);
      } catch (error) {
        // Se distingue de "sin resultados": si la búsqueda realmente falla
        // (p. ej. el servicio no responde), el cajero debe saberlo en vez de
        // asumir silenciosamente que el cliente no existe.
        console.error("Error buscando clientes:", error);
        setSugerencias([]);
        setErrorBusqueda(true);
      } finally {
        setBuscando(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facturaConDatos, clienteNombre, clienteApellido, clienteCedula]);

  const seleccionarCliente = (cliente: ClienteSugerido) => {
    ignorarProximaBusqueda.current = true;
    setCliente(cliente.nombre, cliente.apellido, cliente.cedula);
    setMostrarSugerencias(false);
    onChange?.();
  };

  /** Oculta el desplegable con un pequeño retraso para no tragarse el click de una sugerencia. */
  const ocultarSugerenciasConRetraso = () => {
    setTimeout(() => setMostrarSugerencias(false), 150);
  };

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
        <div className="relative space-y-2 animate-fade-in">
          <div>
            <input
              type="text"
              placeholder="Nombres"
              autoComplete="off"
              className={inputClass(!!errors.nombre)}
              value={clienteNombre}
              onChange={(e) => { setCliente(e.target.value, clienteApellido, clienteCedula); onChange?.(); }}
              onFocus={() => setMostrarSugerencias(sugerencias.length > 0)}
              onBlur={ocultarSugerenciasConRetraso}
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
                onFocus={() => setMostrarSugerencias(sugerencias.length > 0)}
                onBlur={ocultarSugerenciasConRetraso}
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
                onFocus={() => setMostrarSugerencias(sugerencias.length > 0)}
                onBlur={ocultarSugerenciasConRetraso}
              />
              {errors.cedula && <p className="text-[11px] font-medium text-error mt-1">{errors.cedula}</p>}
            </div>
          </div>

          {/* Sugerencias de clientes ya facturados antes, para reutilizar sus datos sin volver a digitarlos. */}
          {buscando && (
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-on-surface-variant px-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Buscando clientes...
            </p>
          )}
          {!buscando && errorBusqueda && (
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-error px-1">
              <AlertTriangle className="w-3 h-3 shrink-0" /> No se pudo buscar clientes. Revisa tu conexión e inténtalo de nuevo.
            </p>
          )}
          {mostrarSugerencias && sugerencias.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border border-outline-variant/60 bg-surface shadow-lg overflow-hidden">
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Clientes ya facturados
              </p>
              {sugerencias.map((cliente) => (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => seleccionarCliente(cliente)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-primary/5 transition-colors"
                >
                  <span className="min-w-0 truncate">
                    <span className="font-bold text-sm text-on-surface">{cliente.nombre} {cliente.apellido}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-on-surface-variant tabular-nums">{cliente.cedula}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-on-surface-variant font-medium px-1">
          La factura se emitirá a nombre de <span className="font-bold text-on-surface">Consumidor Final</span>, sin datos del cliente.
        </p>
      )}
    </div>
  );
}
