"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { submitEventInquiry } from "./actions";
import { EVENT_CATERING } from "@/lib/pricing";

const CATERING_OPTIONS = [
  { id: "tea-snacks", label: "Tea & Snacks", price: `R${EVENT_CATERING["tea-snacks"]} pp` },
  { id: "three-course", label: "Three-Course Meal", price: `R${EVENT_CATERING["three-course"]} pp` },
  { id: "full-day", label: "Full-Day Package", price: `R${EVENT_CATERING["full-day"]} pp` },
];

export default function EventInquiryForm() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventType, setEventType] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [altDate, setAltDate] = useState("");
  const [catering, setCatering] = useState("");
  const [interestedInRooms, setInterestedInRooms] = useState(false);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setStatus("error");
      setErrorMessage("Please confirm your consent to continue.");
      return;
    }
    setStatus("submitting");
    setErrorMessage(null);
    const result = await submitEventInquiry({
      fullName, phone, email, eventType,
      guestCount: Number(guestCount), eventDate, altDate,
      catering, interestedInRooms, notes,
    });
    if (result.ok) setStatus("success");
    else { setStatus("error"); setErrorMessage(result.error); }
  }

  return (
    <section id="inquiry-form" className="py-16 md:py-24 bg-cream-light">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center motion-fade-up motion-ready">
          <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">Tell us about your event.</h2>
          <p className="text-stone mt-3 text-base">
            All inquiries are handled by <span className="font-semibold text-gold-dark">Lelz Business Enterprise</span>. We&apos;ll respond within one business day.
          </p>
          <p className="text-stone text-sm mt-2">
            Events and catering at Gomodi Guest Lodge are proudly delivered in partnership with Lelz Business Enterprise.
          </p>
        </div>

        {status === "success" ? (
          <div className="mt-10 bg-white rounded-2xl border border-walnut/10 card-shadow p-10 text-center">
            <div className="motion-pop" data-stagger="1">
              <div className="w-16 h-16 rounded-full bg-gold-tint flex items-center justify-center mb-5 mx-auto shadow-lg shadow-gold/20">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8f6a3e" strokeWidth={2.5}><path d="M20 6L9 17l-5-5"/></svg>
              </div>
            </div>
            <h3 className="font-semibold text-ink text-xl mb-2 motion-pop" data-stagger="2">Inquiry received.</h3>
            <p className="text-stone text-sm leading-relaxed max-w-2xl mx-auto motion-pop" data-stagger="3">
              Thanks — we&apos;ve received your inquiry. We&apos;ll check availability for <span className="font-medium text-ink">{new Date(eventDate).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</span> and reply within one business day with options and pricing.
            </p>
            <div className="mt-4 motion-pop" data-stagger="4">
              <p className="text-stone text-sm">
                Managed by <span className="font-semibold text-gold-dark">Lelz Business Enterprise</span>
              </p>
            </div>
            <div className="mt-8 motion-pop" data-stagger="5">
              <Link href="/" className="inline-block btn-primary px-6 py-3 rounded-lg font-semibold btn-press ripple">Back to Home</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 bg-white rounded-2xl border border-walnut/10 card-shadow p-6 md:p-10 motion-fade-up motion-ready">
            {status === "error" && errorMessage && (
              <div className="mb-6 rounded-xl border border-terracotta bg-terracotta-tint p-4 text-sm text-terracotta-dark">{errorMessage}</div>
            )}

            <div className="pb-8 border-b border-walnut/10">
              <h3 className="font-semibold text-ink text-lg">Your details</h3>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-sm font-medium text-ink mb-1.5">Full name *</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                <div><label className="block text-sm font-medium text-ink mb-1.5">Phone / WhatsApp *</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} required className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-ink mb-1.5">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
              </div>
            </div>

            <div className="py-8 border-b border-walnut/10">
              <h3 className="font-semibold text-ink text-lg">Event details</h3>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Event type *</label>
                  <select value={eventType} onChange={(e) => setEventType(e.target.value)} required className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light">
                    <option value="">Select an event type</option>
                    <option value="wedding">Wedding</option>
                    <option value="baby-shower">Baby shower</option>
                    <option value="birthday">Birthday party</option>
                    <option value="graduation">Graduation</option>
                    <option value="anniversary">Anniversary</option>
                    <option value="family-gathering">Family gathering</option>
                    <option value="private-function">Private function</option>
                    <option value="catering-only">Catering only</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-ink mb-1.5">Expected guests *</label>
                  <input type="number" min={1} max={50} value={guestCount} onChange={(e) => setGuestCount(e.target.value)} required className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                <div><label className="block text-sm font-medium text-ink mb-1.5">Preferred date *</label>
                  <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
                <div><label className="block text-sm font-medium text-ink mb-1.5">Alternative date (optional)</label>
                  <input type="date" value={altDate} onChange={(e) => setAltDate(e.target.value)} className="form-input w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light" /></div>
              </div>
            </div>

            <div className="py-8 border-b border-walnut/10">
              <h3 className="font-semibold text-ink text-lg">Catering preference</h3>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                {CATERING_OPTIONS.map((c) => (
                  <label key={c.id} className={`catering-card cursor-pointer bg-cream-light rounded-xl p-4 border border-walnut/10 ${catering === c.id ? "selected" : ""}`}>
                    <input type="radio" name="catering" value={c.id} checked={catering === c.id} onChange={(e) => setCatering(e.target.value)} className="sr-only" />
                    <div className="flex items-start justify-between">
                      <div><div className="font-semibold text-ink text-sm">{c.label}</div><div className="text-stone text-xs mt-0.5">{c.price}</div></div>
                      <div className="w-4 h-4 rounded-full border-2 border-walnut/30 flex items-center justify-center">
                        {catering === c.id && <div className="w-2 h-2 rounded-full bg-gold-dark" />}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <label className="mt-3 flex items-center gap-2 cursor-pointer">
                <input type="radio" name="catering" checked={catering === "venue-only"} onChange={() => setCatering("venue-only")} className="accent-gold" />
                <span className="text-sm text-ink">Venue only — I&apos;ll arrange my own catering</span>
              </label>
              <label className="mt-2 flex items-center gap-2 cursor-pointer">
                <input type="radio" name="catering" checked={catering === "not-sure"} onChange={() => setCatering("not-sure")} className="accent-gold" />
                <span className="text-sm text-ink">Not sure yet — help me decide</span>
              </label>
            </div>

            <div className="py-8 border-b border-walnut/10">
              <h3 className="font-semibold text-ink text-lg">Anything else?</h3>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="form-input mt-4 w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light resize-none" placeholder="Special requirements, themes, or questions..." />
              <div className="mt-5 flex items-start gap-3">
                <input id="interestedInRooms" type="checkbox" checked={interestedInRooms} onChange={(e) => setInterestedInRooms(e.target.checked)} className="mt-1 accent-gold" />
                <label htmlFor="interestedInRooms" className="text-sm text-ink cursor-pointer">
                  I&apos;m also interested in booking rooms for my guests. <Link href="/rooms" className="text-gold-dark font-semibold underline">See rooms →</Link>
                </label>
              </div>
            </div>

            <div className="py-6 border-b border-walnut/10">
              <div className="flex items-start gap-3">
                <input id="eventsConsent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required className="mt-1 accent-gold" />
                <label htmlFor="eventsConsent" className="text-sm text-stone">I agree to Gomodi Guest Lodge collecting my details to respond to this inquiry, in line with POPIA. *</label>
              </div>
            </div>

            <div className="pt-6">
              <button type="submit" disabled={status === "submitting"} className="w-full btn-gold px-6 py-3 rounded-lg font-semibold text-base disabled:opacity-60 shadow-sm shadow-gold-dark/20 hover:shadow-md hover:shadow-gold-dark/30 transition-all btn-press ripple">
                {status === "submitting" ? "Sending..." : "Submit Inquiry"}
              </button>
              <p className="text-center text-stone text-xs mt-3">
                Managed by <span className="font-semibold text-gold-dark">Lelz Business Enterprise</span>
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}