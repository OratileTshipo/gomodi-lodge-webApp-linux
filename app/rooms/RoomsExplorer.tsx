"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { HeroParallax } from "@/components/HeroParallax";

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
      return () => clearTimeout(t);
    } else {
      setModalMounted(false);
    }
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

      {/* HERO */}
      <section className="relative h-[40vh] min-h-[280px] max-h-[400px] overflow-hidden parallax-container mb-0">
        <div className="absolute inset-0">
          <HeroParallax>
            <PhotoPlaceholder label="Guest rooms overview" className="absolute inset-0" />
          </HeroParallax>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-ink/40 to-ink/70" />
        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 flex flex-col justify-end pb-10">
          <h1 className="font-display font-semibold text-cream-light text-3xl md:text-4xl max-w-3xl motion-fade-up motion-ready" data-stagger="1">Every room, freshly renovated.</h1>
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
      <section className="max-w-6xl mx-auto px-6 pb-20">
        {sorted.length > 0 ? (
          <div key={`${filter}-${sort}`} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((room, i) => {
              const images = getRoomImages(room.id);
              return (
                <article key={room.id} className="room-card card-shadow card-lift bg-white rounded-2xl overflow-hidden border border-walnut/10 flex flex-col motion-pop" data-stagger={(i % 6) + 1}>
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
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-ink text-base leading-tight">{room.name}</h3>
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
                      <button onClick={() => setActiveRoom(room)} className="flex-1 btn-outline px-3 py-2 rounded-lg text-sm font-semibold btn-press">View details</button>
                      <Link href={`/book?room=${room.id}${suffix}`} className="flex-1 text-center btn-primary px-3 py-2 rounded-lg text-sm font-semibold btn-press ripple">Book this room</Link>
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

      {/* ROOM DETAIL MODAL */}
      {activeRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className={`absolute inset-0 bg-ink/60 backdrop-blur-sm transition-opacity duration-300 ${modalMounted ? "opacity-100" : "opacity-0"}`} onClick={() => setActiveRoom(null)} />
          <div className={`relative bg-cream-light rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto card-shadow transition-all duration-300 ease-out ${modalMounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"}`}>
            <button onClick={() => setActiveRoom(null)} className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-cream-light/90 backdrop-blur-sm hover:bg-walnut/10 transition-colors shadow-sm" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            
            {/* Image Gallery */}
            <div className="relative aspect-[16/9] overflow-hidden rounded-t-2xl bg-ink/10">
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
                        sizes="(max-width: 768px) 100vw, 768px"
                      />
                      {images.length > 1 && (
                        <>
                          {/* Navigation arrows */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-ink hover:bg-white transition-all shadow-lg"
                            aria-label="Previous image"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImageIndex((prev) => (prev + 1) % images.length);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-ink hover:bg-white transition-all shadow-lg"
                            aria-label="Next image"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          {/* Dots indicator */}
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {images.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveImageIndex(idx);
                                }}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  idx === activeImageIndex ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"
                                }`}
                                aria-label={`View image ${idx + 1}`}
                              />
                            ))}
                          </div>
                          {/* Image counter */}
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
              <div className="px-4 py-3 bg-cream border-b border-walnut/10 overflow-x-auto">
                <div className="flex gap-2">
                  {getRoomImages(activeRoom.id).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                        idx === activeImageIndex ? "ring-2 ring-terracotta ring-offset-2" : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-ink text-xl md:text-2xl">{activeRoom.name}</h2>
                </div>
                <div className="text-right">
                  <div className="text-terracotta-dark font-semibold text-2xl">R{Number(activeRoom.baseRate).toLocaleString("en-ZA")}</div>
                  <div className="text-stone text-xs">per night</div>
                </div>
              </div>
              <p className="text-stone mt-4 leading-relaxed">{activeRoom.description}</p>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
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
                  <div className="text-[10px] uppercase tracking-wide text-stone font-semibold">Room</div>
                  <div className="text-ink text-sm font-medium mt-1">Room {activeRoom.id} of 9</div>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="font-semibold text-ink text-sm mb-3">What&apos;s included</h3>
                <div className="grid grid-cols-2 gap-2">
                  {activeRoom.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-sm text-ink">
                      <span className="text-terracotta-dark">✓</span>{a}
                    </div>
                  ))}
                </div>
              </div>
              {activeRoom.flexible && (
                <div className="mt-6 bg-gold-tint border border-gold/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <svg className="flex-shrink-0 mt-0.5 text-gold-dark" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <div>
                      <div className="font-semibold text-ink text-sm">Flexible configuration</div>
                      <p className="text-stone text-sm mt-1">Let us know when you book whether you&apos;d like two single beds or one double, and we&apos;ll have it ready for you.</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link href={`/book?room=${activeRoom.id}${suffix}`} className="flex-1 text-center btn-primary px-4 py-3 rounded-lg font-semibold btn-press ripple">Book this room</Link>
                <button onClick={() => setActiveRoom(null)} className="flex-1 btn-outline px-4 py-3 rounded-lg font-semibold btn-press">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}