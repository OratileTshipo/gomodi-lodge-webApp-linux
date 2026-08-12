import { listApprovedReviews, reviewStats } from "@/lib/reviews";

type Review = Awaited<ReturnType<typeof listApprovedReviews>>[number];
type Aggregate = Awaited<ReturnType<typeof reviewStats>>;

const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={s <= rating ? "#d4a574" : "none"}
          stroke={s <= rating ? "#d4a574" : "#b8a894"}
          strokeWidth={1.5}
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  );
}

/** Approved guest reviews (only ever real, traceable reviews) + aggregate. */
export function ReviewsSection({
  reviews,
  aggregate,
}: {
  reviews: Review[];
  aggregate: Aggregate;
}) {
  const showAggregate = aggregate.count >= 5;

  return (
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

        {reviews.length > 0 ? (
          <div className="mt-12">
            {showAggregate && (
              <div className="flex items-center justify-center gap-3 mb-10 motion-fade-up motion-ready">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg
                      key={s}
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill={s <= Math.round(aggregate.average) ? "#d4a574" : "none"}
                      stroke="#d4a574"
                      strokeWidth={1.5}
                    >
                      <path d={STAR_PATH} />
                    </svg>
                  ))}
                </div>
                <span className="text-ink font-semibold">
                  {aggregate.average.toFixed(1)} · {aggregate.count} review{aggregate.count === 1 ? "" : "s"}
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((review, i) => (
                <article
                  key={review.id}
                  className="card-shadow card-lift bg-white rounded-2xl border border-walnut/10 p-6 flex flex-col motion-scale-in motion-ready"
                  data-stagger={i + 1}
                >
                  <div className="flex items-center justify-between">
                    <Stars rating={review.rating} />
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
                        <span
                          key={f}
                          className="text-[11px] px-2 py-0.5 rounded bg-terracotta-tint text-terracotta-dark"
                        >
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
  );
}
