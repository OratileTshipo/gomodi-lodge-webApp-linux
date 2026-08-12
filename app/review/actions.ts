"use server";

import {
  submitReview as engineSubmitReview,
  type SubmitReviewResult,
} from "@/lib/reviews";

/**
 * Server action backing the token-gated /review form. All validation happens
 * in the engine (token validity, rating bounds, length caps, feelings
 * allowlist, photo URL allowlist) — never trust the client.
 */
export async function submitGuestReview(
  input: {
    token: string;
    rating: number;
    headline: string;
    body: string;
    feelings: string[];
    guestName: string;
    consentToPublish: boolean;
    photos: string[];
  }
): Promise<SubmitReviewResult> {
  return engineSubmitReview(input);
}
