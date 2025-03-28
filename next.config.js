/** @type {import('next').NextConfig} */
const nextConfig = {
  // Define an onDemandEntries config to avoid conflicts
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 15 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Ignore TypeScript errors in production
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignore ESLint errors in production
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  // Disable strict mode for production
  reactStrictMode: false,
  // Custom webpack config for socket.io support
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'bufferutil', 'utf-8-validate'];
    return config;
  },
  // Skip any files starting with dot and inside pages/api
  pageExtensions: ['js', 'jsx', 'ts', 'tsx']
};

module.exports = nextConfig 