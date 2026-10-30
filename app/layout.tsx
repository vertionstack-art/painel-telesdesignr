import type { Metadata, Viewport } from 'next';
import { Archivo, Caveat, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-jakarta', display: 'swap' });
const caveat = Caveat({ subsets: ['latin'], weight: ['600'], variable: '--font-caveat', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Painel · Teles Designr', template: '%s · Teles Designr' },
  description: 'Propostas comerciais do Teles Designr.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#0b0a0e',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${jakarta.variable} ${caveat.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
