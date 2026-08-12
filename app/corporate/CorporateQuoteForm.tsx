"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { submitCorporateQuote, RoomLineInput } from "./actions";
import { BREAKFAST_PRICE, DINNER_PRICE, ROOM_BASE_RATE } from "@/lib/pricing";

const ROOM_TYPES: { id: "double" | "flexible"; label: string; price: number }[] = [
  { id: "double", label: "Double Room", price: ROOM_BASE_RATE },
  { id: "flexible", label: "Flexible Twin/Double", price: ROOM_BASE_RATE },
];

export default function CorporateQuoteForm() {
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [clientRef, setClientRef] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [lines, setLines] = useState<RoomLineInput[]>([
    { roomType: "double", count: 1, guestsPerRoom: 1 },
  ]);
  const [breakfast, setBreakfast] = useState(false);
  const [dinner, setDinner] = useState(false);
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);

  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-scroll to top on success
  useEffect(() => {
    if (status === "success") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [status]);

  const nights =
    checkIn && checkOut && new Date(checkOut) > new Date(checkIn)
      ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
      : 0;
  const totalRooms = lines.reduce((s, l) => s + (l.count || 0), 0);
  const totalGuests = lines.reduce((s, l) => s + (l.count || 0) * (l.guestsPerRoom || 0), 0);
  const accomEstimate = lines.reduce((s, l) => {
    const type = ROOM_TYPES.find((t) => t.id === l.roomType);
    return s + (type ? type.price * (l.count || 0) * nights : 0);
  }, 0);
  const addonEstimate =
    (breakfast ? totalGuests * nights * BREAKFAST_PRICE : 0) + (dinner ? totalGuests * nights * DINNER_PRICE : 0);

  function updateLine(i: number, patch: Partial<RoomLineInput>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((prev) => [...prev, { roomType: "double", count: 1, guestsPerRoom: 1 }]);
  }
  function removeLine(i: number) {
    setLines((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setStatus("error");
      setErrorMessage("Please confirm your consent to continue.");
      return;
    }
    setStatus("submitting");
    setErrorMessage(null);
    const result = await submitCorporateQuote({
      fullName, jobTitle, company, phone, email, billingEmail, poNumber, vatNumber, clientRef,
      checkIn, checkOut, roomLines: lines, breakfast, dinner, notes,
    });
    if (result.ok) setStatus("success");
    else { setStatus("error"); setErrorMessage(result.error); }
  }

  const fmt = (n: number) => "R" + n.toLocaleString("en-ZA");

  return (
    <section id="quote-form" className="py-16 md:py-24 bg-cream">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center motion-fade-up motion-ready">
          <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">Tell us what you need and we&apos;ll send a formal quote.</h2>
        </div>

        {status === "success" ? (
          <div className="mt-10 bg-white rounded-2xl border border-walnut/10 card-shadow p-10 text-center">
            <div className="motion-pop" data-stagger="1">
              <div className="w-16 h-16 rounded-full bg-gold-tint flex items-center justify-center mb-5 mx-auto shadow-lg shadow-gold/20">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8f6a3e" strokeWidth={2.5}><path d="M20 6L9 17l-5-5"/></svg>
              </div>
            </div>
            <h3 className="font-semibold text-ink text-xl mb-2 motion-pop" data-stagger="2">Quote request received.</h3>
            <p className="text-stone text-sm leading-relaxed max-w-2xl mx-auto motion-pop" data-stagger="3">
              Thank you, <span className="font-medium text-ink">{company}</span>. We have received your request for <span className="font-medium text-ink">{totalRooms} room{totalRooms !== 1 ? "s" : ""}</span>.
              Our team will review availability and email a formal quotation to <span className="font-medium text-ink">{email || billingEmail}</span> within 24 hours.
            </p>
            <div className="mt-8 motion-pop" data-stagger="4">
              <Link href="/" className="inline-block btn-primary px-6 py-3 rounded-lg font-semibold btn-press ripple">Back to Home</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 bg-white rounded-2xl border border-walnut/10 card-shadow p-6 md:p-10 motion-fade-up motion-ready">
            {status === "error" && errorMessage && (
              <div className="mb-6 rounded-xl border border-terracotta bg-terracotta-tint p-4 text-sm text-terracotta-dark">{errorMessage}</div>
            )}

            <div className="pb-8 border-b border-walnut/10">
              <h3 className="font-semibold text-ink text-lg">1. Your details</h3>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label htmlFor="corporateFullName" className="block text-sm font-medium text-ink mb-1.5">Full name *</label>
                  <input id="corporateFullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                <div><label htmlFor="corporateJobTitle" className="block text-sm font-medium text-ink mb-1.5">Job title / role</label>
                  <input id="corporateJobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                <div><label htmlFor="corporateCompany" className="block text-sm font-medium text-ink mb-1.5">Company / department *</label>
                  <input id="corporateCompany" value={company} onChange={(e) => setCompany(e.target.value)} required className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                <div><label htmlFor="corporatePhone" className="block text-sm font-medium text-ink mb-1.5">Phone / WhatsApp *</label>
                  <input id="corporatePhone" value={phone} onChange={(e) => setPhone(e.target.value)} required className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                <div className="md:col-span-2"><label htmlFor="corporateEmail" className="block text-sm font-medium text-ink mb-1.5">Email *</label>
                  <input id="corporateEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
              </div>
            </div>

            <div className="py-8 border-b border-walnut/10">
              <h3 className="font-semibold text-ink text-lg">2. Billing details</h3>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label htmlFor="corporateBillingEmail" className="block text-sm font-medium text-ink mb-1.5">Billing email (if different)</label>
                  <input id="corporateBillingEmail" type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                <div><label htmlFor="corporatePoNumber" className="block text-sm font-medium text-ink mb-1.5">PO number (if available)</label>
                  <input id="corporatePoNumber" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                <div><label htmlFor="corporateVatNumber" className="block text-sm font-medium text-ink mb-1.5">VAT number (optional)</label>
                  <input id="corporateVatNumber" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                <div><label htmlFor="corporateClientRef" className="block text-sm font-medium text-ink mb-1.5">Your reference (optional)</label>
                  <input id="corporateClientRef" value={clientRef} onChange={(e) => setClientRef(e.target.value)} className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
              </div>
            </div>

            <div className="py-8 border-b border-walnut/10">
              <h3 className="font-semibold text-ink text-lg">3. Stay details</h3>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label htmlFor="corporateCheckIn" className="block text-sm font-medium text-ink mb-1.5">Check-in date *</label>
                  <input id="corporateCheckIn" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                <div><label htmlFor="corporateCheckOut" className="block text-sm font-medium text-ink mb-1.5">Check-out date *</label>
                  <input id="corporateCheckOut" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-ink text-sm">Room configuration</h4>
                  <span className="text-xs text-stone">{nights} night{nights !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-3">
                  {lines.map((line, i) => (
                    <div key={i} className="room-line bg-cream-light rounded-xl border border-walnut/10 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-ink">Room {i + 1}</span>
                        <button type="button" onClick={() => removeLine(i)} disabled={lines.length === 1} aria-label={`Remove room ${i + 1}`} className="text-stone hover:text-terracotta-dark w-11 h-11 -m-2 flex items-center justify-center rounded transition-colors disabled:opacity-30">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <label htmlFor={`corporateRoomType-${i}`} className="block text-xs font-medium text-stone mb-1">Room type</label>
                          <select id={`corporateRoomType-${i}`} value={line.roomType} onChange={(e) => updateLine(i, { roomType: e.target.value as "double" | "flexible" })} className="form-input w-full border border-walnut/20 rounded-lg px-3 py-2 text-sm bg-white">
                            {ROOM_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label} — R{t.price}/night</option>)}
                          </select>
                        </div>
                        <div>
                          <label htmlFor={`corporateRoomCount-${i}`} className="block text-xs font-medium text-stone mb-1">No. of rooms</label>
                          <input id={`corporateRoomCount-${i}`} type="number" min={1} max={9} value={line.count} onChange={(e) => updateLine(i, { count: Number(e.target.value) })} className="form-input w-full border border-walnut/20 rounded-lg px-3 py-2 text-sm bg-white" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label htmlFor={`corporateGuestsPerRoom-${i}`} className="block text-xs font-medium text-stone mb-1">Guests per room</label>
                        <input id={`corporateGuestsPerRoom-${i}`} type="number" min={1} max={2} value={line.guestsPerRoom} onChange={(e) => updateLine(i, { guestsPerRoom: Number(e.target.value) })} className="form-input w-full border border-walnut/20 rounded-lg px-3 py-2 text-sm bg-white" />
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addLine} className="mt-4 w-full border border-dashed border-walnut/30 hover:border-walnut hover:bg-walnut-tint/40 rounded-xl py-3 text-sm font-semibold text-walnut transition-colors inline-flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12h14"/></svg>
                  Add another room
                </button>
              </div>
            </div>

            <div className="py-8 border-b border-walnut/10">
              <h3 className="font-semibold text-ink text-lg">4. Meal add-ons (optional)</h3>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`addon-card flex items-start gap-3 rounded-xl p-4 border border-walnut/10 ${breakfast ? "selected" : ""}`}>
                  <input type="checkbox" checked={breakfast} onChange={(e) => setBreakfast(e.target.checked)} className="mt-1 accent-walnut" />
                  <div className="flex-1"><div className="flex items-center justify-between"><span className="font-semibold text-ink text-sm">Breakfast</span><span className="text-walnut font-semibold text-sm">R{BREAKFAST_PRICE} pp/day</span></div></div>
                </label>
                <label className={`addon-card flex items-start gap-3 rounded-xl p-4 border border-walnut/10 ${dinner ? "selected" : ""}`}>
                  <input type="checkbox" checked={dinner} onChange={(e) => setDinner(e.target.checked)} className="mt-1 accent-walnut" />
                  <div className="flex-1"><div className="flex items-center justify-between"><span className="font-semibold text-ink text-sm">Dinner</span><span className="text-walnut font-semibold text-sm">R{DINNER_PRICE} pp/day</span></div></div>
                </label>
              </div>
            </div>

            <div className="py-8 border-b border-walnut/10">
              <h3 className="font-semibold text-ink text-lg">5. Anything else?</h3>
              <textarea id="corporateNotes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="form-input mt-4 w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light resize-none" placeholder="Special requirements, dietary needs, preferred room locations..." />
            </div>

            <div className="py-8 border-b border-walnut/10">
              <h3 className="font-semibold text-ink text-lg">Indicative estimate</h3>
              <div className="mt-4 bg-cream-light rounded-xl border border-walnut/10 p-5">
                <div className="summary-row"><span className="text-stone">Rooms</span><span className="text-ink">{totalRooms || "—"}</span></div>
                <div className="summary-row"><span className="text-stone">Nights</span><span className="text-ink">{nights || "—"}</span></div>
                <div className="summary-row"><span className="text-stone">Guests</span><span className="text-ink">{totalGuests || "—"}</span></div>
                <div className="summary-row"><span className="text-stone">Accommodation estimate</span><span className="text-ink">{accomEstimate ? fmt(accomEstimate) : "—"}</span></div>
                <div className="summary-row"><span className="text-stone">Add-ons estimate</span><span className="text-ink">{addonEstimate ? fmt(addonEstimate) : "None selected"}</span></div>
                <div className="summary-row total"><span className="text-ink">Indicative total</span><span className="text-walnut">{accomEstimate || addonEstimate ? fmt(accomEstimate + addonEstimate) : "—"}</span></div>
              </div>
            </div>

            <div className="py-6 border-b border-walnut/10">
              <div className="flex items-start gap-3">
                <input id="quoteConsent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required className="mt-1 accent-walnut" />
                <label htmlFor="quoteConsent" className="text-sm text-stone">I agree to Gomodi Guest Lodge collecting my details to respond to this quote request, in line with POPIA. *</label>
              </div>
            </div>

            <div className="pt-6">
              <button type="submit" disabled={status === "submitting"} className="w-full btn-primary px-6 py-3 rounded-lg font-semibold text-base disabled:opacity-60 shadow-sm shadow-terracotta-dark/20 hover:shadow-md hover:shadow-terracotta-dark/30 transition-all btn-press ripple">
                {status === "submitting" ? "Sending…" : "Submit Quote Request"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}