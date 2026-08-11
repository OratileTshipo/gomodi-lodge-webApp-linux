import type { NextConfig } from "next";

const nextConfig = {
  // Don't advertise the framework in response headers.
  poweredByHeader: false,
  // Run Vercel Functions in Frankfurt (fra1) — same region as the Neon
  // Postgres endpoint (eu-central-1) — cuts the ~90ms cross-region RTT per
  // DB round-trip (Identified_Issues.md Issue 2).
  regions: ["fra1"],
  // Serve AVIF/WebP instead of JPEG when the browser supports it (every modern
  // phone does) — typically 50-70% smaller payloads for guests on 3G.
  images: {
    formats: ["image/avif", "image/webp"],
  },
} as NextConfig;

export default nextConfig;
