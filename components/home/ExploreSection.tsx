import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";

const SPOTS = [
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
];

/** Local spots with the leisure / business angle on each. */
export function ExploreSection() {
  return (
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
          {SPOTS.map((spot, i) => (
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
  );
}
