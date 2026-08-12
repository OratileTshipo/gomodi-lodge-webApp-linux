"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { submitLeisureBooking, getUnavailableRoomIds } from "./actions";
import { nightlyRatesForStay, stayHasSeasonalNights } from "@/lib/seasonal";
import { BREAKFAST_PRICE, DINNER_PRICE } from "@/lib/pricing";
import { BookingCalendar } from "./BookingCalendar";
import { RoomStep } from "./RoomStep";
import { MealsStep } from "./MealsStep";
import { DetailsStep } from "./DetailsStep";
import { PaymentStep } from "./PaymentStep";
import { StaySummary } from "./StaySummary";
import { OtherRooms } from "./OtherRooms";
import { toISO, type BookingRoom, type SeasonalPeriod } from "./booking-utils";

export function BookingForm({
  rooms,
  seasonalPeriods = [],
  initialRoomId,
  initialCheckIn = "",
  initialCheckOut = "",
  initialGuests = 2,
}: {
  rooms: BookingRoom[];
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

  // Auto-scroll to top when the success message appears
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

            <BookingCalendar
              today={today}
              checkIn={checkIn}
              checkOut={checkOut}
              selectingCheckIn={selectingCheckIn}
              currentMonth={currentMonth}
              monthTransition={monthTransition}
              onPickDate={pickDate}
              onChangeMonth={changeMonth}
              onClear={clearDates}
              onSelectQuickDate={selectQuickDate}
              onSelectCheckIn={() => setSelectingCheckIn(true)}
              onSelectCheckOut={() => { if (checkIn) setSelectingCheckIn(false); }}
            />

            <RoomStep
              rooms={rooms}
              roomId={roomId}
              guestCount={guestCount}
              checkIn={checkIn}
              checkOut={checkOut}
              unavailableIds={unavailableIds}
              onSelectRoom={(id) => setRoomId(id)}
              onSetGuestCount={setGuestCount}
            />

            <MealsStep
              breakfast={breakfast}
              dinner={dinner}
              onToggleBreakfast={setBreakfast}
              onToggleDinner={setDinner}
            />

            <DetailsStep
              fullName={fullName}
              phone={phone}
              email={email}
              specialRequests={specialRequests}
              setFullName={setFullName}
              setPhone={setPhone}
              setEmail={setEmail}
              setSpecialRequests={setSpecialRequests}
            />

            <PaymentStep
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              popFileName={popFileName}
              popUploading={popUploading}
              popUploadError={popUploadError}
              onUploadFile={handlePopFile}
            />

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
            <StaySummary
              checkIn={checkIn}
              checkOut={checkOut}
              nights={nights}
              room={room}
              guestCount={guestCount}
              breakfast={breakfast}
              dinner={dinner}
              accomTotal={accomTotal}
              mealTotal={mealTotal}
              hasSeasonal={hasSeasonal}
            />
          </aside>
        </div>
      </section>

      <OtherRooms
        rooms={rooms}
        roomId={roomId}
        checkIn={checkIn}
        checkOut={checkOut}
        unavailableIds={unavailableIds}
        onSwitchRoom={(id) => {
          setRoomId(id);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </main>
  );
}
