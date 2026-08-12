"use client";

import Link from "next/link";
import { fmtDate, fmt, type BookingRoom } from "./booking-utils";

/** Sticky "Your stay" sidebar — dates, room, meals and the indicative total. */
export function StaySummary({
  checkIn,
  checkOut,
  nights,
  room,
  guestCount,
  breakfast,
  dinner,
  accomTotal,
  mealTotal,
  hasSeasonal,
}: {
  checkIn: string;
  checkOut: string;
  nights: number;
  room: BookingRoom | null;
  guestCount: number;
  breakfast: boolean;
  dinner: boolean;
  accomTotal: number;
  mealTotal: number;
  hasSeasonal: boolean;
}) {
  return (
    <div className="lg:sticky lg:top-[calc(var(--header-h)+1rem)] bg-white rounded-2xl border border-walnut/10 shadow-sm p-5 motion-fade-up motion-ready overflow-hidden relative">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-terracotta via-gold to-terracotta-dark rounded-t-2xl" />
      <div className="mb-4">
        <h3 className="font-semibold text-ink text-lg">Your stay</h3>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-start"><span className="text-stone">Dates</span><span className="text-ink text-right font-medium">{checkIn ? (checkOut ? `${fmtDate(checkIn)} → ${fmtDate(checkOut)}` : `${fmtDate(checkIn)} → ?`) : "—"}</span></div>
        <div className="flex justify-between"><span className="text-stone">Nights</span><span className="text-ink font-medium">{nights || "—"}</span></div>
        <div className="flex justify-between items-start"><span className="text-stone">Room</span><span className="text-ink text-right font-medium">{room?.name ?? "—"}</span></div>
        <div className="flex justify-between"><span className="text-stone">Guests</span><span className="text-ink font-medium">{guestCount}</span></div>
        <div className="flex justify-between"><span className="text-stone">Meals</span><span className="text-ink font-medium">{[breakfast && "Breakfast", dinner && "Dinner"].filter(Boolean).join(" + ") || "None"}</span></div>
        <div className="border-t border-walnut/10 pt-3 mt-3 space-y-1.5">
          <div className="flex justify-between text-stone"><span>Accommodation</span><span>{accomTotal ? fmt(accomTotal) : "—"}</span></div>
          <div className="flex justify-between text-stone"><span>Meals</span><span>{mealTotal ? fmt(mealTotal) : "—"}</span></div>
          <div className="flex justify-between text-ink font-semibold text-base pt-2 border-t border-walnut/10 mt-2"><span>Indicative total</span><span className="text-terracotta-dark">{accomTotal || mealTotal ? fmt(accomTotal + mealTotal) : "—"}</span></div>
          {hasSeasonal && (
            <p className="text-[11px] text-gold-dark leading-relaxed">
              Seasonal rates apply on part of these dates — the quote
              will show each night&apos;s rate.
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 text-center">
        <Link href="/rooms" className="text-sm text-stone hover:text-terracotta-dark">Not sure which room?</Link>
      </div>
    </div>
  );
}
