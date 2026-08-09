"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import HeroSlideshow from "@/components/HeroSlideshow";
import { submitEventInquiry } from "./actions";

const CATERING_OPTIONS = [
  { id: "tea-snacks", label: "Tea & Snacks", price: "R150 pp" },
  { id: "three-course", label: "Three-Course Meal", price: "R250 pp" },
  { id: "full-day", label: "Full-Day Package", price: "R350 pp" },
];

const EVENT_TYPES = [
  {
    title: "Weddings",
    text: "Intimate ceremonies and receptions for up to 50 guests, with on-site accommodation for the wedding party.",
    image: "/images/events/birthday-party.jpeg",
    alt: "Wedding celebration setup",
  },
  {
    title: "Baby Showers",
    text: "Set up for your celebration, with catering and décor coordination available.",
    image: "/images/events/baby-shower.jpeg",
    alt: "Baby shower celebration",
  },
  {
    title: "Birthday Parties",
    text: "Flexible layouts for seated dinners or cocktail-style celebrations.",
    image: "/images/events/birthday-party.jpeg",
    alt: "Birthday party setup",
  },
  {
    title: "Graduations",
    text: "Celebrate your achievement with family and friends in our elegant venue.",
    image: "/images/events/graduation.jpeg",
    alt: "Graduation celebration",
  },
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
          <li><Link href="/" className="hover:text-terracotta-dark inline-block py-2">Home</Link></li>
          <li className="text-walnut/40">/</li>
          <li className="text-ink font-medium">Events &amp; Functions</li>
        </ol>
      </nav>

      {/* HERO */}
      <section className="relative">
        <div className="hero-outer relative h-[55vh] min-h-[min(520px,calc(100svh_-_var(--header-h)))] max-h-[560px] overflow-hidden parallax-container">
          <HeroSlideshow
            images={[
              { src: "/images/events/graduation.jpeg", alt: "Graduation celebration" },
              { src: "/images/events/birthday-party.jpeg", alt: "Birthday party setup" },
              { src: "/images/events/baby-shower.jpeg", alt: "Baby shower celebration" },
            ]}
            interval={5500}
            className="absolute inset-0"
          />
          <div className="hero-content relative z-10 h-full max-w-6xl mx-auto px-6 flex flex-col justify-end pb-12 md:pb-16">
            <h1 className="font-display text-cream-light font-semibold text-3xl md:text-5xl leading-tight max-w-3xl motion-fade-up motion-ready" data-stagger="1">Host your event here.</h1>
            <p className="text-cream/90 mt-4 max-w-xl text-base md:text-lg motion-fade-up motion-ready" data-stagger="2">
              Weddings, baby showers, birthday parties and private functions — for up to 50 guests, with confirmed catering and on-site accommodation.
            </p>
            <div className="hero-cta mt-8 flex flex-col sm:flex-row gap-3 motion-fade-up motion-ready" data-stagger="3">
              <a href="#inquiry-form" className="btn-gold px-6 py-3 rounded-lg font-semibold text-base inline-flex items-center justify-center gap-2 shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30 btn-press">Inquire About Your Event</a>
              <a href="#catering" className="px-6 py-3 rounded-lg font-semibold text-base border border-cream-light/40 text-cream-light hover:bg-cream-light/10 inline-flex items-center justify-center backdrop-blur-sm btn-press">View Catering Packages</a>
            </div>
          </div>
        </div>
      </section>

      {/* LeLz Events Branding */}
      <section className="py-8 bg-cream border-b border-walnut/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gold-tint flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/logos/lelz-logo.jpeg"
                  alt="LeLz Events logo"
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-ink font-semibold text-sm">Events managed by</p>
                <p className="text-gold-dark font-semibold text-base">LeLz Events</p>
              </div>
            </div>
            <div className="h-8 w-px bg-walnut/20 hidden md:block" />
            <div className="flex items-center gap-4 text-sm text-stone">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gold-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +27 XX XXX XXXX
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gold-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                events@lelz.co.za
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE HOST */}
      <section className="py-16 md:py-24 bg-cream-light">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto motion-fade-up motion-ready">
            <h2 className="font-display text-ink font-semibold text-2xl md:text-3xl">Events we host.</h2>
            <p className="text-stone mt-4 text-base">
              From intimate baby showers to milestone birthday celebrations — we help you create unforgettable moments.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {EVENT_TYPES.map((event, i) => (
              <article key={event.title} className="event-type-card card-shadow bg-white rounded-2xl overflow-hidden border border-walnut/10 motion-scale-in motion-ready card-lift" data-stagger={i + 1}>
                <div className="aspect-[4/3] overflow-hidden image-zoom relative">
                  <Image
                    src={event.image}
                    alt={event.alt}
                    fill
                    className="object-cover transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/30 to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-ink">{event.title}</h3>
                  <p className="text-stone text-sm mt-2">{event.text}</p>
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
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">A flexible space for your event.</h2>
            <p className="text-stone mt-4 leading-relaxed">Seated dinners, cocktail setups, buffet layouts, or an open floor for dancing.</p>
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
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">Confirmed pricing.</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-8 border border-walnut/10 card-shadow motion-scale-in motion-ready card-lift" data-stagger="1">
              <div className="text-gold-dark text-xs uppercase tracking-wider font-semibold">Light</div>
              <h3 className="font-semibold text-ink text-lg mt-2">Tea &amp; Snacks</h3>
              <div className="text-terracotta-dark font-semibold text-2xl mt-3">R150 <span className="text-stone text-sm font-normal">pp</span></div>
              <ul className="mt-5 space-y-2 text-sm text-ink">
                <li className="flex items-start gap-2"><span className="text-gold-dark mt-0.5">✓</span> Tea, coffee, and soft drinks</li>
                <li className="flex items-start gap-2"><span className="text-gold-dark mt-0.5">✓</span> Assorted savouries and pastries</li>
                <li className="flex items-start gap-2"><span className="text-gold-dark mt-0.5">✓</span> Ideal for showers &amp; daytime events</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 border-2 border-gold-dark card-shadow relative motion-scale-in motion-ready card-lift" data-stagger="2">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-dark text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</div>
              <div className="text-gold-dark text-xs uppercase tracking-wider font-semibold">Full</div>
              <h3 className="font-semibold text-ink text-lg mt-2">Three-Course Meal</h3>
              <div className="text-terracotta-dark font-semibold text-2xl mt-3">R250 <span className="text-stone text-sm font-normal">pp</span></div>
              <ul className="mt-5 space-y-2 text-sm text-ink">
                <li className="flex items-start gap-2"><span className="text-gold-dark mt-0.5">✓</span> Starter, main, and dessert</li>
                <li className="flex items-start gap-2"><span className="text-gold-dark mt-0.5">✓</span> Soft drinks, water, tea &amp; coffee</li>
                <li className="flex items-start gap-2"><span className="text-gold-dark mt-0.5">✓</span> Ideal for dinners &amp; receptions</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-walnut/10 card-shadow motion-scale-in motion-ready card-lift" data-stagger="3">
              <div className="text-gold-dark text-xs uppercase tracking-wider font-semibold">Premium</div>
              <h3 className="font-semibold text-ink text-lg mt-2">Full-Day Package</h3>
              <div className="text-terracotta-dark font-semibold text-2xl mt-3">R350 <span className="text-stone text-sm font-normal">pp</span></div>
              <ul className="mt-5 space-y-2 text-sm text-ink">
                <li className="flex items-start gap-2"><span className="text-gold-dark mt-0.5">✓</span> Morning tea, lunch, and dinner</li>
                <li className="flex items-start gap-2"><span className="text-gold-dark mt-0.5">✓</span> Full beverage service</li>
                <li className="flex items-start gap-2"><span className="text-gold-dark mt-0.5">✓</span> Ideal for weddings &amp; full-day events</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 bg-gold-tint border border-gold/30 rounded-2xl p-6 md:p-8 motion-fade-up motion-ready">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-gold-dark flex items-center justify-center text-white flex-shrink-0">
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
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">Tell us about your event.</h2>
            <p className="text-stone mt-3 text-base">
              All inquiries are handled by <span className="font-semibold text-gold-dark">LeLz Events</span>. We&apos;ll respond within one business day.
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
                  Managed by <span className="font-semibold text-gold-dark">LeLz Events</span>
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
                <button type="submit" disabled={status === "submitting"} className="w-full btn-gold px-6 py-3 rounded-lg font-semibold text-base disabled:opacity-60 shadow-sm shadow-gold-dark/20 hover:shadow-md hover:shadow-gold-dark/30 transition-all btn-press ripple">
                  {status === "submitting" ? "Sending..." : "Submit Inquiry"}
                </button>
                <p className="text-center text-stone text-xs mt-3">
                  Managed by <span className="font-semibold text-gold-dark">LeLz Events</span>
                </p>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-cream">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center motion-fade-up motion-ready">
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">Good to know.</h2>
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
      <section className="relative py-16 md:py-20 bg-walnut text-cream-light overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative max-w-4xl mx-auto px-6 text-center motion-fade-up motion-ready">
          <h2 className="font-display font-semibold text-2xl md:text-3xl">Message us on WhatsApp.</h2>
          <p className="text-cream/80 mt-4 max-w-xl mx-auto">
            Chat directly with LeLz Events for bookings, availability, and custom packages.
          </p>
          <a href="#" className="mt-8 inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#1EBE5B] text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-[#25D366]/20 hover:shadow-xl hover:shadow-[#25D366]/30 btn-press ripple">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            Chat on WhatsApp
          </a>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-cream/70">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              +27 XX XXX XXXX
            </span>
            <span>·</span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              events@lelz.co.za
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}