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
    <header className="fixed top-0 inset-x-0 z-40 bg-cream-light/95 backdrop-blur-md border-b border-walnut/8 will-change-transform shadow-[0_1px_3px_rgba(74,46,34,0.04)]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-2 md:gap-3">
        <Link href="/" className="flex items-center gap-2.5 py-1 interactive-element group">
          <div className="w-9 h-9 rounded-full bg-terracotta flex items-center justify-center text-cream-light font-bold text-sm shadow-md shadow-terracotta/20 group-hover:shadow-lg group-hover:shadow-terracotta/30 transition-shadow">
            G
          </div>
          <div className="leading-tight whitespace-nowrap">
            <div className="font-semibold text-ink text-sm">
              Gomodi Guest Lodge
            </div>
            <div className="font-display text-xs font-medium italic text-terracotta-dark tracking-wide">
              Iphe Lerato
            </div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm text-ink">
          <Link
            href="/rooms"
            className={`${linkClass("/rooms")} interactive-element px-4 py-3 rounded-lg hover:bg-walnut/5`}
          >
            Rooms
          </Link>
          <Link
            href="/events"
            className={`${linkClass("/events")} interactive-element px-4 py-3 rounded-lg hover:bg-walnut/5`}
          >
            Events
          </Link>
          <Link
            href="/corporate"
            className={`${linkClass("/corporate")} interactive-element px-4 py-3 rounded-lg hover:bg-walnut/5`}
          >
            Corporate
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <button
            onClick={openBranch}
            className="btn-primary px-4 py-3 rounded-lg text-sm font-semibold btn-press ripple shrink-0 whitespace-nowrap shadow-sm shadow-terracotta-dark/20 hover:shadow-md hover:shadow-terracotta-dark/30 transition-shadow"
          >
            Book Now
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-3 rounded-lg border border-walnut/20 interactive-element btn-press hover:bg-walnut/5"
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="transition-transform duration-200"
              style={{ transform: menuOpen ? "rotate(90deg)" : "none" }}
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu — slide + fade transition */}
      <div
        className={`md:hidden border-t border-walnut/10 bg-cream-light/98 backdrop-blur-md transition-all duration-300 ease-out overflow-hidden ${
          menuOpen
            ? "max-h-[300px] opacity-100"
            : "max-h-0 opacity-0 border-t-transparent"
        }`}
      >
        <nav className="px-4 py-3 flex flex-col gap-0.5 text-sm">
          {[
            { href: "/rooms", label: "Rooms" },
            { href: "/events", label: "Events" },
            { href: "/corporate", label: "Corporate" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(link.href, e)}
              className={`py-3 px-3 rounded-lg transition-colors ${
                pathname === link.href
                  ? "bg-terracotta-tint text-terracotta-dark font-semibold"
                  : "hover:bg-walnut/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
