import Link from "next/link";
import Image from "next/image";
import { BREAKFAST_PRICE, DINNER_PRICE, EVENT_CATERING_FROM } from "@/lib/pricing";

const WAYS = [
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
];

/** The three guest journeys (leisure / corporate / events) as cards. */
export function WaysToStaySection() {
  return (
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
          {WAYS.map((item, i) => (
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
  );
}
