"use client";

import Input from "@/components/Input";
import Select from "@/components/Select";
import { TipoElementoEnum, EstadoInventarioEnum, UnidadMedidaEnum } from "@/lib/schemas";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ProductFormFieldsProps {
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  isEdit?: boolean;
}

/**
 * Campos compartidos entre creación y edición de productos/insumos.
 * HU023: en modo edición se habilita `fecha_caducidad` (antes bloqueada).
 */
export default function ProductFormFields({
  register,
  errors,
  watch,
  setValue,
  isEdit = false,
}: ProductFormFieldsProps) {
  return (
    <div className="grid grid-cols-12 gap-x-3 gap-y-3">
      {/* Fila 1 */}
      <div className={!isEdit ? "col-span-8" : "col-span-12"}>
        <Input label="Nombre" required {...register("nombre")} error={errors.nombre?.message} />
      </div>
      {!isEdit && (
        <div className="col-span-4">
          <Input label="SKU" required {...register("sku")} error={errors.sku?.message} />
        </div>
      )}

      {/* Fila 2 */}
      <div className={!isEdit ? "col-span-4" : "col-span-6"}>
        <Input label="Precio" type="number" step="0.01" required {...register("precio", { valueAsNumber: true })} error={errors.precio?.message} />
      </div>
      <div className={!isEdit ? "col-span-4" : "col-span-6"}>
        <Input label="Mínimo" type="number" step="1" required {...register("stock_minimo", { valueAsNumber: true })} error={errors.stock_minimo?.message} />
      </div>
      {!isEdit && (
        <div className="col-span-4">
          <Select label="Categoría" required value={watch("tipo") || ""} options={TipoElementoEnum.options.map((t) => ({ value: t, label: t.replace("_", " ") }))} onValueChange={(val) => setValue("tipo", val)} error={errors.tipo?.message} />
        </div>
      )}

      {/* Fila 3 */}
      <div className={!isEdit ? "col-span-4" : "col-span-6"}>
        <Select label="Unidad" required value={watch("unidad_medida") || ""} options={UnidadMedidaEnum.options.map((u) => ({ value: u, label: u }))} onValueChange={(val) => setValue("unidad_medida", val)} error={errors.unidad_medida?.message} />
      </div>
      {!isEdit && (
        <div className="col-span-4">
          <Select label="Estado" required value={watch("estado") || "DISPONIBLE"} options={EstadoInventarioEnum.options.map((e) => ({ value: e, label: e.replace("_", " ") }))} onValueChange={(val) => setValue("estado", val)} error={errors.estado?.message} />
        </div>
      )}
      {!isEdit && (
        <div className="col-span-4">
          <Input label="C. Inicial" type="number" step="0.01" {...register("cantidad_inicial", { valueAsNumber: true })} error={errors.cantidad_inicial?.message} />
        </div>
      )}

      {/* Fila 4 */}
      <div className={!isEdit ? "col-span-4" : "col-span-6"}>
        <Input label="Caducidad" type="date" {...register("fecha_caducidad")} error={errors.fecha_caducidad?.message} />
      </div>
      
      <div className={!isEdit ? "col-span-8" : "col-span-12"}>
        <div className="relative mt-[2px]">
          <textarea className={`w-full bg-white border rounded-xl outline-none transition-all font-label text-sm font-bold shadow-sm placeholder:font-medium placeholder:text-outline/50 focus:ring-2 p-2.5 resize-none leading-tight ${errors.descripcion ? "border-error focus:border-error focus:ring-error/10" : "border-outline-variant/20 focus:border-primary/30 focus:ring-primary/10"}`} rows={2} placeholder="Descripción del producto..." {...register("descripcion")} />
          <div className="flex justify-between items-center -mt-1">
            {errors.descripcion ? <p className="text-[9px] font-bold text-error ml-1">{errors.descripcion.message}</p> : <span />}
            <span className="text-[9px] font-bold text-outline mr-1">{(watch("descripcion") || "").length}/250</span>
          </div>
        </div>
      </div>
    </div>
  );
}
