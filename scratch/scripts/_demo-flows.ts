import { submitLeisureBooking } from "../app/book/actions";
import { submitCorporateQuote } from "../app/corporate/actions";
import { submitEventInquiry } from "../app/events/actions";

async function main() {
  console.log("--- 1. LEISURE BOOKING ---");
  const leisure = await submitLeisureBooking({
    roomId: 1,
    checkIn: "2026-09-15",
    checkOut: "2026-09-17",
    guestCount: 2,
    breakfast: true,
    dinner: false,
    guestName: "Demo Leisure Guest",
    contactPhone: "0821111111",
    contactEmail: "demo-leisure@example.com",
    specialRequests: "Demo booking - please verify admin queue shows this.",
  });
  console.log("leisure result:", JSON.stringify(leisure));

  console.log("--- 2. CORPORATE QUOTE ---");
  const corp = await submitCorporateQuote({
    fullName: "Demo Corp Contact",
    jobTitle: "Project Manager",
    company: "Demo Construction Co",
    phone: "0822222222",
    email: "demo-corp@example.com",
    billingEmail: "finance@demo-construction.co.za",
    poNumber: "PO-2026-0088",
    vatNumber: "4000000000",
    clientRef: "DEMO-01",
    checkIn: "2026-10-05",
    checkOut: "2026-10-08",
    roomLines: [
      { roomType: "double", count: 2, guestsPerRoom: 1 },
      { roomType: "flexible", count: 1, guestsPerRoom: 2 },
    ],
    breakfast: true,
    dinner: true,
    notes: "Demo quote - verify multi-room appears once in admin queue.",
  });
  console.log("corporate result:", JSON.stringify(corp));

  console.log("--- 3. EVENT INQUIRY ---");
  const ev = await submitEventInquiry({
    fullName: "Demo Event Planner",
    phone: "0823333333",
    email: "demo-event@example.com",
    eventType: "birthday",
    guestCount: 25,
    eventDate: "2026-11-21",
    altDate: "2026-11-28",
    catering: "three-course",
    interestedInRooms: true,
    notes: "Demo event - verify it appears in admin queue (event category).",
  });
  console.log("event result:", JSON.stringify(ev));

  console.log("--- ALL FLOWS RAN ---");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("FLOW FAILED:", e);
    process.exit(1);
  });
