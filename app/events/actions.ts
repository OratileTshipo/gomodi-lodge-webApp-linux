"use server";

import type { Result } from "@/lib/result";
import { db } from "@/lib/db";
import { bookingRequests, eventDetails } from "@/lib/db/schema";
import {
  notifyLelzOfNewRequest,
  notifyOwnerOfNewRequest,
} from "@/lib/notifications";
import { createDraftQuote } from "@/lib/quotes";
import { sanitizeContact } from "@/lib/booking-common";
import {
  safeText,
  isValidIsoDate,
  isNotInPast,
  intInRange,
  MAX_EVENT_TYPE,
  MAX_CATERING,
  MAX_LONG_NOTES,
  MAX_GUESTS_EVENT,
} from "@/lib/validate";
import { eq } from "drizzle-orm";

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

export type EventInquiryResult = Result;

export async function submitEventInquiry(
  input: EventInquiryInput
): Promise<EventInquiryResult> {
  // ---- Strict server-side validation ----
  const contact = sanitizeContact({
    name: input.fullName,
    phone: input.phone,
    email: input.email,
  });
  if (!contact.ok) return contact;
  const { name: fullName, phone, email } = contact;

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
    // ---- Atomic write: request + event details + draft quote + partner
    // notification timestamp all commit or all roll back together. ----
    await db.transaction(async (tx) => {
      const [request] = await tx
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

      await tx.insert(eventDetails).values({
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
      await createDraftQuote(request.id, tx);

      // Events belong to Lelz Business Enterprise: the Owner's assistant keeps
      // visibility (Events Manager) AND Lelz is alerted directly. Record the
      // partner notification timestamp for the audit trail.
      await tx
        .update(bookingRequests)
        .set({ notifiedPartnerAt: new Date() })
        .where(eq(bookingRequests.id, request.id));
    });

    // Post-commit side effects: WhatsApp alerts (fail-open, never block booking).
    await notifyOwnerOfNewRequest({
      guestName: fullName,
      contactPhone: phone,
      roomName: `Event: ${input.eventType}`,
      checkIn: input.eventDate,
      checkOut: input.eventDate,
      guestCount: input.guestCount,
    });

    await notifyLelzOfNewRequest({
      guestName: fullName,
      contactPhone: phone,
      eventType,
      eventDate: input.eventDate,
      expectedGuests: guestCount,
    });

    return { ok: true };
  } catch (err) {
    console.error("Failed to submit event inquiry:", err);
    return { ok: false, error: "Something went wrong submitting your enquiry. Please try again." };
  }
}
