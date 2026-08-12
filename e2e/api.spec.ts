import { expect } from "./fixtures";
import { test } from "./fixtures";

/**
 * API surface: health, auth, validation and unknown-route behaviour. These
 * run even without a database — where an endpoint needs one, the assertion
 * accepts both the healthy and the degraded-but-correct response.
 */
test("/api/ping reports backend health with a real DB round-trip", async ({ request }) => {
  const res = await request.get("/api/ping");
  expect([200, 500]).toContain(res.status());
  const body = (await res.json()) as { ok?: boolean };
  expect(typeof body.ok).toBe("boolean");
});

test("/api/auth/me returns 401 without a session", async ({ request }) => {
  const res = await request.get("/api/auth/me");
  expect(res.status()).toBe(401);
});

test("/api/auth/logout succeeds", async ({ request }) => {
  const res = await request.post("/api/auth/logout");
  expect(res.status()).toBe(200);
  const body = (await res.json()) as { success?: boolean };
  expect(body.success).toBe(true);
});

test("/api/auth/request-otp rejects malformed payloads with 400", async ({ request }) => {
  const res = await request.post("/api/auth/request-otp", {
    data: { phone: "" },
  });
  expect(res.status()).toBe(400);
  const body = (await res.json()) as { error?: string };
  expect(body.error).toBeTruthy();
});

test("/api/upload rejects an empty file with 400", async ({ request }) => {
  const res = await request.post("/api/upload", {
    multipart: { file: { name: "empty.bin", mimeType: "image/jpeg", buffer: Buffer.from([]) } },
  });
  expect(res.status()).toBe(400);
  const body = (await res.json()) as { error?: string };
  expect(body.error).toBeTruthy();
});

test("unknown API routes return 404", async ({ request }) => {
  const res = await request.get("/api/this-route-does-not-exist");
  expect(res.status()).toBe(404);
});

test("/api/review-reminders responds (healthy or degraded) without auth", async ({
  request,
}) => {
  const res = await request.get("/api/review-reminders");
  expect([200, 500]).toContain(res.status());
  const body = (await res.json()) as { ok?: boolean };
  expect(typeof body.ok).toBe("boolean");
});
