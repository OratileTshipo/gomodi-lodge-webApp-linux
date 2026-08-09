/**
 * Pure quotation money math — the single source of truth for totals.
 *
 * Deliberately dependency-free (no db, no crypto, no server APIs) so BOTH the
 * server engine (lib/quotes.ts) and the client quote editor can import it
 * without drifting apart. Tests in scripts/test-quotes.ts cover this module.
 *
 * All arithmetic is done in integer cents to avoid float drift.
 */

export interface QuoteTotals {
  subtotal: string;
  vatAmount: string;
  total: string;
}

export function toCents(value: string | number): number {
  const n = typeof value === "number" ? value : parseFloat(value);
  return Math.round((Number.isFinite(n) ? n : 0) * 100);
}

function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Compute subtotal / VAT / total from line items and a VAT percentage. */
export function computeTotals(
  lines: { quantity: string | number; unitPrice: string | number }[],
  vatRate: string | number
): QuoteTotals {
  const subtotalCents = lines.reduce(
    (sum, l) => sum + Math.round((toCents(l.quantity) * toCents(l.unitPrice)) / 100),
    0
  );
  const rate = parseFloat(String(vatRate));
  const vatCents = Math.round(
    (subtotalCents * (Number.isFinite(rate) && rate > 0 ? Math.min(rate, 100) : 0)) / 100
  );
  return {
    subtotal: fromCents(subtotalCents),
    vatAmount: fromCents(vatCents),
    total: fromCents(subtotalCents + vatCents),
  };
}

export function formatZAR(value: string | number): string {
  const n = typeof value === "number" ? value : parseFloat(value);
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

/** Sanitize a numeric string/number to a non-negative decimal string (2dp). */
export function clampNonNegative(value: string | number | null | undefined, fallback = "0"): string {
  const raw = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  const n = Number.isFinite(raw) && raw >= 0 ? raw : Math.max(0, parseFloat(fallback) || 0);
  return n.toFixed(2);
}
