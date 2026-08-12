import Link from "next/link";
import Image from "next/image";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { bathLabel } from "@/lib/rooms";
import type { getRooms } from "@/lib/rooms-cache";

type Room = Awaited<ReturnType<typeof getRooms>>[number];

/** Three-room teaser linking into the full rooms listing. */
export function RoomsPreviewSection({ rooms }: { rooms: Room[] }) {
  return (
    <section id="rooms" className="py-16 md:py-24 bg-cream-light">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 motion-fade-up motion-ready">
          <div>
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">
              Nine rooms, all freshly renovated.
            </h2>
            <p className="text-stone mt-3 max-w-xl">
              Every room includes Smart TV, WiFi, air conditioning with
              fan/heater backup, and your choice of shower or bath. One
              flexible room can be set as two singles or one double — a
              deep sleep and a slow start are included.
            </p>
          </div>
          <Link
            href="/rooms"
            className="text-terracotta-dark font-semibold text-sm inline-flex items-center gap-2 hover:gap-3 transition-all interactive-element"
          >
            View all 9 rooms
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {rooms.map((room, i) => (
            <Link
              key={room.id}
              href={`/book?room=${room.id}`}
              className="card-shadow card-lift bg-white rounded-2xl overflow-hidden border border-walnut/10 motion-scale-in motion-ready"
              data-stagger={i + 1}
            >
              <div className="aspect-[4/3] bg-cream overflow-hidden image-zoom relative">
                {room.id === 1 ? (
                  <Image
                    src="/images/rooms/room1.jpeg"
                    alt={room.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <PhotoPlaceholder label={room.name} />
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink">{room.name}</h3>
                  <span className="text-terracotta-dark font-semibold text-sm">
                    R{Number(room.baseRate).toFixed(0)}/night
                  </span>
                </div>
                <p className="text-stone text-sm mt-1">
                  {room.config} ·{" "}
                  {bathLabel(room.bathOrShower)} · 2 guests
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
