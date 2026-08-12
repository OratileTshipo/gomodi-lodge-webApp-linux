import { enrichRequests } from "../app/api/admin/requests/route";

const pending = [
  { id: 1, category: "leisure", guestName: "Leisure Guest", contactPhone: "0821111111", contactEmail: null, specialRequests: null, status: "pending", notifiedPartnerAt: null, contactedAt: null },
  { id: 2, category: "event", guestName: "Event Guest", contactPhone: "0822222222", contactEmail: null, specialRequests: null, status: "pending", notifiedPartnerAt: null, contactedAt: null },
  { id: 3, category: "corporate", guestName: "Corp Guest", contactPhone: "0823333333", contactEmail: null, specialRequests: null, status: "pending", notifiedPartnerAt: null, contactedAt: null },
];

const linesByRequest: Record<number, any[]> = {
  1: [{ roomId: 2, checkIn: "2026-08-14", checkOut: "2026-08-16", guestCount: 2, roomName: "Room 2" }],
  // 2 = event: intentionally NO room lines
  3: [
    { roomId: 1, checkIn: "2026-09-01", checkOut: "2026-09-03", guestCount: 1, roomName: "Room 1" },
    { roomId: 2, checkIn: "2026-09-01", checkOut: "2026-09-03", guestCount: 1, roomName: "Room 2" },
    { roomId: 4, checkIn: "2026-09-01", checkOut: "2026-09-03", guestCount: 1, roomName: "Room 4" },
  ],
};

const approved: any[] = [
  { roomId: 2, checkIn: "2026-08-15", checkOut: "2026-08-17" },
  { roomId: 5, checkIn: "2026-09-01", checkOut: "2026-09-02" },
];

const eventMap: Record<number, any> = { 2: { eventType: "wedding", expectedGuests: 40, eventDate: "2026-12-01" } };
const corporateMap: Record<number, any> = { 3: { companyName: "ACME", poNumber: "PO-123" } };
const popMap: Record<number, boolean> = { 1: true };

const out = enrichRequests(pending, linesByRequest, approved, {}, corporateMap, eventMap, popMap, {});
const byId = Object.fromEntries(out.map((r: any) => [r.id, r]));

let fails = 0;
function assert(name: string, cond: boolean) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) fails++;
}

assert("event request appears in the queue", !!byId[2]);
assert("event request room fields are null", byId[2].roomId === null && byId[2].checkIn === null && byId[2].checkOut === null && byId[2].guestCount === null && byId[2].roomName === null);
assert("event request has NO conflict banner", byId[2].conflict === null);
assert("event request has NO pending warning", byId[2].pendingWarning === null);
assert("event request carries its eventDetails", byId[2].eventDetails?.eventType === "wedding");
assert("event request carries POP status (false)", byId[2].proofOfPaymentUploaded === false);
assert("leisure request appears", !!byId[1]);
assert("leisure request keeps room fields", byId[1].roomName === "Room 2" && byId[1].guestCount === 2);
assert("leisure hard conflict detected (overlaps approved)", byId[1].conflict?.startsWith("OVERLAPS APPROVED BOOKING: ROOM 2"));
assert("corporate appears exactly ONCE (no duplicate cards)", out.filter((r: any) => r.category === "corporate").length === 1);
assert("corporate roomName from its first line", byId[3].roomName === "Room 1");
assert("corporate carries corporateDetails", byId[3].corporateDetails?.poNumber === "PO-123");
assert("corporate has no hard conflict (rooms/dates don't overlap approved)", byId[3].conflict === null);

// Soft-warning scenario: a 4th pending leisure request overlapping #1 on room 2
const pending2 = [...pending, { id: 4, category: "leisure", guestName: "Second Leisure", contactPhone: "0824444444", contactEmail: null, specialRequests: null, status: "pending", notifiedPartnerAt: null, contactedAt: null }];
const lines2 = { ...linesByRequest, 4: [{ roomId: 2, checkIn: "2026-08-15", checkOut: "2026-08-17", guestCount: 2, roomName: "Room 2" }] };
const out2 = enrichRequests(pending2, lines2, approved, {}, {}, {}, {}, {});
const byId2 = Object.fromEntries(out2.map((r: any) => [r.id, r]));
assert("soft warning on overlapping pending request #1", byId2[1].pendingWarning?.includes("1 OTHER PENDING REQUEST"));
assert("soft warning on overlapping pending request #4", byId2[4].pendingWarning?.includes("1 OTHER PENDING REQUEST"));
assert("event stays clean despite other overlaps", byId2[2].pendingWarning === null);

console.log(fails === 0 ? "\nALL TESTS PASSED" : `\n${fails} TEST(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
