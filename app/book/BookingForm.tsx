"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { submitLeisureBooking, getUnavailableRoomIds } from "./actions";

type Room = {
  id: number;
  name: string;
  config: string;
  bathOrShower: string;
  baseRate: string | number;
  flexible: boolean;
};

const BREAKFAST_PRICE = 175;
const DINNER_PRICE = 300;

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
  initialRoomId,
  initialCheckIn = "",
  initialCheckOut = "",
  initialGuests = 2,
}: {
  rooms: Room[];
  initialRoomId: number | null;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}) {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
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
  const accomTotal = room && nights > 0 ? Number(room.baseRate) * nights : 0;
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
    setCurrentMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
      const min = new Date(today.getFullYear(), today.getMonth(), 1);
      const max = new Date(today.getFullYear(), today.getMonth() + 6, 1);
      if (next < min) return min;
      if (next > max) return max;
      return next;
    });
  }

  function renderCalendarDays() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayISO = toISO(today);
    const cells = [];

    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className="h-9" />);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = toISO(date);
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      let cls = "h-9 flex items-center justify-center text-sm rounded-full cursor-pointer transition-all ";
      
      if (isPast) {
        cls += "text-stone/50 cursor-not-allowed ";
      } else {
        cls += "hover:bg-terracotta-tint text-ink ";
      }

      if (dateStr === todayISO && !isPast) cls += "font-bold text-terracotta-dark ";

      if (checkIn && checkOut) {
        if (dateStr === checkIn || dateStr === checkOut) {
          cls += "bg-terracotta-dark text-white font-semibold shadow-sm ";
        } else if (date > new Date(checkIn) && date < new Date(checkOut)) {
          cls += "bg-terracotta-tint text-terracotta-dark font-medium ";
        }
      } else if (checkIn && dateStr === checkIn) {
        cls += "bg-terracotta text-white font-semibold shadow-sm ";
      }

      cells.push(
        <div 
          key={d} 
          className={cls} 
          onClick={isPast ? undefined : () => pickDate(dateStr)}
        >
          {d}
        </div>
      );
    }
    return cells;
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
    });
    
    if (result.ok) setStatus("success");
    else { setStatus("error"); setErrorMessage(result.error); }
  }

  const fmt = (n: number) => "R" + n.toLocaleString("en-ZA");

  if (status === "success") {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center motion-pop">
        <div className="w-14 h-14 rounded-full bg-gold-tint flex items-center justify-center mb-4 mx-auto motion-pop">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8f6a3e" strokeWidth={2.5}><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-terracotta-tint text-terracotta-dark mb-3">Request received</span>
        <h1 className="font-semibold text-ink text-2xl mt-3">Thanks, {fullName.split(" ")[0] || "there"}!</h1>
        <p className="text-stone mt-2 max-w-md mx-auto text-base leading-relaxed">
          We&apos;ve received your request for <span className="font-medium text-ink">{room?.name}</span>. We&apos;ll confirm availability on WhatsApp — usually within minutes during the day.
        </p>
        <Link href="/rooms" className="mt-6 inline-block border border-walnut/20 text-ink hover:bg-cream-light px-5 py-2.5 rounded-lg font-semibold transition-colors interactive-element">Back to Rooms</Link>
      </main>
    );
  }

  return (
    <main className="page-transition">
      <nav className="max-w-6xl mx-auto px-6 py-4 text-sm text-stone" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/" className="hover:text-terracotta-dark">Home</Link></li>
          <li className="text-walnut/40">/</li>
          <li><Link href="/rooms" className="hover:text-terracotta-dark">Rooms</Link></li>
          <li className="text-walnut/40">/</li>
          <li className="text-ink font-medium">Book Your Stay</li>
        </ol>
      </nav>

      <section className="max-w-6xl mx-auto px-6 pb-8">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-terracotta-tint text-terracotta-dark mb-3 motion-fade-up motion-ready" data-stagger="1">Leisure Booking</span>
        <h1 className="font-display font-semibold text-ink text-3xl md:text-4xl mt-2 max-w-3xl motion-fade-up motion-ready" data-stagger="2">Book your stay</h1>
        <p className="text-stone mt-3 max-w-2xl text-base leading-relaxed motion-fade-up motion-ready" data-stagger="3">
          Choose your dates, room, and meals. We&apos;ll check availability and confirm on WhatsApp.
        </p>
      </section>

      {/* PROGRESS */}
      <section className="max-w-6xl mx-auto px-6 pb-6">
        <div className="flex items-center gap-2 md:gap-3 text-xs">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${nights > 0 ? "bg-terracotta-dark text-white" : "bg-terracotta-tint text-terracotta-dark"}`}>1</div>
          <div className={`h-0.5 flex-1 ${nights > 0 ? "bg-terracotta" : "bg-walnut/10"}`} />
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${roomId ? "bg-terracotta-dark text-white" : nights > 0 ? "bg-terracotta-tint text-terracotta-dark" : "bg-cream-light text-stone/60"}`}>2</div>
          <div className={`h-0.5 flex-1 ${roomId ? "bg-terracotta" : "bg-walnut/10"}`} />
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${roomId ? "bg-terracotta-tint text-terracotta-dark" : "bg-cream-light text-stone/60"}`}>3</div>
          <div className="h-0.5 flex-1 bg-walnut/10" />
          <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold bg-cream-light text-stone/60">4</div>
        </div>
        <div className="flex items-center justify-between mt-2 text-[11px] text-stone font-medium uppercase tracking-wide">
          <span>Dates</span><span>Room</span><span>Meals</span><span>Details</span>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {status === "error" && errorMessage && (
              <div className="rounded-xl border border-terracotta bg-terracotta-tint p-4 text-sm text-terracotta-dark">{errorMessage}</div>
            )}

            {/* STEP 1: DATES (Compact) */}
            <div className="bg-white rounded-2xl border border-walnut/10 shadow-sm p-5 md:p-6 motion-fade-up motion-ready">
              <div className="mb-4">
                <span className="text-terracotta-dark font-semibold text-xs uppercase tracking-wide">Step 1</span>
                <h2 className="font-semibold text-ink text-lg mt-1">Pick your dates</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-cream-light p-3 rounded-lg border border-walnut/10">
                  <div className="text-[10px] uppercase tracking-wide text-stone font-semibold mb-1">Check-in</div>
                  <div className="text-sm font-semibold text-ink">
                    {checkIn ? fmtDate(checkIn) : "Select date"}
                  </div>
                </div>
                <div className="bg-cream-light p-3 rounded-lg border border-walnut/10">
                  <div className="text-[10px] uppercase tracking-wide text-stone font-semibold mb-1">Check-out</div>
                  <div className="text-sm font-semibold text-ink">
                    {checkOut ? fmtDate(checkOut) : "Select date"}
                  </div>
                </div>
              </div>

              <div className="bg-cream-light rounded-xl border border-walnut/10 p-3">
                <div className="flex items-center justify-between mb-2 px-1">
                  <button type="button" onClick={() => changeMonth(-1)} className="p-1.5 rounded hover:bg-white text-stone" aria-label="Previous month">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <div className="font-semibold text-ink text-sm">
                    {currentMonth.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
                  </div>
                  <button type="button" onClick={() => changeMonth(1)} className="p-1.5 rounded hover:bg-white text-stone" aria-label="Next month">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[10px] uppercase tracking-wide text-stone font-semibold">
                  {["S","M","T","W","T","F","S"].map((d, i) => <div key={i}>{d}</div>)}
                </div>
                
                <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
              </div>

              {checkIn && (
                <div className="mt-3 text-xs text-stone text-center">
                  {checkOut ? (
                    <><span className="font-medium text-ink">{nights} night{nights > 1 ? "s" : ""}</span> · {fmtDate(checkIn)} → {fmtDate(checkOut)}</>
                  ) : (
                    <>Now select your <span className="font-medium text-ink">check-out</span> date</>
                  )}
                </div>
              )}
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
                    <div
                      key={r.id}
                      className={`rounded-xl border overflow-hidden transition-all ${
                        selected 
                          ? "border-terracotta ring-2 ring-terracotta/30 bg-terracotta-tint/50" 
                          : unavailable 
                            ? "border-walnut/10 bg-cream-light opacity-60 cursor-not-allowed" 
                            : "border-walnut/10 bg-white hover:border-walnut/20 cursor-pointer"
                      }`}
                      onClick={unavailable ? undefined : () => setRoomId(selected ? null : r.id)}
                    >
                      <div className="aspect-[16/9] overflow-hidden bg-cream relative">
                        <PhotoPlaceholder label={r.name} />
                        {unavailable && (
                          <div className="absolute inset-0 bg-ink/40 flex items-center justify-center">
                            <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">Booked</span>
                          </div>
                        )}
                        {r.flexible && !unavailable && <span className="absolute top-2 left-2 bg-gold-tint text-gold-dark text-[10px] font-bold uppercase px-2 py-0.5 rounded">Flexible</span>}
                      </div>
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-ink text-sm">{r.name}</div>
                            <div className="text-stone text-xs mt-0.5">{r.config} · {r.bathOrShower === "bath" ? "Bath" : "Shower"}</div>
                          </div>
                          <div className="text-terracotta-dark font-semibold text-sm whitespace-nowrap">R{Number(r.baseRate)}<span className="text-stone/60 font-normal text-[10px]">/nt</span></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-5 pt-5 border-t border-walnut/10">
                <label className="block text-sm font-medium text-ink mb-2">How many guests? <span className="text-stone font-normal">(max 2 per room)</span></label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setGuestCount((g) => Math.max(1, g - 1))} className="w-9 h-9 rounded-lg border border-walnut/20 hover:bg-cream-light flex items-center justify-center text-stone">−</button>
                  <input type="number" min={1} max={2} value={guestCount} onChange={(e) => setGuestCount(Math.min(2, Math.max(1, Number(e.target.value))))} className="w-16 text-center border border-walnut/20 rounded-lg px-2 py-1.5 text-sm bg-white" />
                  <button type="button" onClick={() => setGuestCount((g) => Math.min(2, g + 1))} className="w-9 h-9 rounded-lg border border-walnut/20 hover:bg-cream-light flex items-center justify-center text-stone">+</button>
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
                    <div
                      className="file-drop border-2 border-dashed border-walnut/20 rounded-xl p-5 text-center cursor-pointer bg-cream-light hover:bg-cream transition-colors"
                      onClick={() => document.getElementById("popFileInput")?.click()}
                    >
                      <input id="popFileInput" type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setPopFileName(e.target.files?.[0]?.name ?? null)} />
                      <div className="text-sm text-ink font-medium">
                        {popFileName ? `✓ ${popFileName}` : "Tap to upload, or drag & drop"}
                      </div>
                      <div className="text-xs text-stone mt-1">PDF, JPG, or PNG · max 5MB</div>
                    </div>
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
                <button type="submit" disabled={status === "submitting"} className="w-full bg-terracotta-dark hover:bg-[#74301f] text-white px-6 py-3.5 rounded-lg font-semibold text-base disabled:opacity-60 transition-colors shadow-sm">
                  {status === "submitting" ? "Sending…" : "Send booking request"}
                </button>
                <p className="text-stone text-xs mt-3 text-center">Submitting this doesn&apos;t confirm your booking — we&apos;ll check availability and confirm on WhatsApp.</p>
              </div>
            </div>
          </form>

          {/* SUMMARY SIDEBAR */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-[calc(var(--header-h)+1rem)] bg-white rounded-2xl border border-walnut/10 shadow-sm p-5 motion-fade-up motion-ready">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-ink text-lg">Your stay</h3>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-terracotta-tint text-terracotta-dark">Leisure</span>
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
                <div 
                  key={r.id}
                  onClick={() => {
                    setRoomId(r.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-white rounded-2xl border border-walnut/10 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-terracotta/40 transition-all group motion-pop"
                  data-stagger={(i % 6) + 1}
                >
                  <div className="aspect-[16/10] overflow-hidden bg-cream relative">
                    <PhotoPlaceholder label={r.name} />
                    {r.flexible && <span className="absolute top-2 left-2 bg-gold-tint text-gold-dark text-[10px] font-bold uppercase px-2 py-0.5 rounded">Flexible</span>}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-semibold text-ink text-base group-hover:text-terracotta-dark transition-colors">{r.name}</div>
                        <div className="text-stone text-xs mt-0.5">{r.config} · {r.bathOrShower === "bath" ? "Bath" : "Shower"}</div>
                      </div>
                      <div className="text-terracotta-dark font-semibold text-base whitespace-nowrap">R{Number(r.baseRate)}</div>
                    </div>
                    <button className="w-full mt-3 py-2 text-sm font-semibold text-terracotta-dark border border-terracotta-dark/30 rounded-lg hover:bg-terracotta-tint transition-colors">
                      Switch to this room
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}
    </main>
  );
}
