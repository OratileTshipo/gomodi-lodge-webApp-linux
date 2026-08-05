"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";

type Room = {
  id: number;
  name: string;
  config: string;
  bathOrShower: string;
  baseRate: string;
  amenities: string[];
  description: string;
  flexible: boolean;
};

type Filter = "all" | "double" | "flexible";
type Sort = "default" | "price-asc" | "price-desc" | "name-asc";

export function RoomsExplorer({
  rooms,
  carryParams,
}: {
  rooms: Room[];
  carryParams: { checkIn?: string; checkOut?: string; guests?: string };
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("default");
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);

  const suffix = useMemo(() => {
    const p = new URLSearchParams();
    if (carryParams.checkIn) p.set("checkIn", carryParams.checkIn);
    if (carryParams.checkOut) p.set("checkOut", carryParams.checkOut);
    if (carryParams.guests) p.set("guests", carryParams.guests);
    const s = p.toString();
    return s ? `&${s}` : "";
  }, [carryParams]);

  const counts = {
    all: rooms.length,
    double: rooms.filter((r) => !r.flexible).length,
    flexible: rooms.filter((r) => r.flexible).length,
  };

  const filtered = rooms.filter((r) => {
    if (filter === "all") return true;
    if (filter === "flexible") return r.flexible;
    return !r.flexible;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "price-asc") return Number(a.baseRate) - Number(b.baseRate);
    if (sort === "price-desc") return Number(b.baseRate) - Number(a.baseRate);
    if (sort === "name-asc") return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <main className="page-transition">
      {/* BREADCRUMB */}
      <nav className="max-w-6xl mx-auto px-6 py-4 text-sm text-stone" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/" className="hover:text-terracotta">Home</Link></li>
          <li className="text-walnut/40">/</li>
          <li className="text-ink font-medium">Our Rooms</li>
        </ol>
      </nav>

      {/* HERO - lightweight staggered entrance (opacity/transform only, keeps render instant) */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <span className="pill pill-leisure motion-fade-up motion-ready" data-stagger="1">Nine Rooms</span>
        <h1 className="font-semibold text-ink text-3xl md:text-4xl mt-4 max-w-3xl motion-fade-up motion-ready" data-stagger="2">Every room, freshly renovated. One standard of comfort.</h1>
        <p className="text-stone mt-4 max-w-2xl text-base leading-relaxed motion-fade-up motion-ready" data-stagger="3">
          Warm terracotta walls, dark walnut wood, and cream textiles throughout. Every room includes Smart TV, WiFi, air conditioning with fan and heater backup, and your choice of shower or bath. One flexible room can be set as two singles or one double — just tell us what you need.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 motion-fade-up motion-ready" data-stagger="4">
          <div className="badge">✓ Smart TV in every room</div>
          <div className="badge">✓ Free WiFi</div>
          <div className="badge">✓ A/C + fan/heater backup</div>
          <div className="badge">✓ Shower or bath</div>
          <div className="badge">✓ Secure parking</div>
        </div>
      </section>

      {/* FILTER & SORT BAR - Removed backdrop-blur and fade-in for instant render */}
      <section className="max-w-6xl mx-auto px-6 pb-8 sticky top-[73px] z-30 bg-cream-light py-4 border-y border-walnut/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter rooms">
            <button
              className={`filter-btn pill ${filter === "all" ? "pill-active" : "pill-neutral"}`}
              onClick={() => setFilter("all")}
            >
              All Rooms <span className="text-[10px] opacity-70">· {counts.all}</span>
            </button>
            <button
              className={`filter-btn pill ${filter === "double" ? "pill-active" : "pill-neutral"}`}
              onClick={() => setFilter("double")}
            >
              Double Rooms <span className="text-[10px] opacity-70">· {counts.double}</span>
            </button>
            <button
              className={`filter-btn pill ${filter === "flexible" ? "pill-active" : "pill-neutral"}`}
              onClick={() => setFilter("flexible")}
            >
              Flexible <span className="text-[10px] opacity-70">· {counts.flexible}</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="sortSelect" className="text-sm text-stone whitespace-nowrap">Sort by:</label>
            <select
              id="sortSelect"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="bg-white border border-walnut/20 rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-terracotta"
            >
              <option value="default">Default order</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>
        <div className="mt-3 text-sm text-stone">
          {sorted.length > 0 ? `Showing ${sorted.length} of ${rooms.length} rooms` : "No rooms match that filter."}
        </div>
      </section>

      {/* ROOMS GRID */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        {sorted.length > 0 ? (
          // Key the grid by filter+sort so card entrances replay on every change (mount-safe, no observer dependency)
          <div key={`${filter}-${sort}`} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((room, i) => (
              <article key={room.id} className="room-card card-shadow bg-white rounded-2xl overflow-hidden border border-walnut/10 flex flex-col motion-pop" data-stagger={(i % 6) + 1}>
                <div className="aspect-[4/3] bg-cream overflow-hidden relative">
                  <PhotoPlaceholder label={room.name} />
                  {room.flexible && (
                    <span className="absolute top-3 left-3 pill pill-event">Flexible · Twin or Double</span>
                  )}
                  <span className="absolute top-3 right-3 pill pill-leisure">
                    {room.flexible ? "Flexible" : "Double"}
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-ink text-base leading-tight">{room.name}</h3>
                    <div className="text-terracotta font-semibold text-base whitespace-nowrap">
                      R{Number(room.baseRate).toLocaleString("en-ZA")}<span className="text-stone text-xs font-normal"> / night</span>
                    </div>
                  </div>
                  <p className="text-stone text-sm mt-1">
                    {room.config} · {room.bathOrShower === "bath" ? "Bath" : "Shower"} · Up to 2 guests
                  </p>
                  <p className="text-stone text-sm mt-3 line-clamp-2 flex-1">{room.description}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {room.amenities.slice(0, 4).map((a) => (
                      <span key={a} className="text-[11px] px-2 py-1 rounded bg-cream text-stone">{a}</span>
                    ))}
                    {room.amenities.length > 4 && (
                      <span className="text-[11px] px-2 py-1 rounded bg-walnut-tint text-walnut">+{room.amenities.length - 4} more</span>
                    )}
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button onClick={() => setActiveRoom(room)} className="flex-1 btn-outline px-3 py-2 rounded-lg text-sm font-semibold">View details</button>
                    <Link href={`/book?room=${room.id}${suffix}`} className="flex-1 text-center btn-primary px-3 py-2 rounded-lg text-sm font-semibold">Book this room</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-stone text-lg">No rooms match that filter.</div>
            <button onClick={() => setFilter("all")} className="mt-4 btn-outline px-4 py-2 rounded-lg text-sm font-semibold">Show all rooms</button>
          </div>
        )}
      </section>

      {/* ROOM DETAIL MODAL */}
      {activeRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setActiveRoom(null)} />
          <div className="relative bg-cream-light rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto card-shadow motion-pop">
            <button onClick={() => setActiveRoom(null)} className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-cream-light/90 hover:bg-walnut/10" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <div className="aspect-[16/9] overflow-hidden rounded-t-2xl">
              <PhotoPlaceholder label={activeRoom.name} />
            </div>
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className={`pill ${activeRoom.flexible ? "pill-event" : "pill-leisure"}`}>
                    {activeRoom.flexible ? "Flexible" : "Double"}
                  </span>
                  <h2 className="font-semibold text-ink text-xl md:text-2xl mt-3">{activeRoom.name}</h2>
                </div>
                <div className="text-right">
                  <div className="text-terracotta font-semibold text-2xl">R{Number(activeRoom.baseRate).toLocaleString("en-ZA")}</div>
                  <div className="text-stone text-xs">per night</div>
                </div>
              </div>
              <p className="text-stone mt-4 leading-relaxed">{activeRoom.description}</p>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-cream rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wide text-stone">Config</div>
                  <div className="text-ink text-sm font-medium mt-1">{activeRoom.config}</div>
                </div>
                <div className="bg-cream rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wide text-stone">Bathroom</div>
                  <div className="text-ink text-sm font-medium mt-1">{activeRoom.bathOrShower === "bath" ? "Bath" : "Shower"}</div>
                </div>
                <div className="bg-cream rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wide text-stone">Guests</div>
                  <div className="text-ink text-sm font-medium mt-1">Up to 2</div>
                </div>
                <div className="bg-cream rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wide text-stone">Room</div>
                  <div className="text-ink text-sm font-medium mt-1">Room {activeRoom.id} of 9</div>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="font-semibold text-ink text-sm mb-3">What&apos;s included</h3>
                <div className="grid grid-cols-2 gap-2">
                  {activeRoom.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-sm text-ink">
                      <span className="text-terracotta">✓</span>{a}
                    </div>
                  ))}
                </div>
              </div>
              {activeRoom.flexible && (
                <div className="mt-6 bg-gold-tint border border-gold/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <svg className="flex-shrink-0 mt-0.5 text-gold" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <div>
                      <div className="font-semibold text-ink text-sm">Flexible configuration</div>
                      <p className="text-stone text-sm mt-1">Tell us when you book whether you&apos;d like this room set up as two single beds or one double — we&apos;ll have it ready for your arrival.</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link href={`/book?room=${activeRoom.id}${suffix}`} className="flex-1 text-center btn-primary px-4 py-3 rounded-lg font-semibold">Book this room</Link>
                <button onClick={() => setActiveRoom(null)} className="flex-1 btn-outline px-4 py-3 rounded-lg font-semibold">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
