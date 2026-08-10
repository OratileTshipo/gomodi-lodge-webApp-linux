import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getCurrentUser,
  isManagerRole,
  isPartnerRole,
} from "@/lib/auth";
import { bookingRequests, bookingRoomLines, rooms } from "@/lib/db/schema";
import { notifyGuestOfBookingDecision } from "@/lib/notifications";
import { and, eq, inArray, sql } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Server-side auth. Owner/assistant may manage any booking. The Lelz
    // partner may approve/decline/contact EVENT requests only (never room
    // bookings). Staff get no write access at all.
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const manager = isManagerRole(user.role) ? user : null;
    const partner = isPartnerRole(user.role) ? user : null;
    if (!manager && !partner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    // Strict id validation — rejects non-numeric / overflow / negative ids
    // before they ever reach the query builder.
    if (!/^\d{1,9}$/.test(id)) {
      return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
    }
    const requestId = parseInt(id, 10);
    if (!Number.isSafeInteger(requestId) || requestId < 1) {
      return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
    }

    // Fetch the request's category — needed to gate the partner role and to
    // validate the "contact" action (event requests only).
    const [reqRow] = await db
      .select({ category: bookingRequests.category })
      .from(bookingRequests)
      .where(eq(bookingRequests.id, requestId));
    if (!reqRow) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Partner scope is strictly event/catering requests.
    if (partner && reqRow.category !== "event") {
      return NextResponse.json(
        { error: "Partners may only manage event requests" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const action = body?.action;
    if (action !== "approve" && action !== "decline" && action !== "contact") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // "Contacted" is the Lelz-side status marker on event requests — a status
    // update only, distinct from approve/decline (it never drives room
    // conflicts). Available to owner/assistant and partner on events.
    if (action === "contact") {
      if (reqRow.category !== "event") {
        return NextResponse.json(
          { error: "Only event requests can be marked contacted" },
          { status: 400 }
        );
      }
      await db
        .update(bookingRequests)
        .set({ contactedAt: new Date() })
        .where(eq(bookingRequests.id, requestId));
      return NextResponse.json({ success: true, contacted: true });
    }

    if (action === "approve") {
      // Approve is a read-check-write sequence; two managers approving
      // different pending requests for the same room/dates concurrently could
      // both pass the conflict check and double-book. Serialize on the rooms
      // with Postgres advisory locks (transaction-scoped, auto-released), then
      // re-read and re-check INSIDE the transaction so the check and the
      // status write are atomic. Advisory locks also guard against the
      // approve-vs-approve race, not just approve-vs-insert.
      const outcome = await db.transaction(async (tx) => {
        const requestLines = await tx
          .select({
            roomId: bookingRoomLines.roomId,
            checkIn: bookingRoomLines.checkIn,
            checkOut: bookingRoomLines.checkOut,
            roomName: rooms.name,
          })
          .from(bookingRoomLines)
          .innerJoin(rooms, eq(bookingRoomLines.roomId, rooms.id))
          .where(eq(bookingRoomLines.bookingRequestId, requestId));

        // Events have no room lines — nothing to conflict-check or lock.
        if (requestLines.length > 0) {
          const roomIds = [...new Set(requestLines.map((l) => l.roomId))].sort(
            (a, b) => a - b
          );
          // Take every lock in a stable order to avoid deadlocks between
          // concurrent approvals of overlapping multi-room requests.
          for (const roomId of roomIds) {
            await tx.execute(
              sql`SELECT pg_advisory_xact_lock(hashtext(${`gomodi-approve-${roomId}`}))`
            );
          }

          // Re-read approved bookings AFTER acquiring the locks.
          const approvedBookings = await tx
            .select({
              roomId: bookingRoomLines.roomId,
              checkIn: bookingRoomLines.checkIn,
              checkOut: bookingRoomLines.checkOut,
            })
            .from(bookingRequests)
            .innerJoin(
              bookingRoomLines,
              eq(bookingRequests.id, bookingRoomLines.bookingRequestId)
            )
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
              return {
                ok: false as const,
                status: 409,
                error: `Cannot approve: Overlaps with an existing approved booking for ${line.roomName}.`,
              };
            }
          }
        }

        await tx
          .update(bookingRequests)
          .set({
            status: "approved",
            approvedAt: new Date(),
            approvedById: user.userId,
          })
          .where(eq(bookingRequests.id, requestId));

        return { ok: true as const };
      });

      if (!outcome.ok) {
        return NextResponse.json({ error: outcome.error }, { status: outcome.status });
      }
    } else {
      // Decline: notify the guest via WhatsApp below, same as approve.
      await db
        .update(bookingRequests)
        .set({
          status: "declined",
          approvedAt: new Date(),
          approvedById: user.userId,
        })
        .where(eq(bookingRequests.id, requestId));
    }

    // Notify the guest of the decision (fails open — logs if WhatsApp is unset).
    const [bookingRow] = await db
      .select({
        guestName: bookingRequests.guestName,
        contactPhone: bookingRequests.contactPhone,
      })
      .from(bookingRequests)
      .where(eq(bookingRequests.id, requestId));
    if (bookingRow?.contactPhone) {
      await notifyGuestOfBookingDecision({
        phone: bookingRow.contactPhone,
        guestName: bookingRow.guestName,
        status: action === "approve" ? "approved" : "declined",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update booking status:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
