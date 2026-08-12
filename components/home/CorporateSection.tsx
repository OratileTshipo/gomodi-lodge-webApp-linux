import Link from "next/link";
import Image from "next/image";

const ITEMS = [
  "Multi-room, multi-night in a single submission",
  "PO numbers and billing email captured upfront",
  "Formal quotation before you commit",
  "Invoice-ready documentation",
];

/** Corporate / government booking teaser. */
export function CorporateSection() {
  return (
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
            {ITEMS.map((item, i) => (
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
  );
}
