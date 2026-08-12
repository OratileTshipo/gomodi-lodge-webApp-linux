import { NextResponse } from "next/server";
import { requireManager } from "@/lib/auth";
import { setReviewStatus } from "@/lib/reviews";

export const dynamic = "force-dynamic";

/**
 * Approve/decline a guest review. Manager-only (owner/assistant) — staff can
 * read the queue but not publish. Only `pending` reviews can transition, so a
 * double-click or stale tab can't double-publish or unpublish.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const manager = await requireManager();
    if (!manager) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!/^\d{1,9}$/.test(id)) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }
    const reviewId = parseInt(id, 10);
    if (!Number.isSafeInteger(reviewId) || reviewId < 1) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const action = body?.action;
    if (action !== "approve" && action !== "decline") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const changed = await setReviewStatus(
      reviewId,
      action,
      manager.userId
    );
    if (!changed) {
      return NextResponse.json(
        { error: "Review not found or already reviewed" },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update review:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}
