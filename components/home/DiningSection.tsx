import Link from "next/link";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { BREAKFAST_PRICE, DINNER_PRICE } from "@/lib/pricing";

const ITEMS = [
  `Breakfast R${BREAKFAST_PRICE} pp — eggs, toast, coffee, and the garden view`,
  `Dinner R${DINNER_PRICE} pp — a real evening meal after a long day`,
  "Add either to your stay in the booking wizard — nothing is compulsory",
];

/** Breakfast / dinner teaser with the photo slot for the first real shoot. */
export function DiningSection() {
  return (
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
            {ITEMS.map((item, i) => (
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
  );
}
