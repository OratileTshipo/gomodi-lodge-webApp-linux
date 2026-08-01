"use server";

import { db } from "@/lib/db";
import { bookingRequests, eventDetails } from "@/lib/db/schema";
import { notifyOwnerOfNewRequest } from "@/lib/notifications";

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
  if (!input.fullName?.trim()) return { ok: false, error: "Please enter your full name." };
  if (!input.phone?.trim() || input.phone.replace(/\D/g, "").length < 10) {
    return { ok: false, error: "Please enter a valid contact number." };
  }
  if (!input.eventType) return { ok: false, error: "Please select an event type." };
  if (!input.guestCount || input.guestCount < 1 || input.guestCount > 50) {
    return { ok: false, error: "Please enter a guest count between 1 and 50." };
  }
  if (!input.eventDate || new Date(input.eventDate) < new Date(new Date().toDateString())) {
    return { ok: false, error: "Please select a future event date." };
  }

  try {
    const [request] = await db
      .insert(bookingRequests)
      .values({
        category: "event",
        status: "pending",
        guestName: input.fullName.trim(),
        contactPhone: input.phone.trim(),
        contactEmail: input.email?.trim() || null,
        sourceChannel: "website",
      })
      .returning();

    await db.insert(eventDetails).values({
      bookingRequestId: request.id,
      eventType: input.eventType,
      expectedGuests: input.guestCount,
      eventDate: input.eventDate,
      altDate: input.altDate || null,
      cateringPackage: input.catering || null,
      interestedInRooms: input.interestedInRooms,
      notes: input.notes?.trim() || null,
    });

    await notifyOwnerOfNewRequest({
      guestName: input.fullName,
      contactPhone: input.phone,
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
