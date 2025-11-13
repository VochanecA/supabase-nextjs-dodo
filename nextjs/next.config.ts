// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Omogući React Strict Mode za bolji development
  reactStrictMode: true,
  
  // Podešavanja za slike
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'production' ? false : true,
  },
  
  // Podešavanja za TypeScript i ESLint
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Podešavanja za environment varijable
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Podešavanja za headers (opcionalno)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
  
  // Logging za debug
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;