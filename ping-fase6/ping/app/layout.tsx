import type { Metadata } from "next";
import { Bebas_Neue, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Display: condensada, tipo placa de vitrine de barbearia — usada com moderação
// (headline e números grandes), nunca em corpo de texto.
const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Corpo: geométrica, neutra, otimizada para telas de SaaS densas de informação.
const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Utilitária: números tabulares para financeiro, pontos, horários.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PING — Dá um PING aí",
  description: "O sistema que sua barbearia ou salão usa para agendar, fidelizar e crescer.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
