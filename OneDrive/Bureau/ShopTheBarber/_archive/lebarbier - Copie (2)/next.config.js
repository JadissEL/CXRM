/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize build performance
  swcMinify: true,
  experimental: {
    optimizeCss: true,
  },
  // Image optimization
  images: {
    domains: ['www.gravatar.com'],
    formats: ['image/webp', 'image/avif'],
  },
  // Bundle analyzer (optional - uncomment to analyze bundle size)
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.resolve.fallback = {
  //       ...config.resolve.fallback,
  //       fs: false,
  //     };
  //   }
  //   return config;
  // },
  // Environment variables (moved to .env files for better performance)
};

module.exports = nextConfig;