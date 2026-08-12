/** Stats row shown to managers (pending count, conflicts, occupancy). */
export function ManagerStats({ pendingCount, conflictCount }: { pendingCount: number; conflictCount: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-5 rounded-2xl border border-walnut/10 shadow-sm">
        <div className="text-stone text-[11px] uppercase tracking-wider font-semibold">
          Pending Requests
        </div>
        <div className="text-3xl font-bold text-ink mt-1">
          {pendingCount}
        </div>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-walnut/10 shadow-sm">
        <div className="text-stone text-[11px] uppercase tracking-wider font-semibold">
          Conflicts
        </div>
        <div className="text-3xl font-bold text-terracotta-dark mt-1">
          {conflictCount}
        </div>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-walnut/10 shadow-sm">
        <div className="text-stone text-[11px] uppercase tracking-wider font-semibold">
          Occupancy (Est)
        </div>
        <div className="text-3xl font-bold text-walnut mt-1">65%</div>
      </div>
    </div>
  );
}
