"use server";

import { db } from "@/lib/db";
import { bookingRequests, eventDetails } from "@/lib/db/schema";
import { notifyOwnerOfNewRequest } from "@/lib/notifications";
import { createDraftQuote } from "@/lib/quotes";
import {
  safeText,
  normalizePhone,
  isValidEmail,
  isValidIsoDate,
  isNotInPast,
  intInRange,
  MAX_NAME,
  MAX_EVENT_TYPE,
  MAX_CATERING,
  MAX_LONG_NOTES,
  MAX_GUESTS_EVENT,
} from "@/lib/validate";

export type EventInquiryInput = {
  fullName: string;
  phone: string;
  email?: string;
  eventType: string;
  guestCount: number;
  eventDate: string;
  altDate?: string;
  catering: string;
  interestedInRooms: boolean;
  notes?: string;
};

export type EventInquiryResult = { ok: true } | { ok: false; error: string };

export async function submitEventInquiry(
  input: EventInquiryInput
): Promise<EventInquiryResult> {
  // ---- Strict server-side validation ----
  const fullName = safeText(input.fullName, MAX_NAME);
  if (!fullName) return { ok: false, error: "Please enter your full name." };

  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: "Please enter a valid contact number." };

  const email =
    input.email && input.email.trim() !== "" ? input.email.trim() : null;
  if (email && !isValidEmail(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const eventType = safeText(input.eventType, MAX_EVENT_TYPE);
  if (!eventType) return { ok: false, error: "Please select an event type." };

  const guestCount = intInRange(input.guestCount, 1, MAX_GUESTS_EVENT);
  if (!guestCount) {
    return { ok: false, error: `Please enter a guest count between 1 and ${MAX_GUESTS_EVENT}.` };
  }

  if (!isValidIsoDate(input.eventDate) || !isNotInPast(input.eventDate)) {
    return { ok: false, error: "Please select a future event date." };
  }
  const altDate =
    input.altDate && input.altDate.trim() !== "" ? input.altDate.trim() : null;
  if (altDate && (!isValidIsoDate(altDate) || !isNotInPast(altDate))) {
    return { ok: false, error: "Please enter a valid alternative date." };
  }

  const catering = safeText(input.catering, MAX_CATERING);
  const notes = safeText(input.notes, MAX_LONG_NOTES);

  try {
    const [request] = await db
      .insert(bookingRequests)
      .values({
        category: "event",
        status: "pending",
        guestName: fullName,
        contactPhone: phone,
        contactEmail: email,
        sourceChannel: "website",
      })
      .returning();

    await db.insert(eventDetails).values({
      bookingRequestId: request.id,
      eventType,
      expectedGuests: guestCount,
      eventDate: input.eventDate,
      altDate,
      cateringPackage: catering || null,
      interestedInRooms: Boolean(input.interestedInRooms),
      notes: notes || null,
    });

    // Auto-generate a draft quotation (event package line — owner prices it).
    await createDraftQuote(request.id);

    await notifyOwnerOfNewRequest({
      guestName: fullName,
      contactPhone: phone,
      roomName: `Event: ${input.eventType}`,
      checkIn: input.eventDate,
      checkOut: input.eventDate,
      guestCount: input.guestCount,
    });

    return { ok: true };
  } catch (err) {
    console.error("Failed to submit event inquiry:", err);
    return { ok: false, error: "Something went wrong submitting your enquiry. Please try again." };
  }
}
