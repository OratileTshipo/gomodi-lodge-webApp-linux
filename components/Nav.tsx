"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useBranchModal } from "./BranchModalContext";
import { useSmoothScroll } from "@/lib/motion";

export function Nav() {
  const pathname = usePathname();
  const { openBranch } = useBranchModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollToRef = useSmoothScroll();
  
  const linkClass = (href: string) =>
    `nav-link ${pathname === href ? "active" : ""}`;

  const handleNavClick = (href: string, e?: React.MouseEvent) => {
    if (href.startsWith("#")) {
      e?.preventDefault();
      scrollToRef(href.slice(1));
    }
    setMenuOpen(false);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-cream-light/90 backdrop-blur border-b border-walnut/10 will-change-transform">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-2 md:gap-3">
        <Link href="/" className="flex items-center gap-2 py-1 interactive-element">
          <div className="w-9 h-9 rounded-full bg-terracotta flex items-center justify-center text-cream-light font-bold text-sm">
            G
          </div>
          <div className="leading-tight whitespace-nowrap">
            <div className="font-semibold text-ink text-sm">Gomodi Guest Lodge</div>
            <div className="font-display text-xs font-medium italic text-terracotta-dark tracking-wide">Iphe Lerato</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-ink">
          <Link href="/rooms" className={`${linkClass("/rooms")} interactive-element py-3`}>Rooms</Link>
          <Link href="/events" className={`${linkClass("/events")} interactive-element py-3`}>Events</Link>
          <Link href="/corporate" className={`${linkClass("/corporate")} interactive-element py-3`}>Corporate</Link>
        </nav>
        <div className="flex items-center gap-3">
          <button 
            onClick={openBranch} 
            className="btn-primary px-4 py-3 rounded-lg text-sm font-semibold btn-press ripple shrink-0 whitespace-nowrap"
          >
            Book Now
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-3 rounded-lg border border-walnut/20 interactive-element btn-press"
            aria-label="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>
      <div className={`md:hidden ${menuOpen ? "menu-open" : "menu-closed"} transition-all duration-300 bg-cream-light border-t border-walnut/10`}>
        <nav className="px-6 py-4 flex flex-col gap-2 text-sm">
          <Link href="/rooms" onClick={(e) => handleNavClick("/rooms", e)} className="py-3">Rooms</Link>
          <Link href="/events" onClick={(e) => handleNavClick("/events", e)} className="py-3">Events</Link>
          <Link href="/corporate" onClick={(e) => handleNavClick("/corporate", e)} className="py-3">Corporate</Link>
        </nav>
      </div>
    </header>
  );
}
