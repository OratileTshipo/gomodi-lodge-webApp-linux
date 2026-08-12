/**
 * Client-safe review options — no DB imports, so both the server engine
 * (lib/reviews.ts) and the client review form can use them without pulling
 * `pg` into the browser (same pattern as lib/seasonal.ts).
 *
 * These are the "how did it feel?" chips the guest picks from. The server
 * allowlists against this exact list, so the client can never sneak a
 * non-approved tag into a published review.
 */
export const REVIEW_FEELINGS = [
  "Slept well",
  "Felt at home",
  "Quiet & peaceful",
  "Great breakfast",
  "Warm welcome",
  "Comfortable bed",
  "Clean & fresh",
  "Work-friendly",
  "Beautiful gardens",
  "Would stay again",
] as const;

export type ReviewFeeling = (typeof REVIEW_FEELINGS)[number];

export const CATEGORY_LABELS: Record<string, string> = {
  leisure: "Leisure stay",
  corporate: "Business stay",
  event: "Event guest",
};

export function categoryLabel(category: string | null | undefined): string {
  if (!category) return "Guest stay";
  return CATEGORY_LABELS[category] || "Guest stay";
}
