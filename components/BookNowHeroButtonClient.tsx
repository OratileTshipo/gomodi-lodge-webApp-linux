"use client";

import { useBranchModal } from "./BranchModalContext";

export function BookNowHeroButtonClient() {
  const { openBranch } = useBranchModal();
  return (
    <button
      onClick={openBranch}
      className="btn-primary px-6 py-3 rounded-lg font-semibold text-base inline-flex items-center justify-center gap-2"
    >
      Book Now
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    </button>
  );
}
