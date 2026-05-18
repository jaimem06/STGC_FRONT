/**
 * Centralized theme configuration for the application.
 * Values here correspond to the Tailwind CSS theme defined in globals.css.
 */

export const theme = {
  colors: {
    marineGreen: "#636b3f",
    deepGreen: "#2b361c",
    bariumYellow: "#fefae3",
    sepiaE37: "#d4a369",
    leather: "#b17036",
  },
  fonts: {
    sans: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
};

export type Theme = typeof theme;
