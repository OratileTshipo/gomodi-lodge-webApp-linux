/**
 * WhatsApp notification helpers for the booking pipeline.
 *
 * These are the single entry point every feature uses to alert the lodge
 * (new requests) and the guest (approve/decline). Delivery goes through the
 * Meta WhatsApp Cloud API client (lib/whatsapp.ts); until credentials are set
 * the sends fail open and log visibly, so the booking flow keeps working.
 */
import { sendBookingAlert, sendBookingStatus, sendReviewRequest } from "./whatsapp";

export async function notifyOwnerOfNewRequest(details: {
  guestName: string;
  contactPhone: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
}): Promise<void> {
  const result = await sendBookingAlert(details);
  if (!result.sent) {
    // Visible record so nothing is silently lost while WhatsApp is unset.
    console.log("[WhatsApp notification not sent]", { reason: result.reason, ...details });
  }
}

export async function notifyGuestOfBookingDecision(details: {
  phone: string;
  guestName: string;
  status: "approved" | "declined";
}): Promise<void> {
  const result = await sendBookingStatus(details.phone, details.guestName, details.status);
  if (!result.sent) {
    console.log("[WhatsApp guest status not sent]", { reason: result.reason, ...details });
  }
}

/**
 * Alert Lelz Business Enterprise (partner) about a new event/catering inquiry.
 * STUBBED, parallel to notifyOwnerOfNewRequest(): until Lelz's WhatsApp
 * Business number and template are confirmed, this logs visibly and fails
 * open so the events flow keeps working.
 */
export async function notifyLelzOfNewRequest(details: {
  guestName: string;
  contactPhone: string;
  eventType: string;
  eventDate: string;
  expectedGuests: number;
}): Promise<void> {
  console.log("[WhatsApp notification — STUBBED, not yet sent]", {
    to: "078 078 4139",
    template: "new_event_request",
    ...details,
  });
  // TODO (go-live): real Meta Cloud API call once Lelz's WhatsApp Business
  // number and template are confirmed — same swap-in point pattern as
  // notifyOwnerOfNewRequest().
}

export async function notifyGuestOfReviewRequest(details: {
  phone: string;
  guestName: string;
  link: string;
}): Promise<void> {
  const result = await sendReviewRequest(details);
  if (!result.sent) {
    console.log("[WhatsApp review request not sent]", { reason: result.reason, ...details });
  }
}
