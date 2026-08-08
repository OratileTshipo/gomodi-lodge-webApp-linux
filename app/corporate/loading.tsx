export default function CorporateLoading() {
  return (
    <main className="min-h-screen bg-[color:var(--color-cream-light)]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="h-8 w-72 bg-skeleton rounded mb-3 animate-pulse" />
        <div className="h-4 w-96 max-w-full bg-skeleton rounded mb-10 animate-pulse" />

        <div className="rounded-2xl border border-skeleton bg-white shadow-sm p-8 space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 w-full bg-skeleton-light rounded-xl animate-pulse" />
          ))}
          <div className="h-12 w-1/2 mx-auto bg-skeleton-light rounded-xl animate-pulse" />
        </div>
      </div>
    </main>
  );
}
