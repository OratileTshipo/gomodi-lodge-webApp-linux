/**
 * Next.js instrumentation entry point (auto-detected at project root).
 *
 * Loads the Sentry SDK for the server (Node) and Edge runtimes. The client
 * bundle gets Sentry via the withSentryConfig build plugin, so no manual
 * client import is needed here.
 *
 * Everything is fail-open: without SENTRY_DSN the SDK inits as a no-op
 * (logs a warning at most) and the app keeps working — local dev and CI
 * never need Sentry environment variables.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
