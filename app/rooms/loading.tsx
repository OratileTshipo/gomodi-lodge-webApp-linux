export default function RoomsLoading() {
  const placeholders = Array.from({ length: 9 });

  return (
    <main className="min-h-screen bg-[color:var(--color-cream)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="h-8 w-48 bg-skeleton rounded mb-3 animate-pulse" />
        <div className="h-4 w-80 bg-skeleton rounded mb-8 animate-pulse" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {placeholders.map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-skeleton bg-white overflow-hidden shadow-sm"
            >
              <div className="h-48 sm:h-56 bg-skeleton-light animate-pulse" />
              <div className="p-5 flex flex-col gap-3">
                <div className="h-5 w-2/3 bg-skeleton-light rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-skeleton-light rounded animate-pulse" />
                <div className="h-8 w-full bg-skeleton-light rounded-xl animate-pulse mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
