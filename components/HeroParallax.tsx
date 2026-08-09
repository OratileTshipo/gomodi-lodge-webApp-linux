"use client";

import { useRef, useEffect } from "react";

/**
 * Subtle parallax scroll effect for hero images.
 * Moves the child content at a slower rate than scroll for depth.
 * Respects prefers-reduced-motion.
 */
export function HeroParallax({
  children,
  speed = 0.15,
}: {
  children: React.ReactNode;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion || typeof window === "undefined") return;

    const element = ref.current;
    if (!element) return;

    let inView = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
      },
      { threshold: 0, rootMargin: "100px" }
    );

    observer.observe(element);

    const handleScroll = () => {
      if (rafId.current) return;

      rafId.current = requestAnimationFrame(() => {
        if (inView) {
          const scrollY = window.scrollY;
          const offset = scrollY * speed;
          element.style.transform = `translateY(${offset}px) scale(1.1)`;
        }
        rafId.current = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [speed]);

  return (
    <div
      ref={ref}
      className="absolute inset-0 will-change-transform"
      style={{ transform: "scale(1.1)" }}
    >
      {children}
    </div>
  );
}
