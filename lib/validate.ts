/**
 * Shared input validation + sanitization for every public form and API entry
 * point. The single source of truth for what counts as acceptable input —
 * actions and routes import from here instead of rolling their own checks.
 *
 * Rules of thumb enforced across the app:
 *  - Every free-text field is length-capped (prevents DB/DoS abuse).
 *  - Every phone/email/date/URL is validated against a strict format.
 *  - Every numeric field is range-capped (prevents runaway loops / rows).
 *  - Anything that will be stored is trimmed server-side before insert.
 */

// ---- Length caps (aligned with the tightest DB column where relevant) ----
export const MAX_NAME = 150;
export const MAX_PHONE = 30;
export const MAX_EMAIL = 150;
export const MAX_COMPANY = 200;
export const MAX_JOB_TITLE = 150;
export const MAX_REFERENCE = 100; // PO number, client ref, VAT number
export const MAX_EVENT_TYPE = 60;
export const MAX_CATERING = 60;
export const MAX_TEXT = 2000; // special requests / notes / details
export const MAX_LONG_NOTES = 3000; // corporate / event notes
export const MAX_URL = 500;

// ---- Numeric caps ----
export const MAX_STAY_NIGHTS = 60; // longest allowed stay
export const MAX_GUESTS_LEISURE = 4; // per leisure room (rooms sleep 2, allow families)
export const MAX_GUESTS_EVENT = 50;
export const MAX_ROOM_LINES = 20; // corporate request: distinct room-line entries
export const MAX_ROOM_COUNT = 50; // rooms per corporate line
export const MAX_GUESTS_PER_ROOM = 4; // per room in a corporate line
export const MAX_QUOTE_LINES = 100; // admin quote editor line items

// ---- Primitives ----

/** Trim + truncate any free-text value; empty string when not a string. */
export function safeText(value: unknown, max = MAX_TEXT): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

/**
 * Normalize a phone number to a canonical E.164-ish string, or "" if invalid.
 * Handles the formats guests actually type: separators (spaces, dashes,
 * parentheses, dots) are stripped, "00" international prefixes become "+",
 * and a bare South African local number ("082..." → "+2782...") gets the
 * +27 country code. This makes every format resolve to the same canonical
 * string, which matters for the admin OTP flow — the users table stores
 * E.164 numbers, so a local-format login must still match (and get its dev
 * OTP shown in development).
 */
export function normalizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  let cleaned = value.trim().replace(/[\s().-]/g, "");
  if (cleaned.startsWith("00")) cleaned = "+" + cleaned.slice(2);
  // Bare SA local number: 0XX XXX XXXX → +27XX XXX XXXX
  else if (/^0\d{9}$/.test(cleaned)) cleaned = "+27" + cleaned.slice(1);
  // E.164-ish: optional leading +, then 7-15 digits.
  if (!/^\+?\d{7,15}$/.test(cleaned)) return "";
  return cleaned;
}

export function isValidPhone(value: unknown): boolean {
  return normalizePhone(value) !== "";
}

export function isValidEmail(value: unknown): boolean {
  if (typeof value !== "string" || value.length > MAX_EMAIL) return false;
  // Practical email check (not RFC-5322 exhaustive): exactly one @, non-empty
  // local + domain, domain has a dot with a 2+ char TLD, no whitespace/<>().
  const email = value.trim();
  if (email.length < 3 || email.length > MAX_EMAIL) return false;
  if (!/^[^\s@<>()[\],;:]+@[^\s@<>()[\],;:]+\.[a-zA-Z]{2,}$/.test(email)) return false;
  if (email.includes("..")) return false;
  return true;
}

/** True for a strict calendar date string "YYYY-MM-DD". */
export function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** True when a calendar date is today or later (never in the past). */
export function isNotInPast(value: string, today = new Date()): boolean {
  const [y, m, d] = value.split("-").map(Number);
  const start = new Date(y, m - 1, d).getTime();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return start >= todayMidnight;
}

/** Whole nights between two calendar dates (>= 0). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn}T00:00:00Z`).getTime();
  const end = new Date(`${checkOut}T00:00:00Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

/** True when checkOut is strictly after checkIn and the stay is within bounds. */
export function isValidStay(checkIn: string, checkOut: string, maxNights = MAX_STAY_NIGHTS): boolean {
  if (!isValidIsoDate(checkIn) || !isValidIsoDate(checkOut)) return false;
  const nights = nightsBetween(checkIn, checkOut);
  return nights >= 1 && nights <= maxNights;
}

/** Integer within an inclusive range, or null when invalid. */
export function intInRange(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

/** Safe absolute http(s) URL, capped in length. */
export function isValidHttpUrl(value: unknown): boolean {
  if (typeof value !== "string" || value.length > MAX_URL) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.length > 0;
  } catch {
    return false;
  }
}

/**
 * Proof-of-payment URLs must point at our own file store (Vercel Blob) or, in
 * local development, at localhost. Anything else (javascript:, data:, foreign
 * hosts, raw strings) is rejected so a forged booking can't plant an arbitrary
 * URL into the admin panel.
 */
export function isSafeProofOfPaymentUrl(value: unknown): boolean {
  if (!isValidHttpUrl(value)) return false;
  try {
    const hostname = new URL(value as string).hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return process.env.NODE_ENV !== "production";
    }
    return hostname.endsWith("public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/** Restrict an enum-like string to an explicit allowlist. */
export function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}
