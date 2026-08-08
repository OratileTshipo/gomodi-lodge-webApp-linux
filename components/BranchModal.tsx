"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBranchModal } from "./BranchModalContext";

export function BranchModal() {
  const { isOpen, closeBranch } = useBranchModal();
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeBranch();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeBranch]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
  }, [isOpen]);

  if (!isOpen) return null;

  function goTo(path: string) {
    closeBranch();
    router.push(path);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={closeBranch}
      />
      <div className="relative bg-cream-light rounded-2xl max-w-lg w-full p-6 md:p-8 card-shadow">
        <button
          onClick={closeBranch}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-walnut/10"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <span className="pill pill-leisure">Book Now</span>
        <h3 className="font-semibold text-ink text-xl mt-3">How are you visiting?</h3>
        <p className="text-stone text-sm mt-2">
          Choose the one that fits your visit — each takes you to the right form.
        </p>
        <div className="mt-6 space-y-3">
          <button
            onClick={() => goTo("/rooms")}
            className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-walnut/10 hover:border-terracotta/40 text-left transition-colors"
          >
            <span className="pill pill-leisure">Leisure</span>
            <div className="flex-1">
              <div className="font-semibold text-ink text-sm">Request a Stay</div>
              <div className="text-stone text-xs">Dates, room, breakfast/dinner add-ons</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => goTo("/corporate")}
            className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-walnut/10 hover:border-walnut/40 text-left transition-colors"
          >
            <span className="pill pill-corporate">Corporate</span>
            <div className="flex-1">
              <div className="font-semibold text-ink text-sm">Request a Quote</div>
              <div className="text-stone text-xs">Multi-room, PO number, formal quote</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => goTo("/events")}
            className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-walnut/10 hover:border-gold/40 text-left transition-colors"
          >
            <span className="pill pill-event">Events</span>
            <div className="flex-1">
              <div className="font-semibold text-ink text-sm">Inquire About Your Event</div>
              <div className="text-stone text-xs">Weddings, showers, parties up to 50</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
