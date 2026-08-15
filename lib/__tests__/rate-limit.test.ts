import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

/**
 * The in-memory sliding-window fallback is the default everywhere Upstash
 * keys are absent — including every local/CI environment — so its semantics
 * are the security-critical path to test. Env stubs guarantee hermetic tests
 * regardless of the machine's environment, and resetModules forces a fresh
 * module (with fresh buckets + upstashConfigured) per test.
 */
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("in-memory sliding window (allowRequest fallback)", () => {
  it("allows up to max requests within the window", async () => {
    const { allowRequest } = await import("../rate-limit");
    for (let i = 0; i < 5; i++) {
      expect(await allowRequest("key", 5, 60_000)).toBe(true);
    }
  });

  it("blocks the (max+1)th request", async () => {
    const { allowRequest } = await import("../rate-limit");
    for (let i = 0; i < 5; i++) await allowRequest("key", 5, 60_000);
    expect(await allowRequest("key", 5, 60_000)).toBe(false);
  });

  it("keeps blocking while inside the window", async () => {
    const { allowRequest } = await import("../rate-limit");
    for (let i = 0; i < 5; i++) await allowRequest("key", 5, 60_000);
    vi.advanceTimersByTime(30_000);
    expect(await allowRequest("key", 5, 60_000)).toBe(false);
  });

  it("resets after the window elapses (sliding window)", async () => {
    const { allowRequest } = await import("../rate-limit");
    for (let i = 0; i < 5; i++) await allowRequest("key", 5, 60_000);
    vi.advanceTimersByTime(60_001);
    expect(await allowRequest("key", 5, 60_000)).toBe(true);
  });

  it("tracks keys independently", async () => {
    const { allowRequest } = await import("../rate-limit");
    for (let i = 0; i < 5; i++) await allowRequest("a", 5, 60_000);
    expect(await allowRequest("a", 5, 60_000)).toBe(false);
    expect(await allowRequest("b", 5, 60_000)).toBe(true);
  });

  it("applies per-call max (a burst over max is still limited)", async () => {
    const { allowRequest } = await import("../rate-limit");
    await allowRequest("key", 2, 60_000);
    await allowRequest("key", 2, 60_000);
    expect(await allowRequest("key", 2, 60_000)).toBe(false);
    // A different stricter window on the same key is independent.
    expect(await allowRequest("key", 5, 60_000)).toBe(true);
  });
});

describe("Upstash path (fail-open posture)", () => {
  const limit = vi.hoisted(() => vi.fn());

  beforeEach(() => {
    limit.mockReset();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "secret");
  });

  vi.mock("@upstash/ratelimit", () => {
    class FakeRatelimit {
      static slidingWindow = () => ({});
      limit = limit;
      constructor(_opts: unknown) {
        void _opts;
      }
    }
    return { Ratelimit: FakeRatelimit };
  });

  vi.mock("@upstash/redis", () => ({
    Redis: { fromEnv: () => ({}) },
  }));

  it("denies when Upstash reports the limit hit", async () => {
    limit.mockResolvedValue({ success: false });
    const { allowRequest } = await import("../rate-limit");
    expect(await allowRequest("key", 5, 60_000)).toBe(false);
  });

  it("allows when Upstash reports success", async () => {
    limit.mockResolvedValue({ success: true });
    const { allowRequest } = await import("../rate-limit");
    expect(await allowRequest("key", 5, 60_000)).toBe(true);
  });

  it("fails OPEN (allows) when Upstash errors — never blocks everyone", async () => {
    limit.mockRejectedValue(new Error("redis down"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { allowRequest } = await import("../rate-limit");
      expect(await allowRequest("key", 5, 60_000)).toBe(true);
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
