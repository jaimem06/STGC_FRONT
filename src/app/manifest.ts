import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "STGC Tierra Fértil",
    short_name: "STGC",
    description: "Sistema de Trazabilidad y Gestión de Café",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8f3",
    theme_color: "#442a22",
    icons: [
      {
        src: "/loader_cafe.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/loader_cafe.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/loader_cafe.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
