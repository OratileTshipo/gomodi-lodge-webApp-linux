import Link from "next/link";
import Image from "next/image";
import { EVENT_CATERING_FROM } from "@/lib/pricing";

const ITEMS = [
  "Up to 50 guests seated or cocktail",
  `Catering packages from R${EVENT_CATERING_FROM} pp`,
  "On-site accommodation for your guests",
  "Confirmed pricing — no surprises on the day",
];

/** Events teaser — venue, catering, and the Lelz partnership. */
export function EventsSection() {
  return (
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
            {ITEMS.map((item, i) => (
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
  );
}
