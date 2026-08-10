import { BookingForm } from "./BookingForm";
import { getRooms } from "@/lib/rooms-cache";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{
    room?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
  }>;
}) {
  const params = await searchParams;

  // 60s-cached room list (lib/rooms-cache) — repeat visits skip the remote DB.
  const allRooms = await getRooms();

  return (
    <BookingForm
      rooms={allRooms.map((r) => ({
        id: r.id,
        name: r.name,
        config: r.config,
        bathOrShower: r.bathOrShower,
        baseRate: r.baseRate,
        flexible: r.config.toLowerCase().includes("configurable"),
      }))}
      initialRoomId={params.room ? Number(params.room) : null}
      initialCheckIn={params.checkIn ?? ""}
      initialCheckOut={params.checkOut ?? ""}
      initialGuests={params.guests ? Number(params.guests) : 2}
    />
  );
}
