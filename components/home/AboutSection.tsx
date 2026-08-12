import Image from "next/image";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";

const STATS = [
  { num: "9", label: "Rooms" },
  { num: "50", label: "Event Capacity" },
  { num: "3", label: "Ways to Book" },
];

/** Freshly-renovated / family-run story with stats and the host photo slot. */
export function AboutSection() {
  return (
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
            {STATS.map((stat, i) => (
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
  );
}
