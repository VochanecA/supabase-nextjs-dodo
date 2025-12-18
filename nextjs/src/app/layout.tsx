// app/layout.tsx - LIGHTHOUSE OPTIMIZED
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import CookieConsent from "@/components/Cookies";
import { GlobalProvider } from '@/lib/context/GlobalContext';
import { ThemeProvider } from 'next-themes';

// OPTIMIZED: Only load Inter, remove JetBrains Mono if not needed
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCTNAME || "Your Best SaaS";
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
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  alternates: { canonical: BASE_URL },
  category: 'technology',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: PRODUCT_NAME },
  verification: {
    // Add your verification tokens here
    // google: 'your-google-site-verification',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Changed from 1 to improve accessibility
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#4f46e5' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' }
  ],
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
  publisher: { 
    '@type': 'Organization', 
    name: PRODUCT_NAME, 
    logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` } 
  },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '1000' },
  offers: { '@type': 'AggregateOffer', lowPrice: '0', highPrice: '199', priceCurrency: 'USD', offerCount: '3' }
};

interface RootLayoutProps { children: React.ReactNode; }

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${inter.variable} ${THEME}`} suppressHydrationWarning>
      <head>
        {/* REMOVED: Unnecessary preconnects that were causing warnings */}
        {/* Only keep preconnects for resources you ACTUALLY use */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} 
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem 
          disableTransitionOnChange
          storageKey="theme"
        >
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