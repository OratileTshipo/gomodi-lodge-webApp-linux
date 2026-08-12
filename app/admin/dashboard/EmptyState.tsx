/** Shown when there are no pending requests to review. */
export function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-walnut/10 shadow-sm p-12 text-center">
      <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center mx-auto mb-4">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="text-stone"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <p className="text-stone font-medium">All caught up</p>
      <p className="text-stone/60 text-sm mt-1">
        No pending requests to review
      </p>
    </div>
  );
}
