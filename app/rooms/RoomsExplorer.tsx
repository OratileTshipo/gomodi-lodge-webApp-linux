"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import HeroSlideshow from "@/components/HeroSlideshow";

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

// Real images for Room 1 — other rooms use PhotoPlaceholder
const ROOM_IMAGES: Record<number, { src: string; alt: string }[]> = {
  1: [
    { src: "/images/rooms/room1.jpeg", alt: "Room 1 main view" },
    { src: "/images/rooms/room1-view1.jpeg", alt: "Room 1 second view" },
    { src: "/images/rooms/room1-view2.jpeg", alt: "Room 1 third view" },
    { src: "/images/rooms/room1-view3.jpeg", alt: "Room 1 fourth view" },
    { src: "/images/rooms/room1-view4.jpeg", alt: "Room 1 fifth view" },
    { src: "/images/rooms/room1-bed-tv.jpeg", alt: "Room 1 bed and TV" },
    { src: "/images/rooms/room1-bathroom.jpeg", alt: "Room 1 bathroom" },
  ],
};

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
  const [modalMounted, setModalMounted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (activeRoom) {
      setActiveImageIndex(0);
      const t = setTimeout(() => setModalMounted(true), 10);
      // Lock body scroll while the modal is open — no page scroll behind it
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(t);
        document.body.style.overflow = prevOverflow;
      };
    } else {
      setModalMounted(false);
    }
  }, [activeRoom]);

  // Close modal on Escape
  useEffect(() => {
    if (!activeRoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveRoom(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeRoom]);

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

  const getRoomImages = (roomId: number) => ROOM_IMAGES[roomId] || [];

  return (
    <main className="page-transition">
      {/* BREADCRUMB */}
      <nav className="max-w-6xl mx-auto px-6 py-4 text-sm text-stone" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/" className="hover:text-terracotta-dark inline-block py-2">Home</Link></li>
          <li className="text-walnut/40">/</li>
          <li className="text-ink font-medium">Our Rooms</li>
        </ol>
      </nav>

      {/* HERO — same template as home/corporate/events (hero-outer + hero-content,
          identical spacing, stagger and interval; only text and images differ) */}
      <section className="relative">
        <div className="hero-outer relative h-[55vh] min-h-[min(520px,calc(100svh_-_var(--header-h)))] max-h-[560px] overflow-hidden parallax-container">
          <HeroSlideshow
            images={[
              { src: "/images/rooms/room1.jpeg", alt: "Room 1 — main view" },
              { src: "/images/rooms/room1-view1.jpeg", alt: "Room 1 — second view" },
              { src: "/images/rooms/room1-view2.jpeg", alt: "Room 1 — third view" },
              { src: "/images/rooms/room1-view3.jpeg", alt: "Room 1 — fourth view" },
              { src: "/images/rooms/room1-view4.jpeg", alt: "Room 1 — fifth view" },
              { src: "/images/rooms/room1-bed-tv.jpeg", alt: "Room 1 — bed and TV" },
              { src: "/images/rooms/room1-bathroom.jpeg", alt: "Room 1 — bathroom" },
            ]}
            interval={5500}
            className="absolute inset-0"
          />
          <div className="hero-content relative z-10 h-full max-w-6xl mx-auto px-6 flex flex-col justify-end pb-12 md:pb-16">
            <h1 className="font-display text-cream-light font-semibold text-3xl md:text-5xl leading-tight max-w-3xl motion-fade-up motion-ready" data-stagger="1">
              Every room, freshly renovated.
            </h1>
            <p className="text-cream/90 mt-4 max-w-xl text-base md:text-lg motion-fade-up motion-ready" data-stagger="2">
              Terracotta walls, walnut wood, and cream textiles — nine rooms, all recently renovated.
            </p>
            <div className="hero-cta mt-8 flex flex-col sm:flex-row gap-3 motion-fade-up motion-ready" data-stagger="3">
              <Link
                href="/book"
                className="px-6 py-3 rounded-lg font-semibold text-base inline-flex items-center justify-center gap-2 bg-cream-light text-walnut hover:bg-white transition-all shadow-lg shadow-ink/10 hover:shadow-xl btn-press"
              >
                Book a Stay
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </Link>
              <a
                href="#rooms-grid"
                className="px-6 py-3 rounded-lg font-semibold text-base border border-cream-light/40 text-cream-light hover:bg-cream-light/10 inline-flex items-center justify-center backdrop-blur-sm btn-press"
              >
                Browse Rooms
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-12 pt-8">
        <p className="text-stone max-w-2xl text-base leading-relaxed motion-fade-up motion-ready" data-stagger="2">
          Terracotta walls, walnut wood, and cream textiles throughout. Every room has a Smart TV, WiFi, air conditioning with fan and heater backup, and a shower or bath. One room can be set up as two singles or one double — tell us which you prefer when you book.
        </p>
      </section>

      {/* FILTER & SORT BAR */}
      <section className="max-w-6xl mx-auto px-6 pb-8 sticky top-[var(--header-h)] z-30 bg-cream-light/95 backdrop-blur-md py-4 border-y border-walnut/10 shadow-[0_1px_3px_rgba(74,46,34,0.04)]">
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
              className="bg-white border border-walnut/20 rounded-lg px-3 py-2 text-sm text-ink focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition-all"
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
      <section id="rooms-grid" className="max-w-6xl mx-auto px-6 pb-20">
        {sorted.length > 0 ? (
          <div key={`${filter}-${sort}`} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((room, i) => {
              const images = getRoomImages(room.id);
              return (
                <article
                  key={room.id}
                  className="room-card card-shadow card-lift bg-white rounded-2xl overflow-hidden border border-walnut/10 flex flex-col motion-pop cursor-pointer group"
                  data-stagger={(i % 6) + 1}
                  onClick={() => setActiveRoom(room)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveRoom(room);
                    }
                  }}
                  aria-label={`View details for ${room.name}`}
                >
                  <div className="aspect-[4/3] bg-cream overflow-hidden relative image-zoom">
                    {images.length > 0 ? (
                      <Image
                        src={images[0].src}
                        alt={images[0].alt}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <PhotoPlaceholder label={room.name} />
                    )}
                    {images.length > 1 && (
                      <div className="absolute top-3 right-3 bg-ink/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                        {images.length} photos
                      </div>
                    )}
                    {/* Hover hint */}
                    <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="bg-white/90 text-ink text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                        View details &amp; photos
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-ink text-base leading-tight group-hover:text-terracotta-dark transition-colors">{room.name}</h3>
                      <div className="text-terracotta-dark font-semibold text-base whitespace-nowrap">
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveRoom(room);
                        }}
                        className="flex-1 btn-outline px-3 py-2 rounded-lg text-sm font-semibold btn-press"
                      >
                        View details
                      </button>
                      <Link
                        href={`/book?room=${room.id}${suffix}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-center btn-primary px-3 py-2 rounded-lg text-sm font-semibold btn-press ripple"
                      >
                        Book this room
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-walnut-tint flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-walnut"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <div className="text-stone text-lg">No rooms match that filter.</div>
            <button onClick={() => setFilter("all")} className="mt-4 btn-outline px-4 py-2 rounded-lg text-sm font-semibold btn-press">Show all rooms</button>
          </div>
        )}
      </section>

      {/* ROOM DETAIL MODAL — compact two-pane layout */}
      {activeRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`${activeRoom.name} details`}>
          <div className={`absolute inset-0 bg-ink/60 backdrop-blur-sm transition-opacity duration-300 ${modalMounted ? "opacity-100" : "opacity-0"}`} onClick={() => setActiveRoom(null)} />

          <div className={`relative bg-white rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden card-shadow transition-all duration-300 ease-out ${modalMounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"}`}>
            {/* Sticky header: name + price + close, always visible */}
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-walnut/10 bg-white flex-shrink-0">
              <div className="min-w-0">
                <h2 className="font-semibold text-ink text-lg md:text-xl truncate">{activeRoom.name}</h2>
                <p className="text-stone text-xs mt-0.5">
                  {activeRoom.config} · {activeRoom.bathOrShower === "bath" ? "Bath" : "Shower"} · Room {activeRoom.id} of 9
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <div className="text-terracotta-dark font-semibold text-xl">R{Number(activeRoom.baseRate).toLocaleString("en-ZA")}</div>
                  <div className="text-stone text-xs">per night</div>
                </div>
                <button onClick={() => setActiveRoom(null)} className="p-2 rounded-lg hover:bg-walnut/10 transition-colors" aria-label="Close">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            {/* Body: gallery left, details right — no page scroll, internal scroll only */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row">
              {/* LEFT: image gallery */}
              <div className="w-full md:w-1/2 md:border-r border-walnut/10 flex flex-col min-h-0 bg-cream-light">
                <div className="relative w-full h-56 sm:h-64 md:h-auto md:flex-1 min-h-0 overflow-hidden bg-ink/10">
                  {(() => {
                    const images = getRoomImages(activeRoom.id);
                    if (images.length > 0) {
                      return (
                        <>
                          <Image
                            src={images[activeImageIndex]?.src || images[0].src}
                            alt={images[activeImageIndex]?.alt || activeRoom.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                          {images.length > 1 && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
                                }}
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-ink hover:bg-white transition-all shadow-lg"
                                aria-label="Previous image"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveImageIndex((prev) => (prev + 1) % images.length);
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-ink hover:bg-white transition-all shadow-lg"
                                aria-label="Next image"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                              </button>
                              <div className="absolute top-3 left-3 bg-ink/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                                {activeImageIndex + 1} / {images.length}
                              </div>
                            </>
                          )}
                        </>
                      );
                    }
                    return <PhotoPlaceholder label={activeRoom.name} />;
                  })()}
                </div>

                {/* Thumbnail strip */}
                {getRoomImages(activeRoom.id).length > 1 && (
                  <div className="px-3 py-2.5 bg-white border-t border-walnut/10 overflow-x-auto flex-shrink-0">
                    <div className="flex gap-2">
                      {getRoomImages(activeRoom.id).map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`relative w-14 h-11 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                            idx === activeImageIndex ? "ring-2 ring-terracotta ring-offset-1" : "opacity-60 hover:opacity-100"
                          }`}
                          aria-label={`View image ${idx + 1}`}
                        >
                          <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="56px" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: details (scrolls internally, never the page) */}
              <div className="w-full md:w-1/2 overflow-y-auto min-h-0 p-5 md:p-6 flex flex-col">
                <p className="text-stone leading-relaxed text-sm">{activeRoom.description}</p>

                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <div className="bg-cream rounded-lg p-3 border border-walnut/5">
                    <div className="text-[10px] uppercase tracking-wide text-stone font-semibold">Config</div>
                    <div className="text-ink text-sm font-medium mt-1">{activeRoom.config}</div>
                  </div>
                  <div className="bg-cream rounded-lg p-3 border border-walnut/5">
                    <div className="text-[10px] uppercase tracking-wide text-stone font-semibold">Bathroom</div>
                    <div className="text-ink text-sm font-medium mt-1">{activeRoom.bathOrShower === "bath" ? "Bath" : "Shower"}</div>
                  </div>
                  <div className="bg-cream rounded-lg p-3 border border-walnut/5">
                    <div className="text-[10px] uppercase tracking-wide text-stone font-semibold">Guests</div>
                    <div className="text-ink text-sm font-medium mt-1">Up to 2</div>
                  </div>
                  <div className="bg-cream rounded-lg p-3 border border-walnut/5">
                    <div className="text-[10px] uppercase tracking-wide text-stone font-semibold">Flexible</div>
                    <div className="text-ink text-sm font-medium mt-1">{activeRoom.flexible ? "Twin/Double" : "Fixed"}</div>
                  </div>
                </div>

                <div className="mt-5">
                  <h3 className="font-semibold text-ink text-sm mb-2.5">What&apos;s included</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
                    {activeRoom.amenities.map((a) => (
                      <div key={a} className="flex items-center gap-2 text-sm text-ink">
                        <span className="text-terracotta-dark">✓</span>{a}
                      </div>
                    ))}
                  </div>
                </div>

                {activeRoom.flexible && (
                  <div className="mt-5 bg-gold-tint border border-gold/30 rounded-xl p-3.5">
                    <div className="flex items-start gap-2.5">
                      <svg className="flex-shrink-0 mt-0.5 text-gold-dark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      <div>
                        <div className="font-semibold text-ink text-sm">Flexible configuration</div>
                        <p className="text-stone text-sm mt-0.5">Two singles or one double — tell us your preference when you book.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-5 flex flex-col sm:flex-row gap-2.5">
                  <Link href={`/book?room=${activeRoom.id}${suffix}`} className="flex-1 text-center btn-primary px-4 py-3 rounded-lg font-semibold btn-press ripple">Book this room</Link>
                  <button onClick={() => setActiveRoom(null)} className="flex-1 btn-outline px-4 py-3 rounded-lg font-semibold btn-press">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}