/** Loading skeleton shown while the queue and clock status are fetched. */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-cream-light">
      {/* Skeleton header */}
      <div className="bg-white border-b border-walnut/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-48 bg-skeleton rounded animate-pulse" />
            <div className="h-3 w-32 bg-skeleton-light rounded animate-pulse" />
          </div>
          <div className="h-9 w-24 bg-skeleton rounded-lg animate-pulse" />
        </div>
      </div>
      {/* Skeleton cards */}
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-walnut/10 p-5 h-24 animate-pulse"
            />
          ))}
        </div>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-walnut/10 p-6 h-48 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
