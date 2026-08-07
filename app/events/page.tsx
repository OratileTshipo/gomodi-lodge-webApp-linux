"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { submitEventInquiry } from "./actions";

const CATERING_OPTIONS = [
  { id: "tea-snacks", label: "Tea & Snacks", price: "R150 pp" },
  { id: "three-course", label: "Three-Course Meal", price: "R250 pp" },
  { id: "full-day", label: "Full-Day Package", price: "R350 pp" },
];

const FAQS = [
  { q: "How many guests can the venue hold?", a: "Up to 50 guests for seated events, and slightly more for cocktail-style setups." },
  { q: "Can I bring my own caterer or décor?", a: "Yes — external caterers and décor teams are welcome. Let us know in your enquiry so we can coordinate arrival times." },
  { q: "Is there parking for guests?", a: "Yes, secure on-site parking is available for all guests at no extra charge." },
  { q: "Can guests stay over after the event?", a: "Absolutely. We have 9 rooms on-site and can arrange group rates for your guests." },
  { q: "How far in advance should I book?", a: "For weddings and large events, 3–6 months is ideal. For smaller functions, 4–8 weeks usually works." },
  { q: "What's the cancellation policy?", a: "Our standard cancellation and deposit terms will be included in your written quote." },
];

export default function EventsPage() {
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
    <main className="page-transition">
      <nav className="max-w-6xl mx-auto px-6 py-4 text-sm text-stone" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/" className="hover:text-terracotta">Home</Link></li>
          <li className="text-walnut/40">/</li>
          <li className="text-ink font-medium">Events &amp; Functions</li>
        </ol>
      </nav>

      {/* HERO */}
      <section className="relative">
        <div className="hero-outer relative h-[55vh] min-h-[min(520px,calc(100svh_-_var(--header-h)))] max-h-[560px] overflow-hidden parallax-container">
          <div className="absolute inset-0 motion-zoom-out motion-ready">
            <PhotoPlaceholder label="Event space set for a wedding" tone="gold" className="absolute inset-0" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-ink/40 to-ink/75" />
          <div className="hero-content relative z-10 h-full max-w-6xl mx-auto px-6 flex flex-col justify-end pb-12 md:pb-16">
            <span className="pill pill-event self-start mb-4 motion-fade-up motion-ready" data-stagger="1">Events &amp; Functions</span>
            <h1 className="text-cream-light font-semibold text-3xl md:text-5xl leading-tight max-w-3xl motion-fade-up motion-ready" data-stagger="2">Host your moment here.</h1>
            <p className="text-cream/90 mt-4 max-w-xl text-base md:text-lg motion-fade-up motion-ready" data-stagger="3">
              Weddings, baby showers, birthday parties and private functions — for up to 50 guests, with confirmed catering and on-site accommodation.
            </p>
            <div className="hero-cta mt-8 flex flex-col sm:flex-row gap-3 motion-fade-up motion-ready" data-stagger="4">
              <a href="#inquiry-form" className="btn-gold px-6 py-3 rounded-lg font-semibold text-base inline-flex items-center justify-center gap-2">Inquire About Your Event</a>
              <a href="#catering" className="px-6 py-3 rounded-lg font-semibold text-base border border-cream-light/40 text-cream-light hover:bg-cream-light/10 inline-flex items-center justify-center">View Catering Packages</a>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE HOST */}
      <section className="py-16 md:py-24 bg-cream-light">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto motion-fade-up motion-ready">
            <span className="pill pill-event">What We Host</span>
            <h2 className="text-ink font-semibold text-2xl md:text-3xl mt-4">Your event, your way.</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              ["Weddings", "Intimate ceremonies and receptions for up to 50 guests, with on-site accommodation for the wedding party."],
              ["Baby Showers", "Warm, beautifully set spaces for your celebration — catering and décor coordination available."],
              ["Birthday Parties", "Milestones deserve a proper setting. Flexible layouts for seated dinners or cocktail-style celebrations."],
              ["Private Functions", "Anniversaries, family gatherings, reunions — any occasion worth celebrating."],
            ].map(([title, text], i) => (
              <article key={title} className="event-type-card card-shadow bg-white rounded-2xl overflow-hidden border border-walnut/10 motion-scale-in motion-ready interactive-element card-lift" data-stagger={i + 1}>
                <div className="aspect-[4/3] overflow-hidden"><PhotoPlaceholder label={title} tone="gold" /></div>
                <div className="p-5">
                  <h3 className="font-semibold text-ink">{title}</h3>
                  <p className="text-stone text-sm mt-2">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* VENUE DETAILS */}
      <section className="py-16 md:py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="motion-fade-left motion-ready">
            <span className="pill pill-event">The Venue</span>
            <h2 className="font-semibold text-ink text-2xl md:text-3xl mt-4">A space that works for your guests.</h2>
            <p className="text-stone mt-4 leading-relaxed">Our multipurpose function space flexes with your event — seated dinners, cocktail setups, buffet layouts, or open floor for dancing.</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {[["50", "Max Guests"], ["Flexible", "Layout Options"], ["9", "Rooms for Guests"], ["On-site", "Secure Parking"]].map(([n, l], i) => (
                <div key={l} className="bg-white rounded-xl p-4 border border-walnut/10 motion-scale-in motion-ready interactive-element" data-stagger={i + 1}>
                  <div className="text-gold-dark font-semibold text-2xl">{n}</div>
                  <div className="text-stone text-xs uppercase tracking-wide mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="motion-fade-right motion-ready image-zoom">
            <div className="rounded-2xl overflow-hidden card-shadow aspect-[4/3]"><PhotoPlaceholder label="Function space interior" tone="gold" /></div>
          </div>
        </div>
      </section>

      {/* CATERING PACKAGES */}
      <section id="catering" className="py-16 md:py-24 bg-cream-light">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto motion-fade-up motion-ready">
            <span className="pill pill-event">Catering Packages</span>
            <h2 className="font-semibold text-ink text-2xl md:text-3xl mt-4">Confirmed pricing. No surprises.</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-8 border border-walnut/10 card-shadow motion-scale-in motion-ready card-lift" data-stagger="1">
              <div className="text-gold-dark text-xs uppercase tracking-wider font-semibold">Light</div>
              <h3 className="font-semibold text-ink text-lg mt-2">Tea &amp; Snacks</h3>
              <div className="text-terracotta font-semibold text-2xl mt-3">R150 <span className="text-stone text-sm font-normal">pp</span></div>
              <ul className="mt-5 space-y-2 text-sm text-ink">
                <li className="flex items-start gap-2"><span className="text-gold mt-0.5">✓</span> Tea, coffee, and soft drinks</li>
                <li className="flex items-start gap-2"><span className="text-gold mt-0.5">✓</span> Assorted savouries and pastries</li>
                <li className="flex items-start gap-2"><span className="text-gold mt-0.5">✓</span> Ideal for showers &amp; daytime events</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 border-2 border-gold card-shadow relative motion-scale-in motion-ready card-lift" data-stagger="2">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 pill pill-event">Most Popular</span>
              <div className="text-gold-dark text-xs uppercase tracking-wider font-semibold">Full</div>
              <h3 className="font-semibold text-ink text-lg mt-2">Three-Course Meal</h3>
              <div className="text-terracotta font-semibold text-2xl mt-3">R250 <span className="text-stone text-sm font-normal">pp</span></div>
              <ul className="mt-5 space-y-2 text-sm text-ink">
                <li className="flex items-start gap-2"><span className="text-gold mt-0.5">✓</span> Starter, main, and dessert</li>
                <li className="flex items-start gap-2"><span className="text-gold mt-0.5">✓</span> Soft drinks, water, tea &amp; coffee</li>
                <li className="flex items-start gap-2"><span className="text-gold mt-0.5">✓</span> Ideal for dinners &amp; receptions</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-walnut/10 card-shadow motion-scale-in motion-ready card-lift" data-stagger="3">
              <div className="text-gold-dark text-xs uppercase tracking-wider font-semibold">Premium</div>
              <h3 className="font-semibold text-ink text-lg mt-2">Full-Day Package</h3>
              <div className="text-terracotta font-semibold text-2xl mt-3">R350 <span className="text-stone text-sm font-normal">pp</span></div>
              <ul className="mt-5 space-y-2 text-sm text-ink">
                <li className="flex items-start gap-2"><span className="text-gold mt-0.5">✓</span> Morning tea, lunch, and dinner</li>
                <li className="flex items-start gap-2"><span className="text-gold mt-0.5">✓</span> Full beverage service</li>
                <li className="flex items-start gap-2"><span className="text-gold mt-0.5">✓</span> Ideal for weddings &amp; full-day events</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 bg-gold-tint border border-gold/30 rounded-2xl p-6 md:p-8 motion-fade-up motion-ready">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-gold flex items-center justify-center text-white flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              </div>
              <div>
                <h3 className="font-semibold text-ink">Day-use of the venue only?</h3>
                <p className="text-stone text-sm mt-1">Pricing is available on request while final touches to the venue are completed. <a href="#inquiry-form" className="text-gold-dark font-semibold underline">Ask us here</a>.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INQUIRY FORM */}
      <section id="inquiry-form" className="py-16 md:py-24 bg-cream-light">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center motion-fade-up motion-ready">
            <span className="pill pill-event">Inquire</span>
            <h2 className="font-semibold text-ink text-2xl md:text-3xl mt-4">Tell us about your event.</h2>
          </div>

          {status === "success" ? (
            <div className="mt-10 bg-white rounded-2xl border border-walnut/10 card-shadow p-10 text-center motion-pop">
              <div className="w-14 h-14 rounded-full bg-gold-tint flex items-center justify-center mb-4 mx-auto">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b8860b" strokeWidth={2.5}><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <h3 className="font-semibold text-ink text-xl mb-2">Inquiry received!</h3>
              <p className="text-stone text-sm leading-relaxed max-w-2xl mx-auto">
                Thank you for considering Gomodi Guest Lodge for your <span className="font-medium text-ink capitalize">{eventType.replace("-", " ")}</span>. 
                We&apos;ll check venue availability for <span className="font-medium text-ink">{new Date(eventDate).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</span> and reply within one business day with a tailored package.
              </p>
              <Link href="/" className="mt-6 inline-block border border-walnut/20 text-ink hover:bg-cream-light px-5 py-2.5 rounded-lg font-semibold transition-colors interactive-element">Back to Home</Link>
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
                      <option value="anniversary">Anniversary</option>
                      <option value="family-gathering">Family gathering</option>
                      <option value="private-function">Private function</option>
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
                          {catering === c.id && <div className="w-2 h-2 rounded-full bg-gold" />}
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
                  <input type="checkbox" checked={interestedInRooms} onChange={(e) => setInterestedInRooms(e.target.checked)} className="mt-1 accent-gold" />
                  <label className="text-sm text-ink cursor-pointer">
                    I&apos;m also interested in booking rooms for my guests. <Link href="/rooms" className="text-gold-dark font-semibold underline">See rooms →</Link>
                  </label>
                </div>
              </div>

              <div className="py-6 border-b border-walnut/10">
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required className="mt-1 accent-gold" />
                  <label className="text-sm text-stone">I agree to Gomodi Guest Lodge collecting my details to respond to this inquiry, in line with POPIA. *</label>
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" disabled={status === "submitting"} className="w-full btn-gold px-6 py-3 rounded-lg font-semibold text-base disabled:opacity-60">
                  {status === "submitting" ? "Sending…" : "Submit Inquiry"}
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
            <span className="pill pill-event">Common Questions</span>
            <h2 className="font-semibold text-ink text-2xl md:text-3xl mt-4">Before you ask.</h2>
          </div>
          <div className="mt-10 bg-white rounded-2xl border border-walnut/10 card-shadow overflow-hidden motion-fade-up motion-ready">
            {FAQS.map((f, i) => (
              <div key={f.q} className={`faq-item px-6 py-5 ${openFaq === i ? "open" : ""}`}>
                <button className="flex items-center justify-between w-full text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-semibold text-ink">{f.q}</span>
                  <svg className="faq-chevron flex-shrink-0 ml-4 text-gold-dark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6"/></svg>
                </button>
                <div className="faq-answer text-stone text-sm">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHATSAPP CTA */}
      <section className="py-16 md:py-20 bg-walnut text-cream-light">
        <div className="max-w-4xl mx-auto px-6 text-center motion-fade-up motion-ready">
          <span className="pill" style={{ background: "rgba(245,235,221,0.15)", color: "#FAF6F0" }}>Prefer to chat?</span>
          <h2 className="font-semibold text-2xl md:text-3xl mt-4">Message us on WhatsApp.</h2>
          <a href="#" className="mt-8 inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#1EBE5B] text-white px-6 py-3 rounded-lg font-semibold transition-colors">Chat on WhatsApp</a>
        </div>
      </section>
    </main>
  );
}
