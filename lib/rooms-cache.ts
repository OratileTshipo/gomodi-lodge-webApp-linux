import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { rooms } from "@/lib/db/schema";

// The room list only changes when the owner edits rooms (there is no admin
// room editor yet), so the expensive remote-Neon query is cached for 60s and
// shared across home / rooms / book. Availability is always re-checked live on
// submit, so caching the list never blocks a real booking.
export const getRooms = unstable_cache(
  async () => db.select().from(rooms).orderBy(rooms.id),
  ["rooms-list"],
  { revalidate: 60 }
);
