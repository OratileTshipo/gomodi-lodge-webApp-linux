import { submitLeisureBooking } from "../app/book/actions";
import { db } from "../lib/db/index";
import { bookingRequests, bookingRoomLines, addOnSelections } from "../lib/db/schema";

async function main() {
  console.log("Test 1: valid booking with breakfast + dinner, 2 nights...");
  const result1 = await submitLeisureBooking({
    roomId: 2, // Garden Double
    checkIn: "2026-08-14",
    checkOut: "2026-08-16",
    guestCount: 2,
    breakfast: true,
    dinner: true,
    guestName: "Thabo Nkosi",
    contactPhone: "0821234567",
    contactEmail: "thabo@example.com",
  });
  console.log("Result:", result1);

  const requests = await db.select().from(bookingRequests);
  console.log(`booking_requests rows: ${requests.length}`);
  console.log(requests);

  const lines = await db.select().from(bookingRoomLines);
  console.log(`booking_room_lines rows: ${lines.length}`);
  console.log(lines);

  const addons = await db.select().from(addOnSelections);
  console.log(`add_on_selections rows: ${addons.length} (expect 4 = 2 nights x breakfast+dinner)`);
  console.log(addons);

  console.log("\nTest 2: overlapping dates should still succeed (status=pending, not approved yet)...");
  const result2 = await submitLeisureBooking({
    roomId: 2,
    checkIn: "2026-08-15",
    checkOut: "2026-08-17",
    guestCount: 1,
    breakfast: false,
    dinner: false,
    guestName: "Second Guest",
    contactPhone: "0839999999",
  });
  console.log("Result (should be ok:true, since first booking is still pending, not approved):", result2);

  console.log("\nTest 3: invalid — checkout before checkin...");
  const result3 = await submitLeisureBooking({
    roomId: 2,
    checkIn: "2026-08-20",
    checkOut: "2026-08-18",
    guestCount: 1,
    breakfast: false,
    dinner: false,
    guestName: "Bad Dates",
    contactPhone: "0821111111",
  });
  console.log("Result (should be ok:false):", result3);

  console.log("\nTest 4: missing name...");
  const result4 = await submitLeisureBooking({
    roomId: 2,
    checkIn: "2026-09-01",
    checkOut: "2026-09-02",
    guestCount: 1,
    breakfast: false,
    dinner: false,
    guestName: "",
    contactPhone: "0821111111",
  });
  console.log("Result (should be ok:false):", result4);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
