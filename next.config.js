/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // Optimized for Bolt.new hosting environment
  // Static export disabled for SSR and API routes support

  // React strict mode
  reactStrictMode: true,

  // Use SWC minification
  swcMinify: true,

  // Disable ESLint during build to speed up WebContainer builds
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during build to avoid EAGAIN issues
  typescript: {
    ignoreBuildErrors: true,
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Headers for caching and security
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

  // WebContainer/Bolt.new optimization: Fix EAGAIN errors
  webpack: (config, { isServer }) => {
    // Reduce parallelism to avoid "EAGAIN: resource temporarily unavailable"
    // This serializes file operations in WebContainer environment
    config.parallelism = 1;

    // Disable cache to reduce file handle pressure
    config.cache = false;

    // Reduce concurrent module processing
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      minimize: process.env.NODE_ENV === 'production',
    };

    return config;
  },
};

module.exports = nextConfig;
