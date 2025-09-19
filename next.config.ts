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

  // Trace all project files correctly (monorepo safe)
  outputFileTracingRoot: path.resolve(__dirname, "../../"),

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
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
