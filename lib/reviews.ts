/**
 * Guest review engine — capture, moderate, publish.
 *
 * Lifecycle: when an approved booking's stay has ended, a review invite
 * (unguessable token, one per booking request) is created and delivered by
 * WhatsApp (/api/review-reminders). The guest opens /review?token=…, writes a
 * review, and it lands as `pending`. Staff approve/decline in the admin
 * reviews queue; only APPROVED reviews are shown publicly.
 *
 * Guardrails (binding — see UI-findings-and-recommendations.md §8):
 *  - No fabricated reviews. Every review must trace to a real booking via
 *    the invite token. There is no anonymous public review form.
 *  - POPIA: the form captures explicit consent to publish; a review without
 *    consent displays as "Guest".
 *  - Never show pending reviews publicly.
 */
import { randomBytes } from "crypto";
import { db } from "./db";
import {
  reviews,
  reviewInvites,
  bookingRequests,
  bookingRoomLines,
  eventDetails,
  rooms,
} from "./db/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import { REVIEW_FEELINGS } from "./review-options";

export type ReviewStatus = "pending" | "approved" | "declined";

export type PublicReview = {
  id: number;
  guestName: string;
  category: string | null;
  rating: number;
  headline: string;
  body: string;
  feelings: string[];
  photos: string[];
  submittedAt: Date;
};

// ---------------------------------------------------------------------------
// Invites
// ---------------------------------------------------------------------------

function newInviteToken(): string {
  return randomBytes(18).toString("base64url");
}

/** True when the guest's stay is over (all room lines' check-outs in the past). */
export async function stayHasEnded(bookingRequestId: number): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select({ checkOut: bookingRoomLines.checkOut })
    .from(bookingRoomLines)
    .where(eq(bookingRoomLines.bookingRequestId, bookingRequestId));
  if (rows.length === 0) {
    // Events have no room lines — only invite once the event date has passed.
    const [ev] = await db
      .select({ eventDate: eventDetails.eventDate })
      .from(eventDetails)
      .where(eq(eventDetails.bookingRequestId, bookingRequestId));
    return ev ? ev.eventDate < today : true;
  }
  return rows.every((r) => r.checkOut < today);
}

/**
 * Create a review invite for a booking request (idempotent — one per request).
 * Returns the token, or null if an invite already exists.
 */
export async function createReviewInvite(bookingRequestId: number): Promise<string | null> {
  const [existing] = await db
    .select({ token: reviewInvites.token })
    .from(reviewInvites)
    .where(eq(reviewInvites.bookingRequestId, bookingRequestId));
  if (existing) return existing.token;

  const [invite] = await db
    .insert(reviewInvites)
    .values({ bookingRequestId, token: newInviteToken() })
    .returning({ token: reviewInvites.token });
  return invite?.token ?? null;
}

export type InviteContext = {
  token: string;
  guestName: string;
  category: "leisure" | "corporate" | "event";
  alreadySubmitted: boolean;
  hasReview: boolean;
};

/** Validate a token from /review?token=… and return what the form needs. */
export async function loadInviteContext(token: string): Promise<InviteContext | null> {
  const [invite] = await db
    .select({
      token: reviewInvites.token,
      status: reviewInvites.status,
      guestName: bookingRequests.guestName,
      category: bookingRequests.category,
      hasReview: sql<boolean>`EXISTS (
        SELECT 1 FROM ${reviews} WHERE ${reviews.bookingRequestId} = ${bookingRequests.id}
      )`,
    })
    .from(reviewInvites)
    .innerJoin(bookingRequests, eq(reviewInvites.bookingRequestId, bookingRequests.id))
    .where(eq(reviewInvites.token, token));
  if (!invite) return null;
  return {
    token: invite.token,
    guestName: invite.guestName,
    category: invite.category,
    alreadySubmitted: invite.status === "submitted" || Boolean(invite.hasReview),
    hasReview: Boolean(invite.hasReview),
  };
}

// ---------------------------------------------------------------------------
// Submission (server action path — app/review/actions.ts)
// ---------------------------------------------------------------------------

export type SubmitReviewInput = {
  token: string;
  rating: number;
  headline: string;
  body: string;
  feelings: string[];
  guestName: string;
  consentToPublish: boolean;
  photos: string[];
};

export type SubmitReviewResult = { ok: true } | { ok: false; error: string };

const FEELINGS_ALLOWLIST: readonly string[] = REVIEW_FEELINGS;

/** One active review per invite — reuse it if the guest edits after approval. */
export async function submitReview(input: SubmitReviewInput): Promise<SubmitReviewResult> {
  const token = String(input.token || "").slice(0, 64);
  if (!token) return { ok: false, error: "This review link is invalid." };

  const invite = await loadInviteContext(token);
  if (!invite) return { ok: false, error: "This review link is invalid." };
  if (invite.alreadySubmitted) {
    return { ok: false, error: "A review has already been submitted for this stay." };
  }

  const rating = Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Please choose a star rating from 1 to 5." };
  }
  const headline = String(input.headline || "").trim().slice(0, 120);
  if (!headline) return { ok: false, error: "Please add a short headline." };
  const body = String(input.body || "").trim().slice(0, 2000);
  if (!body) return { ok: false, error: "Please tell us about your stay." };

  const feelings = (Array.isArray(input.feelings) ? input.feelings : [])
    .filter((f): f is string => typeof f === "string")
    .map((f) => f.slice(0, 40))
    .filter((f) => FEELINGS_ALLOWLIST.includes(f))
    .slice(0, 5);

  const photos = (Array.isArray(input.photos) ? input.photos : [])
    .filter((p): p is string => typeof p === "string")
    .map((p) => p.slice(0, 500))
    .filter((p) => p.startsWith("https://"))
    .slice(0, 3);

  const guestName = String(input.guestName || "").trim().slice(0, 150);
  const consentToPublish = Boolean(input.consentToPublish);

  try {
    // Insert the review + mark the invite submitted atomically — a failure
    // between the two would leave the invite "sent" with a review already
    // present (the hasReview guard would still block re-submission, but the
    // invite status would be a lie).
    await db.transaction(async (tx) => {
      const [inviteRow] = await tx
        .select({ bookingRequestId: reviewInvites.bookingRequestId })
        .from(reviewInvites)
        .where(eq(reviewInvites.token, token));
      if (!inviteRow) throw new Error("Review invite vanished mid-submit");

      await tx
        .insert(reviews)
        .values({
          bookingRequestId: inviteRow.bookingRequestId,
          guestName: consentToPublish ? guestName : "",
          category: invite.category,
          rating,
          headline,
          body,
          feelings,
          photos,
          status: "pending",
          consentToPublish,
        });

      await tx
        .update(reviewInvites)
        .set({ status: "submitted", submittedAt: new Date() })
        .where(eq(reviewInvites.token, token));
    });

    return { ok: true };
  } catch (err) {
    console.error("Failed to submit review:", err);
    return { ok: false, error: "Something went wrong saving your review. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// Public reads (homepage + rooms teasers) — approved only
// ---------------------------------------------------------------------------

export async function listApprovedReviews(limit = 3): Promise<PublicReview[]> {
  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.status, "approved"))
    .orderBy(desc(reviews.approvedAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    guestName: r.guestName || "Guest",
    category: r.category,
    rating: r.rating,
    headline: r.headline,
    body: r.body,
    feelings: r.feelings,
    photos: r.photos,
    submittedAt: r.submittedAt,
  }));
}

/** Aggregate stats from approved reviews (for a "4.8 · 12 reviews" badge). */
export async function reviewStats(): Promise<{ count: number; average: number }> {
  // SQL aggregates instead of pulling every approved rating into JS — count
  // and average stay on the DB. Casts keep real JS numbers (pg returns int8
  // counts and numerics as strings otherwise).
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      average: sql<number>`coalesce(round(avg(${reviews.rating})::numeric, 1), 0)::float8`,
    })
    .from(reviews)
    .where(eq(reviews.status, "approved"));
  return { count: row?.count ?? 0, average: row?.average ?? 0 };
}

// ---------------------------------------------------------------------------
// Admin reads/writes
// ---------------------------------------------------------------------------

export type AdminReviewRow = {
  id: number;
  guestName: string;
  category: string | null;
  rating: number;
  headline: string;
  body: string;
  feelings: string[];
  photos: string[];
  status: ReviewStatus;
  consentToPublish: boolean;
  submittedAt: Date;
  bookingId: number | null;
  stayDates: { checkIn: string; checkOut: string } | null;
  roomName: string | null;
};

export async function listAdminReviews(): Promise<AdminReviewRow[]> {
  const rows = await db
    .select({
      id: reviews.id,
      guestName: reviews.guestName,
      category: reviews.category,
      rating: reviews.rating,
      headline: reviews.headline,
      body: reviews.body,
      feelings: reviews.feelings,
      photos: reviews.photos,
      status: reviews.status,
      consentToPublish: reviews.consentToPublish,
      submittedAt: reviews.submittedAt,
      bookingId: reviews.bookingRequestId,
      checkIn: bookingRoomLines.checkIn,
      checkOut: bookingRoomLines.checkOut,
      roomName: rooms.name,
    })
    .from(reviews)
    .leftJoin(bookingRoomLines, eq(reviews.bookingRequestId, bookingRoomLines.bookingRequestId))
    .leftJoin(rooms, eq(bookingRoomLines.roomId, rooms.id))
    .orderBy(desc(reviews.submittedAt));

  // Group by review — a corporate request can have several room lines; keep
  // the first as the representative stay.
  const byId = new Map<number, AdminReviewRow>();
  for (const r of rows) {
    const existing = byId.get(r.id);
    const stayDates =
      r.checkIn && r.checkOut ? { checkIn: r.checkIn, checkOut: r.checkOut } : null;
    if (!existing) {
      byId.set(r.id, {
        id: r.id,
        guestName: r.guestName,
        category: r.category,
        rating: r.rating,
        headline: r.headline,
        body: r.body,
        feelings: r.feelings,
        photos: r.photos,
        status: r.status as ReviewStatus,
        consentToPublish: r.consentToPublish,
        submittedAt: r.submittedAt,
        bookingId: r.bookingId,
        stayDates,
        roomName: r.roomName,
      });
    }
  }
  return [...byId.values()];
}

export async function setReviewStatus(
  reviewId: number,
  status: "approved" | "declined",
  approvedById: number
): Promise<boolean> {
  const result = await db
    .update(reviews)
    .set({
      status,
      approvedById,
      approvedAt: new Date(),
    })
    .where(and(eq(reviews.id, reviewId), eq(reviews.status, "pending")));
  return (result.rowCount ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Post-stay reminder sweep (cron — app/api/review-reminders/route.ts)
// ---------------------------------------------------------------------------

/**
 * Find approved bookings whose stay has ended, with no invite yet, and create
 * + deliver review invites. Returns the number of new invites created.
 */
export async function createDueReviewInvites(): Promise<number> {
  const approved = await db
    .select({
      id: bookingRequests.id,
      guestName: bookingRequests.guestName,
      contactPhone: bookingRequests.contactPhone,
    })
    .from(bookingRequests)
    .where(eq(bookingRequests.status, "approved"));

  let created = 0;
  for (const booking of approved) {
    const [existing] = await db
      .select({ id: reviewInvites.id })
      .from(reviewInvites)
      .where(eq(reviewInvites.bookingRequestId, booking.id));
    if (existing) continue;

    if (!(await stayHasEnded(booking.id))) continue;

    const token = await createReviewInvite(booking.id);
    if (token) {
      created += 1;
      // Deliver (fails open — the /review link is also reachable from the
      // booking success screen and admin queue while WhatsApp is unset).
      const { notifyGuestOfReviewRequest } = await import("./notifications");
      await notifyGuestOfReviewRequest({
        phone: booking.contactPhone,
        guestName: booking.guestName,
        link: reviewLink(token),
      });
    }
  }
  return created;
}

/** Build the public review URL for a token (env-aware like the quote link). */
export function reviewLink(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/review?token=${encodeURIComponent(token)}`;
}
