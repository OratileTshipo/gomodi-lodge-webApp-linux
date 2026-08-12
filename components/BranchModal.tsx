"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useBranchModal } from "./BranchModalContext";

export function BranchModal() {
  const { isOpen, closeBranch } = useBranchModal();
  if (!isOpen) return null;
  // Mounts fresh on every open: the fade-in transition replays, the scroll
  // lock is released on unmount, and no synchronous setState runs inside an
  // effect (react-hooks/set-state-in-effect).
  return <BranchModalInner closeBranch={closeBranch} />;
}

function BranchModalInner({ closeBranch }: { closeBranch: () => void }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay so the transition plays on mount
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeBranch();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeBranch]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function goTo(path: string) {
    closeBranch();
    router.push(path);
  }

  const options = [
    {
      // Leisure goes straight to the booking form (dates, room, meals) —
      // /rooms is the browsing listing, not where you request a booking.
      path: "/book",
      label: "Request a Stay",
      desc: "Dates, room, breakfast/dinner add-ons",
      hoverBorder: "hover:border-terracotta/40",
      icon: "terracotta",
    },
    {
      path: "/corporate",
      label: "Request a Quote",
      desc: "Multi-room, PO number, formal quote",
      hoverBorder: "hover:border-walnut/40",
      icon: "walnut",
    },
    {
      path: "/events",
      label: "Inquire About Your Event",
      desc: "Weddings, showers, parties up to 50",
      hoverBorder: "hover:border-gold/40",
      icon: "gold",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-ink/60 backdrop-blur-sm transition-opacity duration-300 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeBranch}
      />

      {/* Modal */}
      <div
        className={`relative bg-cream-light rounded-2xl max-w-lg w-full p-6 md:p-8 card-shadow transition-all duration-300 ease-out ${
          mounted
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95"
        }`}
      >
        <button
          onClick={closeBranch}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-walnut/10 transition-colors"
          aria-label="Close"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <h3 className="font-semibold text-ink text-xl">How are you visiting?</h3>
        <p className="text-stone text-sm mt-2">
          Choose the one that fits your visit — each takes you to the right
          form.
        </p>

        <div className="mt-6 space-y-3">
          {options.map((opt, i) => (
            <button
              key={opt.path}
              onClick={() => goTo(opt.path)}
              className={`w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-walnut/10 ${opt.hoverBorder} text-left transition-all duration-200 group hover:shadow-sm`}
              style={{
                transitionDelay: mounted ? `${i * 60}ms` : "0ms",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(8px)",
              }}
            >
              <div className="w-10 h-10 rounded-lg bg-cream flex items-center justify-center flex-shrink-0 border border-walnut/10">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className={`${
                    opt.icon === "terracotta"
                      ? "text-terracotta-dark"
                      : opt.icon === "gold"
                      ? "text-gold-dark"
                      : "text-walnut"
                  }`}
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink text-sm group-hover:text-terracotta-dark transition-colors">
                  {opt.label}
                </div>
                <div className="text-stone text-xs mt-0.5">{opt.desc}</div>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="text-stone/40 group-hover:text-terracotta-dark group-hover:translate-x-0.5 transition-all flex-shrink-0"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
