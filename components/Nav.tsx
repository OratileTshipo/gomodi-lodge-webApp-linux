"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useBranchModal } from "./BranchModalContext";

export function Nav() {
  const pathname = usePathname();
  const { openBranch } = useBranchModal();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = (href: string) =>
    `nav-link ${pathname === href ? "active" : ""}`;

  return (
    <header className="sticky top-0 z-40 bg-cream-light/90 backdrop-blur border-b border-walnut/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-terracotta flex items-center justify-center text-cream-light font-bold text-sm">
            G
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-ink text-sm">Gomodi Guest Lodge</div>
            <div className="text-[11px] text-stone">Boutique Guest House</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-ink">
          <Link href="/rooms" className={linkClass("/rooms")}>Rooms</Link>
          <Link href="/events" className={linkClass("/events")}>Events</Link>
          <Link href="/corporate" className={linkClass("/corporate")}>Corporate</Link>
        </nav>
        <div className="flex items-center gap-3">
          <button onClick={openBranch} className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold">
            Book Now
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg border border-walnut/20"
            aria-label="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>
      <div className={`md:hidden ${menuOpen ? "menu-open" : "menu-closed"} transition-all duration-300 bg-cream-light border-t border-walnut/10`}>
        <nav className="px-6 py-4 flex flex-col gap-4 text-sm">
          <Link href="/rooms" onClick={() => setMenuOpen(false)}>Rooms</Link>
          <Link href="/events" onClick={() => setMenuOpen(false)}>Events</Link>
          <Link href="/corporate" onClick={() => setMenuOpen(false)}>Corporate</Link>
        </nav>
      </div>
    </header>
  );
}
