/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compress responses with gzip
  compress: true,

  // SWC minifier (default in Next 14, explicit for clarity)
  swcMinify: true,

  // Optimize images: allow WebP/AVIF conversion, local images allowed
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000, // 1 year
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Experimental optimizations
  experimental: {
    // Optimize package imports to reduce JS bundle size
    optimizePackageImports: ["lucide-react", "lenis"],
  },

  // Production compiler: remove console.log to reduce bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;