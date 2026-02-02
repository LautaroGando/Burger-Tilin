import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Burger Tilin | Inteligencia de Negocios",
  description: "Gestión avanzada e inteligencia para Burger Tilin",
  icons: {
    icon: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${inter.className} antialiased selection:bg-primary/30 selection:text-white`}
      >
        {children}
        <Toaster theme="dark" position="top-center" richColors />
      </body>
    </html>
  );
}
