"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { submitLeisureBooking, getUnavailableRoomIds } from "./actions";
import { BREAKFAST_PRICE, DINNER_PRICE } from "@/lib/pricing";
import { nightlyRatesForStay, stayHasSeasonalNights, type SeasonalPeriod } from "@/lib/seasonal";

type Room = {
  id: number;
  name: string;
  config: string;
  bathOrShower: string;
  baseRate: string | number;
  flexible: boolean;
  images: string[];
};

function fmtDate(iso: string) {
  // Parse "YYYY-MM-DD" into LOCAL date components — new Date(iso) parses as UTC
  // midnight, which shows the previous day for negative-UTC timezones.
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return date.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toISO(d: Date) {
  // Local calendar date, NOT UTC. toISOString() converts local midnight to
  // UTC and shifts a day back for timezones east of UTC (e.g. South Africa
  // UTC+2) — which silently moved every picked date a day earlier.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function BookingForm({
  rooms,
  seasonalPeriods = [],
  initialRoomId,
  initialCheckIn = "",
  initialCheckOut = "",
  initialGuests = 2,
}: {
  rooms: Room[];
  seasonalPeriods?: SeasonalPeriod[];
  initialRoomId: number | null;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}) {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [monthTransition, setMonthTransition] = useState<"none" | "left" | "right">("none");
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [selectingCheckIn, setSelectingCheckIn] = useState(!initialCheckIn);
  const [roomId, setRoomId] = useState<number | null>(initialRoomId);
  const [guestCount, setGuestCount] = useState(initialGuests);
  const [breakfast, setBreakfast] = useState(false);
  const [dinner, setDinner] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"eft" | "cash">("eft");
  const [popFileName, setPopFileName] = useState<string | null>(null);
  const [popFileUrl, setPopFileUrl] = useState<string | null>(null);
  const [popUploading, setPopUploading] = useState(false);
  const [popUploadError, setPopUploadError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [unavailableIds, setUnavailableIds] = useState<number[]>([]);

  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // FIX 1: Auto-scroll to top when the success message appears
  useEffect(() => {
    if (status === "success") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [status]);

  useEffect(() => {
    if (!checkIn || !checkOut) return;
    let cancelled = false;
    getUnavailableRoomIds(checkIn, checkOut).then((ids) => {
      if (!cancelled) setUnavailableIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [checkIn, checkOut]);

  const nights =
    checkIn && checkOut && new Date(checkOut) > new Date(checkIn)
      ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
      : 0;
  const room = rooms.find((r) => r.id === roomId) || null;

  // Seasonal-aware accommodation total: resolve EVERY night individually so a
  // stay straddling a festive window quotes both rates exactly (same engine as
  // the draft quote — lib/seasonal.ts + lib/quotes.ts buildDraftLines).
  const seasonalNights = useMemo(() => {
    if (!room || !checkIn || !checkOut || seasonalPeriods.length === 0) return null;
    return nightlyRatesForStay(String(room.baseRate), checkIn, checkOut, seasonalPeriods);
  }, [room, checkIn, checkOut, seasonalPeriods]);
  const hasSeasonal =
    room && checkIn && checkOut && seasonalPeriods.length > 0
      ? stayHasSeasonalNights(String(room.baseRate), checkIn, checkOut, seasonalPeriods)
      : false;
  const accomTotal = seasonalNights
    ? seasonalNights.reduce((s, n) => s + Number(n.rate), 0)
    : room && nights > 0
      ? Number(room.baseRate) * nights
      : 0;
  const mealTotal =
    (breakfast ? guestCount * nights * BREAKFAST_PRICE : 0) +
    (dinner ? guestCount * nights * DINNER_PRICE : 0);

  function pickDate(dateStr: string) {
    if (selectingCheckIn) {
      setCheckIn(dateStr);
      setCheckOut("");
      setSelectingCheckIn(false);
    } else {
      if (dateStr <= checkIn) {
        setCheckIn(dateStr);
        setCheckOut("");
        return;
      }
      setCheckOut(dateStr);
      setSelectingCheckIn(true);
    }
  }

  function changeMonth(delta: number) {
    setMonthTransition(delta > 0 ? "right" : "left");
    setTimeout(() => {
      setCurrentMonth((prev) => {
        const next = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
        const min = new Date(today.getFullYear(), today.getMonth(), 1);
        const max = new Date(today.getFullYear(), today.getMonth() + 6, 1);
        if (next < min) return min;
        if (next > max) return max;
        return next;
      });
      setMonthTransition("none");
    }, 150);
  }

  function clearDates() {
    setCheckIn("");
    setCheckOut("");
    setSelectingCheckIn(true);
  }

  function selectQuickDate(range: "tonight" | "weekend" | "next-week") {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (range === "tonight") {
      start = now;
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (range === "weekend") {
      // Find next Friday
      const dayOfWeek = now.getDay();
      const daysUntilFri = (5 - dayOfWeek + 7) % 7 || 7;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilFri);
      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 2);
    } else {
      // Next Monday-Friday
      const dayOfWeek = now.getDay();
      const daysUntilMon = (1 - dayOfWeek + 7) % 7 || 7;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMon);
      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 5);
    }

    // Navigate to the month of the start date
    setCurrentMonth(new Date(start.getFullYear(), start.getMonth(), 1));
    setCheckIn(toISO(start));
    setCheckOut(toISO(end));
    setSelectingCheckIn(true);
  }

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

      // Determine if this cell needs left/right rounding for range
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
        // Selected dates: filled circle
        cls += "bg-terracotta-dark text-white font-semibold shadow-md shadow-terracotta-dark/20 z-10 ";
        if (isRangeStart) cls += "rounded-l-full rounded-r-lg ";
        else if (isRangeEnd) cls += "rounded-r-full rounded-l-lg ";
        else cls += "rounded-full ";
      } else if (inRange) {
        // In-range dates: subtle background, no rounding (connected to neighbors)
        cls += "bg-terracotta-tint/60 text-terracotta-dark font-medium ";
        if (!prevInRange && !isRangeStart) cls += "rounded-l-lg ";
        else cls += "rounded-none ";
        if (!nextInRange && !isRangeEnd) cls += "rounded-r-lg ";
        else cls += "rounded-none ";
      } else {
        // Regular dates
        cls += "rounded-full ";
        if (!isPast) {
          cls += "hover:bg-terracotta-tint hover:text-terracotta-dark hover:scale-105 active:scale-95 text-ink ";
        }
      }

      // Today indicator
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
          onClick={() => pickDate(dateStr)}
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

  async function handlePopFile(file: File | undefined) {
    if (!file) return;
    setPopUploading(true);
    setPopUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setPopUploadError(json.error || "Upload failed — try again.");
        setPopFileName(null);
        setPopFileUrl(null);
        return;
      }
      setPopFileName(file.name);
      setPopFileUrl(json.url);
    } catch {
      setPopUploadError("Upload failed — check your connection and try again.");
      setPopFileName(null);
      setPopFileUrl(null);
    } finally {
      setPopUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId) {
      setStatus("error");
      setErrorMessage("Please choose a room.");
      return;
    }
    if (!consent) {
      setStatus("error");
      setErrorMessage("Please confirm to continue.");
      return;
    }
    if (popFileName && !popFileUrl) {
      setStatus("error");
      setErrorMessage("Your proof of payment is still uploading — wait a moment and try again.");
      return;
    }
    setStatus("submitting");
    setErrorMessage(null);
    
    const result = await submitLeisureBooking({
      roomId, 
      checkIn, 
      checkOut, 
      guestCount, 
      breakfast, 
      dinner,
      guestName: fullName, 
      contactPhone: phone, 
      contactEmail: email,
      specialRequests, 
      proofOfPaymentUrl: popFileUrl,
    });
    
    if (result.ok) setStatus("success");
    else { setStatus("error"); setErrorMessage(result.error); }
  }

  const fmt = (n: number) => "R" + n.toLocaleString("en-ZA");

  if (status === "success") {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="motion-pop" data-stagger="1">
          <div className="w-16 h-16 rounded-full bg-gold-tint flex items-center justify-center mb-5 mx-auto shadow-lg shadow-gold/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8f6a3e" strokeWidth={2.5}><path d="M20 6L9 17l-5-5"/></svg>
          </div>
        </div>
        <h1 className="font-semibold text-ink text-2xl mt-3 motion-pop" data-stagger="2">Thanks, {fullName.split(" ")[0] || "there"}!</h1>
        <p className="text-stone mt-3 max-w-md mx-auto text-base leading-relaxed motion-pop" data-stagger="3">
          We&apos;ve received your request for <span className="font-medium text-ink">{room?.name}</span>. We&apos;ll confirm availability on WhatsApp — usually within minutes during the day.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center motion-pop" data-stagger="4">
          <Link href="/rooms" className="inline-block btn-primary px-6 py-3 rounded-lg font-semibold btn-press ripple">Browse More Rooms</Link>
          <Link href="/" className="inline-block btn-outline px-6 py-3 rounded-lg font-semibold btn-press">Back to Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-transition">
      <nav className="max-w-6xl mx-auto px-6 py-4 text-sm text-stone" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/" className="hover:text-terracotta-dark inline-block py-2">Home</Link></li>
          <li className="text-walnut/40">/</li>
          <li><Link href="/rooms" className="hover:text-terracotta-dark inline-block py-2">Rooms</Link></li>
          <li className="text-walnut/40">/</li>
          <li className="text-ink font-medium">Book Your Stay</li>
        </ol>
      </nav>

      <section className="max-w-6xl mx-auto px-6 pb-8">
        <h1 className="font-display font-semibold text-ink text-3xl md:text-4xl max-w-3xl motion-fade-up motion-ready" data-stagger="1">Book your stay</h1>
        <p className="text-stone mt-3 max-w-2xl text-base leading-relaxed motion-fade-up motion-ready" data-stagger="2">
          Choose your dates, room, and meals. We&apos;ll check availability and confirm on WhatsApp.
        </p>
      </section>

      {/* PROGRESS */}
      <section className="max-w-6xl mx-auto px-6 pb-6">
        <div className="bg-white rounded-2xl border border-walnut/10 p-4 shadow-sm">
          <div className="flex items-center gap-2 md:gap-3 text-xs">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${nights > 0 ? "bg-terracotta-dark text-white shadow-sm shadow-terracotta-dark/30" : "bg-terracotta-tint text-terracotta-dark"}`}>1</div>
            <div className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${nights > 0 ? "bg-terracotta" : "bg-walnut/10"}`} />
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${roomId ? "bg-terracotta-dark text-white shadow-sm shadow-terracotta-dark/30" : nights > 0 ? "bg-terracotta-tint text-terracotta-dark" : "bg-cream-light text-stone/60"}`}>2</div>
            <div className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${roomId ? "bg-terracotta" : "bg-walnut/10"}`} />
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${roomId ? "bg-terracotta-tint text-terracotta-dark" : "bg-cream-light text-stone/60"}`}>3</div>
            <div className="h-0.5 flex-1 rounded-full bg-walnut/10" />
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold bg-cream-light text-stone/60">4</div>
          </div>
          <div className="flex items-center justify-between mt-2.5 text-[10px] text-stone font-semibold uppercase tracking-wider">
            <span className={nights > 0 ? "text-terracotta-dark" : ""}>Dates</span>
            <span className={roomId ? "text-terracotta-dark" : ""}>Room</span>
            <span>Meals</span>
            <span>Details</span>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {status === "error" && errorMessage && (
              <div className="rounded-xl border border-terracotta bg-terracotta-tint p-4 text-sm text-terracotta-dark">{errorMessage}</div>
            )}

            {/* STEP 1: DATES */}
            <div className="bg-white rounded-2xl border border-walnut/10 shadow-sm p-5 md:p-6 motion-fade-up motion-ready">
              <div className="mb-4">
                <span className="text-terracotta-dark font-semibold text-xs uppercase tracking-wide">Step 1</span>
                <h2 className="font-semibold text-ink text-lg mt-1">Pick your dates</h2>
              </div>

              {/* Check-in / Check-out indicator */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setSelectingCheckIn(true)}
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
                  onClick={() => { if (checkIn) setSelectingCheckIn(false); }}
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
                    onClick={() => selectQuickDate(q.key)}
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
                    onClick={() => changeMonth(-1)}
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
                    onClick={() => changeMonth(1)}
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
                      <><span className="font-medium text-ink">{nights} night{nights > 1 ? "s" : ""}</span> · {fmtDate(checkIn)} → {fmtDate(checkOut)}</>
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
                    onClick={clearDates}
                    className="text-xs text-stone hover:text-terracotta-dark font-medium px-2 py-1 rounded hover:bg-terracotta-tint/50 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* STEP 2: ROOM */}
            <div className="bg-white rounded-2xl border border-walnut/10 shadow-sm p-5 md:p-6 motion-fade-up motion-ready">
              <div className="mb-4">
                <span className="text-terracotta-dark font-semibold text-xs uppercase tracking-wide">Step 2</span>
                <h2 className="font-semibold text-ink text-lg mt-1">Choose your room</h2>
                <p className="text-stone text-sm mt-1">Rooms greyed out are already booked for your dates.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rooms.map((r) => {
                  // Only apply availability when both dates are chosen; otherwise
                  // a stale fetch result could wrongly grey out rooms.
                  const unavailable = checkIn && checkOut ? unavailableIds.includes(r.id) : false;
                  const selected = roomId === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      disabled={unavailable}
                      aria-pressed={selected}
                      className={`rounded-xl border overflow-hidden transition-all text-left ${
                        selected 
                          ? "border-terracotta ring-2 ring-terracotta/30 bg-terracotta-tint/50" 
                          : unavailable 
                            ? "border-walnut/10 bg-cream-light opacity-60 cursor-not-allowed" 
                            : "border-walnut/10 bg-white hover:border-walnut/20 cursor-pointer"
                      }`}
                      onClick={() => setRoomId(selected ? null : r.id)}
                    >
                      <span className="block aspect-[16/9] overflow-hidden bg-cream relative">
                        {r.images.length > 0 ? (
                          <Image
                            src={r.images[0]}
                            alt={r.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        ) : (
                          <PhotoPlaceholder label={r.name} />
                        )}
                        {unavailable && (
                          <span className="absolute inset-0 bg-ink/40 flex items-center justify-center">
                            <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">Booked</span>
                          </span>
                        )}
                        {r.flexible && !unavailable && <span className="absolute top-2 left-2 bg-ink/70 text-cream-light text-[10px] font-medium uppercase px-2 py-0.5 rounded">Flexible twin/double</span>}
                      </span>
                      <span className="block p-3">
                        <span className="flex items-start justify-between gap-2">
                          <span>
                            <span className="font-semibold text-ink text-sm">{r.name}</span>
                            <span className="block text-stone text-xs mt-0.5">{r.config} · {r.bathOrShower === "bath" ? "Bath" : "Shower"}</span>
                          </span>
                          <span className="text-terracotta-dark font-semibold text-sm whitespace-nowrap">R{Number(r.baseRate)}<span className="text-stone/60 font-normal text-[10px]">/nt</span></span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-5 pt-5 border-t border-walnut/10">
                <label className="block text-sm font-medium text-ink mb-2">How many guests? <span className="text-stone font-normal">(max 2 per room)</span></label>
                <div className="flex items-center gap-3">
                  <button type="button" aria-label="Fewer guests" onClick={() => setGuestCount((g) => Math.max(1, g - 1))} className="w-11 h-11 rounded-lg border border-walnut/20 hover:bg-cream-light flex items-center justify-center text-stone">−</button>
                  <input type="number" min={1} max={2} value={guestCount} aria-label="Number of guests" onChange={(e) => setGuestCount(Math.min(2, Math.max(1, Number(e.target.value))))} className="w-16 text-center border border-walnut/20 rounded-lg px-2 py-1.5 text-sm bg-white" />
                  <button type="button" aria-label="More guests" onClick={() => setGuestCount((g) => Math.min(2, g + 1))} className="w-11 h-11 rounded-lg border border-walnut/20 hover:bg-cream-light flex items-center justify-center text-stone">+</button>
                </div>
              </div>
            </div>

            {/* STEP 3: MEALS */}
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
                  <input type="checkbox" checked={breakfast} onChange={(e) => setBreakfast(e.target.checked)} className="sr-only" />
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
                  <input type="checkbox" checked={dinner} onChange={(e) => setDinner(e.target.checked)} className="sr-only" />
                </label>
              </div>
            </div>

            {/* STEP 4: DETAILS */}
            <div className="bg-white rounded-2xl border border-walnut/10 shadow-sm p-5 md:p-6 motion-fade-up motion-ready">
              <div className="mb-4">
                <span className="text-terracotta-dark font-semibold text-xs uppercase tracking-wide">Step 4</span>
                <h2 className="font-semibold text-ink text-lg mt-1">Your details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1.5">Full name *</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">WhatsApp number *</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Email (optional)</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1.5">Anything we should know? (optional)</label>
                  <textarea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} rows={3} className="w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta outline-none resize-none" placeholder="e.g. Late arrival, extra pillows, dietary requirements..." />
                </div>
              </div>
            </div>

            {/* PAYMENT */}
            <div className="bg-white rounded-2xl border border-walnut/10 shadow-sm p-5 md:p-6 motion-fade-up motion-ready">
              <div className="mb-4">
                <span className="text-terracotta-dark font-semibold text-xs uppercase tracking-wide">Payment</span>
                <h2 className="font-semibold text-ink text-lg mt-1">Payment options</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className={`flex items-start gap-3 rounded-xl p-4 border cursor-pointer transition-all ${paymentMethod === "eft" ? "border-terracotta bg-terracotta-tint/50" : "border-walnut/10 bg-white hover:border-walnut/20"}`}>
                  <input type="radio" checked={paymentMethod === "eft"} onChange={() => setPaymentMethod("eft")} className="mt-1 accent-terracotta" />
                  <div><div className="font-semibold text-ink text-sm">EFT / Bank Transfer</div><div className="text-stone text-xs mt-0.5">Pay to our business account. Upload proof below.</div></div>
                </label>
                <label className={`flex items-start gap-3 rounded-xl p-4 border cursor-pointer transition-all ${paymentMethod === "cash" ? "border-terracotta bg-terracotta-tint/50" : "border-walnut/10 bg-white hover:border-walnut/20"}`}>
                  <input type="radio" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} className="mt-1 accent-terracotta" />
                  <div><div className="font-semibold text-ink text-sm">Cash on Arrival</div><div className="text-stone text-xs mt-0.5">Settle in person at check-in.</div></div>
                </label>
              </div>
              {paymentMethod === "eft" && (
                <>
                  <div className="mt-4 bg-cream-light rounded-xl border border-walnut/10 p-4">
                    <div className="font-semibold text-ink text-sm mb-2">Banking details</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div className="flex justify-between py-1 border-b border-walnut/10"><span className="text-stone">Bank</span><span className="text-ink font-medium">FNB</span></div>
                      <div className="flex justify-between py-1 border-b border-walnut/10"><span className="text-stone">Account name</span><span className="text-ink font-medium">Gomodi Guest Lodge</span></div>
                      <div className="flex justify-between py-1 border-b border-walnut/10"><span className="text-stone">Account number</span><span className="text-ink font-medium">62874592011</span></div>
                      <div className="flex justify-between py-1 border-b border-walnut/10"><span className="text-stone">Branch code</span><span className="text-ink font-medium">250655</span></div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-ink mb-1.5">Upload proof of payment (optional)</label>
                    <label
                      htmlFor="popFileInput"
                      className="file-drop border-2 border-dashed border-walnut/20 rounded-xl p-5 text-center cursor-pointer bg-cream-light hover:bg-cream transition-colors block"
                    >
                      <input id="popFileInput" type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => handlePopFile(e.target.files?.[0])} />
                      <span className="text-sm text-ink font-medium">
                        {popUploading ? "Uploading…" : popFileName ? `✓ ${popFileName}` : "Tap to upload, or drag & drop"}
                      </span>
                      <span className="text-xs text-stone mt-1 block">PDF, JPG, or PNG · max 5MB</span>
                      {popUploadError && <span className="block text-xs text-terracotta-dark mt-1">{popUploadError}</span>}
                    </label>
                  </div>
                </>
              )}
            </div>

            {/* CONSENT */}
            <div className="bg-white rounded-2xl border border-walnut/10 shadow-sm p-5 md:p-6 motion-fade-up motion-ready">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required className="mt-1 accent-terracotta w-4 h-4" />
                <label className="text-sm text-stone">I&apos;m happy for Gomodi Guest Lodge to keep my details to manage this booking, in line with POPIA. *</label>
              </div>
              <div className="mt-6">
                <button type="submit" disabled={status === "submitting"} className="w-full bg-terracotta-dark hover:bg-[#74301f] text-white px-6 py-3.5 rounded-lg font-semibold text-base disabled:opacity-60 transition-all shadow-sm shadow-terracotta-dark/20 hover:shadow-md hover:shadow-terracotta-dark/30 btn-press ripple">
                  {status === "submitting" ? "Sending…" : "Send booking request"}
                </button>
                <p className="text-stone text-xs mt-3 text-center">Submitting this doesn&apos;t confirm your booking — we&apos;ll check availability and confirm on WhatsApp.</p>
              </div>
            </div>
          </form>

          {/* SUMMARY SIDEBAR */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-[calc(var(--header-h)+1rem)] bg-white rounded-2xl border border-walnut/10 shadow-sm p-5 motion-fade-up motion-ready overflow-hidden relative">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-terracotta via-gold to-terracotta-dark rounded-t-2xl" />
              <div className="mb-4">
                <h3 className="font-semibold text-ink text-lg">Your stay</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-start"><span className="text-stone">Dates</span><span className="text-ink text-right font-medium">{checkIn ? (checkOut ? `${fmtDate(checkIn)} → ${fmtDate(checkOut)}` : `${fmtDate(checkIn)} → ?`) : "—"}</span></div>
                <div className="flex justify-between"><span className="text-stone">Nights</span><span className="text-ink font-medium">{nights || "—"}</span></div>
                <div className="flex justify-between items-start"><span className="text-stone">Room</span><span className="text-ink text-right font-medium">{room?.name ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-stone">Guests</span><span className="text-ink font-medium">{guestCount}</span></div>
                <div className="flex justify-between"><span className="text-stone">Meals</span><span className="text-ink font-medium">{[breakfast && "Breakfast", dinner && "Dinner"].filter(Boolean).join(" + ") || "None"}</span></div>
                <div className="border-t border-walnut/10 pt-3 mt-3 space-y-1.5">
                  <div className="flex justify-between text-stone"><span>Accommodation</span><span>{accomTotal ? fmt(accomTotal) : "—"}</span></div>
                  <div className="flex justify-between text-stone"><span>Meals</span><span>{mealTotal ? fmt(mealTotal) : "—"}</span></div>
                  <div className="flex justify-between text-ink font-semibold text-base pt-2 border-t border-walnut/10 mt-2"><span>Indicative total</span><span className="text-terracotta-dark">{accomTotal || mealTotal ? fmt(accomTotal + mealTotal) : "—"}</span></div>
                  {hasSeasonal && (
                    <p className="text-[11px] text-gold-dark leading-relaxed">
                      Seasonal rates apply on part of these dates — the quote
                      will show each night&apos;s rate.
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 text-center">
                <Link href="/rooms" className="text-sm text-stone hover:text-terracotta-dark">Not sure which room?</Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* FIX 3: EXPLORE OTHER ROOMS (Conversion Optimisation & Retention) */}
      {roomId && rooms.filter(r => r.id !== roomId && (checkIn && checkOut ? !unavailableIds.includes(r.id) : true)).length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-20 border-t border-walnut/10 pt-12 mt-8 motion-pop">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-semibold text-ink">Prefer a different room?</h2>
            <p className="text-stone mt-2 max-w-xl mx-auto">
              Other rooms available for your dates — tap one to switch.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms
              .filter(r => r.id !== roomId && (checkIn && checkOut ? !unavailableIds.includes(r.id) : true))
              .map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setRoomId(r.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-white rounded-2xl border border-walnut/10 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-terracotta/40 transition-all group motion-pop text-left card-lift"
                  data-stagger={(i % 6) + 1}
                >
                  <span className="block aspect-[16/10] overflow-hidden bg-cream relative">
                    {r.images.length > 0 ? (
                      <Image
                        src={r.images[0]}
                        alt={r.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <PhotoPlaceholder label={r.name} />
                    )}
                    {r.flexible && <span className="absolute top-2 left-2 bg-ink/70 text-cream-light text-[10px] font-medium uppercase px-2 py-0.5 rounded">Flexible twin/double</span>}
                  </span>
                  <span className="block p-4">
                    <span className="flex items-start justify-between gap-2 mb-2">
                      <span>
                        <span className="font-semibold text-ink text-base group-hover:text-terracotta-dark transition-colors">{r.name}</span>
                        <span className="block text-stone text-xs mt-0.5">{r.config} · {r.bathOrShower === "bath" ? "Bath" : "Shower"}</span>
                      </span>
                      <span className="text-terracotta-dark font-semibold text-base whitespace-nowrap">R{Number(r.baseRate)}</span>
                    </span>
                    <span className="block w-full mt-3 py-2 text-sm font-semibold text-terracotta-dark border border-terracotta-dark/30 rounded-lg group-hover:bg-terracotta-tint transition-colors text-center">
                      Switch to this room
                    </span>
                  </span>
                </button>
              ))}
          </div>
        </section>
      )}
    </main>
  );
}
