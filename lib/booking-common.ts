/**
 * Shared helpers for the three booking server actions (leisure / corporate /
 * event) — contact sanitization and per-night meal add-on row building.
 *
 * Keeps the validation rules and add-on math in one place so the three flows
 * can't drift apart (same single-source-of-truth principle as lib/pricing.ts
 * and lib/validate.ts). Server-only — imported by "use server" actions.
 */
import { safeText, normalizePhone, isValidEmail, MAX_NAME } from "./validate";
import { BREAKFAST_PRICE, DINNER_PRICE } from "./pricing";
import { addOnSelections } from "./db/schema";

export type ContactInput = { name: unknown; phone: unknown; email?: unknown };

export type SanitizedContact =
  | { ok: true; name: string; phone: string; email: string | null }
  | { ok: false; error: string };

/**
 * Trim + validate a guest's name / phone / optional email in one pass. The
 * messages are deliberately shared across all three journeys so guests get
 * consistent feedback no matter which form they used.
 */
export function sanitizeContact(
  input: ContactInput,
  opts: { requireEmail?: boolean } = {}
): SanitizedContact {
  const name = safeText(input.name, MAX_NAME);
  if (!name) return { ok: false, error: "Please enter your name." };

  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: "Please enter a valid phone number." };

  let email: string | null = null;
  if (input.email !== undefined && input.email !== null && String(input.email).trim() !== "") {
    email = String(input.email).trim();
  }
  if (opts.requireEmail && !email) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (email && !isValidEmail(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  return { ok: true, name, phone, email };
}

/**
 * Build the addOnSelections rows for a stay: one row per meal type per night
 * at the current single-source prices. Order is breakfast rows then dinner
 * rows (insert order is irrelevant — the quote engine aggregates by type).
 */
export function buildAddOnRows(params: {
  bookingRequestId: number;
  nights: string[];
  guestCount: number;
  breakfast: boolean;
  dinner: boolean;
}): (typeof addOnSelections.$inferInsert)[] {
  const rows: (typeof addOnSelections.$inferInsert)[] = [];
  if (params.breakfast) {
    for (const night of params.nights) {
      rows.push({
        bookingRequestId: params.bookingRequestId,
        type: "breakfast",
        persons: params.guestCount,
        date: night,
        unitPrice: BREAKFAST_PRICE.toFixed(2),
      });
    }
  }
  if (params.dinner) {
    for (const night of params.nights) {
      rows.push({
        bookingRequestId: params.bookingRequestId,
        type: "dinner",
        persons: params.guestCount,
        date: night,
        unitPrice: DINNER_PRICE.toFixed(2),
      });
    }
  }
  return rows;
}
