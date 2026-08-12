import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import {
  bookingRequests,
  bookingRoomLines,
  rooms,
  addOnSelections,
  eventDetails,
  corporateDetails,
  proofOfPayments,
  quotes,
} from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

type PendingRequest = {
  id: number;
  category: string;
  guestName: string;
  contactPhone: string;
  contactEmail: string | null;
  specialRequests: string | null;
  status: string;
  notifiedPartnerAt: Date | null;
  contactedAt: Date | null;
};

type RoomLine = {
  roomId: number;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  roomName: string;
};

type ApprovedBooking = {
  roomId: number;
  checkIn: string;
  checkOut: string;
};

type AddOn = {
  type: string;
  persons: number;
  date: string;
};

function overlaps(
  a: { checkIn: string; checkOut: string },
  b: { checkIn: string; checkOut: string }
): boolean {
  return new Date(a.checkIn) < new Date(b.checkOut) && new Date(a.checkOut) > new Date(b.checkIn);
}

/**
 * Pure enrichment logic for the pending-request queue. Extracted so it can be
 * unit-tested without a database.
 *
 * - leisure requests have exactly one room line
 * - corporate requests can have several (one card per request, not per line)
 * - event requests have NO room lines — they must still appear in the queue
 */
export function enrichRequests(
  pending: PendingRequest[],
  linesByRequest: Record<number, RoomLine[]>,
  approvedBookings: ApprovedBooking[],
  addOnsMap: Record<number, AddOn[]>,
  corporateMap: Record<number, unknown>,
  eventMap: Record<number, unknown>,
  popMap: Record<number, boolean>
) {
  return pending.map((req) => {
    const lines = linesByRequest[req.id] || [];

    // HARD CONFLICT: any line overlaps an APPROVED booking (red banner)
    let conflict: string | null = null;
    for (const line of lines) {
      const hit = approvedBookings.some(
        (approved) => approved.roomId === line.roomId && overlaps(line, approved)
      );
      if (hit) {
        const inDate = new Date(line.checkIn)
          .toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
          .toUpperCase();
        const outDate = new Date(line.checkOut)
          .toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
          .toUpperCase();
        conflict = `OVERLAPS APPROVED BOOKING: ${line.roomName.toUpperCase()}, ${inDate}–${outDate}`;
        break;
      }
    }

    // SOFT CONFLICT: any line overlaps ANOTHER pending request's lines (amber banner)
    let pendingWarning: string | null = null;
    if (lines.length > 0) {
      const overlappingIds = new Set<number>();
      for (const line of lines) {
        for (const other of pending) {
          if (other.id === req.id) continue;
          for (const otherLine of linesByRequest[other.id] || []) {
            if (line.roomId === otherLine.roomId && overlaps(line, otherLine)) {
              overlappingIds.add(other.id);
            }
          }
        }
      }
      if (overlappingIds.size > 0) {
        pendingWarning = `ATTENTION: ${overlappingIds.size} OTHER PENDING REQUEST(S) FOR THIS ROOM ON THESE DATES`;
      }
    }

    // Primary line drives the date/room fields (null for events, which have none)
    const primary = lines[0] || null;

    return {
      ...req,
      roomId: primary?.roomId ?? null,
      checkIn: primary?.checkIn ?? null,
      checkOut: primary?.checkOut ?? null,
      guestCount: primary?.guestCount ?? null,
      roomName: primary?.roomName ?? null,
      conflict,
      pendingWarning,
      addOns: addOnsMap[req.id] || [],
      corporateDetails: corporateMap[req.id] || null,
      eventDetails: eventMap[req.id] || null,
      proofOfPaymentUploaded: popMap[req.id] || false,
    };
  });
}

export async function GET() {
  try {
    // Server-side auth: any logged-in user may READ the queue, but the role
    // determines WHICH categories they may see (enforced here, not just in the
    // client): owner/assistant see everything, staff see leisure only, and the
    // Lelz partner sees event/catering requests only.
    const staff = await requireStaff();
    if (!staff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Pending requests, role-scoped by category. Events are NOT joined
    //    against booking_room_lines (they have none) — inner-joining that
    //    table used to silently drop event requests from the queue.
    const whereConditions = [eq(bookingRequests.status, "pending")];
    if (staff.role === "staff") {
      // Staff must NEVER see event/catering data — leisure only.
      whereConditions.push(eq(bookingRequests.category, "leisure"));
    } else if (staff.role === "partner") {
      // Partner (Lelz): event/catering queue only; no room-booking history.
      whereConditions.push(eq(bookingRequests.category, "event"));
    }
    const pending: PendingRequest[] = await db
      .select({
        id: bookingRequests.id,
        category: bookingRequests.category,
        guestName: bookingRequests.guestName,
        contactPhone: bookingRequests.contactPhone,
        contactEmail: bookingRequests.contactEmail,
        specialRequests: bookingRequests.specialRequests,
        status: bookingRequests.status,
        notifiedPartnerAt: bookingRequests.notifiedPartnerAt,
        contactedAt: bookingRequests.contactedAt,
      })
      .from(bookingRequests)
      .where(and(...whereConditions));

    if (pending.length === 0) return NextResponse.json([]);

    const requestIds = pending.map((r) => r.id);

    // 2-8. All remaining lookups depend only on requestIds (or nothing), so
    // run them in parallel instead of 7 sequential Neon round-trips. On the
    // serverless DB this cut the dashboard's data time from ~1.5s to ~0.2s.
    const [lineRows, approvedBookings, addOns, corporateData, eventData, popData, quoteData] =
      await Promise.all([
        // Room lines grouped by request (leisure: 1, corporate: several, event: none)
        db
          .select({
            bookingRequestId: bookingRoomLines.bookingRequestId,
            roomId: bookingRoomLines.roomId,
            checkIn: bookingRoomLines.checkIn,
            checkOut: bookingRoomLines.checkOut,
            guestCount: bookingRoomLines.guestCount,
            roomName: rooms.name,
          })
          .from(bookingRoomLines)
          .innerJoin(rooms, eq(bookingRoomLines.roomId, rooms.id))
          .where(inArray(bookingRoomLines.bookingRequestId, requestIds)),

        // Approved bookings for HARD conflict detection
        db
          .select({
            roomId: bookingRoomLines.roomId,
            checkIn: bookingRoomLines.checkIn,
            checkOut: bookingRoomLines.checkOut,
          })
          .from(bookingRequests)
          .innerJoin(bookingRoomLines, eq(bookingRequests.id, bookingRoomLines.bookingRequestId))
          .where(eq(bookingRequests.status, "approved")),

        // Add-ons for these pending requests
        db
          .select({
            bookingRequestId: addOnSelections.bookingRequestId,
            type: addOnSelections.type,
            persons: addOnSelections.persons,
            date: addOnSelections.date,
          })
          .from(addOnSelections)
          .where(inArray(addOnSelections.bookingRequestId, requestIds)),

        // Corporate details
        db.select().from(corporateDetails).where(inArray(corporateDetails.bookingRequestId, requestIds)),

        // Event details
        db.select().from(eventDetails).where(inArray(eventDetails.bookingRequestId, requestIds)),

        // Proof-of-payment status
        db
          .select({ bookingRequestId: proofOfPayments.bookingRequestId })
          .from(proofOfPayments)
          .where(inArray(proofOfPayments.bookingRequestId, requestIds)),

        // Quote per request (draft quote auto-generated at submission time)
        db
          .select({
            bookingRequestId: quotes.bookingRequestId,
            id: quotes.id,
            quoteNumber: quotes.quoteNumber,
            status: quotes.status,
            total: quotes.total,
          })
          .from(quotes)
          .where(inArray(quotes.bookingRequestId, requestIds)),
      ]);

    const linesByRequest: Record<number, RoomLine[]> = {};
    for (const row of lineRows) {
      (linesByRequest[row.bookingRequestId] ||= []).push({
        roomId: row.roomId,
        checkIn: row.checkIn,
        checkOut: row.checkOut,
        guestCount: row.guestCount,
        roomName: row.roomName,
      });
    }

    const addOnsMap: Record<number, AddOn[]> = {};
    for (const a of addOns) {
      (addOnsMap[a.bookingRequestId] ||= []).push(a);
    }

    const corporateMap: Record<number, unknown> = {};
    for (const cd of corporateData) corporateMap[cd.bookingRequestId] = cd;

    const eventMap: Record<number, unknown> = {};
    for (const ed of eventData) eventMap[ed.bookingRequestId] = ed;

    const popMap: Record<number, boolean> = {};
    for (const p of popData) popMap[p.bookingRequestId] = true;

    const quotesMap: Record<number, unknown> = {};
    for (const q of quoteData) quotesMap[q.bookingRequestId] = q;

    const enriched = enrichRequests(
      pending,
      linesByRequest,
      approvedBookings,
      addOnsMap,
      corporateMap,
      eventMap,
      popMap
    );

    // Attach quote summary to each request card (for the dashboard badge).
    for (const row of enriched) {
      (row as Record<string, unknown>).quote = quotesMap[row.id] || null;
    }

    return NextResponse.json(enriched);
  } catch (error) {
    // Never leak internal error details (DB internals, driver messages) to
    // the client — log them server-side and return a generic message.
    console.error("❌ [API ERROR] Failed to fetch admin requests:", error);
    return NextResponse.json({ error: "Failed to load requests" }, { status: 500 });
  }
}
