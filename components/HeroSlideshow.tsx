"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

interface HeroSlideshowProps {
  images: { src: string; alt: string }[];
  interval?: number;
  className?: string;
}

export default function HeroSlideshow({
  images,
  interval = 5000,
  className = "",
}: HeroSlideshowProps) {
  // Only the currently-shown slide (plus the one fading out during a
  // transition) is ever mounted. Previously ALL slides rendered <Image>
  // elements up front — the home hero alone fetched 7 full JPEGs on load,
  // which is brutal on 3G. Now only the active slide's image is requested
  // (priority), and later slides are fetched on demand when they rotate in.
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const displayedRef = useRef(0);
  displayedRef.current = displayedIndex;
  // Single coordinated timer for dropping the outgoing slide after the fade —
  // clearing it on each transition prevents rapid clicks from cutting a
  // crossfade short with a stale cleanup.
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pause sources: hovering the slideshow, focusing its controls, or the
  // user pressing the pause/play button all stop the auto-advance
  // (WCAG 2.2.2). Tracked separately so leaving with the mouse never resumes
  // while keyboard focus is still inside, and vice versa.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // User-initiated pause via the visible pause/play button (touch users have
  // no hover, so this is their WCAG 2.2.2 mechanism).
  const [paused, setPaused] = useState(false);
  // Users who prefer reduced motion get a static first slide with working
  // manual controls — no autoplay at all.
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // Track OS reduced-motion changes live (e.g. the user toggles the setting
  // mid-session), pausing/resuming autoplay accordingly.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (index === displayedRef.current || index < 0 || index >= images.length)
        return;
      // Keep the outgoing slide mounted (opacity-0) so the CSS crossfade
      // plays, then drop it once the 500ms transition has finished.
      // Cancelling the previous timer keeps rapid clicks from cutting the
      // fade short with a stale cleanup.
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      setPrevIndex(displayedRef.current);
      setDisplayedIndex(index);
      fadeTimer.current = setTimeout(() => setPrevIndex(null), 600);
    },
    [images.length]
  );

  const goToNext = useCallback(() => {
    goTo((displayedRef.current + 1) % images.length);
  }, [goTo, images.length]);

  const goToPrev = useCallback(() => {
    goTo((displayedRef.current - 1 + images.length) % images.length);
  }, [goTo, images.length]);

  const goToSlide = useCallback(
    (index: number) => goTo(index),
    [goTo]
  );

  // Clear the fade timer on unmount so no state update fires after teardown.
  useEffect(() => {
    return () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, []);

  useEffect(() => {
    // No autoplay while hovered, keyboard-focused, user-paused, or under
    // reduced motion.
    if (hovered || focused || paused || reducedMotion) return;
    const timer = setInterval(goToNext, interval);
    return () => clearInterval(timer);
  }, [goToNext, interval, hovered, focused, paused, reducedMotion]);

  return (
    <div
      className={`overflow-hidden ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        // Resume only when focus actually leaves the slideshow (relatedTarget
        // is null when focus moves to the document).
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
    >
      {/* Image container */}
      <div className="relative w-full h-full">
        {images.map((image, index) => {
          const isShown = index === displayedIndex || index === prevIndex;
          if (!isShown) return null;
          return (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                index === displayedIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                // Only the very first slide is high-priority (LCP); every
                // other slide is fetched lazily when it becomes the active one.
                priority={index === 0}
                fetchPriority={index === 0 ? "high" : undefined}
                sizes="100vw"
              />
            </div>
          );
        })}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/30 to-transparent" />

      {/* Navigation arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label="Previous image"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label="Next image"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
              index === displayedIndex
                ? "bg-white scale-125"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Pause/play — the WCAG 2.2.2 mechanism for touch-only users. Hidden
          under reduced motion because there is no autoplay to pause. */}
      {!reducedMotion && (
        <button
          onClick={() => setPaused((v) => !v)}
          className="absolute bottom-4 right-4 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label={paused ? "Play slideshow" : "Pause slideshow"}
          aria-pressed={paused}
        >
          {paused ? (
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
