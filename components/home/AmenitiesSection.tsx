import { BREAKFAST_PRICE, DINNER_PRICE } from "@/lib/pricing";

const AMENITIES = [
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
];

/** The what-every-room-includes grid. */
export function AmenitiesSection() {
  return (
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
          {AMENITIES.map((a, i) => (
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
  );
}
