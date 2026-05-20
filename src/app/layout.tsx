import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Manrope, Public_Sans } from "next/font/google";
import "./globals.css";
import PremiumToaster from "@/components/PremiumToaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#442a22",
};

export const metadata: Metadata = {
  title: "STGC - Sistema de Trazabilidad y Gestión",
  description: "Plataforma para la gestión de trazabilidad y calidad del café",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "STGC",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} ${publicSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <PremiumToaster />
      </body>
    </html>
  );
}
