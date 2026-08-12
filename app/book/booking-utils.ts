/**
 * Shared helpers + types for the booking wizard (BookingForm and its step
 * components). Date formatting is deliberately local-calendar based — the
 * naive new Date(iso) / toISOString() round-trip shifts dates by a day in
 * UTC+ timezones (see the notes on each helper).
 */
import type { SeasonalPeriod } from "@/lib/seasonal";

export type { SeasonalPeriod };

/** Room shape passed to the booking wizard (mapped in app/book/page.tsx). */
export type BookingRoom = {
  id: number;
  name: string;
  config: string;
  bathOrShower: string;
  baseRate: string | number;
  flexible: boolean;
  images: string[];
};

/** Parse "YYYY-MM-DD" into LOCAL date components and format for display. */
export function fmtDate(iso: string) {
  // new Date(iso) parses as UTC midnight, which shows the previous day for
  // negative-UTC timezones.
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return date.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Local calendar date as YYYY-MM-DD (NOT UTC — toISOString shifts a day back east of UTC). */
export function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Short ZAR price label (e.g. "R1 500"). */
export function fmt(n: number) {
  return "R" + n.toLocaleString("en-ZA");
}
