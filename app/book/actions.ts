"use server";

import type { Result } from "@/lib/result";
import { db } from "@/lib/db";
import { bookingRequests, bookingRoomLines, addOnSelections, rooms, proofOfPayments } from "@/lib/db/schema";
import { and, eq, lt, gt } from "drizzle-orm";
import { isRoomAvailable } from "@/lib/db/availability";
import { notifyOwnerOfNewRequest } from "@/lib/notifications";
import { createDraftQuote } from "@/lib/quotes";
import { sanitizeContact, buildAddOnRows } from "@/lib/booking-common";
import { sanitizePopMeta } from "@/lib/pop-upload";
import {
  isValidStay,
  isNotInPast,
  intInRange,
  isSafeProofOfPaymentUrl,
  nightDates,
  safeText,
  MAX_TEXT,
  MAX_GUESTS_LEISURE,
} from "@/lib/validate";

export type LeisureBookingInput = {
  roomId: number;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  breakfast: boolean;
  dinner: boolean;
  guestName: string;
  contactPhone: string;
  contactEmail?: string;
  specialRequests?: string;
  proofOfPaymentUrl?: string | null;
  proofOfPaymentFileName?: string | null;
  proofOfPaymentFileSize?: number | null;
  proofOfPaymentMimeType?: string | null;
};

export type LeisureBookingResult = Result;

export async function submitLeisureBooking(
  input: LeisureBookingInput
): Promise<LeisureBookingResult> {
  // ---- Strict server-side validation (never trust the client) ----
  const contact = sanitizeContact({
    name: input.guestName,
    phone: input.contactPhone,
    email: input.contactEmail,
  });
  if (!contact.ok) return contact;
  const { name: guestName, phone: contactPhone, email: contactEmail } = contact;

  if (!isValidStay(input.checkIn, input.checkOut)) {
    return {
      ok: false,
      error: "Please select valid dates — check-out must be after check-in (max 60 nights).",
    };
  }
  if (!isNotInPast(input.checkIn)) {
    return { ok: false, error: "Check-in date can't be in the past." };
  }

  const guestCount = intInRange(input.guestCount, 1, MAX_GUESTS_LEISURE);
  if (!guestCount) {
    return { ok: false, error: `Please enter between 1 and ${MAX_GUESTS_LEISURE} guests.` };
  }

  const roomId = intInRange(input.roomId, 1, 1_000_000);
  if (!roomId) return { ok: false, error: "Please choose a room." };

  const specialRequests = safeText(input.specialRequests, MAX_TEXT);

  // Proof of payment must be a real blob URL from our own store — never an
  // arbitrary string that could plant a foreign link into the admin panel.
  if (input.proofOfPaymentUrl && !isSafeProofOfPaymentUrl(input.proofOfPaymentUrl)) {
    return { ok: false, error: "Proof-of-payment upload looks invalid. Please upload again." };
  }
  const proofOfPaymentUrl = input.proofOfPaymentUrl || null;
  // Metadata is hygiene (admin display), not security — the URL check above
  // is the gate; cap/allowlist what the client claims about the file.
  const popMeta = sanitizePopMeta({
    fileName: input.proofOfPaymentFileName,
    fileSize: input.proofOfPaymentFileSize,
    mimeType: input.proofOfPaymentMimeType,
  });

  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId));
  if (!room) return { ok: false, error: "That room could not be found — please choose again." };

  const available = await isRoomAvailable(input.roomId, input.checkIn, input.checkOut);
  if (!available) {
    return {
      ok: false,
      error: "Sorry — this room is already booked for part of that date range. Please try different dates, or contact us directly on WhatsApp to check alternatives.",
    };
  }

  try {
    // ---- Atomic write: request + room line + meals + draft quote + POP row
    // all commit or all roll back — a mid-flow failure can never leave a
    // request without its quote (or a POP row orphaned from its request). ----
    await db.transaction(async (tx) => {
      const [request] = await tx
        .insert(bookingRequests)
        .values({
          category: "leisure",
          status: "pending",
          guestName,
          contactPhone,
          contactEmail,
          specialRequests: specialRequests || null,
          sourceChannel: "website",
        })
        .returning();

      await tx.insert(bookingRoomLines).values({
        bookingRequestId: request.id,
        roomId,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guestCount,
      });

      const addOnRows = buildAddOnRows({
        bookingRequestId: request.id,
        nights: nightDates(input.checkIn, input.checkOut),
        guestCount,
        breakfast: input.breakfast,
        dinner: input.dinner,
      });
      if (addOnRows.length > 0) {
        await tx.insert(addOnSelections).values(addOnRows);
      }

      // Auto-generate a draft quotation atomically with the request.
      await createDraftQuote(request.id, tx);

      // Store proof of payment if provided (already validated as our blob URL)
      if (proofOfPaymentUrl) {
        await tx.insert(proofOfPayments).values({
          bookingRequestId: request.id,
          fileUrl: proofOfPaymentUrl,
          fileName: popMeta.fileName || "proof-of-payment",
          fileSize: popMeta.fileSize,
          mimeType: popMeta.mimeType,
          uploadedAt: new Date(),
        });
      }

      return request.id;
    });

    // Post-commit side effect: WhatsApp alert (fail-open, never blocks booking).
    await notifyOwnerOfNewRequest({
      guestName,
      contactPhone,
      roomName: room.name,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guestCount,
    });

    return { ok: true };
  } catch (err) {
    console.error("Failed to submit leisure booking:", err);
    return {
      ok: false,
      error: "Something went wrong submitting your request. Please try again.",
    };
  }
}

export async function getUnavailableRoomIds(
  checkIn: string,
  checkOut: string
): Promise<number[]> {
  // Only ever run the availability query with validated calendar dates.
  if (!isValidStay(checkIn, checkOut)) return [];
  // One query instead of N: every room with an approved booking overlapping
  // the requested range is unavailable (same overlap logic as isRoomAvailable).
  const rows = await db
    .selectDistinct({ roomId: bookingRoomLines.roomId })
    .from(bookingRoomLines)
    .innerJoin(bookingRequests, eq(bookingRoomLines.bookingRequestId, bookingRequests.id))
    .where(
      and(
        eq(bookingRequests.status, "approved"),
        lt(bookingRoomLines.checkIn, checkOut),
        gt(bookingRoomLines.checkOut, checkIn)
      )
    );
  return rows.map((r) => r.roomId);
}
