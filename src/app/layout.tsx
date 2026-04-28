import type { Metadata } from 'next';
import { Geist, Newsreader } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader-loaded',
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://evolu.team';
const siteName = 'Evoluteam';
const siteDescription = 'Gestão de pessoas para times que evoluem. Avaliações, feedback, PDI e recrutamento em um só lugar.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: ['gestão de pessoas', 'RH', 'avaliação de desempenho', 'PDI', 'feedback', 'recrutamento'],
  authors: [{ name: siteName }],
  creator: siteName,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName,
    title: siteName,
    description: siteDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${newsreader.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="h-full bg-background font-sans text-foreground">
        <TooltipProvider delay={300}>
          {children}
        </TooltipProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
