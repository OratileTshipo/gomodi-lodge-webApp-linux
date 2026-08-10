import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signed-session auth.
 *
 * The session cookie is a base64url JSON payload followed by an HMAC-SHA256
 * signature. The payload carries userId/role/name and an 8h expiry. Verifying
 * the signature means a forged or tampered cookie is rejected server-side —
 * previously the cookie was unsigned JSON that any client could mint.
 *
 * Set SESSION_SECRET in production (any long random string). In dev it falls
 * back to a constant so local logins keep working; change the value and all
 * sessions invalidate (they'd need re-login), which is expected.
 *
 * In production the fallback is deliberately a hard failure: sessions signed
 * with a well-known constant would be forgeable by anyone. The check is lazy
 * (inside signing) rather than at module load, because Next.js evaluates route
 * modules during `next build` with NODE_ENV=production and would otherwise
 * fail the build when the env var is only present at runtime.
 */
let cachedSecret: string | null = null;
function getSessionSecret(): string {
  if (cachedSecret) return cachedSecret;
  if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set in production");
  }
  cachedSecret = process.env.SESSION_SECRET || "gomodi-dev-secret-change-me";
  return cachedSecret;
}
const SESSION_COOKIE = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours (shift length)

export type SessionUser = {
  userId: number;
  role: "owner" | "assistant" | "staff" | "partner";
  name: string;
};

type SessionPayload = SessionUser & { exp: number };

function sign(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(raw: string): SessionPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (!parsed || typeof parsed.userId !== "number" || !parsed.role || !parsed.name || typeof parsed.exp !== "number") {
      return null;
    }
    return parsed as SessionPayload;
  } catch {
    return null;
  }
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Serialize a user into a signed cookie value. */
export function buildSessionCookie(user: SessionUser): string {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const raw = encodePayload(payload);
  return `${raw}.${sign(raw)}`;
}

/** Parse and verify a signed cookie value; returns null if invalid/expired. */
export function parseSession(raw: string): SessionUser | null {
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  if (!safeEqual(signature, sign(body))) return null;

  const payload = decodePayload(body);
  if (!payload) return null;
  if (payload.exp * 1000 < Date.now()) return null;

  return {
    userId: payload.userId,
    role: payload.role,
    name: payload.name,
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie) return null;
  return parseSession(sessionCookie.value);
}

/** True for roles allowed to manage bookings (owner/assistant). */
export function isManagerRole(role: string): boolean {
  return role === "owner" || role === "assistant";
}

/** True for the Lelz Business Enterprise partner role. */
export function isPartnerRole(role: string): boolean {
  return role === "partner";
}

/**
 * Server-side guard for booking-management APIs. Returns the user on success
 * or null — the route should respond 401 when null.
 */
export async function requireManager(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || !isManagerRole(user.role)) return null;
  return user;
}

/** Server-side guard for staff-facing APIs (time clock): any logged-in user. */
export async function requireStaff(): Promise<SessionUser | null> {
  return getCurrentUser();
}

/**
 * Server-side guard for partner-only APIs (Lelz Business Enterprise). Same
 * signed-session pattern as the other guards — no new auth mechanism.
 */
export async function requirePartner(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || !isPartnerRole(user.role)) return null;
  return user;
}

export { SESSION_COOKIE, SESSION_TTL_SECONDS };
