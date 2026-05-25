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
  identifier: z.string()
    .min(1, "La identificación es requerida")
    .refine((val) => {
      if (/^\d{10}$/.test(val)) return validateEcuadorianId(val);
      return identifierRegex.test(val);
    }, "Identificación Inválida"),
  phone_number: z.string()
    .min(1, "El teléfono es requerido")
    .regex(phoneRegex, "Número de teléfono Inválido"),
  status: z.enum(["ACTIVO", "INACTIVO", "SUSPENDIDO", "PENDIENTE"]).default("ACTIVO"),
});

export const UserUpdateSchema = z.object({
  role_name: z.string().nullable().optional(),
  status: z.enum(["ACTIVO", "INACTIVO", "SUSPENDIDO", "PENDIENTE"]).nullable().optional(),
  email: z.string().email("Correo electrónico inválido").nullable().optional(),
  phone_number: z.string().regex(phoneRegex, "Número de teléfono inválido").nullable().optional(),
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
  name: z.string().min(1, "El nombre del rol es requerido").transform(v => v.toUpperCase()),
  description: z.string().nullable().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type UserCreateInput = z.infer<typeof UserCreateSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof PasswordResetConfirmSchema>;
export type RoleCreateInput = z.infer<typeof RoleCreateSchema>;
