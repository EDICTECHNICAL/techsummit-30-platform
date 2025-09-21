import type { NextConfig } from "next";
import path from "node:path";

// Custom loader for visual edits
const LOADER = path.resolve(__dirname, "src/visual-edits/component-tagger-loader.js");

const nextConfig: NextConfig = {
  // Ensure Vercel builds in standalone mode
  output: "standalone",

  // Image optimization for all http/https hosts
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },

  // Remove this line if you're not in a monorepo or if it's causing issues
  // outputFileTracingRoot: path.resolve(__dirname, "../../"),
  
  // Alternative: Only set this if you're actually in a monorepo
  ...(process.env.MONOREPO_MODE === "true" && {
    outputFileTracingRoot: path.resolve(__dirname, "../../"),
  }),

  // Enable custom turbopack loader
  turbopack: {
    rules: {
      "*.{jsx,tsx}": {
        loaders: [LOADER],
      },
    },
  },

  // Strip console logs in production (except warn + error)
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  // Enable gzip compression
  compress: true,

  // Optimize certain imports
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  // Security + SSE headers
  async headers() {
    return [
      {
        source: "/api/sse/:path*",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Connection", value: "keep-alive" },
          { key: "Content-Type", value: "text/event-stream" },
          { key: "X-Accel-Buffering", value: "no" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          // Prevent XSS attacks
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          
          // Referrer policy
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          
          // Strict Transport Security (HTTPS only)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          
          // Content Security Policy
          { 
            key: "Content-Security-Policy", 
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://vitals.vercel-analytics.com https://slelguoygbfzlpylpxfs.supabase.co",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://vercel.live wss://vercel.live https://vitals.vercel-analytics.com https://slelguoygbfzlpylpxfs.supabase.co",
              "media-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join("; ")
          },
          
          // Permissions Policy (Feature Policy)
          { 
            key: "Permissions-Policy", 
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
          },
        ],
      },
    ];
  },
};

export default nextConfig;