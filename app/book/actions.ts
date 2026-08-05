"use server";

import { db } from "@/lib/db";
import { bookingRequests, bookingRoomLines, addOnSelections, rooms, proofOfPayments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isRoomAvailable } from "@/lib/db/availability";
import { notifyOwnerOfNewRequest } from "@/lib/notifications";

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
  // ---- Validation ----
  if (!input.guestName?.trim()) return { ok: false, error: "Please enter your name." };
  if (!input.contactPhone?.trim()) return { ok: false, error: "Please enter a contact phone number." };
  if (!input.checkIn || !input.checkOut) return { ok: false, error: "Please select your check-in and check-out dates." };
  if (new Date(input.checkOut) <= new Date(input.checkIn)) {
    return { ok: false, error: "Check-out date must be after check-in date." };
  }
  if (!input.guestCount || input.guestCount < 1) {
    return { ok: false, error: "Please enter at least 1 guest." };
  }

  const [room] = await db.select().from(rooms).where(eq(rooms.id, input.roomId));
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
        guestName: input.guestName.trim(),
        contactPhone: input.contactPhone.trim(),
        contactEmail: input.contactEmail?.trim() || null,
        specialRequests: input.specialRequests?.trim() || null, // <--- ADDED HERE
        sourceChannel: "website",
      })
      .returning();

    await db.insert(bookingRoomLines).values({
      bookingRequestId: request.id,
      roomId: input.roomId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guestCount: input.guestCount,
    });

    const nights = nightsBetween(input.checkIn, input.checkOut);
    const addOnRows: (typeof addOnSelections.$inferInsert)[] = [];
    if (input.breakfast) {
      for (const night of nights) {
        addOnRows.push({
          bookingRequestId: request.id,
          type: "breakfast",
          persons: input.guestCount,
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
          persons: input.guestCount,
          date: night,
          unitPrice: DINNER_PRICE,
        });
      }
    }
    if (addOnRows.length > 0) {
      await db.insert(addOnSelections).values(addOnRows);
    }

    await notifyOwnerOfNewRequest({
      guestName: input.guestName,
      contactPhone: input.contactPhone,
      roomName: room.name,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guestCount: input.guestCount,
    });

    // Store proof of payment if provided
    if (input.proofOfPaymentUrl) {
      await db.insert(proofOfPayments).values({
        bookingRequestId: request.id,
        fileUrl: input.proofOfPaymentUrl,
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
  if (!checkIn || !checkOut) return [];
  const allRooms = await db.select({ id: rooms.id }).from(rooms);
  const unavailable: number[] = [];
  for (const room of allRooms) {
    const ok = await isRoomAvailable(room.id, checkIn, checkOut);
    if (!ok) unavailable.push(room.id);
  }
  return unavailable;
}
