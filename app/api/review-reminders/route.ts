import { NextResponse } from "next/server";
import { createDueReviewInvites } from "@/lib/reviews";

export const dynamic = "force-dynamic";

/**
 * Post-stay review sweep — run by Vercel cron (see vercel.json). Finds
 * approved bookings whose stay has ended, creates one unguessable review
 * invite per booking, and delivers it by WhatsApp (fails open). The guest
 * writes a review at /review?token=…; staff approve it in the admin queue
 * before it appears publicly.
 */
export async function GET() {
  try {
    const created = await createDueReviewInvites();
    return NextResponse.json({ ok: true, invitesCreated: created });
  } catch (error) {
    console.error("Review reminder sweep failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
