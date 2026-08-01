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
  return new Date(iso).toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
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
    if (checkIn && checkOut) {
      getUnavailableRoomIds(checkIn, checkOut).then(setUnavailableIds);
    } else {
      setUnavailableIds([]);
    }
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
        cls += "text-stone-300 cursor-not-allowed ";
      } else {
        cls += "hover:bg-orange-50 text-stone-700 ";
      }

      if (dateStr === todayISO && !isPast) cls += "font-bold text-orange-600 ";

      if (checkIn && checkOut) {
        if (dateStr === checkIn || dateStr === checkOut) {
          cls += "bg-orange-600 text-white font-semibold shadow-sm ";
        } else if (date > new Date(checkIn) && date < new Date(checkOut)) {
          cls += "bg-orange-100 text-orange-900 font-medium ";
        }
      } else if (checkIn && dateStr === checkIn) {
        cls += "bg-orange-600 text-white font-semibold shadow-sm ";
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
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-4 mx-auto">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C65D3C" strokeWidth={2.5}><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-orange-100 text-orange-800 mb-3">Request received</span>
        <h1 className="font-semibold text-stone-900 text-2xl mt-3">Thanks, {fullName.split(" ")[0] || "there"}!</h1>
        <p className="text-stone-600 mt-2 max-w-md mx-auto">
          We&apos;ll WhatsApp you shortly to confirm availability and lock in your booking — usually within minutes during the day.
        </p>
        <Link href="/rooms" className="mt-6 inline-block border border-stone-300 text-stone-700 hover:bg-stone-50 px-5 py-2.5 rounded-lg font-semibold transition-colors">Back to Rooms</Link>
      </main>
    );
  }

  return (
    <main>
      <nav className="max-w-6xl mx-auto px-6 py-4 text-sm text-stone-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/" className="hover:text-orange-600">Home</Link></li>
          <li className="text-stone-300">/</li>
          <li><Link href="/rooms" className="hover:text-orange-600">Rooms</Link></li>
          <li className="text-stone-300">/</li>
          <li className="text-stone-900 font-medium">Book Your Stay</li>
        </ol>
      </nav>

      <section className="max-w-6xl mx-auto px-6 pb-8">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-orange-100 text-orange-800 mb-3">Leisure Booking</span>
        <h1 className="font-semibold text-stone-900 text-3xl md:text-4xl mt-2 max-w-3xl">Let&apos;s get you booked in.</h1>
        <p className="text-stone-600 mt-3 max-w-2xl text-base leading-relaxed">
          Tell us when you&apos;d like to come, which room you fancy, and whether you&apos;d like us to sort meals. We&apos;ll check availability and come back to you on WhatsApp.
        </p>
      </section>

      {/* PROGRESS */}
      <section className="max-w-6xl mx-auto px-6 pb-6">
        <div className="flex items-center gap-2 md:gap-3 text-xs">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${nights > 0 ? "bg-orange-600 text-white" : "bg-orange-100 text-orange-800"}`}>1</div>
          <div className={`h-0.5 flex-1 ${nights > 0 ? "bg-orange-600" : "bg-stone-200"}`} />
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${roomId ? "bg-orange-600 text-white" : nights > 0 ? "bg-orange-100 text-orange-800" : "bg-stone-100 text-stone-400"}`}>2</div>
          <div className={`h-0.5 flex-1 ${roomId ? "bg-orange-600" : "bg-stone-200"}`} />
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${roomId ? "bg-orange-100 text-orange-800" : "bg-stone-100 text-stone-400"}`}>3</div>
          <div className="h-0.5 flex-1 bg-stone-200" />
          <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold bg-stone-100 text-stone-400">4</div>
        </div>
        <div className="flex items-center justify-between mt-2 text-[11px] text-stone-500 font-medium uppercase tracking-wide">
          <span>Dates</span><span>Room</span><span>Meals</span><span>Details</span>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {status === "error" && errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>
            )}

            {/* STEP 1: DATES (Compact) */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 md:p-6">
              <div className="mb-4">
                <span className="text-orange-600 font-semibold text-xs uppercase tracking-wide">Step 1</span>
                <h2 className="font-semibold text-stone-900 text-lg mt-1">Pick your dates</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                  <div className="text-[10px] uppercase tracking-wide text-stone-500 font-semibold mb-1">Check-in</div>
                  <div className="text-sm font-semibold text-stone-900">
                    {checkIn ? fmtDate(checkIn) : "Select date"}
                  </div>
                </div>
                <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                  <div className="text-[10px] uppercase tracking-wide text-stone-500 font-semibold mb-1">Check-out</div>
                  <div className="text-sm font-semibold text-stone-900">
                    {checkOut ? fmtDate(checkOut) : "Select date"}
                  </div>
                </div>
              </div>

              <div className="bg-stone-50 rounded-xl border border-stone-200 p-3">
                <div className="flex items-center justify-between mb-2 px-1">
                  <button type="button" onClick={() => changeMonth(-1)} className="p-1.5 rounded hover:bg-white text-stone-600" aria-label="Previous month">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <div className="font-semibold text-stone-900 text-sm">
                    {currentMonth.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
                  </div>
                  <button type="button" onClick={() => changeMonth(1)} className="p-1.5 rounded hover:bg-white text-stone-600" aria-label="Next month">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[10px] uppercase tracking-wide text-stone-500 font-semibold">
                  {["S","M","T","W","T","F","S"].map((d, i) => <div key={i}>{d}</div>)}
                </div>
                
                <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
              </div>

              {checkIn && (
                <div className="mt-3 text-xs text-stone-600 text-center">
                  {checkOut ? (
                    <><span className="font-medium text-stone-900">{nights} night{nights > 1 ? "s" : ""}</span> · {fmtDate(checkIn)} → {fmtDate(checkOut)}</>
                  ) : (
                    <>Now select your <span className="font-medium text-stone-900">check-out</span> date</>
                  )}
                </div>
              )}
            </div>

            {/* STEP 2: ROOM */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 md:p-6">
              <div className="mb-4">
                <span className="text-orange-600 font-semibold text-xs uppercase tracking-wide">Step 2</span>
                <h2 className="font-semibold text-stone-900 text-lg mt-1">Choose your room</h2>
                <p className="text-stone-500 text-sm mt-1">Rooms greyed out are already booked for your dates.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rooms.map((r) => {
                  const unavailable = unavailableIds.includes(r.id);
                  const selected = roomId === r.id;
                  return (
                    <div
                      key={r.id}
                      className={`rounded-xl border overflow-hidden transition-all ${
                        selected 
                          ? "border-orange-500 ring-2 ring-orange-200 bg-orange-50/30" 
                          : unavailable 
                            ? "border-stone-200 bg-stone-50 opacity-60 cursor-not-allowed" 
                            : "border-stone-200 bg-white hover:border-stone-300 cursor-pointer"
                      }`}
                      onClick={unavailable ? undefined : () => setRoomId(selected ? null : r.id)}
                    >
                      <div className="aspect-[16/9] overflow-hidden bg-stone-100 relative">
                        <PhotoPlaceholder label={r.name} />
                        {unavailable && (
                          <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center">
                            <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">Booked</span>
                          </div>
                        )}
                        {r.flexible && !unavailable && <span className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded">Flexible</span>}
                      </div>
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-stone-900 text-sm">{r.name}</div>
                            <div className="text-stone-500 text-xs mt-0.5">{r.config} · {r.bathOrShower === "bath" ? "Bath" : "Shower"}</div>
                          </div>
                          <div className="text-orange-600 font-semibold text-sm whitespace-nowrap">R{Number(r.baseRate)}<span className="text-stone-400 font-normal text-[10px]">/nt</span></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-5 pt-5 border-t border-stone-100">
                <label className="block text-sm font-medium text-stone-900 mb-2">How many guests? <span className="text-stone-500 font-normal">(max 2 per room)</span></label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setGuestCount((g) => Math.max(1, g - 1))} className="w-9 h-9 rounded-lg border border-stone-300 hover:bg-stone-50 flex items-center justify-center text-stone-600">−</button>
                  <input type="number" min={1} max={2} value={guestCount} onChange={(e) => setGuestCount(Math.min(2, Math.max(1, Number(e.target.value))))} className="w-16 text-center border border-stone-300 rounded-lg px-2 py-1.5 text-sm bg-white" />
                  <button type="button" onClick={() => setGuestCount((g) => Math.min(2, g + 1))} className="w-9 h-9 rounded-lg border border-stone-300 hover:bg-stone-50 flex items-center justify-center text-stone-600">+</button>
                </div>
              </div>
            </div>

            {/* STEP 3: MEALS */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 md:p-6">
              <div className="mb-4">
                <span className="text-orange-600 font-semibold text-xs uppercase tracking-wide">Step 3</span>
                <h2 className="font-semibold text-stone-900 text-lg mt-1">Add breakfast or dinner <span className="text-stone-500 text-sm font-normal">(optional)</span></h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className={`rounded-xl p-4 border flex items-start gap-3 cursor-pointer transition-all ${breakfast ? "border-orange-500 bg-orange-50/30" : "border-stone-200 bg-white hover:border-stone-300"}`}>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 ${breakfast ? "bg-orange-600 border-orange-600" : "border-stone-300"}`}>
                    {breakfast && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div><div className="font-semibold text-stone-900 text-sm">Breakfast</div><div className="text-stone-500 text-xs mt-0.5">Full cooked or continental</div></div>
                      <div className="text-orange-600 font-semibold text-sm whitespace-nowrap">R{BREAKFAST_PRICE}</div>
                    </div>
                  </div>
                  <input type="checkbox" checked={breakfast} onChange={(e) => setBreakfast(e.target.checked)} className="sr-only" />
                </label>
                <label className={`rounded-xl p-4 border flex items-start gap-3 cursor-pointer transition-all ${dinner ? "border-orange-500 bg-orange-50/30" : "border-stone-200 bg-white hover:border-stone-300"}`}>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 ${dinner ? "bg-orange-600 border-orange-600" : "border-stone-300"}`}>
                    {dinner && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div><div className="font-semibold text-stone-900 text-sm">Dinner</div><div className="text-stone-500 text-xs mt-0.5">Three-course set menu</div></div>
                      <div className="text-orange-600 font-semibold text-sm whitespace-nowrap">R{DINNER_PRICE}</div>
                    </div>
                  </div>
                  <input type="checkbox" checked={dinner} onChange={(e) => setDinner(e.target.checked)} className="sr-only" />
                </label>
              </div>
            </div>

            {/* STEP 4: DETAILS */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 md:p-6">
              <div className="mb-4">
                <span className="text-orange-600 font-semibold text-xs uppercase tracking-wide">Step 4</span>
                <h2 className="font-semibold text-stone-900 text-lg mt-1">Your details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-stone-900 mb-1.5">Full name *</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-1.5">WhatsApp number *</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-1.5">Email (optional)</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-stone-900 mb-1.5">Anything we should know? (optional)</label>
                  <textarea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} rows={3} className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none" placeholder="e.g. Late arrival, extra pillows, dietary requirements..." />
                </div>
              </div>
            </div>

            {/* PAYMENT */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 md:p-6">
              <div className="mb-4">
                <span className="text-orange-600 font-semibold text-xs uppercase tracking-wide">Payment</span>
                <h2 className="font-semibold text-stone-900 text-lg mt-1">Payment options</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className={`flex items-start gap-3 rounded-xl p-4 border cursor-pointer transition-all ${paymentMethod === "eft" ? "border-orange-500 bg-orange-50/30" : "border-stone-200 bg-white hover:border-stone-300"}`}>
                  <input type="radio" checked={paymentMethod === "eft"} onChange={() => setPaymentMethod("eft")} className="mt-1 accent-orange-600" />
                  <div><div className="font-semibold text-stone-900 text-sm">EFT / Bank Transfer</div><div className="text-stone-500 text-xs mt-0.5">Pay to our business account. Upload proof below.</div></div>
                </label>
                <label className={`flex items-start gap-3 rounded-xl p-4 border cursor-pointer transition-all ${paymentMethod === "cash" ? "border-orange-500 bg-orange-50/30" : "border-stone-200 bg-white hover:border-stone-300"}`}>
                  <input type="radio" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} className="mt-1 accent-orange-600" />
                  <div><div className="font-semibold text-stone-900 text-sm">Cash on Arrival</div><div className="text-stone-500 text-xs mt-0.5">Settle in person at check-in.</div></div>
                </label>
              </div>
              {paymentMethod === "eft" && (
                <>
                  <div className="mt-4 bg-stone-50 rounded-xl border border-stone-200 p-4">
                    <div className="font-semibold text-stone-900 text-sm mb-2">Banking details</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div className="flex justify-between py-1 border-b border-stone-200"><span className="text-stone-500">Bank</span><span className="text-stone-900 font-medium">FNB</span></div>
                      <div className="flex justify-between py-1 border-b border-stone-200"><span className="text-stone-500">Account name</span><span className="text-stone-900 font-medium">Gomodi Guest Lodge</span></div>
                      <div className="flex justify-between py-1 border-b border-stone-200"><span className="text-stone-500">Account number</span><span className="text-stone-900 font-medium">62874592011</span></div>
                      <div className="flex justify-between py-1 border-b border-stone-200"><span className="text-stone-500">Branch code</span><span className="text-stone-900 font-medium">250655</span></div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-stone-900 mb-1.5">Upload proof of payment (optional)</label>
                    <div
                      className="file-drop border-2 border-dashed border-stone-300 rounded-xl p-5 text-center cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors"
                      onClick={() => document.getElementById("popFileInput")?.click()}
                    >
                      <input id="popFileInput" type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setPopFileName(e.target.files?.[0]?.name ?? null)} />
                      <div className="text-sm text-stone-900 font-medium">
                        {popFileName ? `✓ ${popFileName}` : "Tap to upload, or drag & drop"}
                      </div>
                      <div className="text-xs text-stone-500 mt-1">PDF, JPG, or PNG · max 5MB</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* CONSENT */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 md:p-6">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required className="mt-1 accent-orange-600 w-4 h-4" />
                <label className="text-sm text-stone-600">I&apos;m happy for Gomodi Guest Lodge to keep my details to manage this booking, in line with POPIA. *</label>
              </div>
              <div className="mt-6">
                <button type="submit" disabled={status === "submitting"} className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3.5 rounded-lg font-semibold text-base disabled:opacity-60 transition-colors shadow-sm">
                  {status === "submitting" ? "Sending…" : "Send booking request"}
                </button>
                <p className="text-stone-500 text-xs mt-3 text-center">Submitting doesn&apos;t confirm your booking — we&apos;ll check availability and come back to you on WhatsApp.</p>
              </div>
            </div>
          </form>

          {/* SUMMARY SIDEBAR */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-stone-900 text-lg">Your stay</h3>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-orange-100 text-orange-800">Leisure</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-start"><span className="text-stone-500">Dates</span><span className="text-stone-900 text-right font-medium">{checkIn ? (checkOut ? `${fmtDate(checkIn)} → ${fmtDate(checkOut)}` : `${fmtDate(checkIn)} → ?`) : "—"}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Nights</span><span className="text-stone-900 font-medium">{nights || "—"}</span></div>
                <div className="flex justify-between items-start"><span className="text-stone-500">Room</span><span className="text-stone-900 text-right font-medium">{room?.name ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Guests</span><span className="text-stone-900 font-medium">{guestCount}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Meals</span><span className="text-stone-900 font-medium">{[breakfast && "Breakfast", dinner && "Dinner"].filter(Boolean).join(" + ") || "None"}</span></div>
                <div className="border-t border-stone-100 pt-3 mt-3 space-y-1.5">
                  <div className="flex justify-between text-stone-500"><span>Accommodation</span><span>{accomTotal ? fmt(accomTotal) : "—"}</span></div>
                  <div className="flex justify-between text-stone-500"><span>Meals</span><span>{mealTotal ? fmt(mealTotal) : "—"}</span></div>
                  <div className="flex justify-between text-stone-900 font-semibold text-base pt-2 border-t border-stone-100 mt-2"><span>Indicative total</span><span className="text-orange-600">{accomTotal || mealTotal ? fmt(accomTotal + mealTotal) : "—"}</span></div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Link href="/rooms" className="text-sm text-stone-500 hover:text-orange-600">Not sure which room?</Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* FIX 3: EXPLORE OTHER ROOMS (Conversion Optimisation & Retention) */}
      {roomId && rooms.filter(r => r.id !== roomId && !unavailableIds.includes(r.id)).length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-20 border-t border-stone-200 pt-12 mt-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-stone-900">Not quite the right fit?</h2>
            <p className="text-stone-600 mt-2 max-w-xl mx-auto">
              Here are our other available rooms for your selected dates. Tap any room to switch your booking instantly.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms
              .filter(r => r.id !== roomId && !unavailableIds.includes(r.id))
              .map((r) => (
                <div 
                  key={r.id}
                  onClick={() => {
                    setRoomId(r.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-orange-300 transition-all group"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-stone-100 relative">
                    <PhotoPlaceholder label={r.name} />
                    {r.flexible && <span className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded">Flexible</span>}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-semibold text-stone-900 text-base group-hover:text-orange-600 transition-colors">{r.name}</div>
                        <div className="text-stone-500 text-xs mt-0.5">{r.config} · {r.bathOrShower === "bath" ? "Bath" : "Shower"}</div>
                      </div>
                      <div className="text-orange-600 font-semibold text-base whitespace-nowrap">R{Number(r.baseRate)}</div>
                    </div>
                    <button className="w-full mt-3 py-2 text-sm font-semibold text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors">
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
