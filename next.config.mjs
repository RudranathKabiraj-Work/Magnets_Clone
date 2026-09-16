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
    // Optimize package imports to reduce JS bundle size (tree-shaking aware)
    optimizePackageImports: ["lucide-react", "lenis", "framer-motion"],
  },

  // Production compiler: remove console.log to reduce bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Security + Caching Headers
  async headers() {
    return [
      {
        // Security headers for all routes
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
      {
        // Landing page: allow bfcache (no no-store, no no-cache)
        // stale-while-revalidate keeps it fast AND fresh
        source: "/",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, s-maxage=60, stale-while-revalidate=3600" },
        ],
      },
      {
        // Static assets (fonts, images): immutable 1-year cache
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Public images and fonts: long cache
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;