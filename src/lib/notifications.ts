import { toast as sonnerToast } from "sonner";

/**
 * Profesional notification utility for STGC.
 * By default, notifications require user confirmation, except for success.
 */
export const toast = {
  success: (message: string, description?: string) =>
    sonnerToast.success(message, {
      description,
      duration: 3000,
    }),

  error: (message: string, description?: string, actionLabel: string = "Cerrar") =>
    sonnerToast.error(message, {
      description,
      duration: Infinity,
      action: {
        label: actionLabel,
        onClick: () => {},
      },
    }),

  warning: (message: string, description?: string, actionLabel: string = "Revisar") =>
    sonnerToast.warning(message, {
      description,
      duration: Infinity,
      action: {
        label: actionLabel,
        onClick: () => {},
      },
    }),

  info: (message: string, description?: string, actionLabel: string = "Ok") =>
    sonnerToast.info(message, {
      description,
      duration: Infinity,
      action: {
        label: actionLabel,
        onClick: () => {},
      },
    }),

  // Fallback for custom sonner calls if needed
  custom: sonnerToast,
};
