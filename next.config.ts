import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  // Don't advertise the framework in response headers.
  poweredByHeader: false,
  // Allow dev HMR (hot reload) to work over the platform preview domain, whose
  // hostname is a random subdomain of *.monkeycode-ai.live.
  allowedDevOrigins: ["*.monkeycode-ai.live"],

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

export default withSentryConfig(nextConfig, {
  // Fail open: without SENTRY_DSN / SENTRY_AUTH_TOKEN the SDK is a no-op and
  // source-map upload is skipped — local dev and CI never need Sentry env.
  silent: true,
  telemetry: false,
});
