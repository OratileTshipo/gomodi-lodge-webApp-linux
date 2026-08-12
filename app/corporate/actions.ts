"use server";

import type { Result } from "@/lib/result";
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
import { createDraftQuote } from "@/lib/quotes";
import { sanitizeContact, buildAddOnRows } from "@/lib/booking-common";
import {
  safeText,
  isValidStay,
  isValidEmail,
  isNotInPast,
  intInRange,
  oneOf,
  nightDates,
  MAX_COMPANY,
  MAX_JOB_TITLE,
  MAX_REFERENCE,
  MAX_LONG_NOTES,
  MAX_ROOM_LINES,
  MAX_ROOM_COUNT,
  MAX_GUESTS_PER_ROOM,
} from "@/lib/validate";

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

export type CorporateQuoteResult = Result;

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
  // ---- Strict server-side validation ----
  const contact = sanitizeContact(
    { name: input.fullName, phone: input.phone, email: input.email },
    { requireEmail: true }
  );
  if (!contact.ok) return contact;
  const { name: fullName, phone, email } = contact;

  const company = safeText(input.company, MAX_COMPANY);
  if (!company) return { ok: false, error: "Please enter your company or department." };

  const billingEmail =
    input.billingEmail && input.billingEmail.trim() !== ""
      ? input.billingEmail.trim()
      : null;
  if (billingEmail && !isValidEmail(billingEmail)) {
    return { ok: false, error: "Please enter a valid billing email address." };
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

  // Validate every room line: type must be from the allowlist, counts capped.
  const rawLines = Array.isArray(input.roomLines) ? input.roomLines : [];
  if (rawLines.length === 0 || rawLines.length > MAX_ROOM_LINES) {
    return { ok: false, error: `Please add between 1 and ${MAX_ROOM_LINES} room lines.` };
  }
  const validLines: RoomLineInput[] = [];
  for (const line of rawLines) {
    const roomType = oneOf(line.roomType, ["double", "flexible"] as const);
    const count = intInRange(line.count, 1, MAX_ROOM_COUNT);
    const guestsPerRoom = intInRange(line.guestsPerRoom, 1, MAX_GUESTS_PER_ROOM);
    if (!roomType || !count || !guestsPerRoom) {
      return { ok: false, error: "Invalid room line — check room type and counts." };
    }
    validLines.push({ roomType, count, guestsPerRoom });
  }

  const jobTitle = safeText(input.jobTitle, MAX_JOB_TITLE);
  const poNumber = safeText(input.poNumber, MAX_REFERENCE);
  const vatNumber = safeText(input.vatNumber, MAX_REFERENCE);
  const clientRef = safeText(input.clientRef, MAX_REFERENCE);
  const notes = safeText(input.notes, MAX_LONG_NOTES);

  try {
    const [request] = await db
      .insert(bookingRequests)
      .values({
        category: "corporate",
        status: "pending",
        guestName: fullName,
        contactPhone: phone,
        contactEmail: email,
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

    const totalGuests = validLines.reduce((sum, l) => sum + l.count * l.guestsPerRoom, 0);
    const addOnRows = buildAddOnRows({
      bookingRequestId: request.id,
      nights: nightDates(input.checkIn, input.checkOut),
      guestCount: totalGuests,
      breakfast: input.breakfast,
      dinner: input.dinner,
    });
    if (addOnRows.length > 0) await db.insert(addOnSelections).values(addOnRows);

    await db.insert(corporateDetails).values({
      bookingRequestId: request.id,
      jobTitle: jobTitle || null,
      companyName: company,
      billingEmail: billingEmail || null,
      poNumber: poNumber || null,
      vatNumber: vatNumber || null,
      clientRef: clientRef || null,
      notes: notes + shortfallNote,
    });

    // Auto-generate a draft quotation from the room lines + meals booked.
    await createDraftQuote(request.id);

    await notifyOwnerOfNewRequest({
      guestName: `${fullName} (${company})`,
      contactPhone: phone,
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
