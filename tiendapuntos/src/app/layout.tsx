import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TiendaPuntos — Fidelización de clientes",
  description:
    "Plataforma de fidelización por puntos para tu negocio. Sumá puntos a tus clientes y canjealos por premios.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
