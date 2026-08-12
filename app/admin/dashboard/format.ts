/** Pure display helpers for the admin queue (testable, no React imports). */

export function getCategoryColor(cat: string): string {
  if (cat === "leisure") return "pill pill-leisure";
  if (cat === "corporate") return "pill pill-corporate";
  if (cat === "event") return "pill pill-event";
  return "pill pill-neutral";
}

export function getCategoryLabel(cat: string): string {
  if (cat === "leisure") return "LEISURE";
  if (cat === "corporate") return "CORPORATE";
  if (cat === "event") return "EVENT";
  return cat.toUpperCase();
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });
}

export function fmtClockTime(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
