import Link from "next/link";
import Image from "next/image";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { BookNowHeroButtonClient } from "@/components/BookNowHeroButtonClient";
import { BREAKFAST_PRICE, DINNER_PRICE, EVENT_CATERING_FROM } from "@/lib/pricing";
import { whatsappHref, ENQUIRIES_EMAIL } from "@/lib/contact";
import { listApprovedReviews, reviewStats } from "@/lib/reviews";
import { getRooms } from "@/lib/rooms-cache";
import { bathLabel } from "@/lib/rooms";
import HeroSlideshow from "@/components/HeroSlideshow";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Real sample rooms for the "Rooms Preview" teaser (3 of the 9), replacing
  // the original design's fictional room-type pricing with our actual flat-rate
  // data. Room list is 60s-cached (lib/rooms-cache) so repeat visits skip the
  // remote-Neon round-trip; availability is always re-checked live on submit.
  const previewRooms = (await getRooms()).slice(0, 3);

  // What guests say — only APPROVED reviews are ever shown publicly. If the
  // reviews tables aren't pushed yet (or the DB is briefly unavailable) the
  // homepage degrades to the empty state instead of failing the whole page.
  let approvedReviews: Awaited<ReturnType<typeof listApprovedReviews>> = [];
  let aggregate: Awaited<ReturnType<typeof reviewStats>> = { count: 0, average: 0 };
  try {
    [approvedReviews, aggregate] = await Promise.all([
      listApprovedReviews(3),
      reviewStats(),
    ]);
  } catch (err) {
    console.error("Reviews section unavailable (tables may not be pushed yet):", err);
  }

  const showAggregate = aggregate.count >= 5;

  return (
    <main className="page-transition">
      {/* HERO */}
      <section className="relative">
        <div className="hero-outer relative h-[70vh] min-h-[min(520px,calc(100svh_-_var(--header-h)))] max-h-[720px] overflow-hidden">
          <HeroSlideshow
            images={[
              { src: "/images/reception/reception-1.jpeg", alt: "Gomodi Guest Lodge reception building" },
              { src: "/images/reception/reception-2.jpeg", alt: "Reception entrance" },
              { src: "/images/reception/reception-3.jpeg", alt: "Lodge exterior view" },
              { src: "/images/reception/rooms-building-1.jpeg", alt: "Guest rooms building" },
              { src: "/images/reception/rooms-building-2.jpeg", alt: "Rooms building second view" },
              { src: "/images/reception/rooms-building-3.jpeg", alt: "Rooms building third view" },
              { src: "/images/reception/rooms-building-4.jpeg", alt: "Rooms building fourth view" },
            ]}
            interval={6000}
            className="absolute inset-0"
          />
          <div className="absolute inset-0 hero-gradient" />
          <div className="hero-content relative z-10 h-full max-w-6xl mx-auto px-6 flex flex-col justify-end pb-12 md:pb-16">
            <h1
              className="font-display text-cream-light font-semibold text-3xl md:text-5xl leading-tight max-w-2xl motion-fade-up motion-ready"
              data-stagger="1"
            >
              Welcome to Gomodi Guest Lodge — Mmabatho, Mafikeng.
            </h1>
            <p
              className="text-cream/90 mt-4 max-w-xl text-base md:text-lg motion-fade-up motion-ready"
              data-stagger="3"
            >
              Nine rooms, freshly renovated, family-run. Sleep well, eat
              well, and book direct with us — no booking platform in
              between, for leisure stays, work trips, and private events.
            </p>
            <div
              className="hero-cta mt-8 flex flex-col sm:flex-row gap-3 motion-fade-up motion-ready"
              data-stagger="4"
            >
              <BookNowHeroButtonClient />
              <Link
                href="/rooms"
                className="px-6 py-3 rounded-lg font-semibold text-base border border-cream-light/40 text-cream-light hover:bg-cream-light/10 inline-flex items-center justify-center interactive-element backdrop-blur-sm"
              >
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
            <h2 className="font-display text-ink font-semibold text-2xl md:text-3xl">
              Choose how you want to stay.
            </h2>
            <p className="text-stone mt-4 text-base">
              A weekend away, a working week, or a celebration. Pick the one
              that fits — you send the request, a person confirms by WhatsApp.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Leisure",
                heading: "A slow morning is the point",
                desc: "Sleep in, order breakfast when you wake up, and let the day happen at its own pace. We confirm on WhatsApp within minutes.",
                icon: "✓",
                iconColor: "text-terracotta-dark",
                iconBg: "bg-terracotta-tint",
                items: [
                  "9 rooms, including flexible twin/double",
                  `Breakfast R${BREAKFAST_PRICE} · Dinner R${DINNER_PRICE} pp`,
                  "Cash on arrival or EFT",
                ],
                link: "/rooms",
                linkText: "Request a Stay",
                img: "/images/rooms/room1.jpeg",
                imgTone: "terracotta" as const,
              },
              {
                title: "Corporate",
                heading: "Arrive the night before your big day",
                desc: "A quiet room, a desk that works, breakfast before the meeting. And the paperwork your finance team needs — PO, quotes, invoices.",
                icon: "✓",
                iconColor: "text-walnut",
                iconBg: "bg-walnut-tint",
                items: [
                  "One submission, many rooms",
                  "PO reference & billing email",
                  "Invoice-ready documentation",
                ],
                link: "/corporate",
                linkText: "Request a Quote",
                img: "/images/rooms/room1-view2.jpeg",
                imgTone: "walnut" as const,
              },
              {
                title: "Events",
                heading: "The garden fills with people you love",
                desc: "Weddings, showers, birthdays — up to 50 guests, confirmed catering, and rooms for the family to stay over.",
                icon: "✓",
                iconColor: "text-gold-dark",
                iconBg: "bg-gold-tint",
                items: [
                  "Up to 50 guests",
                  `Catering packages from R${EVENT_CATERING_FROM} pp`,
                  "Accommodation for guests on-site",
                ],
                link: "/events",
                linkText: "Inquire About Your Event",
                img: "/images/events/birthday-party.jpeg",
                imgTone: "gold" as const,
              },
            ].map((item, i) => (
              <article
                key={item.title}
                className="branch-card card-shadow card-lift bg-white rounded-2xl overflow-hidden border border-walnut/10 motion-scale-in motion-ready"
                data-stagger={i + 1}
              >
                <div className="aspect-[4/3] overflow-hidden image-zoom relative">
                  <Image
                    src={item.img}
                    alt={item.heading}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center`}
                    >
                      <span className={`${item.iconColor} text-sm font-bold`}>
                        {item.icon}
                      </span>
                    </div>
                    <h3 className="font-semibold text-ink text-lg">
                      {item.heading}
                    </h3>
                  </div>
                  <p className="text-stone text-sm leading-relaxed">{item.desc}</p>
                  <ul className="mt-4 space-y-2 text-sm text-ink">
                    {item.items.map((it) => (
                      <li key={it} className="flex items-start gap-2">
                        <span className={`${item.iconColor} mt-0.5`}>
                          {item.icon}
                        </span>{" "}
                        {it}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={item.link}
                    className="mt-6 block text-center btn-primary btn-press px-4 py-2.5 rounded-lg font-semibold text-sm ripple"
                  >
                    {item.linkText}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT + OWNER STORY */}
      <section className="py-16 md:py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="motion-fade-left motion-ready">
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">
              Freshly renovated. Family-run.
            </h2>
            <p className="text-stone mt-4 text-base leading-relaxed">
              Gomodi Guest Lodge is a nine-room guest house in Mmabatho,
              Mafikeng. We&apos;ve recently renovated — terracotta walls, walnut
              wood, and cream textiles throughout. We&apos;re family-run and
              personally managed, and we take bookings directly rather than
              through a platform.
            </p>
            <p className="text-stone mt-4 text-base leading-relaxed">
              You&apos;ll deal with the people who own it — not a call centre.
              Need to check in late? Want breakfast earlier than usual? Just
              ask. Weekend away, work stay, or a celebration — we&apos;ll make
              sure you&apos;re comfortable.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-6">
              {[
                { num: "9", label: "Rooms" },
                { num: "50", label: "Event Capacity" },
                { num: "3", label: "Ways to Book" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="motion-scale-in motion-ready interactive-element"
                  data-stagger={i + 1}
                >
                  <div className="text-terracotta-dark font-semibold text-2xl">
                    {stat.num}
                  </div>
                  <div className="text-stone text-xs uppercase tracking-wide mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="motion-fade-right motion-ready image-zoom">
            <div className="rounded-2xl overflow-hidden card-shadow aspect-[4/3] relative">
              <Image
                src="/images/reception/reception-3.jpeg"
                alt="Gomodi Guest Lodge reception"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            {/* Host photo slot — the "personally managed" claim needs a face.
                Swap the placeholder for the owner/host portrait (with consent). */}
            <div className="relative mt-4 rounded-2xl overflow-hidden card-shadow aspect-[21/9]">
              <PhotoPlaceholder label="The family that runs Gomodi" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-4 pb-3 pt-10">
                <p className="text-cream-light text-sm font-medium">
                  Run by the family — you&apos;ll know us by name.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROOMS PREVIEW */}
      <section id="rooms" className="py-16 md:py-24 bg-cream-light">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 motion-fade-up motion-ready">
            <div>
              <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">
                Nine rooms, all freshly renovated.
              </h2>
              <p className="text-stone mt-3 max-w-xl">
                Every room includes Smart TV, WiFi, air conditioning with
                fan/heater backup, and your choice of shower or bath. One
                flexible room can be set as two singles or one double — a
                deep sleep and a slow start are included.
              </p>
            </div>
            <Link
              href="/rooms"
              className="text-terracotta-dark font-semibold text-sm inline-flex items-center gap-2 hover:gap-3 transition-all interactive-element"
            >
              View all 9 rooms
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {previewRooms.map((room, i) => (
              <Link
                key={room.id}
                href={`/book?room=${room.id}`}
                className="card-shadow card-lift bg-white rounded-2xl overflow-hidden border border-walnut/10 motion-scale-in motion-ready"
                data-stagger={i + 1}
              >
                <div className="aspect-[4/3] bg-cream overflow-hidden image-zoom relative">
                  {room.id === 1 ? (
                    <Image
                      src="/images/rooms/room1.jpeg"
                      alt={room.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <PhotoPlaceholder label={room.name} />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-ink">{room.name}</h3>
                    <span className="text-terracotta-dark font-semibold text-sm">
                      R{Number(room.baseRate).toFixed(0)}/night
                    </span>
                  </div>
                  <p className="text-stone text-sm mt-1">
                    {room.config} ·{" "}
                    {bathLabel(room.bathOrShower)} · 2 guests
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT GUESTS SAY */}
      <section id="reviews" className="py-16 md:py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto motion-fade-up motion-ready">
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">
              What guests say.
            </h2>
            <p className="text-stone mt-4 text-base">
              Real words from real stays — every review below came from a
              guest who actually slept here.
            </p>
          </div>

          {approvedReviews.length > 0 ? (
            <div className="mt-12">
              {showAggregate && (
                <div className="flex items-center justify-center gap-3 mb-10 motion-fade-up motion-ready">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg key={s} width="18" height="18" viewBox="0 0 24 24" fill={s <= Math.round(aggregate.average) ? "#d4a574" : "none"} stroke="#d4a574" strokeWidth={1.5}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-ink font-semibold">
                    {aggregate.average.toFixed(1)} · {aggregate.count} review{aggregate.count === 1 ? "" : "s"}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {approvedReviews.map((review, i) => (
                  <article
                    key={review.id}
                    className="card-shadow card-lift bg-white rounded-2xl border border-walnut/10 p-6 flex flex-col motion-scale-in motion-ready"
                    data-stagger={i + 1}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill={s <= review.rating ? "#d4a574" : "none"} stroke={s <= review.rating ? "#d4a574" : "#b8a894"} strokeWidth={1.5}>
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                      <span className="pill pill-neutral">
                        {review.category === "corporate"
                          ? "Business stay"
                          : review.category === "event"
                            ? "Event guest"
                            : "Leisure stay"}
                      </span>
                    </div>
                    <h3 className="font-semibold text-ink mt-4 leading-snug">
                      &ldquo;{review.headline}&rdquo;
                    </h3>
                    <p className="text-stone text-sm mt-2 leading-relaxed line-clamp-4 flex-1">
                      {review.body}
                    </p>
                    {review.feelings.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {review.feelings.map((f) => (
                          <span key={f} className="text-[11px] px-2 py-0.5 rounded bg-terracotta-tint text-terracotta-dark">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-5 pt-4 border-t border-walnut/10 flex items-center justify-between">
                      <span className="text-sm text-ink font-medium">
                        {review.guestName}
                      </span>
                      <span className="text-xs text-stone">
                        {new Date(review.submittedAt).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-12 max-w-2xl mx-auto bg-white rounded-2xl border border-walnut/10 card-shadow p-10 text-center motion-fade-up motion-ready">
              <div className="w-14 h-14 rounded-full bg-gold-tint flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8f6a3e" strokeWidth={1.5}>
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <h3 className="font-semibold text-ink text-lg">
                First reviews are on their way.
              </h3>
              <p className="text-stone text-sm mt-2 max-w-md mx-auto leading-relaxed">
                After every stay we invite guests to share how it felt — those
                words land here, real and unedited. Check back after your own
                stay to add yours.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* AMENITIES */}
      <section className="py-16 md:py-20 bg-cream-light">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto motion-fade-up motion-ready">
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">
              What every room includes.
            </h2>
            <p className="text-stone mt-3 text-base">
              Everything you need for a good night&apos;s sleep — and a good
              day&apos;s work.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                title: "Smart TV",
                sub: "Sleep in, stream, switch off",
                d: "M2 7h20v13H2zM17 2l-5 5-5-5",
              },
              {
                title: "Free WiFi",
                sub: "Post the photos; join the call",
                d: "M5 12.55a11 11 0 0 1 14 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01",
              },
              {
                title: "A/C + Backup",
                sub: "Cool nights, even when the grid blinks",
                d: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
              },
              {
                title: "Breakfast",
                sub: `R${BREAKFAST_PRICE} pp — eggs, toast, coffee`,
                d: "M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4zM6 1v3M10 1v3M14 1v3",
              },
              {
                title: "Dinner",
                sub: `R${DINNER_PRICE} pp — a real evening meal`,
                d: "M3 11h18M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",
              },
              {
                title: "Secure Parking",
                sub: "Your car is behind our gate",
                d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
              },
              {
                title: "Flexible Check-in",
                sub: "Arrive when your flight lands",
                d: "M12 6v6l4 2",
              },
              {
                title: "Personal Host",
                sub: "A family, not a call centre",
                d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
              },
            ].map((a, i) => (
              <div
                key={a.title}
                className="bg-white rounded-xl p-5 border border-walnut/10 card-shadow card-lift motion-scale-in motion-ready"
                data-stagger={i + 1}
              >
                <div className="w-10 h-10 rounded-lg bg-terracotta-tint flex items-center justify-center text-terracotta-dark">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d={a.d} />
                  </svg>
                </div>
                <h3 className="font-semibold text-ink mt-3 text-sm">
                  {a.title}
                </h3>
                <p className="text-stone text-xs mt-1 leading-relaxed">{a.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DINING TEASER */}
      <section id="dining" className="py-16 md:py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="motion-fade-left motion-ready image-zoom">
            <div className="rounded-2xl overflow-hidden card-shadow aspect-[4/3]">
              <PhotoPlaceholder label="Breakfast at Gomodi" tone="terracotta" />
            </div>
          </div>
          <div className="motion-fade-right motion-ready">
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">
              Breakfast before the day. Dinner at the end of it.
            </h2>
            <p className="text-stone mt-4 text-base leading-relaxed">
              Cooked or continental, served when you&apos;re actually awake —
              not at a fixed hour. Business guests get out the door on time;
              leisure guests take the slow route.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink">
              {[
                `Breakfast R${BREAKFAST_PRICE} pp — eggs, toast, coffee, and the garden view`,
                `Dinner R${DINNER_PRICE} pp — a real evening meal after a long day`,
                "Add either to your stay in the booking wizard — nothing is compulsory",
              ].map((item, i) => (
                <li
                  key={item}
                  className="flex items-start gap-3 motion-fade-up motion-ready"
                  data-stagger={i + 1}
                >
                  <span className="text-terracotta-dark font-bold">✓</span> {item}
                </li>
              ))}
            </ul>
            <Link
              href="/book"
              className="mt-8 inline-block btn-primary btn-press px-6 py-3 rounded-lg font-semibold ripple"
            >
              Book a Stay
            </Link>
          </div>
        </div>
      </section>

      {/* EVENTS TEASER */}
      <section id="events" className="py-16 md:py-24 bg-cream-light">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 motion-fade-left motion-ready">
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">
              Host your event here.
            </h2>
            <p className="text-stone mt-4 text-base leading-relaxed">
              Weddings, baby showers, birthdays, and private functions. Our
              venue holds up to 50 guests, with catering packages and flexible
              setups — managed with our partners at LeLz Events.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink">
              {[
                "Up to 50 guests seated or cocktail",
                `Catering packages from R${EVENT_CATERING_FROM} pp`,
                "On-site accommodation for your guests",
                "Confirmed pricing — no surprises on the day",
              ].map((item, i) => (
                <li
                  key={item}
                  className="flex items-start gap-3 motion-fade-up motion-ready"
                  data-stagger={i + 1}
                >
                  <span className="text-gold-dark font-bold">✓</span> {item}
                </li>
              ))}
            </ul>
            <Link
              href="/events"
              className="mt-8 inline-block btn-gold btn-press px-6 py-3 rounded-lg font-semibold ripple"
            >
              Inquire About Your Event
            </Link>
            <p className="text-stone text-xs mt-4 italic">
              Day-use of the meeting/function space is priced on request while
              final touches to the renovation are completed.
            </p>
          </div>
          <div className="order-1 md:order-2 motion-fade-right motion-ready image-zoom">
            <div className="rounded-2xl overflow-hidden card-shadow aspect-[4/3] relative">
              <Image
                src="/images/events/baby-shower.jpeg"
                alt="Baby shower celebration at Gomodi"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CORPORATE TEASER */}
      <section id="corporate" className="py-16 md:py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="motion-fade-left motion-ready image-zoom">
            <div className="rounded-2xl overflow-hidden card-shadow aspect-[4/3] relative">
              <Image
                src="/images/rooms/room1-view3.jpeg"
                alt="Corporate accommodation room"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
          <div className="motion-fade-right motion-ready">
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">
              Set up for corporate and government bookings.
            </h2>
            <p className="text-stone mt-4 text-base leading-relaxed">
              Contractor deployments, government rotations, and multi-room
              group stays. Sleep well before the site visit, work from a room
              that has a desk and WiFi that holds a call — and let us handle
              the formal quotations, invoices, and consolidated statements
              your finance team needs.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink">
              {[
                "Multi-room, multi-night in a single submission",
                "PO numbers and billing email captured upfront",
                "Formal quotation before you commit",
                "Invoice-ready documentation",
              ].map((item, i) => (
                <li
                  key={item}
                  className="flex items-start gap-3 motion-fade-up motion-ready"
                  data-stagger={i + 1}
                >
                  <span className="text-walnut font-bold">✓</span> {item}
                </li>
              ))}
            </ul>
            <Link
              href="/corporate"
              className="mt-8 inline-block btn-primary btn-press px-6 py-3 rounded-lg font-semibold ripple"
            >
              Request a Corporate Quote
            </Link>
          </div>
        </div>
      </section>

      {/* THINGS TO DO IN MAFIKENG */}
      <section id="explore" className="py-16 md:py-24 bg-cream-light">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto motion-fade-up motion-ready">
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">
              While you&apos;re in Mafikeng.
            </h2>
            <p className="text-stone mt-4 text-base">
              We&apos;ll point you the way to any of these — and tell you the
              honest truth about what&apos;s worth the trip.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Mafikeng Game Reserve",
                leisure: "A quiet drive to spot game — best in the early morning.",
                business: "A sunrise game drive before a day of meetings.",
                tone: "terracotta" as const,
              },
              {
                title: "Mafikeng Museum",
                leisure: "An hour to understand where you are and who built it.",
                business: "Useful context if your work here is government-facing.",
                tone: "walnut" as const,
              },
              {
                title: "Mmabatho Stadium",
                leisure: "Catch a local match or a walk around the precinct.",
                business: "A landmark to navigate the city by.",
                tone: "gold" as const,
              },
            ].map((spot, i) => (
              <article
                key={spot.title}
                className="card-shadow card-lift bg-white rounded-2xl overflow-hidden border border-walnut/10 motion-scale-in motion-ready"
                data-stagger={i + 1}
              >
                <div className="aspect-[4/3] relative">
                  <PhotoPlaceholder label={spot.title} tone={spot.tone} />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-ink text-lg">{spot.title}</h3>
                  <p className="text-stone text-sm mt-2 leading-relaxed">{spot.leisure}</p>
                  <p className="text-stone text-xs mt-2 leading-relaxed border-t border-walnut/10 pt-3">
                    <span className="font-semibold text-walnut">On business:</span>{" "}
                    {spot.business}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <p className="text-center text-stone text-sm mt-10 max-w-xl mx-auto">
            Ask at reception for directions, opening times, and what&apos;s
            actually worth your afternoon — we live here.
          </p>
        </div>
      </section>

      {/* PAYMENT */}
      <section id="payment" className="py-16 md:py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto motion-fade-up motion-ready">
            <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">
              How you pay.
            </h2>
            <p className="text-stone mt-3">
              EFT or cash on arrival. No online card processing — just the
              methods our guests already use.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "M2 7h20v13H2zM17 2l-5 5-5-5",
                title: "EFT / Bank Transfer",
                desc: "Pay directly to our business account. Upload proof of payment and we'll verify within one business day.",
                bg: "bg-walnut-tint",
                color: "text-walnut",
              },
              {
                icon: "M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
                title: "Cash on Arrival",
                desc: "Perfect for leisure guests. Settle in person at check-in — no advance payment required.",
                bg: "bg-terracotta-tint",
                color: "text-terracotta-dark",
              },
              {
                icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
                title: "Proof of Payment",
                desc: "Upload your POP directly through your booking confirmation and we'll mark it verified on your record.",
                bg: "bg-gold-tint",
                color: "text-gold-dark",
              },
            ].map((p, i) => (
              <div
                key={p.title}
                className="bg-white rounded-2xl p-8 border border-walnut/10 card-shadow card-lift motion-scale-in motion-ready"
                data-stagger={i + 1}
              >
                <div
                  className={`w-12 h-12 rounded-xl ${p.bg} flex items-center justify-center ${p.color}`}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d={p.icon} />
                  </svg>
                </div>
                <h3 className="font-semibold text-ink mt-4">{p.title}</h3>
                <p className="text-stone text-sm mt-2">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHATSAPP CTA */}
      <section
        id="contact"
        className="relative py-16 md:py-20 bg-walnut text-cream-light overflow-hidden"
      >
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-6 text-center motion-fade-up motion-ready">
          <h2 className="font-display font-semibold text-2xl md:text-3xl">
            Message us on WhatsApp.
          </h2>
          <p className="text-cream/80 mt-4 max-w-xl mx-auto">
            The quickest way to reach us — a person answers, usually within
            minutes during the day. Booking confirmations come through
            WhatsApp too.
          </p>
          <a
            href={whatsappHref()}
            className="mt-8 inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#1EBE5B] text-white px-6 py-3 rounded-lg font-semibold transition-all btn-press ripple shadow-lg shadow-[#25D366]/20 hover:shadow-xl hover:shadow-[#25D366]/30"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Chat on WhatsApp
          </a>
          <p className="text-cream/60 text-xs mt-6">
            Or email us at{" "}
            <a href={`mailto:${ENQUIRIES_EMAIL}`} className="underline hover:text-cream-light transition-colors">
              {ENQUIRIES_EMAIL}
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
