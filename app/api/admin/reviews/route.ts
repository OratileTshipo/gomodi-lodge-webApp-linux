import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { listAdminReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

/**
 * Admin reviews queue — any logged-in staff may READ pending/approved reviews
 * (approve/decline writes are manager-only, see [id]/route.ts), mirroring the
 * booking-request queue pattern.
 */
export async function GET() {
  try {
    const staff = await requireStaff();
    if (!staff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const reviews = await listAdminReviews();
    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Failed to load reviews:", error);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}
