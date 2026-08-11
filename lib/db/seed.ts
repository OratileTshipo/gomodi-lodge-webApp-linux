import { db } from "./index";
import { rooms, users, seasonalPricing } from "./schema";
import { sql } from "drizzle-orm";

const AMENITIES = "Smart TV, WiFi, Air-conditioning, Fan/heater backup, Complementary Tea and Coffee, 500ml still water";

// Room 1 is the only room with real photos so far — the rest keep an empty
// gallery and the UI falls back to placeholder art until the owner supplies
// photos. Paths live in /public so they work on Vercel out of the box.
const ROOM_1_IMAGES = [
  "/images/rooms/room1.jpeg",
  "/images/rooms/room1-view1.jpeg",
  "/images/rooms/room1-view2.jpeg",
  "/images/rooms/room1-view3.jpeg",
  "/images/rooms/room1-view4.jpeg",
  "/images/rooms/room1-bed-tv.jpeg",
  "/images/rooms/room1-bathroom.jpeg",
];

const ROOM_DATA: (typeof rooms.$inferInsert)[] = [
  {
    name: "Room 1",
    config: "Double",
    bathOrShower: "Shower",
    baseRate: "750.00",
    amenities: AMENITIES,
    description:
      "A comfortable and cozy room with air-conditioning and a warm focal point — a good choice for a relaxed stay. Features a king-size feel, Smart TV and an en-suite shower.",
    images: ROOM_1_IMAGES,
  },
  {
    name: "Room 2",
    config: "Double",
    bathOrShower: "Bath",
    baseRate: "750.00",
    amenities: AMENITIES,
    description:
      "A warm, comfortable room with a board bed, walnut headboard, and en-suite bathtub. Perfect for couples or solo travellers who like a long soak.",
    images: [],
  },
  {
    name: "Room 3",
    config: "Double",
    bathOrShower: "Shower",
    baseRate: "750.00",
    amenities: AMENITIES,
    description:
      "Overlooking the reception, with the same warm palette and walnut furnishings throughout, plus an en-suite shower with rainfall head.",
    images: [],
  },
  {
    name: "Room 4",
    config: "Double",
    bathOrShower: "Shower",
    baseRate: "750.00",
    amenities: AMENITIES,
    description:
      "A generously sized room with both bath and shower, and a small desk — ideal for a longer stay or working guests.",
    images: [],
  },
  {
    name: "Room 5 - Flexible Suite",
    config: "Configurable — 2 single beds or 1 double bed",
    bathOrShower: "Shower",
    baseRate: "750.00",
    amenities: AMENITIES,
    description:
      "Our most adaptable room — set up as two single beds for friends or colleagues sharing, or pushed together as one double for couples. Just tell us your preference when you book.",
    images: [],
  },
  {
    name: "Room 6",
    config: "Double",
    bathOrShower: "Shower",
    baseRate: "750.00",
    amenities: AMENITIES,
    description:
      "A very quiet, mid-sized room with a shower — ideal for a one-night rest or a day rest between meetings.",
    images: [],
  },
  {
    name: "Room 7",
    config: "Double",
    bathOrShower: "Bath",
    baseRate: "750.00",
    amenities: AMENITIES,
    description:
      "A corner room with dual-aspect windows, an en-suite bath, and the most natural light in the lodge.",
    images: [],
  },
  {
    name: "Room 8",
    config: "Double",
    bathOrShower: "Shower",
    // Confirmed flat rate — this room previously drifted to 950.00; every room
    // shares the same R750/night standard rate (seasonal windows raise it).
    baseRate: "750.00",
    amenities: AMENITIES,
    description:
      "A bright and very spacious, welcoming room with an en-suite shower, finished in the same warm terracotta and walnut palette as the rest of the lodge.",
    images: [],
  },
  {
    name: "Room 9 - Office View",
    config: "Double",
    bathOrShower: "Shower",
    baseRate: "750.00",
    amenities: AMENITIES,
    description:
      "One of our most spacious rooms, with a king-size feel, built-in reading lights, and an en-suite bathroom with a spacious shower.",
    images: [],
  },
];

// FIX: Explicitly type the array to match the Drizzle schema, preventing the generic "string" type error.
const USERS_DATA: (typeof users.$inferInsert)[] = [
  { name: "Owner", phone: "+27820000001", role: "owner" },
  { name: "Manager", phone: "+27820000002", role: "assistant" },
  { name: "General", phone: "+27820000003", role: "staff" },
  { name: "Keba", phone: "+27820000004", role: "staff" },
  { name: "Keletso", phone: "+27820000005", role: "staff" },
  { name: "Staff 4", phone: "+27820000006", role: "staff" },
];

// Seasonal pricing: festive/busy windows carry a higher per-night rate that
// applies ONLY inside the window — outside it, the base rate (R750) is used.
// These are example windows; the owner edits dates/rates in the seed or admin.
const SEASONAL_DATA: (typeof seasonalPricing.$inferInsert)[] = [
  {
    label: "Festive Season 2026/27 (Christmas & New Year)",
    startDate: "2026-12-18",
    endDate: "2027-01-03",
    ratePerNight: "950.00",
    active: true,
  },
  {
    label: "Easter Weekend 2027",
    startDate: "2027-03-26",
    endDate: "2027-03-29",
    ratePerNight: "950.00",
    active: true,
  },
  {
    label: "Heritage Day Weekend 2026",
    startDate: "2026-09-24",
    endDate: "2026-09-27",
    ratePerNight: "850.00",
    active: true,
  },
];

async function main() {
  console.log("Truncating tables...");
  // Reset tables so re-running this script always reflects the latest data
  await db.execute(sql`TRUNCATE TABLE booking_requests RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE rooms RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE seasonal_pricing RESTART IDENTITY CASCADE`);

  console.log("Seeding rooms...");
  await db.insert(rooms).values(ROOM_DATA);
  console.log(`✓ Seeded ${ROOM_DATA.length} rooms.`);

  console.log("Seeding users...");
  await db.insert(users).values(USERS_DATA);
  console.log(`✓ Seeded ${USERS_DATA.length} users.`);

  console.log("Seeding seasonal pricing...");
  await db.insert(seasonalPricing).values(SEASONAL_DATA);
  console.log(`✓ Seeded ${SEASONAL_DATA.length} seasonal pricing windows.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
