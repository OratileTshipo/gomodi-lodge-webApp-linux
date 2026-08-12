import { RoomsExplorer } from "./RoomsExplorer";
import { getRooms } from "@/lib/rooms-cache";

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>;
}) {
  const params = await searchParams;
  // 60s-cached room list (lib/rooms-cache) — repeat visits skip the remote DB.
  const allRooms = await getRooms();

  return (
    <RoomsExplorer
      rooms={allRooms.map((r) => ({
        id: r.id,
        name: r.name,
        config: r.config,
        bathOrShower: r.bathOrShower,
        baseRate: String(r.baseRate),
        amenities: r.amenities.split(",").map((a) => a.trim()),
        description: r.description,
        flexible: r.config.toLowerCase().includes("configurable"),
        images: r.images,
      }))}
      carryParams={{
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guests: params.guests,
      }}
    />
  );
}
