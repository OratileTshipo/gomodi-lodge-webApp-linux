"use client";

import type { User } from "./types";
import { fmtClockTime } from "./format";

interface Props {
  user: User;
  isManager: boolean;
  isPartner: boolean;
  clockStatus: "clock_in" | "clock_out" | null;
  clockTimestamp: string | null;
  clockLoading: boolean;
  onClockAction: () => void;
  onLogout: () => void;
  onGoToReviews: () => void;
  onGoToSite: () => void;
}

/** Sticky dashboard header: identity, nav, logout, and the staff time clock. */
export function AdminHeader({
  user,
  isManager,
  isPartner,
  clockStatus,
  clockTimestamp,
  clockLoading,
  onClockAction,
  onLogout,
  onGoToReviews,
  onGoToSite,
}: Props) {
  return (
    <header className="bg-white border-b border-walnut/10 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-terracotta flex items-center justify-center text-cream-light font-bold text-sm shadow-sm shadow-terracotta/20">
            G
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-ink leading-tight">
              {isManager
                ? "Operations Dashboard"
                : isPartner
                  ? "Partner Dashboard"
                  : "Staff Dashboard"}
            </h1>
            <p className="text-xs text-stone">
              {user.name} · {user.role}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onGoToReviews}
            className="px-3 py-2 text-stone hover:text-ink hover:bg-walnut/5 text-sm rounded-lg transition-colors"
          >
            Reviews
          </button>
          <button
            onClick={onGoToSite}
            className="px-3 py-2 text-stone hover:text-ink hover:bg-walnut/5 text-sm rounded-lg transition-colors"
          >
            ← Site
          </button>
          <button
            onClick={onLogout}
            className="px-3 py-2 text-stone hover:text-terracotta-dark hover:bg-terracotta-tint/50 text-sm font-medium rounded-lg transition-colors"
          >
            Logout
          </button>

          {/* TIME CLOCK (not shown to the Lelz partner — she isn't lodge staff) */}
          {!isPartner && (
            <div className="ml-2 pl-2 border-l border-walnut/10">
              <button
                onClick={onClockAction}
                disabled={clockLoading}
                className={`px-4 py-2 rounded-lg font-semibold text-sm text-white flex items-center gap-2 transition-all btn-press ${
                  clockStatus === "clock_in"
                    ? "bg-terracotta-dark hover:bg-[#74301f] shadow-sm shadow-terracotta-dark/20"
                    : "bg-walnut hover:bg-walnut-dark shadow-sm shadow-walnut/20"
                } disabled:opacity-50`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {clockLoading
                  ? "Logging..."
                  : clockStatus === "clock_in"
                    ? "Clock Out"
                    : "Clock In"}
              </button>
              {clockTimestamp && clockStatus && (
                <span className="block text-[10px] text-stone text-right mt-1">
                  {clockStatus === "clock_in" ? "Clocked in" : "Clocked out"} ·{" "}
                  {fmtClockTime(clockTimestamp)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
