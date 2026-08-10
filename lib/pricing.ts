/**
 * Single source of truth for meal pricing.
 *
 * The booking wizard charges these exact per-person-per-night rates. Keep the
 * marketing copy (homepage, corporate page) reading from here so no surface
 * can drift from the price guests are actually quoted.
 */
export const BREAKFAST_PRICE = 175;
export const DINNER_PRICE = 300;

// TODO: confirm with Owner — placeholder only. Lunch is NOT exposed as a
// selectable option in any guest-facing form until a real rate is provided.
export const LUNCH_PRICE = 0;
