/**
 * Payload smoke test for lib/whatsapp.ts.
 *
 * Stubs globalThis.fetch so no network call is made, then verifies every
 * request body matches the Meta WhatsApp Cloud API spec. Run with:
 *   npx tsx scripts/_whatsapp-test.ts
 */
import assert from "node:assert";

async function main() {
  const captured: { url: string; headers: Record<string, string>; body: any }[] = [];
  (globalThis as any).fetch = async (url: string, init: any) => {
    captured.push({ url, headers: init.headers, body: JSON.parse(init.body) });
    return { ok: true, json: async () => ({ messages: [{ id: "wamid.test123" }] }) };
  };

  process.env.WHATSAPP_TOKEN = "TEST_TOKEN";
  process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789";
  process.env.WHATSAPP_RECIPIENT = "+27820000001";
  delete process.env.WHATSAPP_OTP_TEMPLATE;
  delete process.env.WHATSAPP_ALERT_TEMPLATE;
  delete process.env.WHATSAPP_STATUS_TEMPLATE;
  delete process.env.WHATSAPP_QUOTE_TEMPLATE;
  delete process.env.WHATSAPP_LANGUAGE;

  const {
    sendOtp,
    sendBookingAlert,
    sendBookingStatus,
    sendTextMessage,
    sendQuoteLink,
    isWhatsAppConfigured,
  } = await import("../lib/whatsapp");

  assert.equal(isWhatsAppConfigured(), true, "should report configured with creds set");

  await sendOtp("+27 82 000 0002", "123456");
  await sendBookingAlert({
    guestName: "Jane",
    contactPhone: "+27820000003",
    roomName: "Room 1",
    checkIn: "2026-09-01",
    checkOut: "2026-09-03",
    guestCount: 2,
  });
  await sendBookingStatus("+27820000004", "Jane", "approved");
  await sendTextMessage("+27820000005", "hello");
  await sendQuoteLink({
    phone: "+27820000006",
    guestName: "Jane",
    quoteNumber: "QT-2026-ABC123",
    link: "https://example.com/quote/xyz",
  });

  assert.equal(captured.length, 5, "expected 5 sends");
  const [otp, alert, status, text, quote] = captured;

  // --- OTP (authentication template) ---
  assert.equal(otp.url, "https://graph.facebook.com/v23.0/123456789/messages");
  assert.equal(otp.headers.Authorization, "Bearer TEST_TOKEN");
  assert.equal(otp.body.messaging_product, "whatsapp");
  assert.equal(otp.body.recipient_type, "individual");
  assert.equal(otp.body.type, "template");
  assert.equal(otp.body.to, "+27820000002", "E.164 normalization with spaces");
  assert.equal(otp.body.template.name, "gomodi_otp");
  assert.equal(otp.body.template.language.code, "en");
  assert.equal(otp.body.template.components[0].type, "body");
  assert.equal(otp.body.template.components[0].parameters[0].type, "text");
  assert.equal(otp.body.template.components[0].parameters[0].text, "123456");
  assert.ok(otp.body.biz_opaque_callback_data, "auth templates should carry callback data");

  // --- Booking alert (utility template, 6 variables) ---
  assert.equal(alert.body.to, "+27820000001");
  assert.equal(alert.body.template.name, "gomodi_booking_alert");
  assert.equal(alert.body.template.components[0].parameters.length, 6);
  assert.deepEqual(
    alert.body.template.components[0].parameters.map((p: any) => p.text),
    ["Jane", "+27820000003", "Room 1", "2026-09-01", "2026-09-03", "2"]
  );

  // --- Guest status ---
  assert.equal(status.body.template.name, "gomodi_booking_status");
  assert.equal(status.body.template.components[0].parameters[1].text, "approved");

  // --- Free-form text ---
  assert.equal(text.body.type, "text");
  assert.equal(text.body.text.body, "hello");
  assert.equal(text.body.text.preview_url, false);

  // --- Quote link (utility template, 3 variables) ---
  assert.equal(quote.body.to, "+27820000006");
  assert.equal(quote.body.template.name, "gomodi_quote_link");
  assert.deepEqual(
    quote.body.template.components[0].parameters.map((p: any) => p.text),
    ["Jane", "QT-2026-ABC123", "https://example.com/quote/xyz"]
  );

  // --- Fail-open when unconfigured: never throws, returns sent:false ---
  delete process.env.WHATSAPP_TOKEN;
  assert.equal(isWhatsAppConfigured(), false, "should report unconfigured without token");
  const before = captured.length;
  const unconfigured = await sendOtp("+27820000002", "999999");
  assert.equal(unconfigured.sent, false);
  assert.equal(captured.length, before, "no network call attempted when unconfigured");

  console.log("✅ WhatsApp payload smoke test passed (5 sends, shapes verified, fail-open OK)");
}

main().catch((err) => {
  console.error("❌ WhatsApp payload test failed:", err.message);
  process.exit(1);
});
