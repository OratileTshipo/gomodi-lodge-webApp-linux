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
    <main className="min-h-screen bg-stone-50">
      {/* Phase 2b Compliant Hero Section */}
      <section className="bg-stone-100 border-b border-stone-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-stone-900 mb-4 tracking-tight">
            Our Rooms
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Nine thoughtfully designed rooms, blending warm terracotta tones, 
            dark walnut furnishings, and modern comfort. Choose the space that 
            best suits your stay.
          </p>
        </div>
      </section>

      {/* Room Cards Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
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
            }))}
            carryParams={{
              checkIn: params.checkIn,
              checkOut: params.checkOut,
              guests: params.guests,
            }}
          />
        </div>
      </section>
    </main>
  );
}
