import type { Metadata } from "next";
export const viewport = { themeColor: '#112d39', width: 'device-width', initialScale: 1 };
import "./globals.css";

export const metadata: Metadata = {
  title: "SIBATÉ Conecta | Hospedaje y alimentación",
  description: "Piloto privado de servicios locales para estudiantes en Sibaté.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "SIBATÉ Conecta", statusBarStyle: "default" },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
