"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function FadeInObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    const els = document.querySelectorAll(".fade-in:not(.visible)");
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
