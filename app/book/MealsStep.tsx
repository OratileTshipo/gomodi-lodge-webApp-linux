"use client";

import { BREAKFAST_PRICE, DINNER_PRICE } from "@/lib/pricing";

/** Step 3 — optional breakfast/dinner add-ons (per person per night). */
export function MealsStep({
  breakfast,
  dinner,
  onToggleBreakfast,
  onToggleDinner,
}: {
  breakfast: boolean;
  dinner: boolean;
  onToggleBreakfast: (v: boolean) => void;
  onToggleDinner: (v: boolean) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-walnut/10 shadow-sm p-5 md:p-6 motion-fade-up motion-ready">
      <div className="mb-4">
        <span className="text-terracotta-dark font-semibold text-xs uppercase tracking-wide">Step 3</span>
        <h2 className="font-semibold text-ink text-lg mt-1">Add breakfast or dinner <span className="text-stone text-sm font-normal">(optional)</span></h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className={`rounded-xl p-4 border flex items-start gap-3 cursor-pointer transition-all ${breakfast ? "border-terracotta bg-terracotta-tint/50" : "border-walnut/10 bg-white hover:border-walnut/20"}`}>
          <div className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 ${breakfast ? "bg-terracotta-dark border-terracotta-dark" : "border-walnut/20"}`}>
            {breakfast && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}><path d="M20 6L9 17l-5-5"/></svg>}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div><div className="font-semibold text-ink text-sm">Breakfast</div><div className="text-stone text-xs mt-0.5">Full cooked or continental</div></div>
              <div className="text-terracotta-dark font-semibold text-sm whitespace-nowrap">R{BREAKFAST_PRICE}</div>
            </div>
          </div>
          <input type="checkbox" checked={breakfast} onChange={(e) => onToggleBreakfast(e.target.checked)} className="sr-only" />
        </label>
        <label className={`rounded-xl p-4 border flex items-start gap-3 cursor-pointer transition-all ${dinner ? "border-terracotta bg-terracotta-tint/50" : "border-walnut/10 bg-white hover:border-walnut/20"}`}>
          <div className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 ${dinner ? "bg-terracotta-dark border-terracotta-dark" : "border-walnut/20"}`}>
            {dinner && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}><path d="M20 6L9 17l-5-5"/></svg>}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div><div className="font-semibold text-ink text-sm">Dinner</div><div className="text-stone text-xs mt-0.5">Three-course set menu</div></div>
              <div className="text-terracotta-dark font-semibold text-sm whitespace-nowrap">R{DINNER_PRICE}</div>
            </div>
          </div>
          <input type="checkbox" checked={dinner} onChange={(e) => onToggleDinner(e.target.checked)} className="sr-only" />
        </label>
      </div>
    </div>
  );
}
