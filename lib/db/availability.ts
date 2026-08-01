import { and, eq, lt, gt } from "drizzle-orm";
import { db } from "./index";
import { bookingRoomLines, bookingRequests } from "./schema";

/**
 * Returns true if the given room has an APPROVED, overlapping booking for the
 * requested date range. Per the Phase 2 Architecture Document, the real
 * availability-lock (which prevents two people approving conflicting requests)
 * is enforced at approval time, on the Admin Approval Screen slice — not built
 * yet. This check is the guest-facing half: it stops someone requesting a room
 * that is already confirmed unavailable, using simple date-range overlap logic
 * (two ranges overlap when each starts before the other ends).
 */
export async function isRoomAvailable(
  roomId: number,
  checkIn: string,
  checkOut: string
): Promise<boolean> {
  const overlapping = await db
    .select({ id: bookingRoomLines.id })
    .from(bookingRoomLines)
    .innerJoin(
      bookingRequests,
      eq(bookingRoomLines.bookingRequestId, bookingRequests.id)
    )
    .where(
      and(
        eq(bookingRoomLines.roomId, roomId),
        eq(bookingRequests.status, "approved"),
        lt(bookingRoomLines.checkIn, checkOut),
        gt(bookingRoomLines.checkOut, checkIn)
      )
    )
    .limit(1);

  return overlapping.length === 0;
}
