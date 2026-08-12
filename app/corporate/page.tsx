import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import HeroSlideshow from "@/components/HeroSlideshow";

const CorporateQuoteForm = dynamic(
  () => import("./CorporateQuoteForm"),
  {
    loading: () => (
      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center">
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">
              Loading form…
            </h2>
            <div className="mt-10 bg-white rounded-2xl border border-walnut/10 card-shadow p-6 md:p-10 space-y-6">
              <div className="h-10 bg-walnut/5 rounded-lg animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-12 bg-walnut/5 rounded-lg animate-pulse" />
                <div className="h-12 bg-walnut/5 rounded-lg animate-pulse" />
                <div className="h-12 bg-walnut/5 rounded-lg animate-pulse" />
                <div className="h-12 bg-walnut/5 rounded-lg animate-pulse" />
              </div>
              <div className="h-32 bg-walnut/5 rounded-lg animate-pulse" />
              <div className="h-12 bg-walnut/5 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    ),
  }
);

const clientSegments = [
  {
    title: "Contractor Deployments",
    text: "Week-long or month-long stays for project teams. Multi-room bookings, consolidated invoicing, and reliable WiFi.",
    items: ["Multi-room, multi-night in one quote", "Weekly/monthly rates on request", "Secure on-site parking"],
  },
  {
    title: "Government Officials",
    text: "Rotations, inspections, and official visits — with formal quotations, PO references, and VAT-compliant invoices.",
    items: ["PO numbers captured upfront", "Formal quotation before commitment", "VAT-compliant invoicing"],
  },
  {
    title: "Group & Team Stays",
    text: "Training groups, audit teams, or project kick-offs — book multiple rooms in a single submission.",
    items: ["Up to 9 rooms in one booking", "Flexible twin/double configuration", "Group rates on request"],
  },
];

const docSteps = [
  ["1. Formal Quotation", "Itemised by room, night, and add-on. References your PO number if provided."],
  ["2. Written Confirmation", "Once you approve the quote, a formal confirmation is issued by email."],
  ["3. VAT-Compliant Invoice", "Issued after stay, suitable for EFT payment against your PO."],
  ["4. Consolidated Statement", "For repeat clients — multiple invoices grouped into a single statement."],
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
  return (
    <main className="page-transition">
      <nav className="max-w-6xl mx-auto px-6 py-4 text-sm text-stone" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/" className="hover:text-terracotta-dark inline-block py-2">Home</Link></li>
          <li className="text-walnut/40">/</li>
          <li className="text-ink font-medium">Corporate &amp; Government</li>
        </ol>
      </nav>

      {/* HERO */}
      <section className="relative">
        <div className="hero-outer relative h-[55vh] min-h-[min(520px,calc(100svh_-_var(--header-h)))] max-h-[560px] overflow-hidden parallax-container">
          <HeroSlideshow
            images={[
              { src: "/images/rooms/room1-view1.jpeg", alt: "Guest room — bed view" },
              { src: "/images/rooms/room1-view2.jpeg", alt: "Guest room — seating area" },
              { src: "/images/rooms/room1-view3.jpeg", alt: "Guest room — another view" },
              { src: "/images/rooms/room1.jpeg", alt: "Gomodi Guest Lodge guest room" },
            ]}
            interval={5500}
            className="absolute inset-0"
          />
          <div className="hero-content relative z-10 h-full max-w-6xl mx-auto px-6 flex flex-col justify-end pb-12 md:pb-16">
            <h1 className="font-display text-cream-light font-semibold text-3xl md:text-5xl leading-tight max-w-3xl motion-fade-up motion-ready" data-stagger="1">
              Corporate accommodation, with the paperwork handled.
            </h1>
            <p className="text-cream/90 mt-4 max-w-xl text-base md:text-lg motion-fade-up motion-ready" data-stagger="2">
              Contractor deployments, government rotations, and multi-room group stays. Send one form and we&apos;ll issue the formal quotations, invoices, and consolidated statements your finance team needs.
            </p>
            <div className="hero-cta mt-8 flex flex-col sm:flex-row gap-3 motion-fade-up motion-ready" data-stagger="3">
              <a href="#quote-form" className="px-6 py-3 rounded-lg font-semibold text-base inline-flex items-center justify-center gap-2 bg-cream-light text-walnut hover:bg-white transition-all shadow-lg shadow-ink/10 hover:shadow-xl btn-press">
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
            <h2 className="font-display text-ink font-semibold text-2xl md:text-3xl">The clients we host.</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {clientSegments.map((s, i) => (
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
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">From quotation to invoice, in order.</h2>
            <p className="text-stone mt-4 leading-relaxed">
              Every document, from the first quote to the final consolidated statement, is issued by email and ready for your approval and payment process.
            </p>
            <div className="mt-6 space-y-3">
              {docSteps.map(([title, text], i) => (
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

      {/* QUOTE FORM — lazy-loaded */}
      <CorporateQuoteForm />

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-cream">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center motion-fade-up motion-ready">
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">Before you request.</h2>
          </div>
          <div className="mt-10 bg-white rounded-2xl border border-walnut/10 card-shadow overflow-hidden motion-fade-up motion-ready">
            {FAQS.map((f, i) => (
              <div key={f.q} className={`faq-item px-6 py-5`}>
                <details className="group">
                  <summary className="flex items-center justify-between w-full text-left cursor-pointer list-none">
                    <span className="font-semibold text-ink">{f.q}</span>
                    <svg className="faq-chevron flex-shrink-0 ml-4 text-walnut group-open:rotate-180 transition-transform" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6"/></svg>
                  </summary>
                  <p className="text-stone text-sm mt-3">{f.a}</p>
                </details>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="relative py-16 md:py-20 bg-walnut text-cream-light overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center motion-fade-up motion-ready">
            <div>
              <h2 className="font-display font-semibold text-2xl md:text-3xl">Get in touch.</h2>
              <p className="text-cream/80 mt-4">WhatsApp, phone, or email — whichever suits you.</p>
            </div>
            <div className="flex flex-col gap-3">
              <a href="https://wa.me/27780784139" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1EBE5B] text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-[#25D366]/20 hover:shadow-xl hover:shadow-[#25D366]/30 btn-press">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                WhatsApp
              </a>
              <a href="mailto:corporate@gomodiguestlodge.co.za" className="inline-flex items-center justify-center gap-3 bg-cream-light text-walnut hover:bg-white px-6 py-3 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md btn-press">corporate@gomodiguestlodge.co.za</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}