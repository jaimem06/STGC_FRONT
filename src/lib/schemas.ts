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
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const UserCreateSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
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
    .regex(phoneRegex, "Número de teléfono Inválido"),
  status: z.enum(["ACTIVO", "INACTIVO", "SUSPENDIDO", "PENDIENTE"]).default("ACTIVO"),
}).superRefine((data, ctx) => {
  if (data.id_type === "CEDULA") {
    if (!validateEcuadorianId(data.identifier)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cédula Ecuatoriana Inválida",
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
  phone_number: z.string().regex(phoneRegex, "Número de teléfono inválido").nullable().optional(),
  identifier: z.string().optional(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").nullable().optional(),
});

export const PasswordResetRequestSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
});

export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1, "El token es requerido"),
  new_password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const RoleCreateSchema = z.object({
  name: z.string()
    .min(5, "El nombre del rol debe tener al menos 5 caracteres")
    .transform(v => v.toUpperCase())
    .refine(v => /^[A-Z_]+$/.test(v), "Solo se permiten letras y guiones bajos (_)"),
  description: z.string()
    .min(1, "La descripción es requerida")
    .refine(v => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\.,;:'"()\-]+$/.test(v), "Solo se permite texto")
    .refine(v => v.trim().split(/\s+/).length >= 10, "Mínimo 10 palabras"),
});

// --- Inventory & Traceability Schemas ---

export const CalidadCafeEnum = z.enum(["ALTA", "MEDIA", "BAJA"]);
export const ClasificacionInsumoEnum = z.enum(["QUIMICO_FERTILIZANTE", "QUIMICO_FUNGICIDA", "ORGANICO"]);
export const EstadoProductoEnum = z.enum([
  "DISPONIBLE",
  "AGOTADO",
  "STOCK_BAJO",
  "INACTIVO",
  "EN_TRANSITO",
  "BLOQUEADO",
  "CADUCADO",
]);
export const FaseCafeEnum = z.enum(["PULPA", "DESPULPADO", "SECADO", "TOSTADO", "MOLIDO"]);
export const TipoElementoEnum = z.enum(["INSUMO", "PRODUCTO", "CAFE_PROCESADO"]);
export const TipoMovimientoEnum = z.enum(["ENTRADA", "SALIDA"]);
export const UnidadMedidaEnum = z.enum(["QUINTALES", "ARROBAS", "LIBRAS"]);

export const CreateInventarioItemSchema = z.object({
  sku: z.string().min(1, "El SKU es requerido"),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().nullable().optional(),
  tipo: TipoElementoEnum,
  estado: EstadoProductoEnum,
  unidad_medida: UnidadMedidaEnum,
  precio: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  fecha_caducidad: z.string().nullable().optional(),
});

export const InventarioItemSchema = CreateInventarioItemSchema.extend({
  id: z.string().uuid(),
  cantidad: z.number(),
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

export type LoginInput = z.infer<typeof LoginSchema>;
export type UserCreateInput = z.infer<typeof UserCreateSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof PasswordResetConfirmSchema>;
export type RoleCreateInput = z.infer<typeof RoleCreateSchema>;

// Inventory types
export type CalidadCafe = z.infer<typeof CalidadCafeEnum>;
export type ClasificacionInsumo = z.infer<typeof ClasificacionInsumoEnum>;
export type EstadoProducto = z.infer<typeof EstadoProductoEnum>;
export type FaseCafe = z.infer<typeof FaseCafeEnum>;
export type TipoElemento = z.infer<typeof TipoElementoEnum>;
export type TipoMovimiento = z.infer<typeof TipoMovimientoEnum>;
export type UnidadMedida = z.infer<typeof UnidadMedidaEnum>;
export type CreateInventarioItemInput = z.infer<typeof CreateInventarioItemSchema>;
export type InventarioItem = z.infer<typeof InventarioItemSchema>;
export type MovimientoStockInput = z.infer<typeof MovimientoStockSchema>;
export type LoteCafe = z.infer<typeof LoteCafeSchema>;
