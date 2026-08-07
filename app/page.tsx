import Link from "next/link";
import { db } from "@/lib/db";
import { rooms } from "@/lib/db/schema";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { BookNowHeroButtonClient } from "@/components/BookNowHeroButtonClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Real sample rooms for the "Rooms Preview" teaser (3 of the 9), replacing
  // the original design's fictional room-type pricing with our actual flat-rate data.
  const previewRooms = await db
    .select()
    .from(rooms)
    .orderBy(rooms.id)
    .limit(3);

  return (
    <main className="page-transition">
      {/* HERO */}
      <section className="relative">
        <div className="hero-outer relative h-[70vh] min-h-[min(520px,calc(100svh_-_var(--header-h)))] max-h-[720px] overflow-hidden parallax-container">
          <div className="absolute inset-0 motion-zoom-out motion-ready">
            <PhotoPlaceholder label="Gomodi Guest Lodge exterior at golden hour" className="absolute inset-0" />
          </div>
          <div className="absolute inset-0 hero-gradient" />
          <div className="hero-content relative z-10 h-full max-w-6xl mx-auto px-6 flex flex-col justify-end pb-12 md:pb-16">
            <span className="pill pill-leisure self-start mb-4 motion-fade-up motion-ready" data-stagger="1">Now Open · Post-Renovation</span>
            <h1 className="font-display text-cream-light font-semibold text-3xl md:text-5xl leading-tight max-w-2xl motion-fade-up motion-ready" data-stagger="2">
              Welcome to Gomodi Guest Lodge — Mmabatho, Mafikeng.
            </h1>
            <p className="text-cream/90 mt-4 max-w-xl text-base md:text-lg motion-fade-up motion-ready" data-stagger="3">
              A warm, nine-room boutique guest house built for the way you actually travel. Leisure stays, corporate and government bookings, and private events — all in one place, booked directly with us.
            </p>
            <div className="hero-cta mt-8 flex flex-col sm:flex-row gap-3 motion-fade-up motion-ready" data-stagger="4">
              <BookNowHeroButtonClient />
              <Link href="/rooms" className="px-6 py-3 rounded-lg font-semibold text-base border border-cream-light/40 text-cream-light hover:bg-cream-light/10 inline-flex items-center justify-center interactive-element">
                View Rooms
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* THREE WAYS TO STAY */}
      <section id="stay" className="py-16 md:py-24 bg-cream-light">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto motion-fade-up motion-ready">
            <span className="pill pill-leisure mb-4">Three Ways to Stay</span>
            <h2 className="font-display text-ink font-semibold text-2xl md:text-3xl mt-4">Choose the booking path that fits your trip.</h2>
            <p className="text-stone mt-4 text-base">One lodge, three tailored experiences. Pick the flow that matches your reason for visiting — we&apos;ll take it from there.</p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                pill: "pill-leisure",
                title: "Leisure",
                heading: "Weekend or weeknight escape",
                desc: "Pick your room, add breakfast or dinner, send us a request. We confirm by WhatsApp within minutes.",
                icon: "✓",
                iconColor: "text-terracotta-dark",
                items: ["9 rooms, including flexible twin/double", "Breakfast from R150 · Dinner from R250", "Cash on arrival or EFT"],
                link: "/rooms",
                linkText: "Request a Stay",
                img: "Leisure guest room",
              },
              {
                pill: "pill-corporate",
                title: "Corporate",
                heading: "Contractors & government stays",
                desc: "Multi-room, multi-night quote in one form. PO numbers, formal quotations, invoices and consolidated statements.",
                icon: "✓",
                iconColor: "text-walnut",
                items: ["One submission, many rooms", "PO reference & billing email", "Invoice-ready documentation"],
                link: "/corporate",
                linkText: "Request a Quote",
                img: "Corporate guest room",
                imgTone: "walnut",
              },
              {
                pill: "pill-event",
                title: "Events",
                heading: "Weddings, showers & parties",
                desc: "Host up to 50 guests in our multipurpose venue. Confirmed catering pricing, flexible setups, your event your way.",
                icon: "✓",
                iconColor: "text-gold-dark",
                items: ["Up to 50 guests", "Catering packages available", "Accommodation for guests on-site"],
                link: "/events",
                linkText: "Inquire About Your Event",
                img: "Event space set for wedding",
                imgTone: "gold",
              },
            ].map((item, i) => (
              <article key={item.title} className="branch-card card-shadow card-lift bg-white rounded-2xl overflow-hidden border border-walnut/10 motion-scale-in motion-ready interactive-element" data-stagger={i + 1}>
                <div className="aspect-[4/3] overflow-hidden image-zoom">
                  <PhotoPlaceholder label={item.img} tone={item.imgTone as "walnut" | "gold"} />
                </div>
                <div className="p-6">
                  <span className={`pill ${item.pill}`}>{item.title}</span>
                  <h3 className="font-semibold text-ink text-lg mt-3">{item.heading}</h3>
                  <p className="text-stone text-sm mt-2">{item.desc}</p>
                  <ul className="mt-4 space-y-2 text-sm text-ink">
                    {item.items.map((it) => (
                      <li key={it} className="flex items-start gap-2"><span className={`${item.iconColor} mt-0.5`}>{item.icon}</span> {it}</li>
                    ))}
                  </ul>
                  <Link href={item.link} className="mt-6 block text-center btn-primary btn-press px-4 py-2.5 rounded-lg font-semibold text-sm ripple">
                    {item.linkText}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-16 md:py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="motion-fade-left motion-ready">
            <span className="pill pill-corporate">About the Lodge</span>
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl mt-4">Freshly renovated. Thoughtfully run.</h2>
            <p className="text-stone mt-4 text-base leading-relaxed">
              Gomodi Guest Lodge is a nine-room boutique guest house in South Africa — recently renovated with warm terracotta walls, dark walnut wood, and cream textiles throughout. We&apos;re family-run, personally managed, and built for guests who&apos;d rather book directly than navigate a big platform.
            </p>
            <p className="text-stone mt-4 text-base leading-relaxed">
              Whether you&apos;re here for a weekend away, a week-long contract, or a celebration with the people who matter most — we&apos;ll look after you.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-6">
              {[
                { num: "9", label: "Rooms" },
                { num: "50", label: "Event Capacity" },
                { num: "3", label: "Booking Paths" },
              ].map((stat, i) => (
                <div key={stat.label} className="motion-scale-in motion-ready interactive-element" data-stagger={i + 1}>
                  <div className="text-terracotta-dark font-semibold text-2xl">{stat.num}</div>
                  <div className="text-stone text-xs uppercase tracking-wide mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="motion-fade-right motion-ready image-zoom">
            <div className="rounded-2xl overflow-hidden card-shadow aspect-[4/3]">
              <PhotoPlaceholder label="Renovated guest room" />
            </div>
          </div>
        </div>
      </section>

      {/* ROOMS PREVIEW */}
      <section id="rooms" className="py-16 md:py-24 bg-cream-light">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 motion-fade-up motion-ready">
            <div>
              <span className="pill pill-leisure">Our Rooms</span>
              <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl mt-4">Nine rooms. One standard of comfort.</h2>
              <p className="text-stone mt-3 max-w-xl">Every room includes Smart TV, WiFi, air conditioning with fan/heater backup, and your choice of shower or bath. One flexible room can be set as two singles or one double.</p>
            </div>
            <Link href="/rooms" className="text-terracotta-dark font-semibold text-sm inline-flex items-center gap-2 hover:gap-3 transition-all interactive-element">
              View all 9 rooms
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {previewRooms.map((room, i) => (
              <Link
                key={room.id}
                href={`/book?room=${room.id}`}
                className="card-shadow card-lift bg-white rounded-2xl overflow-hidden border border-walnut/10 motion-scale-in motion-ready interactive-element"
                data-stagger={i + 1}
              >
                <div className="aspect-[4/3] bg-cream overflow-hidden image-zoom">
                  <PhotoPlaceholder label={room.name} />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-ink">{room.name}</h3>
                    <span className="text-terracotta-dark font-semibold text-sm">R{Number(room.baseRate).toFixed(0)}/night</span>
                  </div>
                  <p className="text-stone text-sm mt-1">
                    {room.config} · {room.bathOrShower === "bath" ? "Bath" : "Shower"} · 2 guests
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-[11px] px-2 py-1 rounded bg-cream text-stone">Smart TV</span>
                    <span className="text-[11px] px-2 py-1 rounded bg-cream text-stone">WiFi</span>
                    <span className="text-[11px] px-2 py-1 rounded bg-cream text-stone">A/C</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AMENITIES */}
      <section className="py-16 md:py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto motion-fade-up motion-ready">
            <span className="pill pill-corporate">What&apos;s Included</span>
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl mt-4">Comforts you can count on.</h2>
          </div>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: "Smart TV", sub: "In every room", d: "M2 7h20v13H2zM17 2l-5 5-5-5" },
              { title: "Free WiFi", sub: "Lodge-wide", d: "M5 12.55a11 11 0 0 1 14 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" },
              { title: "A/C + Backup", sub: "Fan & heater ready", d: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" },
              { title: "Breakfast", sub: "From R150 pp", d: "M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4zM6 1v3M10 1v3M14 1v3" },
              { title: "Dinner", sub: "From R250 pp", d: "M3 11h18M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" },
              { title: "Secure Parking", sub: "On-site", d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
              { title: "Flexible Check-in", sub: "By arrangement", d: "M12 6v6l4 2" },
              { title: "Personal Host", sub: "Owner-managed", d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
            ].map((a, i) => (
              <div key={a.title} className="bg-white rounded-xl p-6 border border-walnut/10 card-shadow motion-scale-in motion-ready interactive-element" data-stagger={i + 1}>
                <div className="w-10 h-10 rounded-lg bg-terracotta-tint flex items-center justify-center text-terracotta-dark">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d={a.d} /></svg>
                </div>
                <h3 className="font-semibold text-ink mt-3 text-sm">{a.title}</h3>
                <p className="text-stone text-xs mt-1">{a.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EVENTS TEASER */}
      <section id="events" className="py-16 md:py-24 bg-cream-light">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 motion-fade-left motion-ready">
            <span className="pill pill-event">Events &amp; Functions</span>
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl mt-4">Host your moment here.</h2>
            <p className="text-stone mt-4 text-base leading-relaxed">
              Weddings, baby showers, birthday parties and private functions — our multipurpose venue hosts up to 50 guests with confirmed catering packages and flexible setups.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink">
              {["Up to 50 guests seated or cocktail", "Catering packages from R150 pp", "On-site accommodation for your guests", "Confirmed pricing — no surprises"].map((item, i) => (
                <li key={item} className="flex items-start gap-3 motion-fade-up motion-ready" data-stagger={i + 1}><span className="text-gold-dark font-bold">✓</span> {item}</li>
              ))}
            </ul>
            <Link href="/events" className="mt-8 inline-block btn-primary btn-press px-6 py-3 rounded-lg font-semibold ripple">Inquire About Your Event</Link>
            <p className="text-stone text-xs mt-4 italic">Day-use of the meeting/function space is priced on request while final touches to the renovation are completed.</p>
          </div>
          <div className="order-1 md:order-2 motion-fade-right motion-ready image-zoom">
            <div className="rounded-2xl overflow-hidden card-shadow aspect-[4/3]">
              <PhotoPlaceholder label="Event space" tone="gold" />
            </div>
          </div>
        </div>
      </section>

      {/* CORPORATE TEASER */}
      <section id="corporate" className="py-16 md:py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="motion-fade-left motion-ready image-zoom">
            <div className="rounded-2xl overflow-hidden card-shadow aspect-[4/3]">
              <PhotoPlaceholder label="Corporate accommodation" tone="walnut" />
            </div>
          </div>
          <div className="motion-fade-right motion-ready">
            <span className="pill pill-corporate">Corporate &amp; Government</span>
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl mt-4">Accommodation that respects your procurement process.</h2>
            <p className="text-stone mt-4 text-base leading-relaxed">
              Contractor deployments, government rotations, and multi-room group stays — one form captures everything, and we issue formal quotations, invoices, and consolidated statements that work with your finance team.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink">
              {["Multi-room, multi-night in a single submission", "PO numbers and billing email captured upfront", "Formal quotation before you commit", "Invoice-ready documentation"].map((item, i) => (
                <li key={item} className="flex items-start gap-3 motion-fade-up motion-ready" data-stagger={i + 1}><span className="text-walnut font-bold">✓</span> {item}</li>
              ))}
            </ul>
            <Link href="/corporate" className="mt-8 inline-block btn-primary btn-press px-6 py-3 rounded-lg font-semibold ripple">Request a Corporate Quote</Link>
          </div>
        </div>
      </section>

      {/* PAYMENT */}
      <section id="payment" className="py-16 md:py-20 bg-cream-light">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto motion-fade-up motion-ready">
            <span className="pill pill-corporate">Payment</span>
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl mt-4">Simple, familiar, flexible.</h2>
            <p className="text-stone mt-3">Pay the way that suits you. No online card processing — just the methods our guests already use.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "M2 7h20v13H2zM17 2l-5 5-5-5", title: "EFT / Bank Transfer", desc: "Pay directly to our business account. Upload proof of payment and we'll verify within one business day.", bg: "bg-walnut-tint", color: "text-walnut" },
              { icon: "M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z", title: "Cash on Arrival", desc: "Perfect for leisure guests. Settle in person at check-in — no advance payment required.", bg: "bg-terracotta-tint", color: "text-terracotta-dark" },
              { icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8", title: "Proof of Payment", desc: "Upload your POP directly through your booking confirmation and we'll mark it verified on your record.", bg: "bg-gold-tint", color: "text-gold-dark" },
            ].map((p, i) => (
              <div key={p.title} className="bg-white rounded-2xl p-8 border border-walnut/10 card-shadow motion-scale-in motion-ready interactive-element" data-stagger={i + 1}>
                <div className={`w-12 h-12 rounded-xl ${p.bg} flex items-center justify-center ${p.color}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d={p.icon}/></svg>
                </div>
                <h3 className="font-semibold text-ink mt-4">{p.title}</h3>
                <p className="text-stone text-sm mt-2">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHATSAPP CTA */}
      <section id="contact" className="py-16 md:py-20 bg-walnut text-cream-light">
        <div className="max-w-4xl mx-auto px-6 text-center motion-fade-up motion-ready">
          <span className="pill" style={{ background: "rgba(245,235,221,0.15)", color: "#FAF6F0" }}>Prefer to chat?</span>
          <h2 className="font-display font-semibold text-2xl md:text-3xl mt-4">Message us on WhatsApp.</h2>
          <p className="text-cream/80 mt-4 max-w-xl mx-auto">Fastest way to reach us. We typically respond within minutes during business hours — and our booking confirmations come through WhatsApp too.</p>
          <a href="#" className="mt-8 inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#1EBE5B] text-white px-6 py-3 rounded-lg font-semibold transition-colors btn-press ripple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            Chat on WhatsApp
          </a>
          <p className="text-cream/60 text-xs mt-6">Or call us directly · Email enquiries welcome</p>
        </div>
      </section>
    </main>
  );
}
