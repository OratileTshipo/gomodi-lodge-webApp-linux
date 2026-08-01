import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingRequests, bookingRoomLines, rooms } from "@/lib/db/schema";
import { eq, and, lt, gt } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json(); 

    if (action !== "approve" && action !== "decline") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Phase 2 Architecture §2.2: Server-side double-check for conflicts on approval
    if (action === "approve") {
      const reqDetails = await db
        .select({
          roomId: bookingRoomLines.roomId,
          checkIn: bookingRoomLines.checkIn,
          checkOut: bookingRoomLines.checkOut,
          roomName: rooms.name,
        })
        .from(bookingRequests)
        .innerJoin(bookingRoomLines, eq(bookingRequests.id, bookingRoomLines.bookingRequestId))
        .innerJoin(rooms, eq(bookingRoomLines.roomId, rooms.id))
        .where(eq(bookingRequests.id, parseInt(id)))
        .limit(1);

      if (reqDetails.length > 0) {
        const target = reqDetails[0];
        const overlaps = await db
          .select({ id: bookingRoomLines.id })
          .from(bookingRoomLines)
          .innerJoin(bookingRequests, eq(bookingRoomLines.bookingRequestId, bookingRequests.id))
          .where(
            and(
              eq(bookingRoomLines.roomId, target.roomId),
              eq(bookingRequests.status, "approved"),
              lt(bookingRoomLines.checkIn, target.checkOut),
              gt(bookingRoomLines.checkOut, target.checkIn)
            )
          )
          .limit(1);

        if (overlaps.length > 0) {
          return NextResponse.json(
            { error: `Cannot approve: Overlaps with an existing approved booking for ${target.roomName}.` },
            { status: 409 }
          );
        }
      }
    }

    await db
      .update(bookingRequests)
      .set({
        status: action === "approve" ? "approved" : "declined",
        approvedAt: new Date(),
      })
      .where(eq(bookingRequests.id, parseInt(id)));

    console.log(`\n========================================`);
    console.log(`[NOTIFICATION STUB] Booking #${id} ${action.toUpperCase()}D.`);
    console.log(`Guest would be notified via WhatsApp Cloud API here.`);
    console.log(`========================================\n`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update booking status:", error);
    // FIXED: Changed NextResponse to NextResponse
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 }); 
  }
}
