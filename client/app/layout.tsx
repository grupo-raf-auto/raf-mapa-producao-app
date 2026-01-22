import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { ModalProvider } from "@/lib/contexts/modal-context";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// Fonte para títulos - Montserrat (suporta maiúsculas e minúsculas)
const montserrat = Montserrat({
  variable: "--font-title",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RAF Mapa de Produção",
  description: "Sistema de gestão de formulários e questões dinâmicas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${montserrat.variable} antialiased`}
        style={{ backgroundColor: "#F4F8FE" }}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ModalProvider>
            {children}
            <Toaster position="top-center" richColors />
          </ModalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
