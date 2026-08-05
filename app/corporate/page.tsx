"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { submitCorporateQuote, RoomLineInput } from "./actions";

const ROOM_TYPES: { id: "double" | "flexible"; label: string; price: number }[] = [
  { id: "double", label: "Double Room", price: 950 },
  { id: "flexible", label: "Flexible Twin/Double", price: 950 },
];

const FAQS = [
  { q: "Can you accommodate more than 9 guests?", a: "We have 9 rooms on-site, each sleeping up to 2 guests (18 guests total). For larger teams, we can recommend trusted partner accommodation nearby and coordinate the booking for you." },
  { q: "Do you offer weekly or monthly rates?", a: "Yes — extended-stay rates are available for bookings of 7 nights or more. Mention the duration in your request and we'll include the discounted rate in your quotation." },
  { q: "Can you issue a quote before we have a PO number?", a: "Absolutely. Many clients request a quote first to secure internal approval. The PO number can be added later, before we issue the final invoice." },
  { q: "What payment methods do you accept?", a: "EFT/bank transfer is our standard for corporate clients. We'll include our banking details on every invoice." },
  { q: "Do you provide a consolidated statement for repeat clients?", a: "Yes — for clients with regular bookings, we can issue a consolidated statement grouping multiple invoices monthly or quarterly." },
  { q: "What's your cancellation policy for corporate bookings?", a: "Our standard cancellation terms will be included in your written quotation. For long-term arrangements, we're happy to agree bespoke terms." },
];

export default function CorporatePage() {
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
    (breakfast ? totalGuests * nights * 175 : 0) + (dinner ? totalGuests * nights * 300 : 0);

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
    <main className="page-transition">
      <nav className="max-w-6xl mx-auto px-6 py-4 text-sm text-stone" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/" className="hover:text-terracotta">Home</Link></li>
          <li className="text-walnut/40">/</li>
          <li className="text-ink font-medium">Corporate &amp; Government</li>
        </ol>
      </nav>

      {/* HERO */}
      <section className="relative">
        <div className="relative h-[55vh] min-h-[400px] max-h-[560px] overflow-hidden parallax-container">
          <div className="absolute inset-0 motion-zoom-out motion-ready">
            <PhotoPlaceholder label="Corporate guest room" tone="walnut" className="absolute inset-0" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/50 to-ink/80" />
          <div className="relative z-10 h-full max-w-6xl mx-auto px-6 flex flex-col justify-end pb-12 md:pb-16">
            <span className="pill pill-corporate self-start mb-4 motion-fade-up motion-ready" data-stagger="1">Corporate &amp; Government</span>
            <h1 className="text-cream-light font-semibold text-3xl md:text-5xl leading-tight max-w-3xl motion-fade-up motion-ready" data-stagger="2">
              Accommodation that respects your procurement process.
            </h1>
            <p className="text-cream/90 mt-4 max-w-xl text-base md:text-lg motion-fade-up motion-ready" data-stagger="3">
              Contractor deployments, government rotations, and multi-room group stays — one form captures everything, and we issue the formal quotations, invoices, and consolidated statements your finance team needs.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 motion-fade-up motion-ready" data-stagger="4">
              <a href="#quote-form" className="btn-primary px-6 py-3 rounded-lg font-semibold text-base inline-flex items-center justify-center gap-2 bg-cream-light text-walnut hover:bg-white">
                Request a Quote
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* WHO WE SERVE */}
      <section className="py-16 md:py-24 bg-cream-light">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto motion-fade-up motion-ready">
            <span className="pill pill-corporate">Who We Serve</span>
            <h2 className="text-ink font-semibold text-2xl md:text-3xl mt-4">Built for the clients we already host.</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Contractor Deployments", text: "Week-long or month-long stays for project teams. Multi-room bookings, consolidated invoicing, and reliable WiFi.", items: ["Multi-room, multi-night in one quote", "Weekly/monthly rates on request", "Secure on-site parking"] },
              { title: "Government Officials", text: "Rotations, inspections, and official visits — with formal quotations, PO references, and VAT-compliant invoices.", items: ["PO numbers captured upfront", "Formal quotation before commitment", "VAT-compliant invoicing"] },
              { title: "Group & Team Stays", text: "Training groups, audit teams, or project kick-offs — book multiple rooms in a single submission.", items: ["Up to 9 rooms in one booking", "Flexible twin/double configuration", "Group rates on request"] },
            ].map((s, i) => (
              <article key={s.title} className="segment-card bg-white rounded-2xl p-6 border border-walnut/10 card-shadow motion-scale-in motion-ready interactive-element card-lift" data-stagger={i + 1}>
                <div className="doc-icon bg-walnut-tint text-walnut">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1zM9 5h6v2H9z"/></svg>
                </div>
                <h3 className="font-semibold text-ink text-lg mt-4">{s.title}</h3>
                <p className="text-stone text-sm mt-2">{s.text}</p>
                <ul className="mt-4 space-y-2 text-sm text-ink">
                  {s.items.map((it) => (
                    <li key={it} className="flex items-start gap-2"><span className="text-walnut mt-0.5">✓</span> {it}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* DOCUMENTATION TRAIL */}
      <section className="py-16 md:py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="motion-fade-left motion-ready">
            <span className="pill pill-corporate">The Documentation Trail</span>
            <h2 className="font-semibold text-ink text-2xl md:text-3xl mt-4">Everything your finance team needs, in order.</h2>
            <p className="text-stone mt-4 leading-relaxed">
              From the first quote to the final consolidated statement, every document is issued formally, by email, and ready for your internal approval and payment processes.
            </p>
            <div className="mt-6 space-y-3">
              {[
                ["1. Formal Quotation", "Itemised by room, night, and add-on. References your PO number if provided."],
                ["2. Written Confirmation", "Once you approve the quote, a formal confirmation is issued by email."],
                ["3. VAT-Compliant Invoice", "Issued after stay, suitable for EFT payment against your PO."],
                ["4. Consolidated Statement", "For repeat clients — multiple invoices grouped into a single statement."],
              ].map(([title, text], i) => (
                <div key={title} className="flex items-start gap-3 motion-fade-up motion-ready" data-stagger={i + 1}>
                  <div className="w-8 h-8 rounded-lg bg-walnut-tint text-walnut flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  <div>
                    <div className="font-semibold text-ink text-sm">{title}</div>
                    <div className="text-stone text-sm">{text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="motion-fade-right motion-ready image-zoom">
            <div className="rounded-2xl overflow-hidden card-shadow aspect-[4/3]">
              <PhotoPlaceholder label="Deluxe room" tone="walnut" />
            </div>
          </div>
        </div>
      </section>

      {/* QUOTE FORM */}
      <section id="quote-form" className="py-16 md:py-24 bg-cream">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center motion-fade-up motion-ready">
            <span className="pill pill-corporate">Request a Quote</span>
            <h2 className="font-semibold text-ink text-2xl md:text-3xl mt-4">Tell us what you need. We&apos;ll come back with a formal quote.</h2>
          </div>

          {status === "success" ? (
            <div className="mt-10 bg-white rounded-2xl border border-walnut/10 card-shadow p-10 text-center motion-pop">
              <div className="w-14 h-14 rounded-full bg-gold-tint flex items-center justify-center mb-4 mx-auto">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b8860b" strokeWidth={2.5}><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <h3 className="font-semibold text-ink text-xl mb-2">Quote request received.</h3>
              <p className="text-stone text-sm leading-relaxed max-w-2xl mx-auto">
                Thank you, <span className="font-medium text-ink">{company}</span>. We have received your request for <span className="font-medium text-ink">{totalRooms} room{totalRooms !== 1 ? "s" : ""}</span>. 
                Our team will review availability and email a formal quotation to <span className="font-medium text-ink">{email || billingEmail}</span> within 24 hours.
              </p>
              <Link href="/" className="mt-6 inline-block border border-walnut/20 text-ink hover:bg-cream-light px-5 py-2.5 rounded-lg font-semibold transition-colors interactive-element">Back to Home</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 bg-white rounded-2xl border border-walnut/10 card-shadow p-6 md:p-10 motion-fade-up motion-ready">
              {status === "error" && errorMessage && (
                <div className="mb-6 rounded-xl border border-terracotta bg-terracotta-tint p-4 text-sm text-terracotta-dark">{errorMessage}</div>
              )}

              <div className="pb-8 border-b border-walnut/10">
                <h3 className="font-semibold text-ink text-lg">1. Your details</h3>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-medium text-ink mb-1.5">Full name *</label>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                  <div><label className="block text-sm font-medium text-ink mb-1.5">Job title / role</label>
                    <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                  <div><label className="block text-sm font-medium text-ink mb-1.5">Company / department *</label>
                    <input value={company} onChange={(e) => setCompany(e.target.value)} required className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                  <div><label className="block text-sm font-medium text-ink mb-1.5">Phone / WhatsApp *</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} required className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-ink mb-1.5">Email *</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                </div>
              </div>

              <div className="py-8 border-b border-walnut/10">
                <h3 className="font-semibold text-ink text-lg">2. Billing details</h3>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-medium text-ink mb-1.5">Billing email (if different)</label>
                    <input type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                  <div><label className="block text-sm font-medium text-ink mb-1.5">PO number (if available)</label>
                    <input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                  <div><label className="block text-sm font-medium text-ink mb-1.5">VAT number (optional)</label>
                    <input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                  <div><label className="block text-sm font-medium text-ink mb-1.5">Your reference (optional)</label>
                    <input value={clientRef} onChange={(e) => setClientRef(e.target.value)} className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                </div>
              </div>

              <div className="py-8 border-b border-walnut/10">
                <h3 className="font-semibold text-ink text-lg">3. Stay details</h3>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-medium text-ink mb-1.5">Check-in date *</label>
                    <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                  <div><label className="block text-sm font-medium text-ink mb-1.5">Check-out date *</label>
                    <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
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
                          <button type="button" onClick={() => removeLine(i)} disabled={lines.length === 1} className="text-stone hover:text-terracotta p-1 rounded transition-colors disabled:opacity-30">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-stone mb-1">Room type</label>
                            <select value={line.roomType} onChange={(e) => updateLine(i, { roomType: e.target.value as "double" | "flexible" })} className="form-input w-full border border-walnut/20 rounded-lg px-3 py-2 text-sm bg-white">
                              {ROOM_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label} — R{t.price}/night</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-stone mb-1">No. of rooms</label>
                            <input type="number" min={1} max={9} value={line.count} onChange={(e) => updateLine(i, { count: Number(e.target.value) })} className="form-input w-full border border-walnut/20 rounded-lg px-3 py-2 text-sm bg-white" />
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-stone mb-1">Guests per room</label>
                          <input type="number" min={1} max={2} value={line.guestsPerRoom} onChange={(e) => updateLine(i, { guestsPerRoom: Number(e.target.value) })} className="form-input w-full border border-walnut/20 rounded-lg px-3 py-2 text-sm bg-white" />
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
                    <div className="flex-1"><div className="flex items-center justify-between"><span className="font-semibold text-ink text-sm">Breakfast</span><span className="text-walnut font-semibold text-sm">R150–R200 pp/day</span></div></div>
                  </label>
                  <label className={`addon-card flex items-start gap-3 rounded-xl p-4 border border-walnut/10 ${dinner ? "selected" : ""}`}>
                    <input type="checkbox" checked={dinner} onChange={(e) => setDinner(e.target.checked)} className="mt-1 accent-walnut" />
                    <div className="flex-1"><div className="flex items-center justify-between"><span className="font-semibold text-ink text-sm">Dinner</span><span className="text-walnut font-semibold text-sm">R250–R350 pp/day</span></div></div>
                  </label>
                </div>
              </div>

              <div className="py-8 border-b border-walnut/10">
                <h3 className="font-semibold text-ink text-lg">5. Anything else?</h3>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="form-input mt-4 w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light resize-none" placeholder="Special requirements, dietary needs, preferred room locations..." />
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
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required className="mt-1 accent-walnut" />
                  <label className="text-sm text-stone">I agree to Gomodi Guest Lodge collecting my details to respond to this quote request, in line with POPIA. *</label>
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" disabled={status === "submitting"} className="w-full btn-primary px-6 py-3 rounded-lg font-semibold text-base disabled:opacity-60">
                  {status === "submitting" ? "Sending…" : "Submit Quote Request"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-cream">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center motion-fade-up motion-ready">
            <span className="pill pill-corporate">Common Questions</span>
            <h2 className="font-semibold text-ink text-2xl md:text-3xl mt-4">Before you request.</h2>
          </div>
          <div className="mt-10 bg-white rounded-2xl border border-walnut/10 card-shadow overflow-hidden motion-fade-up motion-ready">
            {FAQS.map((f, i) => (
              <div key={f.q} className={`faq-item px-6 py-5 ${openFaq === i ? "open" : ""}`}>
                <button className="flex items-center justify-between w-full text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-semibold text-ink">{f.q}</span>
                  <svg className="faq-chevron flex-shrink-0 ml-4 text-walnut" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6"/></svg>
                </button>
                <div className="faq-answer text-stone text-sm">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="py-16 md:py-20 bg-walnut text-cream-light">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center motion-fade-up motion-ready">
            <div>
              <span className="pill" style={{ background: "rgba(245,235,221,0.15)", color: "#FAF6F0" }}>Prefer to talk it through?</span>
              <h2 className="font-semibold text-2xl md:text-3xl mt-4">We&apos;re a message or call away.</h2>
              <p className="text-cream/80 mt-4">Reach us by WhatsApp, phone, or email — whichever suits your process.</p>
            </div>
            <div className="flex flex-col gap-3">
              <a href="#" className="inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1EBE5B] text-white px-6 py-3 rounded-lg font-semibold transition-colors">WhatsApp</a>
              <a href="mailto:corporate@gomodiguestlodge.co.za" className="inline-flex items-center justify-center gap-3 bg-cream-light text-walnut hover:bg-white px-6 py-3 rounded-lg font-semibold transition-colors">corporate@gomodiguestlodge.co.za</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
