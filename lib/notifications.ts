/**
 * WhatsApp Business Cloud API integration (Meta, direct) — per Phase 2
 * Architecture Document, Section 1.3 (Platform-Specific Constraints).
 *
 * STUB: this cannot be wired to the real Meta Cloud API from a build sandbox —
 * it requires a verified Meta Business account, a registered WhatsApp Business
 * phone number, and live API credentials, none of which exist yet (Meta
 * Business verification is a flagged Changelog item, not started). This
 * function currently logs the notification instead of sending it, so the
 * booking flow can be built and tested end-to-end now. Swapping in the real
 * API call later is a small, contained change — everywhere else in the app
 * calls this same function.
 */
export async function notifyOwnerOfNewRequest(details: {
  guestName: string;
  contactPhone: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
}): Promise<void> {
  // eslint-disable-next-line no-console
  console.log("[WhatsApp notification — STUBBED, not yet sent]", {
    to: "OWNER_WHATSAPP_NUMBER",
    template: "new_leisure_request",
    ...details,
  });
  // TODO (Phase 5 / go-live): replace with a real call to the Meta WhatsApp
  // Business Cloud API, using an approved message template per the 24-hour
  // session window constraint already documented in the Architecture Doc.
}
