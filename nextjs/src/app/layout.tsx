import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import CookieConsent from "@/components/Cookies";
import { GlobalProvider } from '@/lib/context/GlobalContext';
import { ThemeProvider } from 'next-themes';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  preload: false,
});

const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCTNAME || "Your SaaS";
const HOMEPAGE_TITLE = `${PRODUCT_NAME} - Bootstrap Your SaaS in 5 Minutes`;
const HOMEPAGE_DESCRIPTION = "Launch your SaaS product in days, not months. Complete with authentication, payment processing, and enterprise-grade security built right in.";
const THEME = process.env.NEXT_PUBLIC_THEME || "theme-sass3";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://yoursaas.com";

export const metadata: Metadata = {
  title: { default: HOMEPAGE_TITLE, template: `%s | ${PRODUCT_NAME}` },
  description: HOMEPAGE_DESCRIPTION,
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESCRIPTION,
    siteName: PRODUCT_NAME,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: PRODUCT_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESCRIPTION,
    images: ['/og-image.jpg'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: BASE_URL },
  category: 'technology',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: PRODUCT_NAME },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4f46e5',
  colorScheme: 'light dark',
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: PRODUCT_NAME,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web-Based',
  description: HOMEPAGE_DESCRIPTION,
  url: BASE_URL,
  author: { '@type': 'Organization', name: PRODUCT_NAME, url: BASE_URL },
  publisher: { '@type': 'Organization', name: PRODUCT_NAME, logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` } },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '1000' },
  offers: { '@type': 'AggregateOffer', lowPrice: '0', highPrice: '199', priceCurrency: 'USD', offerCount: '3' }
};

interface RootLayoutProps { children: React.ReactNode; }

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${THEME}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://vercel.live" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <meta name="theme-color" content="#4f46e5" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1f2937" media="(prefers-color-scheme: dark)" />
      </head>
      <body className="font-sans antialiased min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <GlobalProvider>
            {children}
            <Analytics />
            <CookieConsent />
          </GlobalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}