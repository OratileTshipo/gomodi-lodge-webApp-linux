export default function BookLoading() {
  return (
    <main className="min-h-screen bg-[color:var(--color-cream-light)]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="h-8 w-56 bg-skeleton rounded mb-3 animate-pulse" />
        <div className="h-4 w-96 max-w-full bg-skeleton rounded mb-10 animate-pulse" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-skeleton bg-white overflow-hidden shadow-sm p-6 space-y-4"
              >
                <div className="h-5 w-24 bg-skeleton-light rounded animate-pulse" />
                <div className="h-5 w-40 bg-skeleton-light rounded animate-pulse" />
                <div className="h-32 w-full bg-skeleton-light rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-skeleton bg-white shadow-sm p-5 space-y-3">
              <div className="h-6 w-24 bg-skeleton-light rounded animate-pulse" />
              <div className="h-4 w-full bg-skeleton-light rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-skeleton-light rounded animate-pulse" />
              <div className="h-10 w-full bg-skeleton-light rounded-xl animate-pulse mt-4" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
