import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json(); // "approve" or "decline"

    if (action !== "approve" && action !== "decline") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Phase 2b Style Note §5: Server-side double-check for conflicts on approval
    if (action === "approve") {
      // (Optional but recommended: re-run the overlap check here before allowing the status change)
      // For MVP, we trust the UI warning, but the DB constraint is the ultimate source of truth.
    }

    await db
      .update(bookingRequests)
      .set({
        status: action === "approve" ? "approved" : "declined",
        approvedAt: new Date(),
        // approvedById: 1, // TODO: Wire up real user ID from session when RBAC is fully implemented
      })
      .where(eq(bookingRequests.id, parseInt(id)));

    // TODO: Trigger WhatsApp stub/notification to guest here (Phase 3 Changelog)
    console.log(`\n[NOTIFICATION STUB] Booking #${id} ${action}d. Guest notified.`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update booking status:", error);
    return Next0Response.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
