"use client";

import { fmtDate, toISO } from "./booking-utils";
import { nightsBetween } from "@/lib/validate";

/**
 * Step 1 — dates. A controlled calendar card: all date state (checkIn,
 * checkOut, current month, which side is being picked) lives in the parent;
 * this component renders the check-in/out indicator, quick shortcuts, the
 * calendar grid, and the summary/clear row.
 */
export function BookingCalendar({
  today,
  checkIn,
  checkOut,
  selectingCheckIn,
  currentMonth,
  monthTransition,
  onPickDate,
  onChangeMonth,
  onClear,
  onSelectQuickDate,
  onSelectCheckIn,
  onSelectCheckOut,
}: {
  today: Date;
  checkIn: string;
  checkOut: string;
  selectingCheckIn: boolean;
  currentMonth: Date;
  monthTransition: "none" | "left" | "right";
  onPickDate: (dateStr: string) => void;
  onChangeMonth: (delta: number) => void;
  onClear: () => void;
  onSelectQuickDate: (range: "tonight" | "weekend" | "next-week") => void;
  onSelectCheckIn: () => void;
  onSelectCheckOut: () => void;
}) {
  function renderCalendarDays() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayISO = toISO(today);
    const checkInDate = checkIn ? new Date(checkIn + "T00:00:00") : null;
    const checkOutDate = checkOut ? new Date(checkOut + "T00:00:00") : null;
    const cells = [];

    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className="h-10" />);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = toISO(date);
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isToday = dateStr === todayISO;
      const isCheckIn = dateStr === checkIn;
      const isCheckOut = dateStr === checkOut;
      const isSelected = isCheckIn || isCheckOut;
      const inRange = !!(checkInDate && checkOutDate && date > checkInDate && date < checkOutDate);
      const isRangeStart = isCheckIn && checkOut;
      const isRangeEnd = isCheckOut && checkIn;

      const prevDate = new Date(year, month, d - 1);
      const prevStr = d > 1 ? toISO(prevDate) : "";
      const nextDate = new Date(year, month, d + 1);
      const nextStr = d < daysInMonth ? toISO(nextDate) : "";
      const prevInRange = !!(checkInDate && checkOutDate && prevDate >= checkInDate && prevDate <= checkOutDate && d > 1);
      const nextInRange = !!(checkInDate && checkOutDate && nextDate >= checkInDate && nextDate <= checkOutDate && d < daysInMonth);

      let cls = "relative h-10 min-w-10 flex items-center justify-center text-sm transition-all duration-150 ";

      if (isPast) {
        cls += "text-stone/40 cursor-not-allowed ";
      } else {
        cls += "cursor-pointer ";
      }

      if (isSelected) {
        cls += "bg-terracotta-dark text-white font-semibold shadow-md shadow-terracotta-dark/20 z-10 ";
        if (isRangeStart) cls += "rounded-l-full rounded-r-lg ";
        else if (isRangeEnd) cls += "rounded-r-full rounded-l-lg ";
        else cls += "rounded-full ";
      } else if (inRange) {
        cls += "bg-terracotta-tint/60 text-terracotta-dark font-medium ";
        if (!prevInRange && !isRangeStart) cls += "rounded-l-lg ";
        else cls += "rounded-none ";
        if (!nextInRange && !isRangeEnd) cls += "rounded-r-lg ";
        else cls += "rounded-none ";
      } else {
        cls += "rounded-full ";
        if (!isPast) {
          cls += "hover:bg-terracotta-tint hover:text-terracotta-dark hover:scale-105 active:scale-95 text-ink ";
        }
      }

      if (isToday && !isSelected) {
        cls += " font-bold text-terracotta-dark ";
      }

      cells.push(
        <button
          key={d}
          type="button"
          disabled={isPast}
          aria-pressed={isSelected}
          aria-label={date.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          className={cls}
          onClick={() => onPickDate(dateStr)}
        >
          {d}
          {isToday && !isSelected && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-terracotta" />
          )}
        </button>
      );
    }
    return cells;
  }

  return (
    <div className="bg-white rounded-2xl border border-walnut/10 shadow-sm p-5 md:p-6 motion-fade-up motion-ready">
      <div className="mb-4">
        <span className="text-terracotta-dark font-semibold text-xs uppercase tracking-wide">Step 1</span>
        <h2 className="font-semibold text-ink text-lg mt-1">Pick your dates</h2>
      </div>

      {/* Check-in / Check-out indicator */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          type="button"
          onClick={onSelectCheckIn}
          className={`text-left p-3 rounded-lg border-2 transition-all duration-200 ${
            selectingCheckIn
              ? "border-terracotta bg-terracotta-tint/50 shadow-sm shadow-terracotta/10"
              : "border-walnut/10 bg-cream-light hover:border-walnut/20"
          }`}
        >
          <div className="text-[10px] uppercase tracking-wide font-semibold mb-1 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${selectingCheckIn ? "bg-terracotta" : "bg-stone/30"}`} />
            Check-in
          </div>
          <div className="text-sm font-semibold text-ink">
            {checkIn ? fmtDate(checkIn) : "Select date"}
          </div>
        </button>
        <button
          type="button"
          onClick={onSelectCheckOut}
          className={`text-left p-3 rounded-lg border-2 transition-all duration-200 ${
            !selectingCheckIn && checkIn
              ? "border-terracotta bg-terracotta-tint/50 shadow-sm shadow-terracotta/10"
              : "border-walnut/10 bg-cream-light hover:border-walnut/20"
          }`}
        >
          <div className="text-[10px] uppercase tracking-wide font-semibold mb-1 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${!selectingCheckIn && checkIn ? "bg-terracotta" : "bg-stone/30"}`} />
            Check-out
          </div>
          <div className="text-sm font-semibold text-ink">
            {checkOut ? fmtDate(checkOut) : "Select date"}
          </div>
        </button>
      </div>

      {/* Quick date shortcuts */}
      <div className="flex gap-2 mb-4">
        {([
          { key: "tonight" as const, label: "Tonight" },
          { key: "weekend" as const, label: "This weekend" },
          { key: "next-week" as const, label: "Next week" },
        ]).map((q) => (
          <button
            key={q.key}
            type="button"
            onClick={() => onSelectQuickDate(q.key)}
            className="flex-1 px-2 py-1.5 text-[11px] font-medium text-stone bg-cream border border-walnut/10 rounded-lg hover:bg-terracotta-tint hover:text-terracotta-dark hover:border-terracotta/30 transition-all"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-cream-light rounded-xl border border-walnut/10 p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            type="button"
            onClick={() => onChangeMonth(-1)}
            className="w-10 h-10 rounded-lg hover:bg-white hover:shadow-sm text-stone flex items-center justify-center transition-all"
            aria-label="Previous month"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="transition-transform"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="font-semibold text-ink text-sm select-none">
            {currentMonth.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
          </div>
          <button
            type="button"
            onClick={() => onChangeMonth(1)}
            className="w-10 h-10 rounded-lg hover:bg-white hover:shadow-sm text-stone flex items-center justify-center transition-all"
            aria-label="Next month"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="transition-transform"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[10px] uppercase tracking-wide text-stone font-semibold">
          {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} className="py-1">{d}</div>)}
        </div>

        <div className={`grid grid-cols-7 gap-1 transition-all duration-150 ${
          monthTransition === "left" ? "opacity-0 -translate-x-2" :
          monthTransition === "right" ? "opacity-0 translate-x-2" :
          "opacity-100 translate-x-0"
        }`}>{renderCalendarDays()}</div>
      </div>

      {/* Date summary + clear */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-stone">
          {checkIn ? (
            checkOut ? (
              <><span className="font-medium text-ink">{nightsBetween(checkIn, checkOut)} night{nightsBetween(checkIn, checkOut) > 1 ? "s" : ""}</span> · {fmtDate(checkIn)} → {fmtDate(checkOut)}</>
            ) : (
              <>Now select your <span className="font-medium text-terracotta-dark">check-out</span> date</>
            )
          ) : (
            <span>Tap a date to begin</span>
          )}
        </div>
        {(checkIn || checkOut) && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-stone hover:text-terracotta-dark font-medium px-2 py-1 rounded hover:bg-terracotta-tint/50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
