/** @type {import('next').NextConfig} */
const isBoltDev = process.env.BOLT_ENV === 'true';
const isProduction = process.env.NODE_ENV === 'production';

const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  reactStrictMode: true,
  swcMinify: true,

  eslint: {
    ignoreDuringBuilds: isBoltDev,
  },

  typescript: {
    ignoreBuildErrors: isBoltDev,
  },

  compiler: {
    removeConsole: isProduction ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  async headers() {
    return [
      {
        source: '/documents/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      {
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  webpack: (config, { isServer, dev }) => {
    if (isBoltDev && dev) {
      config.parallelism = 1;
      config.cache = false;
    }

    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      minimize: isProduction,
    };

    return config;
  },
};

module.exports = nextConfig;
