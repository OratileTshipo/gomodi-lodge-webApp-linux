import { and, eq, lt, gt } from "drizzle-orm";
import { db } from "./index";
import { bookingRoomLines, bookingRequests } from "./schema";

/**
 * Returns true if the given room has an APPROVED, overlapping booking for the
 * requested date range. This is the guest-facing half of availability: it
 * stops someone requesting a room that is already confirmed unavailable.
 *
 * The authoritative lock — the one that prevents two managers approving
 * conflicting requests — is enforced at approval time in
 * app/api/admin/requests/[id]/route.ts (Postgres advisory locks + re-check
 * inside a transaction). This read-only check uses simple date-range overlap
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
