import type { NextConfig } from "next";

/**
 * shifto is a guest-first app: all personal state lives in the visitor's
 * browser (versioned localStorage), and every page renders from that state on
 * the client. Cache Components / Partial Prefetching are therefore left off —
 * there is no per-request server data to cache, and the classic App Router
 * behaviour keeps the code easier to read for reviewers.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
