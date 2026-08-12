import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't advertise the framework in response headers.
  poweredByHeader: false,
  // Allow dev HMR (hot reload) to work over the platform preview domain, whose
  // hostname is a random subdomain of *.monkeycode-ai.live.
  allowedDevOrigins: ["*.monkeycode-ai.live"],

  // Serve AVIF/WebP instead of JPEG when the browser supports it (every modern
  // phone does) — typically 50-70% smaller payloads for guests on 3G.
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
