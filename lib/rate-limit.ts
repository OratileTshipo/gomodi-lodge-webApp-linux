/**
 * Sliding-window rate limiting for the middleware layer.
 *
 * Primary: Upstash Redis (@upstash/ratelimit) — a global, multi-instance
 * limiter that works in the Vercel Edge runtime (REST-based, unlike TCP Redis
 * clients). Used automatically when UPSTASH_REDIS_REST_URL / _TOKEN exist.
 *
 * Fallback: the previous in-memory sliding window. It is per-warm-instance
 * only — a strong brake on a single server, not a global guarantee — but it
 * keeps every endpoint protected the moment this module loads with no keys.
 *
 * Both paths fail OPEN on limiter errors (never block everyone because the
 * limiter hiccuped), matching the app's fail-open posture elsewhere.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const upstashConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// One Ratelimit client per (max, window) pair, created lazily and cached.
const upstashClients = new Map<string, Ratelimit>();

function upstashFor(max: number, windowMs: number): Ratelimit | null {
  if (!upstashConfigured) return null;
  const key = `${max}:${windowMs}`;
  let client = upstashClients.get(key);
  if (!client) {
    client = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(max, `${Math.round(windowMs / 1000)} s`),
      prefix: "gomodi-rl",
    });
    upstashClients.set(key, client);
  }
  return client;
}

// ---- In-memory fallback (per warm instance) --------------------------------

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

function allowMemory(key: string, max: number, windowMs: number): boolean {
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

/** True when the request is allowed; false when rate-limited. */
export async function allowRequest(
  key: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  const upstash = upstashFor(max, windowMs);
  if (!upstash) return allowMemory(key, max, windowMs);

  try {
    const { success } = await upstash.limit(key);
    return success;
  } catch (err) {
    console.error("[rate-limit] Upstash unavailable, allowing request:", err);
    return true;
  }
}
