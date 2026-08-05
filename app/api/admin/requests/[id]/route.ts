import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingRequests, bookingRoomLines, rooms } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

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

    // Phase 2 Architecture §2.2: Server-side double-check for conflicts on approval.
    // Checks EVERY room line of the request (corporate bookings can span several
    // rooms — a limit(1) check would silently approve an overlapping second room).
    // Events have no room lines and skip this check, which is correct for them.
    if (action === "approve") {
      const requestLines = await db
        .select({
          roomId: bookingRoomLines.roomId,
          checkIn: bookingRoomLines.checkIn,
          checkOut: bookingRoomLines.checkOut,
          roomName: rooms.name,
        })
        .from(bookingRoomLines)
        .innerJoin(rooms, eq(bookingRoomLines.roomId, rooms.id))
        .where(eq(bookingRoomLines.bookingRequestId, parseInt(id)));

      if (requestLines.length > 0) {
        const roomIds = requestLines.map((l) => l.roomId);
        const approvedBookings = await db
          .select({
            roomId: bookingRoomLines.roomId,
            checkIn: bookingRoomLines.checkIn,
            checkOut: bookingRoomLines.checkOut,
          })
          .from(bookingRequests)
          .innerJoin(bookingRoomLines, eq(bookingRequests.id, bookingRoomLines.bookingRequestId))
          .where(
            and(
              eq(bookingRequests.status, "approved"),
              inArray(bookingRoomLines.roomId, roomIds)
            )
          );

        for (const line of requestLines) {
          const hit = approvedBookings.some(
            (approved) =>
              approved.roomId === line.roomId &&
              new Date(line.checkIn) < new Date(approved.checkOut) &&
              new Date(line.checkOut) > new Date(approved.checkIn)
          );
          if (hit) {
            return NextResponse.json(
              { error: `Cannot approve: Overlaps with an existing approved booking for ${line.roomName}.` },
              { status: 409 }
            );
          }
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
