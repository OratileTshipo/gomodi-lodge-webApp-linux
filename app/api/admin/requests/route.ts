import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingRequests, bookingRoomLines, rooms, addOnSelections } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Fetch pending requests with room details
    const pendingRequests = await db
      .select({
        id: bookingRequests.id,
        category: bookingRequests.category,
        guestName: bookingRequests.guestName,
        contactPhone: bookingRequests.contactPhone,
        contactEmail: bookingRequests.contactEmail,
        specialRequests: bookingRequests.specialRequests,
        status: bookingRequests.status,
        roomId: bookingRoomLines.roomId,
        checkIn: bookingRoomLines.checkIn,
        checkOut: bookingRoomLines.checkOut,
        guestCount: bookingRoomLines.guestCount,
        roomName: rooms.name,
      })
      .from(bookingRequests)
      .innerJoin(bookingRoomLines, eq(bookingRequests.id, bookingRoomLines.bookingRequestId))
      .innerJoin(rooms, eq(bookingRoomLines.roomId, rooms.id))
      .where(eq(bookingRequests.status, "pending"));

    if (pendingRequests.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Fetch approved bookings for HARD conflict detection (Red Banner)
    const approvedBookings = await db
      .select({
        roomId: bookingRoomLines.roomId,
        checkIn: bookingRoomLines.checkIn,
        checkOut: bookingRoomLines.checkOut,
      })
      .from(bookingRequests)
      .innerJoin(bookingRoomLines, eq(bookingRequests.id, bookingRoomLines.bookingRequestId))
      .where(eq(bookingRequests.status, "approved"));

    // 3. Fetch add-ons for these pending requests
    const requestIds = pendingRequests.map(r => r.id);
    let addOnsMap: Record<number, any[]> = {};
    
    const addOns = await db
      .select({
        bookingRequestId: addOnSelections.bookingRequestId,
        type: addOnSelections.type,
        persons: addOnSelections.persons,
        date: addOnSelections.date,
      })
      .from(addOnSelections)
      .where(inArray(addOnSelections.bookingRequestId, requestIds));

    addOns.forEach(addon => {
      if (!addOnsMap[addon.bookingRequestId]) addOnsMap[addon.bookingRequestId] = [];
      addOnsMap[addon.bookingRequestId].push(addon);
    });

    // 4. Enrich with Hard Conflicts, Soft Warnings, and Add-ons
    const enrichedRequests = pendingRequests.map((req) => {
      let conflict: string | null = null;
      let pendingWarning: string | null = null;

      // HARD CONFLICT: Overlaps with an APPROVED booking (Red Banner)
      const hasApprovedOverlap = approvedBookings.some(
        (approved) =>
          approved.roomId === req.roomId &&
          new Date(approved.checkIn) < new Date(req.checkOut) &&
          new Date(approved.checkOut) > new Date(req.checkIn)
      );

      if (hasApprovedOverlap) {
        const inDate = new Date(req.checkIn).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }).toUpperCase();
        const outDate = new Date(req.checkOut).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }).toUpperCase();
        conflict = `OVERLAPS APPROVED BOOKING: ${req.roomName.toUpperCase()}, ${inDate}–${outDate}`;
      }

      // SOFT CONFLICT: Overlaps with ANOTHER PENDING booking (Amber Warning)
      const pendingOverlaps = pendingRequests.filter(
        (other) =>
          other.id !== req.id && // Don't compare against itself
          other.roomId === req.roomId &&
          new Date(other.checkIn) < new Date(req.checkOut) &&
          new Date(other.checkOut) > new Date(req.checkIn)
      );

      if (pendingOverlaps.length > 0) {
        pendingWarning = `ATTENTION: ${pendingOverlaps.length} OTHER PENDING REQUEST(S) FOR THIS ROOM ON THESE DATES`;
      }

      return {
        ...req,
        conflict,
        pendingWarning,
        addOns: addOnsMap[req.id] || [],
      };
    });

    return NextResponse.json(enrichedRequests);
  } catch (error: any) {
    console.error("❌ [API ERROR] Failed to fetch admin requests:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
