/**
 * Room display helpers — shared across the homepage, rooms explorer, and
 * booking wizard so room fields render identically everywhere.
 *
 * The seed/DB stores bathroom type as "Bath" / "Shower" (capitalised), so
 * comparisons are case-insensitive — a lowercased "bath" check would silently
 * render every room as "Shower".
 */

/** Human label for a room's bathroom type ("Bath" or "Shower"). */
export function bathLabel(bathOrShower: string): string {
  return bathOrShower.trim().toLowerCase() === "bath" ? "Bath" : "Shower";
}
