/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Optimize chunk loading strategy
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Improve chunk loading resilience
      config.output = {
        ...config.output,
        // Ensure proper chunk naming for better caching
        chunkFilename: 'static/chunks/[name].[contenthash].js',
        // Set public path to ensure chunks load from correct location
        publicPath: '/_next/',
      };

      // Optimize chunk splitting
      config.optimization = {
        ...config.optimization,
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor chunks for better caching
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            // Common chunks
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
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
      // Cache static chunks aggressively
      {
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache CSS and JS files
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
