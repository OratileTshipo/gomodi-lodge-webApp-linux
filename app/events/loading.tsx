export default function EventsLoading() {
  return (
    <main className="min-h-screen bg-[color:var(--color-cream-light)]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="h-8 w-72 bg-[#e7ded6] rounded mb-3 animate-pulse" />
        <div className="h-4 w-96 max-w-full bg-[#e7ded6] rounded mb-10 animate-pulse" />

        <div className="rounded-2xl border border-[#e7ded6] bg-white shadow-sm p-8 space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 w-full bg-[#eee6da] rounded-xl animate-pulse" />
          ))}
          <div className="h-12 w-1/2 mx-auto bg-[#eee6da] rounded-xl animate-pulse" />
        </div>
      </div>
    </main>
  );
}
