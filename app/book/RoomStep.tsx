"use client";

import Image from "next/image";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { bathLabel } from "@/lib/rooms";
import type { BookingRoom } from "./booking-utils";

/**
 * Step 2 — room + guest count. Rooms overlapping an approved booking for the
 * chosen dates are greyed out (unavailableIds is fetched by the parent).
 */
export function RoomStep({
  rooms,
  roomId,
  guestCount,
  checkIn,
  checkOut,
  unavailableIds,
  onSelectRoom,
  onSetGuestCount,
}: {
  rooms: BookingRoom[];
  roomId: number | null;
  guestCount: number;
  checkIn: string;
  checkOut: string;
  unavailableIds: number[];
  onSelectRoom: (id: number | null) => void;
  onSetGuestCount: (n: number) => void;
}) {
  return (
    // data-testid: stable hook for the e2e suite — the heading's parent div
    // does NOT contain the room buttons (they live in a sibling grid), so
    // heading-based scoping breaks.
    <div data-testid="room-step" className="bg-white rounded-2xl border border-walnut/10 shadow-sm p-5 md:p-6 motion-fade-up motion-ready">
      <div className="mb-4">
        <span className="text-terracotta-dark font-semibold text-xs uppercase tracking-wide">Step 2</span>
        <h2 className="font-semibold text-ink text-lg mt-1">Choose your room</h2>
        <p className="text-stone text-sm mt-1">Rooms greyed out are already booked for your dates.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rooms.map((r) => {
          // Only apply availability when both dates are chosen; otherwise
          // a stale fetch result could wrongly grey out rooms.
          const unavailable = checkIn && checkOut ? unavailableIds.includes(r.id) : false;
          const selected = roomId === r.id;
          return (
            <button
              key={r.id}
              type="button"
              disabled={unavailable}
              aria-pressed={selected}
              className={`rounded-xl border overflow-hidden transition-all text-left ${
                selected
                  ? "border-terracotta ring-2 ring-terracotta/30 bg-terracotta-tint/50"
                  : unavailable
                    ? "border-walnut/10 bg-cream-light opacity-60 cursor-not-allowed"
                    : "border-walnut/10 bg-white hover:border-walnut/20 cursor-pointer"
              }`}
              onClick={() => onSelectRoom(selected ? null : r.id)}
            >
              <span className="block aspect-[16/9] overflow-hidden bg-cream relative">
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
                {unavailable && (
                  <span className="absolute inset-0 bg-ink/40 flex items-center justify-center">
                    <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">Booked</span>
                  </span>
                )}
                {r.flexible && !unavailable && <span className="absolute top-2 left-2 bg-ink/70 text-cream-light text-[10px] font-medium uppercase px-2 py-0.5 rounded">Flexible twin/double</span>}
              </span>
              <span className="block p-3">
                <span className="flex items-start justify-between gap-2">
                  <span>
                    <span className="font-semibold text-ink text-sm">{r.name}</span>
                    <span className="block text-stone text-xs mt-0.5">{r.config} · {bathLabel(r.bathOrShower)}</span>
                  </span>
                  <span className="text-terracotta-dark font-semibold text-sm whitespace-nowrap">R{Number(r.baseRate)}<span className="text-stone/60 font-normal text-[10px]">/nt</span></span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 pt-5 border-t border-walnut/10">
        <label className="block text-sm font-medium text-ink mb-2">How many guests? <span className="text-stone font-normal">(max 2 per room)</span></label>
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Fewer guests" onClick={() => onSetGuestCount(Math.max(1, guestCount - 1))} className="w-11 h-11 rounded-lg border border-walnut/20 hover:bg-cream-light flex items-center justify-center text-stone">−</button>
          <input type="number" min={1} max={2} value={guestCount} aria-label="Number of guests" onChange={(e) => onSetGuestCount(Math.min(2, Math.max(1, Number(e.target.value))))} className="w-16 text-center border border-walnut/20 rounded-lg px-2 py-1.5 text-sm bg-white" />
          <button type="button" aria-label="More guests" onClick={() => onSetGuestCount(Math.min(2, guestCount + 1))} className="w-11 h-11 rounded-lg border border-walnut/20 hover:bg-cream-light flex items-center justify-center text-stone">+</button>
        </div>
      </div>
    </div>
  );
}
