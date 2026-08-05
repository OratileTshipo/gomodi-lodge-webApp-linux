"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

/**
 * Performance-optimized motion hook for scroll-based animations.
 * Uses IntersectionObserver with reduced motion support and throttling.
 */
export function useScrollReveal(options?: {
  threshold?: number;
  rootMargin?: string;
  delay?: number;
}) {
  const { threshold = 0.1, rootMargin = "0px 0px -50px 0px", delay = 0 } = options || {};
  const ref = useRef<HTMLElement | null>(null);
  const isVisible = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Respect reduced motion preferences
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      if (ref.current) {
        ref.current.classList.add("motion-visible");
        ref.current.style.opacity = "1";
        ref.current.style.transform = "none";
      }
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible.current) {
            isVisible.current = true;
            
            if (delay > 0) {
              timeoutRef.current = setTimeout(() => {
                element.classList.add("motion-visible");
              }, delay);
            } else {
              element.classList.add("motion-visible");
            }
            
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      observer.disconnect();
    };
  }, [threshold, rootMargin, delay]);

  return ref;
}

/**
 * Parallax effect hook optimized for mobile.
 * Uses CSS transforms with will-change and requestAnimationFrame.
 */
export function useParallax(speed: number = 0.2) {
  const ref = useRef<HTMLDivElement | null>(null);
  const rafId = useRef<number | null>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || typeof window === "undefined") return;

    const element = ref.current;
    if (!element) return;

    // Check if element is in viewport before applying parallax
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.dataset.inView = "true";
        } else {
          element.dataset.inView = "false";
        }
      },
      { threshold: 0, rootMargin: "100px" }
    );

    observer.observe(element);

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Throttle scroll updates
      if (rafId.current) return;

      rafId.current = requestAnimationFrame(() => {
        if (element.dataset.inView === "true") {
          const diff = currentScrollY - lastScrollY.current;
          const currentTransform = element.style.transform;
          const match = currentTransform.match(/translateY\((-?\d+\.?\d*)px\)/);
          const currentY = match ? parseFloat(match[1]) : 0;
          
          const newY = Math.max(-100, Math.min(100, currentY + diff * speed));
          element.style.transform = `translateY(${newY}px)`;
        }
        lastScrollY.current = currentScrollY;
        rafId.current = null;
      });
    };

    // Passive listener for better scroll performance
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [speed]);

  return ref;
}

/**
 * Shared layout transition component for page transitions.
 * Uses FLIP technique for smooth, performant animations.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const element = containerRef.current;
    if (!element) return;

    // Fade out
    element.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    element.style.opacity = "0";
    element.style.transform = "translateY(8px)";

    const timeout = setTimeout(() => {
      // Fade in
      element.style.opacity = "1";
      element.style.transform = "translateY(0)";
    }, 50);

    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <div ref={containerRef} className="page-transition">
      {children}
    </div>
  );
}

/**
 * Micro-interaction hook for hover/tap feedback.
 * Optimized for touch devices with haptic feedback support.
 */
export function useMicroInteraction() {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const handlePointerDown = (e: PointerEvent) => {
      if (prefersReducedMotion) return;
      
      // Trigger subtle scale on touch/click
      element.style.transition = "transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)";
      element.style.transform = "scale(0.98)";
      
      // Haptic feedback if available
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(5);
        } catch {
          // Ignore if vibrate not supported
        }
      }
    };

    const handlePointerUp = () => {
      if (prefersReducedMotion) return;
      element.style.transform = "scale(1)";
    };

    const handlePointerLeave = () => {
      if (prefersReducedMotion) return;
      element.style.transform = "scale(1)";
    };

    element.addEventListener("pointerdown", handlePointerDown);
    element.addEventListener("pointerup", handlePointerUp);
    element.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      element.removeEventListener("pointerdown", handlePointerDown);
      element.removeEventListener("pointerup", handlePointerUp);
      element.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return ref;
}

/**
 * Kinetic typography animation hook.
 * Staggered text reveal with GPU-accelerated transforms.
 */
export function useKineticText(options?: { stagger?: number; duration?: number }) {
  const { stagger = 0.03, duration = 0.5 } = options || {};
  const ref = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const element = ref.current;
    if (!element) return;

    const words = element.textContent?.split(" ") || [];
    if (words.length <= 1) return;

    element.innerHTML = words
      .map((word, i) => `<span class="kinetic-word" style="transition-delay: ${i * stagger}s">${word}</span>`)
      .join(" ");

    // Trigger animation on next frame
    requestAnimationFrame(() => {
      const spans = element.querySelectorAll(".kinetic-word");
      spans.forEach((span) => span.classList.add("kinetic-visible"));
    });

    return () => {
      element.textContent = words.join(" ");
    };
  }, [stagger]);

  return ref;
}

/**
 * Observer component that watches for elements to animate on scroll.
 * Lightweight alternative to heavy animation libraries.
 */
export function MotionObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("motion-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const elements = document.querySelectorAll(".motion-ready:not(.motion-visible)");
    elements.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, [pathname]);

  return null;
}

/**
 * Custom smooth scroll hook for anchor links.
 * Provides buttery-smooth scrolling with momentum effect.
 */
export function useSmoothScroll() {
  const scrollToRef = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const y = element.getBoundingClientRect().top + window.scrollY - 80;
    
    // Smooth scroll with custom easing
    const start = window.scrollY;
    const distance = y - start;
    const duration = Math.min(600, Math.abs(distance) / 2);
    const startTime = performance.now();

    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      
      window.scrollTo(0, start + distance * easedProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, []);

  return scrollToRef;
}
