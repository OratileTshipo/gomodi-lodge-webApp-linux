"use client";

import { useEffect } from "react";

/**
 * Keeps a `--header-h` CSS variable in sync with the actual rendered height of
 * the fixed site header. Page content (and sticky bars) use
 * `var(--header-h)` for their offset, so heroes always start EXACTLY at the
 * low end of the header — regardless of viewport, font loading, or zoom.
 */
export function HeaderSpacer() {
  useEffect(() => {
    const sync = () => {
      const header = document.querySelector("header");
      if (header) {
        document.documentElement.style.setProperty(
          "--header-h",
          `${header.offsetHeight}px`
        );
      }
    };

    sync();
    // Re-sync after fonts/hydration settle and on any resize/orientation change
    const settle = setTimeout(sync, 300);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      clearTimeout(settle);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

  return null;
}
