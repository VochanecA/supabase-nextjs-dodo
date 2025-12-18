// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;


// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   reactStrictMode: true,
//   images: {
//     domains: ['localhost'],
//   },
//   // Privremeno onemogući TypeScript i ESLint errors
//   typescript: {
//     ignoreBuildErrors: true,
//   },
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
// };

// export default nextConfig;


import type { NextConfig } from "next";
import { createHash } from "crypto";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // IMPORTANT: Re-enable TypeScript and ESLint for production!
  // typescript: {
  //   ignoreBuildErrors: false,
  // },
  // eslint: {
  //   ignoreDuringBuilds: false,
  // },
  
  // For now, keep them disabled if you have errors
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Modern JavaScript compilation
  swcMinify: true,

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Image optimization - CRITICAL for Lighthouse
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Experimental optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@vercel/analytics', 'next-themes'],
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB', 'INP'],
  },

  // Disable source maps in production
  productionBrowserSourceMaps: false,

  // Performance headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // DNS Prefetch
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          // Security headers
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/icon-:size*.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.webp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize bundle splitting for better caching
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Common chunks used across multiple pages
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
              priority: 10,
            },
            // Large libraries
            lib: {
              test(module: { size?: () => number }) {
                return typeof module.size === 'function' && module.size() > 160000;
              },
              name(module: { identifier?: () => string }) {
                if (module.identifier && typeof module.identifier === 'function') {
                  const hash = createHash('sha1');
                  hash.update(module.identifier());
                  return hash.digest('hex').substring(0, 8);
                }
                return 'lib';
              },
              priority: 20,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // React and related libraries
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: 'react',
              priority: 30,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // Ignore source map warnings from third-party packages
    config.ignoreWarnings = [
      { module: /node_modules/ },
      /Failed to parse source map/,
    ];

    return config;
  },

  // Redirects for better SEO
  async redirects() {
    return [
      // Example: redirect www to non-www
      // {
      //   source: '/:path*',
      //   has: [{ type: 'host', value: 'www.yourdomain.com' }],
      //   destination: 'https://yourdomain.com/:path*',
      //   permanent: true,
      // },
    ];
  },

  // Rewrites for cleaner URLs if needed
  async rewrites() {
    return [
      // Example rewrites
    ];
  },
};

export default nextConfig;