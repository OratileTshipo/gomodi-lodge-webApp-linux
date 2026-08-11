import { db } from "@/lib/db";
import { rooms } from "@/lib/db/schema";
import { getSeasonalPeriods } from "@/lib/db/seasonal";
import { BookingForm } from "./BookingForm";

export const dynamic = "force-dynamic";

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

  const [allRooms, seasonalPeriods] = await Promise.all([
    db.select().from(rooms).orderBy(rooms.id),
    getSeasonalPeriods(),
  ]);

  return (
    <BookingForm
      rooms={allRooms.map((r) => ({
        id: r.id,
        name: r.name,
        config: r.config,
        bathOrShower: r.bathOrShower,
        baseRate: r.baseRate,
        flexible: r.config.toLowerCase().includes("configurable"),
        images: r.images,
      }))}
      seasonalPeriods={seasonalPeriods}
      initialRoomId={params.room ? Number(params.room) : null}
      initialCheckIn={params.checkIn ?? ""}
      initialCheckOut={params.checkOut ?? ""}
      initialGuests={params.guests ? Number(params.guests) : 2}
    />
  );
}
