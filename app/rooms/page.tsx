import { db } from "@/lib/db";
import { rooms } from "@/lib/db/schema";
import { RoomsExplorer } from "./RoomsExplorer";

export const dynamic = "force-dynamic";

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>;
}) {
  const params = await searchParams;
  const allRooms = await db.select().from(rooms).orderBy(rooms.id);

  return (
    <RoomsExplorer
      rooms={allRooms.map((r) => ({
        id: r.id,
        name: r.name,
        config: r.config,
        bathOrShower: r.bathOrShower,
        // FIX: Explicitly cast to String to satisfy the Room type and prevent NaN
        baseRate: String(r.baseRate), 
        amenities: r.amenities.split(",").map((a) => a.trim()),
        description: r.description,
        flexible: r.config.toLowerCase().includes("configurable"),
      }))}
      carryParams={{
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guests: params.guests,
      }}
    />
  );
}
