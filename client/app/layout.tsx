import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import '@/styles/scanner.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { ModalProvider } from '@/lib/contexts/modal-context';
import { ModelContextProvider } from '@/lib/context/model-context';

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

// Fonte para títulos - Montserrat (suporta maiúsculas e minúsculas)
const montserrat = Montserrat({
  variable: '--font-title',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'RAF Mapa de Produção',
  description: 'Sistema de gestão de formulários e questões dinâmicas',
  icons: {
    icon: '/logo-raf-favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${montserrat.variable} antialiased bg-background`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ModelContextProvider>
            <ModalProvider>
              {children}
              <Toaster position="top-center" richColors />
            </ModalProvider>
          </ModelContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
