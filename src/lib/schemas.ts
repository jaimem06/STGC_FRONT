import { z } from "zod";

const validateEcuadorianId = (id: string) => {
  if (id.length !== 10) return false;
  const province = parseInt(id.substring(0, 2), 10);
  if (province < 1 || (province > 24 && province !== 30)) return false;
  const thirdDigit = parseInt(id.substring(2, 3), 10);
  if (thirdDigit >= 6) return false;

  const digits = id.split("").map(Number);
  const checkDigit = digits.pop()!;
  
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let val = digits[i];
    if (i % 2 === 0) {
      val *= 2;
      if (val > 9) val -= 9;
    }
    sum += val;
  }
  
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  return calculatedCheckDigit === checkDigit;
};

const phoneRegex = /^(\+?[1-9]\d{1,14}|0\d{9})$/;
const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
const identifierRegex = /^[A-Z0-9]{6,15}$/i;

export const LoginSchema = z.object({
  email: z.string().email("Correo electrónico es requerido"),
  password: z.string()
   .min(8, 'Debe tener al menos 8 caracteres.')
   .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula.')
   .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula.')
   .regex(/\d/, 'Debe incluir al menos un número.')
   .regex(/[@$!%*?&]/, 'Debe incluir un carácter especial (@$!%*?&).')
   .regex(/^[A-Za-z\d@$!%*?&]+$/, 'Contiene caracteres no permitidos.'),
});

export const PasswordResetRequestSchema = z.object({
  email: z.string().email("Correo electrónico es requerido"),
});
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;

export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1, "Token es requerido"),
  new_password: z.string()
   .min(8, 'Debe tener al menos 8 caracteres.')
   .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula.')
   .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula.')
   .regex(/\d/, 'Debe incluir al menos un número.')
   .regex(/[@$!%*?&]/, 'Debe incluir un carácter especial (@$!%*?&).')
   .regex(/^[A-Za-z\d@$!%*?&]+$/, 'Contiene caracteres no permitidos.'),
});
export type PasswordResetConfirmInput = z.infer<typeof PasswordResetConfirmSchema>;

export const UserCreateSchema = z.object({
  email: z.string().email("Correo electrónico es requerido"),
  password: z.string()
   .min(8, 'Debe tener al menos 8 caracteres.')
  .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula.')
  .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula.')
  .regex(/\d/, 'Debe incluir al menos un número.')
  .regex(/[@$!%*?&]/, 'Debe incluir un carácter especial (@$!%*?&).')
  .regex(/^[A-Za-z\d@$!%*?&]+$/, 'Contiene caracteres no permitidos.'),
  role_name: z.string().min(1, "El rol es requerido"),
  first_name: z.string()
    .min(1, "El nombre es requerido")
    .regex(nameRegex, "El nombre solo puede contener letras"),
  last_name: z.string()
    .min(1, "El apellido es requerido")
    .regex(nameRegex, "El apellido solo puede contener letras"),
  id_type: z.enum(["CEDULA", "PASAPORTE"]).default("CEDULA"),
  identifier: z.string()
    .min(1, "La identificación es requerida"),
  phone_number: z.string()
    .min(1, "El teléfono es requerido")
    .regex(phoneRegex, "Número Inválido"),
  status: z.enum(["ACTIVO", "INACTIVO", "SUSPENDIDO", "PENDIENTE"], {message: 'El rol seleccionado no es válido.' }).default("ACTIVO"),
}).superRefine((data, ctx) => {
  if (data.id_type === "CEDULA") {
    if (!validateEcuadorianId(data.identifier)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cédula Inválida",
        path: ["identifier"],
      });
    }
  } else if (data.id_type === "PASAPORTE") {
    if (!identifierRegex.test(data.identifier)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pasaporte Inválido (6-15 caracteres alfanuméricos)",
        path: ["identifier"],
      });
    }
  }
});

export const UserUpdateSchema = z.object({
  role_name: z.string().nullable().optional(),
  status: z.enum(["ACTIVO", "INACTIVO", "SUSPENDIDO", "PENDIENTE"]).nullable().optional(),
  email: z.string().email("Correo electrónico inválido").nullable().optional(),
  first_name: z.string()
    .min(1, "El nombre es requerido")
    .regex(nameRegex, "El nombre solo puede contener letras")
    .nullable().optional(),
  last_name: z.string()
    .min(1, "El apellido es requerido")
    .regex(nameRegex, "El apellido solo puede contener letras")
    .nullable().optional(),
  phone_number: z.string().regex(phoneRegex, "Número de teléfono inválido").nullable().optional(),
  password: z.string()
  .min(8, 'Debe tener al menos 8 caracteres.')
  .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula.')
  .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula.')
  .regex(/\d/, 'Debe incluir al menos un número.')
  .regex(/[@$!%*?&]/, 'Debe incluir un carácter especial (@$!%*?&).')
  .regex(/^[A-Za-z\d@$!%*?&]+$/, 'Contiene caracteres no permitidos.').nullable().optional(),
});

export type UserCreateInput = z.infer<typeof UserCreateSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;

// --- Inventory & Traceability Schemas ---

export const CalidadCafeEnum = z.enum(["ALTA", "MEDIA", "BAJA"]);
export const ClasificacionInsumoEnum = z.enum(["QUIMICO_FERTILIZANTE", "QUIMICO_FUNGICIDA", "ORGANICO"]);
export const EstadoInventarioEnum = z.enum([
  "DISPONIBLE",
  "AGOTADO",
  "STOCK_BAJO",
  "INACTIVO",
  "EN_TRANSITO",
  "BLOQUEADO",
  "CADUCADO",
], {
  required_error: "El estado del producto es obligatorio.",
  invalid_type_error: "El estado del producto no es válido. Los estados permitidos son: DISPONIBLE, AGOTADO, STOCK_BAJO, INACTIVO, EN_TRANSITO, BLOQUEADO y CADUCADO."
});
export const FaseCafeEnum = z.enum(["PULPA", "DESPULPADO", "SECADO", "TOSTADO", "MOLIDO"]);
export type FaseCafe = z.infer<typeof FaseCafeEnum>;
export const TipoElementoEnum = z.enum(["INSUMO", "PRODUCTO", "CAFE_PROCESADO"], {
  required_error: "La categoría es obligatoria.",
  invalid_type_error: "La categoría seleccionada no es válida. Las opciones permitidas son: PRODUCTO, INSUMO y CAFE PROCESADO."
});
export const TipoMovimientoEnum = z.enum(["ENTRADA", "SALIDA"]);
export const UnidadMedidaEnum = z.enum(["QUINTALES", "ARROBAS", "LIBRAS", "UNIDADES", "LITROS", "KILOGRAMOS"], {
  required_error: "La unidad de medida es obligatoria.",
  invalid_type_error: "La unidad de medida no es válida. Seleccione una de las opciones del catálogo: QUINTALES, ARROBAS, LIBRAS, UNIDADES, LITROS o KILOGRAMOS."
});
export const ModuloInventarioEnum = z.enum(["FINCA", "CAFETERIA"]);

// Base schema for extending
const BaseInventarioItemObject = z.object({
  sku: z.string({ required_error: "El SKU es obligatorio." })
    .min(1, "El SKU es obligatorio.")
    .length(6, "El SKU debe tener exactamente 6 caracteres.")
    .regex(/^[A-Z]{3}\d{3}$/, "El SKU debe tener 3 letras mayúsculas seguidas de 3 números."),
  nombre: z.string({ required_error: "El nombre del producto es obligatorio." })
    .min(1, "El nombre del producto es obligatorio.")
    .min(3, "El nombre debe tener entre 3 y 90 caracteres.")
    .max(90, "El nombre debe tener entre 3 y 90 caracteres."),
  descripcion: z.string({ required_error: "La descripción del producto es obligatoria." })
    .min(1, "La descripción del producto es obligatoria.")
    .min(20, "La descripción debe tener entre 20 y 250 caracteres.")
    .max(250, "La descripción debe tener entre 20 y 250 caracteres."),
  tipo: TipoElementoEnum,
  estado: EstadoInventarioEnum,
  unidad_medida: UnidadMedidaEnum,
  precio: z.number({ required_error: "El precio es obligatorio.", invalid_type_error: "El precio debe ser un número." })
    .refine(val => val !== 0, "El precio debe ser mayor a 0.")
    .refine(val => val > 0, "El precio no puede ser negativo.")
    .refine(val => val <= 10000, "El precio no puede superar 10000.")
    .refine((val) => {
      const str = val.toString();
      if (str.includes(".")) {
        return str.split(".")[1].length <= 2;
      }
      return true;
    }, "El precio solo puede tener hasta dos decimales."),
  fecha_caducidad: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "El formato de fecha debe ser AAAA-MM-DD.")
    .nullable()
    .optional()
    .or(z.literal("")),
  modulo: ModuloInventarioEnum,
  stock_minimo: z.number({ required_error: "El stock mínimo es obligatorio.", invalid_type_error: "El stock mínimo debe ser un número entero." })
    .min(0, "El stock mínimo no puede ser un número negativo.")
    .max(30, "El stock mínimo no puede superar 30.")
    .int("El stock mínimo debe ser un número entero."),
  codigo_trazabilidad: z.string().uuid().nullable().optional(),
  calidad: CalidadCafeEnum.nullable().optional(),
  fase_produccion: FaseCafeEnum.nullable().optional(),
});

const ExpiryDateRefinement = (data: { fecha_caducidad?: string | null }) => {
  if (!data.fecha_caducidad) return true;
  const expiryDate = new Date(data.fecha_caducidad);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiryDate >= today;
};

const ExpiryDateMessage = {
  message: "La fecha de caducidad no puede ser anterior a la fecha actual.",
  path: ["fecha_caducidad"],
};

export const CreateInventarioItemSchema = BaseInventarioItemObject.refine(
  ExpiryDateRefinement,
  ExpiryDateMessage
);

export const UpdateInventarioItemSchema = z.object({
  nombre: z.string().min(1).optional(),
  estado: EstadoInventarioEnum.optional(),
  precio: z.number().min(0).optional(),
  descripcion: z.string().nullable().optional(),
  stock_minimo: z.number().min(0).optional(),
  unidad_medida: UnidadMedidaEnum.optional(),
  fecha_caducidad: z.string().nullable().optional(),
});

export const UpdateEstadoSchema = z.object({
  estado: EstadoInventarioEnum,
});

export const InventarioItemSchema = BaseInventarioItemObject.extend({
  id: z.string().uuid(),
  cantidad: z.number(),
  is_deleted: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const MovimientoStockSchema = z.object({
  id: z.string().uuid().optional(),
  item_id: z.string().uuid("ID de ítem inválido"),
  lote_id: z.string().uuid().nullable().optional(),
  cantidad: z.number().positive("La cantidad debe ser positiva"),
  tipo: TipoMovimientoEnum,
  fecha: z.string().optional(),
  motivo: z.string().min(1, "El motivo es requerido"),
});

export const LoteCafeSchema = z.object({
  id: z.string().uuid(),
  variedad: z.string().min(1, "La variedad es requerida"),
  fase: FaseCafeEnum,
  cantidad_producida: z.number(),
  costo_produccion: z.number(),
  unidad_medida: UnidadMedidaEnum,
  calidad: CalidadCafeEnum,
  codigo_trazabilidad: z.string().uuid(),
  fecha_creacion: z.string(),
  lote_anterior_id: z.string().uuid().nullable().optional(),
});

export type ModuloInventario = z.infer<typeof ModuloInventarioEnum>;
export type EstadoInventario = z.infer<typeof EstadoInventarioEnum>;
export type CreateInventarioItemInput = z.infer<typeof CreateInventarioItemSchema>;
export type UpdateInventarioItemInput = z.infer<typeof UpdateInventarioItemSchema>;
export type UpdateEstadoInput = z.infer<typeof UpdateEstadoSchema>;
export type InventarioItem = z.infer<typeof InventarioItemSchema>;
export type MovimientoStockInput = z.infer<typeof MovimientoStockSchema>;
export type LoteCafe = z.infer<typeof LoteCafeSchema>;
