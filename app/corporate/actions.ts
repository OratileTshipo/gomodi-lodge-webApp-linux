"use server";

import { db } from "@/lib/db";
import {
  bookingRequests,
  bookingRoomLines,
  addOnSelections,
  corporateDetails,
  rooms,
} from "@/lib/db/schema";
import { and, eq, lt, gt } from "drizzle-orm";
import { notifyOwnerOfNewRequest } from "@/lib/notifications";

export type RoomLineInput = {
  roomType: "double" | "flexible";
  count: number;
  guestsPerRoom: number;
};

export type CorporateQuoteInput = {
  fullName: string;
  jobTitle?: string;
  company: string;
  phone: string;
  email: string;
  billingEmail?: string;
  poNumber?: string;
  vatNumber?: string;
  clientRef?: string;
  checkIn: string;
  checkOut: string;
  roomLines: RoomLineInput[];
  breakfast: boolean;
  dinner: boolean;
  notes?: string;
};

export type CorporateQuoteResult = { ok: true } | { ok: false; error: string };

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

async function findAvailableRoomIds(
  isFlexible: boolean,
  checkIn: string,
  checkOut: string,
  needed: number
): Promise<number[]> {
  const candidates = await db.select().from(rooms).orderBy(rooms.id);
  const pool = candidates.filter((r) =>
    isFlexible
      ? r.config.toLowerCase().includes("configurable")
      : !r.config.toLowerCase().includes("configurable")
  );

  const available: number[] = [];
  for (const room of pool) {
    if (available.length >= needed) break;
    const overlapping = await db
      .select({ id: bookingRoomLines.id })
      .from(bookingRoomLines)
      .innerJoin(bookingRequests, eq(bookingRoomLines.bookingRequestId, bookingRequests.id))
      .where(
        and(
          eq(bookingRoomLines.roomId, room.id),
          eq(bookingRequests.status, "approved"),
          lt(bookingRoomLines.checkIn, checkOut),
          gt(bookingRoomLines.checkOut, checkIn)
        )
      )
      .limit(1);
    if (overlapping.length === 0) available.push(room.id);
  }
  return available;
}

export async function submitCorporateQuote(
  input: CorporateQuoteInput
): Promise<CorporateQuoteResult> {
  if (!input.fullName?.trim()) return { ok: false, error: "Please enter your full name." };
  if (!input.company?.trim()) return { ok: false, error: "Please enter your company or department." };
  if (!input.phone?.trim()) return { ok: false, error: "Please enter a contact number." };
  if (!input.email?.trim()) return { ok: false, error: "Please enter an email address." };
  if (!input.checkIn || !input.checkOut) return { ok: false, error: "Please select check-in and check-out dates." };
  if (new Date(input.checkOut) <= new Date(input.checkIn)) {
    return { ok: false, error: "Check-out must be after check-in." };
  }
  const validLines = input.roomLines.filter((l) => l.count > 0);
  if (validLines.length === 0) return { ok: false, error: "Please add at least one room." };

  try {
    const [request] = await db
      .insert(bookingRequests)
      .values({
        category: "corporate",
        status: "pending",
        guestName: input.fullName.trim(),
        contactPhone: input.phone.trim(),
        contactEmail: input.email.trim(),
        sourceChannel: "website",
      })
      .returning();

    let shortfallNote = "";
    for (const line of validLines) {
      const roomIds = await findAvailableRoomIds(
        line.roomType === "flexible",
        input.checkIn,
        input.checkOut,
        line.count
      );
      if (roomIds.length < line.count) {
        shortfallNote += ` Requested ${line.count}x ${line.roomType}, only ${roomIds.length} available for these dates —needs manual review.`;
      }
      for (const roomId of roomIds) {
        await db.insert(bookingRoomLines).values({
          bookingRequestId: request.id,
          roomId,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          guestCount: line.guestsPerRoom,
        });
      }
    }

    const nights = nightsBetween(input.checkIn, input.checkOut);
    const totalGuests = validLines.reduce((sum, l) => sum + l.count * l.guestsPerRoom, 0);
    const addOnRows: (typeof addOnSelections.$inferInsert)[] = [];
    if (input.breakfast) {
      for (const night of nights) {
        addOnRows.push({ bookingRequestId: request.id, type: "breakfast", persons: totalGuests, date: night, unitPrice: BREAKFAST_PRICE });
      }
    }
    if (input.dinner) {
      for (const night of nights) {
        addOnRows.push({ bookingRequestId: request.id, type: "dinner", persons: totalGuests, date: night, unitPrice: DINNER_PRICE });
      }
    }
    if (addOnRows.length > 0) await db.insert(addOnSelections).values(addOnRows);

    await db.insert(corporateDetails).values({
      bookingRequestId: request.id,
      jobTitle: input.jobTitle?.trim() || null,
      companyName: input.company.trim(),
      billingEmail: input.billingEmail?.trim() || null,
      poNumber: input.poNumber?.trim() || null,
      vatNumber: input.vatNumber?.trim() || null,
      clientRef: input.clientRef?.trim() || null,
      notes: (input.notes?.trim() || "") + shortfallNote,
    });

    await notifyOwnerOfNewRequest({
      guestName: `${input.fullName} (${input.company})`,
      contactPhone: input.phone,
      roomName: validLines.map((l) => `${l.count}x ${l.roomType}`).join(", "),
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guestCount: totalGuests,
    });

    return { ok: true };
  } catch (err) {
    console.error("Failed to submit corporate quote:", err);
    return { ok: false, error: "Something went wrong submitting your request. Please try again." };
  }
}
