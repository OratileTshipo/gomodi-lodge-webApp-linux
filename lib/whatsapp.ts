/**
 * Meta WhatsApp Business Cloud API client.
 *
 * Sends outbound WhatsApp messages (OTP codes, booking alerts, booking-status
 * updates) from server-side code. Requires a Meta Business account, a
 * registered WhatsApp Business phone number, a permanent access token, and
 * approved message templates — see knowledge.md for the setup walkthrough.
 *
 * Environment variables:
 *   WHATSAPP_TOKEN            — permanent access token (not the temporary 24h one)
 *   WHATSAPP_PHONE_NUMBER_ID  — numeric ID of the business WhatsApp number
 *   WHATSAPP_RECIPIENT        — E.164 number that receives booking alerts (lodge)
 *   WHATSAPP_OTP_TEMPLATE     — approved AUTHENTICATION template (default gomodi_otp)
 *   WHATSAPP_ALERT_TEMPLATE   — approved UTILITY template (default gomodi_booking_alert)
 *   WHATSAPP_STATUS_TEMPLATE  — approved UTILITY template (default gomodi_booking_status)
 *   WHATSAPP_LANGUAGE         — template language code (default en)
 *
 * Fail-open by design: if credentials are missing every send logs what it
 * would have sent and returns { sent: false } instead of throwing, so the app
 * keeps working during setup and in dev. Send functions also never reject —
 * network failures are caught, logged, and reported on the result object.
 */

const GRAPH_VERSION = "v23.0";
const SEND_TIMEOUT_MS = 5_000;

export type SendResult = { sent: boolean; reason?: string };

function config() {
  return {
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    recipient: process.env.WHATSAPP_RECIPIENT,
    otpTemplate: process.env.WHATSAPP_OTP_TEMPLATE || "gomodi_otp",
    alertTemplate: process.env.WHATSAPP_ALERT_TEMPLATE || "gomodi_booking_alert",
    statusTemplate: process.env.WHATSAPP_STATUS_TEMPLATE || "gomodi_booking_status",
    quoteTemplate: process.env.WHATSAPP_QUOTE_TEMPLATE || "gomodi_quote_link",
    reviewTemplate: process.env.WHATSAPP_REVIEW_TEMPLATE || "gomodi_review_request",
    language: process.env.WHATSAPP_LANGUAGE || "en",
  };
}

export function isWhatsAppConfigured(): boolean {
  const { token, phoneNumberId } = config();
  return Boolean(token && phoneNumberId);
}

/** Normalize a phone number to E.164 ("+" + digits) from any common input. */
function e164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `+${digits}`;
}

async function postToGraph(body: Record<string, unknown>): Promise<SendResult> {
  const { token, phoneNumberId } = config();
  if (!token || !phoneNumberId) {
    return { sent: false, reason: "WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID not set" };
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      }
    );
    const data: { error?: { message?: string } } | null = await res.json().catch(() => null);
    if (!res.ok) {
      const message = data?.error?.message || `HTTP ${res.status}`;
      console.error("[WhatsApp] send failed:", message);
      return { sent: false, reason: message };
    }
    return { sent: true };
  } catch (err) {
    console.error("[WhatsApp] send threw:", err);
    return { sent: false, reason: err instanceof Error ? err.message : "unknown error" };
  }
}

/** Send an approved message template (required for OTPs and alerts). */
export async function sendTemplateMessage(params: {
  to: string;
  templateName: string;
  parameters?: string[];
  language?: string;
  callbackData?: string;
}): Promise<SendResult> {
  const { language } = config();
  const template: Record<string, unknown> = {
    name: params.templateName,
    language: { code: params.language || language },
  };
  if (params.parameters && params.parameters.length > 0) {
    template.components = [
      { type: "body", parameters: params.parameters.map((text) => ({ type: "text", text })) },
    ];
  }
  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: e164(params.to),
    type: "template",
    template,
  };
  if (params.callbackData) body.biz_opaque_callback_data = params.callbackData;
  return postToGraph(body);
}

/** Send free-form text — only valid inside an open 24h customer-service window. */
export async function sendTextMessage(to: string, text: string): Promise<SendResult> {
  return postToGraph({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: e164(to),
    type: "text",
    text: { body: text, preview_url: false },
  });
}

/** Deliver an OTP via the approved AUTHENTICATION template. */
export async function sendOtp(phone: string, code: string): Promise<SendResult> {
  const { otpTemplate } = config();
  if (!isWhatsAppConfigured()) {
    console.log(
      `[WhatsApp not configured] OTP for ${e164(phone)} was NOT delivered by WhatsApp (see OTP log).`
    );
    return { sent: false, reason: "WhatsApp not configured" };
  }
  return sendTemplateMessage({
    to: phone,
    templateName: otpTemplate,
    parameters: [code],
    callbackData: `otp:${Date.now()}`,
  });
}

/** New-booking alert sent to the lodge's own number (WHATSAPP_RECIPIENT). */
export async function sendBookingAlert(details: {
  guestName: string;
  contactPhone: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
}): Promise<SendResult> {
  const { recipient, alertTemplate } = config();
  if (!recipient) {
    console.log("[WhatsApp not configured] booking alert for owner:", details);
    return { sent: false, reason: "WHATSAPP_RECIPIENT not set" };
  }
  return sendTemplateMessage({
    to: recipient,
    templateName: alertTemplate,
    parameters: [
      details.guestName,
      details.contactPhone,
      details.roomName,
      details.checkIn,
      details.checkOut,
      String(details.guestCount),
    ],
  });
}

/** Booking status change (approved/declined) sent to the guest's number. */
export async function sendBookingStatus(
  phone: string,
  guestName: string,
  status: "approved" | "declined"
): Promise<SendResult> {
  const { statusTemplate } = config();
  return sendTemplateMessage({
    to: phone,
    templateName: statusTemplate,
    parameters: [guestName, status],
  });
}

/**
 * Quotation/invoice delivery — sends the requester their public link + PDF
 * URL. Uses the approved UTILITY template (default gomodi_quote_link) with
 * parameters [guestName, quoteNumber, link]. Fails open: while WhatsApp is
 * unconfigured it logs what it would have sent, so the admin can copy the
 * link manually from the editor.
 */
export async function sendQuoteLink(params: {
  phone: string;
  guestName: string;
  quoteNumber: string;
  link: string;
}): Promise<SendResult> {
  const { quoteTemplate } = config();
  if (!isWhatsAppConfigured()) {
    console.log(
      `[WhatsApp not configured] quote ${params.quoteNumber} for ${params.guestName} was NOT delivered. ` +
        `Share link: ${params.link}`
    );
    return { sent: false, reason: "WhatsApp not configured" };
  }
  return sendTemplateMessage({
    to: params.phone,
    templateName: quoteTemplate,
    parameters: [params.guestName, params.quoteNumber, params.link],
  });
}

/**
 * Post-stay review request — sent to the guest after checkout with a private
 * link to /review?token=…. Uses the approved UTILITY template (default
 * gomodi_review_request) with parameters [guestName, link]. Fails open: while
 * WhatsApp is unconfigured it logs the link so the lodge can share it from
 * the admin queue instead.
 */
export async function sendReviewRequest(params: {
  phone: string;
  guestName: string;
  link: string;
}): Promise<SendResult> {
  const { reviewTemplate } = config();
  if (!isWhatsAppConfigured()) {
    console.log(
      `[WhatsApp not configured] review request for ${params.guestName} was NOT delivered. ` +
        `Share link: ${params.link}`
    );
    return { sent: false, reason: "WhatsApp not configured" };
  }
  return sendTemplateMessage({
    to: params.phone,
    templateName: reviewTemplate,
    parameters: [params.guestName, params.link],
  });
}
