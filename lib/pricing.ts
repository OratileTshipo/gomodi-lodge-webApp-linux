/**
 * Single source of truth for room + meal pricing.
 *
 * The booking wizard charges these exact per-person-per-night add-on rates
 * and the flat per-night room rate. Keep the marketing copy (homepage,
 * corporate page) reading from here so no surface can drift from the price
 * guests are actually quoted.
 */
export const BREAKFAST_PRICE = 175;
export const DINNER_PRICE = 300;
export const ROOM_BASE_RATE = 750;

// TODO: confirm with Owner — placeholder only. Lunch is NOT exposed as a
// selectable option in any guest-facing form until a real rate is provided.
export const LUNCH_PRICE = 0;

// Catering packages (events) — per-person rates shown on the events page and
// inquiry form. Single source so the marketing copy can't drift from what the
// form actually offers.
export const EVENT_CATERING = {
  "tea-snacks": 150,
  "three-course": 250,
  "full-day": 350,
} as const;

/** The headline "from R… pp" figure used in teaser copy. */
export const EVENT_CATERING_FROM = EVENT_CATERING["tea-snacks"];
