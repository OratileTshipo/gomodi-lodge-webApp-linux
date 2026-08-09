"use server";

import { db } from "@/lib/db";
import { bookingRequests, bookingRoomLines, addOnSelections, rooms, proofOfPayments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isRoomAvailable } from "@/lib/db/availability";
import { notifyOwnerOfNewRequest } from "@/lib/notifications";
import { createDraftQuote } from "@/lib/quotes";
import {
  safeText,
  normalizePhone,
  isValidEmail,
  isValidStay,
  isNotInPast,
  intInRange,
  isSafeProofOfPaymentUrl,
  MAX_NAME,
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
  specialRequests?: string; // <--- ADDED HERE
  proofOfPaymentUrl?: string | null;
};

export type LeisureBookingResult =
  | { ok: true }
  | { ok: false; error: string };

const BREAKFAST_PRICE = "175.00"; 
const DINNER_PRICE = "300.00"; 

function nightsBetween(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export async function submitLeisureBooking(
  input: LeisureBookingInput
): Promise<LeisureBookingResult> {
  // ---- Strict server-side validation (never trust the client) ----
  const guestName = safeText(input.guestName, MAX_NAME);
  if (!guestName) return { ok: false, error: "Please enter your name." };

  const contactPhone = normalizePhone(input.contactPhone);
  if (!contactPhone) return { ok: false, error: "Please enter a valid contact phone number." };

  const contactEmail =
    input.contactEmail && input.contactEmail.trim() !== ""
      ? input.contactEmail.trim()
      : null;
  if (contactEmail && !isValidEmail(contactEmail)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

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
    const [request] = await db
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

    await db.insert(bookingRoomLines).values({
      bookingRequestId: request.id,
      roomId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guestCount,
    });

    const nights = nightsBetween(input.checkIn, input.checkOut);
    const addOnRows: (typeof addOnSelections.$inferInsert)[] = [];
    if (input.breakfast) {
      for (const night of nights) {
        addOnRows.push({
          bookingRequestId: request.id,
          type: "breakfast",
          persons: guestCount,
          date: night,
          unitPrice: BREAKFAST_PRICE,
        });
      }
    }
    if (input.dinner) {
      for (const night of nights) {
        addOnRows.push({
          bookingRequestId: request.id,
          type: "dinner",
          persons: guestCount,
          date: night,
          unitPrice: DINNER_PRICE,
        });
      }
    }
    if (addOnRows.length > 0) {
      await db.insert(addOnSelections).values(addOnRows);
    }

    // Auto-generate a draft quotation for the owner to review before sending.
    await createDraftQuote(request.id);

    await notifyOwnerOfNewRequest({
      guestName,
      contactPhone,
      roomName: room.name,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guestCount,
    });

    // Store proof of payment if provided (already validated as our blob URL)
    if (proofOfPaymentUrl) {
      await db.insert(proofOfPayments).values({
        bookingRequestId: request.id,
        fileUrl: proofOfPaymentUrl,
        fileName: "proof-of-payment",
        uploadedAt: new Date(),
      });
    }

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
  const allRooms = await db.select({ id: rooms.id }).from(rooms);
  const unavailable: number[] = [];
  for (const room of allRooms) {
    const ok = await isRoomAvailable(room.id, checkIn, checkOut);
    if (!ok) unavailable.push(room.id);
  }
  return unavailable;
}
