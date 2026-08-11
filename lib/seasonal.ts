/**
 * Seasonal pricing — pure helpers, no DB imports so BOTH server components
 * and client components can use them without pulling `pg` into the browser.
 *
 * A seasonal period is a date range with its own per-night rate (e.g. the
 * December festive season at R950). When a night falls inside an ACTIVE
 * period the seasonal rate applies; otherwise the room's base rate does.
 * This is how the owner "sets a higher price for the busy weekend, then it
 * resets by itself once the weekend is over."
 */

export type SeasonalPeriod = {
  id?: number;
  label: string;
  /** Inclusive, YYYY-MM-DD */
  startDate: string;
  /** Inclusive, YYYY-MM-DD */
  endDate: string;
  ratePerNight: string;
  active: boolean;
};

/** Local-calendar YYYY-MM-DD for a Date (avoids UTC day-shift bugs). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isDateInPeriod(date: string, period: SeasonalPeriod): boolean {
  return date >= period.startDate && date <= period.endDate;
}

/** Per-night rate for one date, or the base rate when no active period hits. */
export function nightlyRateForDate(
  baseRate: string,
  date: string,
  periods: SeasonalPeriod[]
): string {
  const hit = periods.find((p) => p.active && isDateInPeriod(date, p));
  return hit ? hit.ratePerNight : baseRate;
}

export type NightRate = { date: string; rate: string };

/**
 * Resolve the per-night rate for every night of a stay (check-in inclusive,
 * check-out exclusive — same convention as the booking engine).
 */
export function nightlyRatesForStay(
  baseRate: string,
  checkIn: string,
  checkOut: string,
  periods: SeasonalPeriod[]
): NightRate[] {
  const out: NightRate[] = [];
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const iso = toISODate(d);
    out.push({ date: iso, rate: nightlyRateForDate(baseRate, iso, periods) });
  }
  return out;
}

/** True when at least one night of the stay is charged at a seasonal rate. */
export function stayHasSeasonalNights(
  baseRate: string,
  checkIn: string,
  checkOut: string,
  periods: SeasonalPeriod[]
): boolean {
  return nightlyRatesForStay(baseRate, checkIn, checkOut, periods).some(
    (n) => n.rate !== baseRate
  );
}
