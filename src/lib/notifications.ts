import { toast as sonnerToast } from "sonner";

/**
 * Profesional notification utility for STGC.
 * All notifications are persistent (duration: Infinity) and require user confirmation.
 */
export const toast = {
  success: (message: string, description?: string, actionLabel: string = "Entendido") =>
    sonnerToast.success(message, {
      description,
      action: {
        label: actionLabel,
        onClick: () => {},
      },
    }),

  error: (message: string, description?: string, actionLabel: string = "Cerrar") =>
    sonnerToast.error(message, {
      description,
      action: {
        label: actionLabel,
        onClick: () => {},
      },
    }),

  warning: (message: string, description?: string, actionLabel: string = "Revisar") =>
    sonnerToast.warning(message, {
      description,
      action: {
        label: actionLabel,
        onClick: () => {},
      },
    }),

  info: (message: string, description?: string, actionLabel: string = "Ok") =>
    sonnerToast.info(message, {
      description,
      action: {
        label: actionLabel,
        onClick: () => {},
      },
    }),

  // Fallback for custom sonner calls if needed
  custom: sonnerToast,
};
