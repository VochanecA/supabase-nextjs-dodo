// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import CookieConsent from "@/components/Cookies";
import { GoogleAnalytics } from '@next/third-parties/google';
import { GlobalProvider } from '@/lib/context/GlobalContext';
import { ThemeProvider } from 'next-themes';


// Optimizovani fontovi sa next/font
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

// Konstante
const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCTNAME || "Your SaaS";
const HOMEPAGE_TITLE = `${PRODUCT_NAME} - Bootstrap Your SaaS in 5 Minutes`;
const HOMEPAGE_DESCRIPTION = "Launch your SaaS product in days, not months. Complete with authentication, payment processing, and enterprise-grade security built right in.";
const THEME = process.env.NEXT_PUBLIC_THEME || "theme-sass3";
const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://yoursaas.com";

// Optimizovani metadata
export const metadata: Metadata = {
  title: {
    default: HOMEPAGE_TITLE,
    template: `%s | ${PRODUCT_NAME}`
  },
  description: HOMEPAGE_DESCRIPTION,
  keywords: [
    "SaaS",
    "nextjs",
    "supabase",
    "template",
    "starter kit",
    "authentication",
    "payments",
    "SaaS boilerplate"
  ],
  authors: [{ name: PRODUCT_NAME }],
  creator: PRODUCT_NAME,
  publisher: PRODUCT_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(BASE_URL),
  
  // Open Graph
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESCRIPTION,
    siteName: PRODUCT_NAME,
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: PRODUCT_NAME,
      },
    ],
  },
  
  // Twitter
  twitter: {
    card: "summary_large_image",
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESCRIPTION,
    images: ['/og-image.jpg'],
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Alternativni jezici
  alternates: {
    canonical: BASE_URL,
  },

  // Kategorizacija
  category: 'technology',
  
  // Dodatne SEO optimizacije
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: PRODUCT_NAME,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4f46e5',
  colorScheme: 'light dark',
};

// Structured data za homepage
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: PRODUCT_NAME,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web-Based',
  description: HOMEPAGE_DESCRIPTION,
  url: BASE_URL,
  author: {
    '@type': 'Organization',
    name: PRODUCT_NAME,
    url: BASE_URL,
  },
  publisher: {
    '@type': 'Organization',
    name: PRODUCT_NAME,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/logo.png`,
    }
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1000',
  },
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '0',
    highPrice: '199',
    priceCurrency: 'USD',
    offerCount: '3'
  }
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${jetbrainsMono.variable} ${THEME}`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect za kritične domene */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://vercel.live" />
        
        {/* Favicon i app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Structured data za SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        
        {/* Performance optimizations */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={PRODUCT_NAME} />
        
        {/* Dodatne meta tagove za bolji SEO */}
        <meta name="theme-color" content="#4f46e5" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1f2937" media="(prefers-color-scheme: dark)" />
        <meta name="msapplication-TileColor" content="#4f46e5" />
      </head>
 <body className="font-sans antialiased min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <GlobalProvider>
            {children}
            <Analytics />
            <CookieConsent />
            {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
          </GlobalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}