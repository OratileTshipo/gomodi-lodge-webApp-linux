import { db } from "./index";
import { rooms, users } from "./schema";
import { sql } from "drizzle-orm";

const AMENITIES = "Smart TV, WiFi, Air-conditioning, Fan/heater backup, Complementary Tea and Coffee, 500ml still water";

const ROOM_DATA = [
  {
    name: "Room 1",
    config: "Double",
    bathOrShower: "Shower",
    baseRate: "750.00",
    amenities: AMENITIES,
    description: "A comfortable and cozy room with air-conditioning and warm focal point — a good choice for a relaxed stay.",
  },
  {
    name: "Room 2",
    config: "Double",
    bathOrShower: "Bath",
    baseRate: "750.00",
    amenities: AMENITIES,
    description: "A warm, comfortable room with a board bed, walnut headboard, and en-suite bathtub. Perfect for couples or solo travellers.",
  },
  {
    name: "Room 3",
    config: "Double",
    bathOrShower: "shower",
    baseRate: "750.00",
    amenities: AMENITIES,
    description: "Overlooking the reception, with the same warm palette and walnut furnishings throughout, plus an en-suite shower with rainfall head.",
  },
  {
    name: "Room 4",
    config: "Double",
    bathOrShower: "Shower",
    baseRate: "750.00",
    amenities: AMENITIES,
    description: "A generously sized room with both bath and shower, and a small desk — ideal for a longer stay or working guests.",
  },
  {
    name: "Room 5 - Flexible Suite",
    config: "Configurable — 2 single beds or 1 double bed",
    bathOrShower: "shower",
    baseRate: "750.00",
    amenities: AMENITIES,
    description: "Our most adaptable room — set up as two single beds for friends or colleagues sharing, or pushed together as one double for couples. Just tell us your preference when you book.",
  },
  {
    name: "Room 6",
    config: "Double",
    bathOrShower: "Shower",
    baseRate: "750.00",
    amenities: AMENITIES,
    description: "A very quiet mid sized room with shower, Ideal for one night rest or day rest",
  },
  {
    name: "Room 7",
    config: "Double",
    bathOrShower: "Shower",
    baseRate: "750.00",
    amenities: AMENITIES,
    description: "A corner room with dual-aspect windows, an en-suite bath, and the most natural light in the lodge.",
  },
  {
    name: "Room 8",
    config: "Double",
    bathOrShower: "shower",
    // Confirmed flat rate — this room previously drifted to 950.00; every room
    // shares the same R750/night standard rate (seasonal windows raise it).
    baseRate: "750.00",
    amenities: AMENITIES,
    description: "A bright and very specious room, welcoming room with an en-suite shower, finished in the same warm terracotta and walnut palette as the rest of the lodge.",
  },
  {
    name: "Room 9 - Office View",
    config: "Double",
    bathOrShower: "Shower",
    baseRate: "750.00",
    amenities: AMENITIES,
    description: "One of our most spacious room, with a king-size feel, built-in reading lights, and an en-suite bathroom with a spacious shower.",
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
  { name: "Lelz Business Enterprise", phone: "+27780784139", role: "partner" },
];

async function main() {
  console.log("Truncating tables...");
  // Reset tables so re-running this script always reflects the latest data
  await db.execute(sql`TRUNCATE TABLE booking_requests RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE rooms RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);

  console.log("Seeding rooms...");
  await db.insert(rooms).values(ROOM_DATA);
  console.log(`✓ Seeded ${ROOM_DATA.length} rooms.`);

  console.log("Seeding users...");
  await db.insert(users).values(USERS_DATA);
  console.log(`✓ Seeded ${USERS_DATA.length} users.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
