import { NextResponse, type NextRequest } from "next/server";

/**
 * Global security middleware — the front door for every request.
 *
 *  1. CSP with a per-request nonce (Next.js auto-applies the nonce from the
 *     `x-nonce` request header to its own inline scripts; the root layout
 *     reads the same nonce to annotate the app's inline scripts).
 *  2. Standard hardening headers: HSTS (prod), nosniff, frame denial,
 *     referrer policy, permissions policy.
 *  3. Origin/Host validation on every state-changing request (CSRF defense in
 *     depth for API routes; server actions have their own built-in check).
 *  4. Sliding-window IP rate limiting on the abuse-prone endpoints: OTP
 *     request/verify, file upload, and the three public booking forms.
 *
 * Notes:
 *  - The rate limiter is in-memory, i.e. per warm instance. On Vercel this is
 *    a strong per-instance brake, not a global guarantee; the same caveat
 *    already applied to the OTP limiter. Swap for a Redis/Upstash limiter if
 *    the site ever grows to many concurrent instances.
 *  - The whole app is force-dynamic, so per-request nonces are safe (no
 *    static pages to invalidate).
 */

// ---------------------------------------------------------------------------
// Rate limiting (sliding window, per client IP)
// ---------------------------------------------------------------------------

const MAX_BUCKETS = 100_000;
const buckets = new Map<string, number[]>();

function pruneBuckets() {
  if (buckets.size <= MAX_BUCKETS) return;
  const now = Date.now();
  for (const [key, hits] of buckets) {
    if (hits.length === 0 || now - hits[hits.length - 1] > 60 * 60 * 1000) {
      buckets.delete(key);
    }
  }
}

/** Returns true when the request is allowed; false when rate-limited. */
function allowRequest(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  pruneBuckets();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

function clientIp(request: NextRequest): string {
  // Vercel and most proxies set x-forwarded-for; take the leftmost (client) hop.
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return "unknown";
}

const RATE_RULES: { path: string; method: string; max: number; windowMs: number }[] = [
  // OTP request: 10 per hour per IP (phone-level limiter still applies too).
  { path: "/api/auth/request-otp", method: "POST", max: 10, windowMs: 60 * 60 * 1000 },
  // OTP verify: 30 per 10 min per IP (per-code attempt lock still applies too).
  { path: "/api/auth/verify-otp", method: "POST", max: 30, windowMs: 10 * 60 * 1000 },
  // File upload: 30 per 10 min per IP (prevents blob-storage cost abuse).
  { path: "/api/upload", method: "POST", max: 30, windowMs: 10 * 60 * 1000 },
  // Public booking forms (server actions): 15 per 10 min per IP.
  { path: "/book", method: "POST", max: 15, windowMs: 10 * 60 * 1000 },
  { path: "/corporate", method: "POST", max: 15, windowMs: 10 * 60 * 1000 },
  { path: "/events", method: "POST", max: 15, windowMs: 10 * 60 * 1000 },
];

// ---------------------------------------------------------------------------
// Origin / Host validation (CSRF defense in depth)
// ---------------------------------------------------------------------------

function isTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    // No Origin header: same-origin form posts, server-side clients, curl.
    // Cookie-based CSRF is already blocked by SameSite=Lax, and JSON/FormData
    // cross-origin requests are blocked by CORS preflight — so an absent
    // Origin is not an attack signal here.
    return true;
  }
  const host = request.headers.get("host");
  try {
    const originUrl = new URL(origin);
    if (originUrl.host === host) return true;
    // Proxy/production edge case: the configured public origin is allowed
    // even if the immediate Host differs (e.g. behind a load balancer).
    const publicUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (publicUrl) {
      return originUrl.host === new URL(publicUrl).host;
    }
    return false;
  } catch {
    return false; // unparseable Origin (e.g. "null") → reject
  }
}

// ---------------------------------------------------------------------------
// Nonce + CSP
// ---------------------------------------------------------------------------

function newNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function buildCsp(nonce: string): string {
  const isProd = process.env.NODE_ENV === "production";
  // React dev mode uses eval() for debug callstacks (never in production), so
  // dev gets 'unsafe-eval'; production keeps a strict no-eval policy.
  const scriptSrc = isProd
    ? `script-src 'self' 'nonce-${nonce}'`
    : `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`;
  const directives = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'", // Next.js injects inline <style> for fonts/CSS
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "connect-src 'self'",
    // Only force HTTPS on the public site, never local dev over http.
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ];
  return directives.join("; ");
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const ip = clientIp(request);

  // 1. CSRF: reject cross-origin state-changing requests before anything else.
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    if (!isTrustedOrigin(request)) {
      const isApi = pathname.startsWith("/api/");
      return NextResponse.json(
        { error: "Cross-origin request rejected" },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }
  }

  // 2. Rate limiting on abuse-prone endpoints.
  for (const rule of RATE_RULES) {
    if (method === rule.method && pathname === rule.path) {
      if (!allowRequest(`rl:${rule.path}:${ip}`, rule.max, rule.windowMs)) {
        const retryAfter = Math.ceil(rule.windowMs / 1000);
        const isApi = pathname.startsWith("/api/");
        return NextResponse.json(
          { error: "Too many requests. Please slow down and try again shortly." },
          { status: 429, headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" } }
        );
      }
    }
  }

  // 3. Security headers + per-request CSP nonce.
  const nonce = newNonce();
  const response = NextResponse.next({
    request: { headers: request.headers },
  });
  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", buildCsp(nonce));
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
  );
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  }

  return response;
}

export const config = {
  // Run everywhere except static assets and image optimization.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
