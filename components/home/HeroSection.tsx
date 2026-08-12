import Link from "next/link";
import HeroSlideshow from "@/components/HeroSlideshow";
import { BookNowHeroButtonClient } from "@/components/BookNowHeroButtonClient";

/** Full-bleed slideshow hero with the welcome message and primary CTAs. */
export function HeroSection() {
  return (
    <section className="relative">
      <div className="hero-outer relative h-[70vh] min-h-[min(520px,calc(100svh_-_var(--header-h)))] max-h-[720px] overflow-hidden">
        <HeroSlideshow
          images={[
            { src: "/images/reception/reception-1.jpeg", alt: "Gomodi Guest Lodge reception building" },
            { src: "/images/reception/reception-2.jpeg", alt: "Reception entrance" },
            { src: "/images/reception/reception-3.jpeg", alt: "Lodge exterior view" },
            { src: "/images/reception/rooms-building-1.jpeg", alt: "Guest rooms building" },
            { src: "/images/reception/rooms-building-2.jpeg", alt: "Rooms building second view" },
            { src: "/images/reception/rooms-building-3.jpeg", alt: "Rooms building third view" },
            { src: "/images/reception/rooms-building-4.jpeg", alt: "Rooms building fourth view" },
          ]}
          interval={6000}
          className="absolute inset-0"
        />
        <div className="absolute inset-0 hero-gradient" />
        <div className="hero-content relative z-10 h-full max-w-6xl mx-auto px-6 flex flex-col justify-end pb-12 md:pb-16">
          <h1
            className="font-display text-cream-light font-semibold text-3xl md:text-5xl leading-tight max-w-2xl motion-fade-up motion-ready"
            data-stagger="1"
          >
            Welcome to Gomodi Guest Lodge — Mmabatho, Mafikeng.
          </h1>
          <p
            className="text-cream/90 mt-4 max-w-xl text-base md:text-lg motion-fade-up motion-ready"
            data-stagger="3"
          >
            Nine rooms, freshly renovated, family-run. Sleep well, eat
            well, and book direct with us — no booking platform in
            between, for leisure stays, work trips, and private events.
          </p>
          <div
            className="hero-cta mt-8 flex flex-col sm:flex-row gap-3 motion-fade-up motion-ready"
            data-stagger="4"
          >
            <BookNowHeroButtonClient />
            <Link
              href="/rooms"
              className="px-6 py-3 rounded-lg font-semibold text-base border border-cream-light/40 text-cream-light hover:bg-cream-light/10 inline-flex items-center justify-center interactive-element backdrop-blur-sm"
            >
              View Rooms
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
