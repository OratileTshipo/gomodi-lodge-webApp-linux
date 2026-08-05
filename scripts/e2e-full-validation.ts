import { db } from "../lib/db/index";
import { rooms, bookingRequests, bookingRoomLines, addOnSelections, users } from "../lib/db/schema";
import { submitLeisureBooking } from "../app/book/actions";
import { submitCorporateQuote } from "../app/corporate/actions";
import { submitEventInquiry } from "../app/events/actions";
import { isRoomAvailable } from "../lib/db/availability";
import { enrichRequests } from "../app/api/admin/requests/route";
import { eq, inArray } from "drizzle-orm";

let totalFails = 0;
function assert(name: string, condition: boolean, extraInfo: string = "") {
  if (condition) {
    console.log(`✅ [PASS] ${name}`);
  } else {
    console.error(`❌ [FAIL] ${name} ${extraInfo}`);
    totalFails++;
  }
}

async function runE2ETests() {
  console.log("\n=======================================================");
  console.log("🚀 GOMODI GUEST LODGE - FULL E2E CLIENT DEMO VALIDATION");
  console.log("=======================================================\n");

  // ---------------------------------------------------------
  // 1. ROOMS DATABASE INTEGRITY
  // ---------------------------------------------------------
  console.log("--- 1. DATABASE & ROOM INVENTORY CHECK ---");
  const allRooms = await db.select().from(rooms);
  assert("Database contains exactly 9 rooms", allRooms.length === 9, `Found: ${allRooms.length}`);
  const room1 = allRooms.find((r) => r.id === 1);
  assert("Room 1 exists with non-empty name", !!room1?.name, `Name: ${room1?.name}`);

  // ---------------------------------------------------------
  // 2. LEISURE BOOKING FLOW & VALIDATIONS
  // ---------------------------------------------------------
  console.log("\n--- 2. LEISURE BOOKING FLOW & VALIDATIONS ---");
  const timestamp = Date.now();
  const testGuestName = `E2E Tester ${timestamp}`;
  const testPhone = "0829990000";

  // Invalid test: checkout before checkin
  const invalidDateRes = await submitLeisureBooking({
    roomId: 1,
    checkIn: "2026-12-20",
    checkOut: "2026-12-18",
    guestCount: 2,
    breakfast: false,
    dinner: false,
    guestName: testGuestName,
    contactPhone: testPhone,
  });
  assert("Rejects checkout date before checkin date", invalidDateRes.ok === false);

  // Invalid test: empty name
  const emptyNameRes = await submitLeisureBooking({
    roomId: 1,
    checkIn: "2026-12-01",
    checkOut: "2026-12-03",
    guestCount: 2,
    breakfast: false,
    dinner: false,
    guestName: "",
    contactPhone: testPhone,
  });
  assert("Rejects request with empty guest name", emptyNameRes.ok === false);

  // Valid leisure booking with breakfast & dinner
  const validLeisureRes = await submitLeisureBooking({
    roomId: 1,
    checkIn: "2026-12-10",
    checkOut: "2026-12-12", // 2 nights
    guestCount: 2,
    breakfast: true,
    dinner: true,
    guestName: testGuestName,
    contactPhone: testPhone,
    contactEmail: "e2e@gomodi.co.za",
    specialRequests: "Client demo automated test booking.",
  });
  assert("Submits valid leisure booking successfully", validLeisureRes.ok === true);

  // Verify DB record created
  const [createdRequest] = await db
    .select()
    .from(bookingRequests)
    .where(eq(bookingRequests.guestName, testGuestName));
  assert("Booking request recorded in DB with status=pending", createdRequest?.status === "pending");

  if (createdRequest) {
    const lines = await db
      .select()
      .from(bookingRoomLines)
      .where(eq(bookingRoomLines.bookingRequestId, createdRequest.id));
    assert("Booking room line associated correctly", lines.length === 1 && lines[0].roomId === 1);

    const addons = await db
      .select()
      .from(addOnSelections)
      .where(eq(addOnSelections.bookingRequestId, createdRequest.id));
    assert("Add-ons created (2 nights x (breakfast + dinner) = 4 records)", addons.length === 4, `Found: ${addons.length}`);
  }

  // ---------------------------------------------------------
  // 3. AVAILABILITY RULES (PENDING VS APPROVED)
  // ---------------------------------------------------------
  console.log("\n--- 3. AVAILABILITY & OVERLAP RULES ---");
  // Pending booking should NOT block availability check yet
  const availBeforeApprove = await isRoomAvailable(1, "2026-12-10", "2026-12-12");
  assert("Pending booking leaves room available for overlap check", availBeforeApprove === true);

  // ---------------------------------------------------------
  // 4. CORPORATE MULTI-ROOM QUOTE PIPELINE
  // ---------------------------------------------------------
  console.log("\n--- 4. CORPORATE MULTI-ROOM QUOTE PIPELINE ---");
  const corpCorpName = `E2E Corporate ${timestamp}`;
  const validCorpRes = await submitCorporateQuote({
    fullName: "Corporate Representative",
    jobTitle: "Operations Manager",
    company: corpCorpName,
    phone: "0838887777",
    email: "corp@gomodi.co.za",
    billingEmail: "finance@gomodi.co.za",
    poNumber: `PO-${timestamp}`,
    vatNumber: "4990011223",
    checkIn: "2027-01-15",
    checkOut: "2027-01-18",
    roomLines: [
      { roomType: "double", count: 2, guestsPerRoom: 1 },
      { roomType: "flexible", count: 1, guestsPerRoom: 2 },
    ],
    breakfast: true,
    dinner: true,
    notes: "E2E corporate multi-room test quote.",
  });
  assert("Submits corporate multi-room quote successfully", validCorpRes.ok === true);

  // ---------------------------------------------------------
  // 5. EVENT INQUIRY PIPELINE
  // ---------------------------------------------------------
  console.log("\n--- 5. EVENT INQUIRY PIPELINE ---");
  const validEventRes = await submitEventInquiry({
    fullName: "Event Organizer",
    phone: "0847776666",
    email: "event@gomodi.co.za",
    eventType: "conference",
    guestCount: 30,
    eventDate: "2027-02-14",
    catering: "buffet",
    interestedInRooms: true,
    notes: "E2E event inquiry test.",
  });
  assert("Submits event inquiry successfully", validEventRes.ok === true);

  // ---------------------------------------------------------
  // 6. ADMIN QUEUE ENRICHMENT & CONFLICT DETECTION
  // ---------------------------------------------------------
  console.log("\n--- 6. ADMIN QUEUE ENRICHMENT & CONFLICT DETECTION ---");
  const pendingRequests = await db
    .select({
      id: bookingRequests.id,
      category: bookingRequests.category,
      guestName: bookingRequests.guestName,
      contactPhone: bookingRequests.contactPhone,
      contactEmail: bookingRequests.contactEmail,
      specialRequests: bookingRequests.specialRequests,
      status: bookingRequests.status,
    })
    .from(bookingRequests)
    .where(eq(bookingRequests.status, "pending"));

  assert("Admin pending queue has pending items", pendingRequests.length > 0);

  const reqIds = pendingRequests.map((r) => r.id);
  const lineRows = await db
    .select({
      bookingRequestId: bookingRoomLines.bookingRequestId,
      roomId: bookingRoomLines.roomId,
      checkIn: bookingRoomLines.checkIn,
      checkOut: bookingRoomLines.checkOut,
      guestCount: bookingRoomLines.guestCount,
      roomName: rooms.name,
    })
    .from(bookingRoomLines)
    .innerJoin(rooms, eq(bookingRoomLines.roomId, rooms.id))
    .where(inArray(bookingRoomLines.bookingRequestId, reqIds));

  const linesByRequest: Record<number, any[]> = {};
  for (const row of lineRows) {
    (linesByRequest[row.bookingRequestId] ||= []).push(row);
  }

  const enriched = enrichRequests(
    pendingRequests,
    linesByRequest,
    [], // approved
    {},
    {},
    {},
    {}
  );
  assert("Enriched admin request list length matches pending count", enriched.length === pendingRequests.length);

  // Event requests must have null room fields in admin queue
  const eventInQueue = enriched.find((r) => r.category === "event");
  if (eventInQueue) {
    assert("Event requests carry null room fields in queue", eventInQueue.roomId === null && eventInQueue.checkIn === null);
  }

  // ---------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------
  console.log("\n=======================================================");
  if (totalFails === 0) {
    console.log("🎉 ALL E2E TESTS PASSED SUCCESSFULLY! READY FOR CLIENT DEMO.");
  } else {
    console.error(`🚨 ${totalFails} TEST(S) FAILED! CHECK LOGS ABOVE.`);
  }
  console.log("=======================================================\n");

  process.exit(totalFails === 0 ? 0 : 1);
}

runE2ETests().catch((err) => {
  console.error("FATAL E2E ERROR:", err);
  process.exit(1);
});
