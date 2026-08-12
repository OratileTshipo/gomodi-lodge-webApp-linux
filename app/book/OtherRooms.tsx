"use client";

import Image from "next/image";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { bathLabel } from "@/lib/rooms";
import type { BookingRoom } from "./booking-utils";

/**
 * "Prefer a different room?" — conversion helper shown after a room is chosen.
 * Lists other rooms still available for the chosen dates; taps switch the
 * selection and scroll back to the top of the wizard.
 */
export function OtherRooms({
  rooms,
  roomId,
  checkIn,
  checkOut,
  unavailableIds,
  onSwitchRoom,
}: {
  rooms: BookingRoom[];
  roomId: number | null;
  checkIn: string;
  checkOut: string;
  unavailableIds: number[];
  onSwitchRoom: (id: number) => void;
}) {
  if (!roomId) return null;
  const others = rooms.filter(
    (r) => r.id !== roomId && (checkIn && checkOut ? !unavailableIds.includes(r.id) : true)
  );
  if (others.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-6 pb-20 border-t border-walnut/10 pt-12 mt-8 motion-pop">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl font-semibold text-ink">Prefer a different room?</h2>
        <p className="text-stone mt-2 max-w-xl mx-auto">
          Other rooms available for your dates — tap one to switch.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {others.map((r, i) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onSwitchRoom(r.id)}
            className="bg-white rounded-2xl border border-walnut/10 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-terracotta/40 transition-all group motion-pop text-left card-lift"
            data-stagger={(i % 6) + 1}
          >
            <span className="block aspect-[16/10] overflow-hidden bg-cream relative">
              {r.images.length > 0 ? (
                <Image
                  src={r.images[0]}
                  alt={r.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <PhotoPlaceholder label={r.name} />
              )}
              {r.flexible && <span className="absolute top-2 left-2 bg-ink/70 text-cream-light text-[10px] font-medium uppercase px-2 py-0.5 rounded">Flexible twin/double</span>}
            </span>
            <span className="block p-4">
              <span className="flex items-start justify-between gap-2 mb-2">
                <span>
                  <span className="font-semibold text-ink text-base group-hover:text-terracotta-dark transition-colors">{r.name}</span>
                  <span className="block text-stone text-xs mt-0.5">{r.config} · {bathLabel(r.bathOrShower)}</span>
                </span>
                <span className="text-terracotta-dark font-semibold text-base whitespace-nowrap">R{Number(r.baseRate)}</span>
              </span>
              <span className="block w-full mt-3 py-2 text-sm font-semibold text-terracotta-dark border border-terracotta-dark/30 rounded-lg group-hover:bg-terracotta-tint transition-colors text-center">
                Switch to this room
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
