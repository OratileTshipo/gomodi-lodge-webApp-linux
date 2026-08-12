import Link from "next/link";
import { loadInviteContext } from "@/lib/reviews";
import { ReviewForm } from "./ReviewForm";

export const dynamic = "force-dynamic";

/**
 * Token-gated public review page. Only reachable via the unguessable invite
 * link delivered after a stay (/review?token=…) — there is deliberately no
 * anonymous review form anywhere on the site (see UI-findings-and-recommendations.md §8).
 */
export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = String(params.token || "").slice(0, 64);

  if (!token) {
    return <InvalidLink />;
  }

  const ctx = await loadInviteContext(token);
  if (!ctx) {
    return <InvalidLink />;
  }

  if (ctx.alreadySubmitted) {
    return (
      <main className="page-transition">
        <section className="max-w-xl mx-auto px-6 py-20 text-center">
          <div className="motion-pop">
            <div className="w-16 h-16 rounded-full bg-gold-tint flex items-center justify-center mb-5 mx-auto shadow-lg shadow-gold/20">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8f6a3e" strokeWidth={2.5}><path d="M20 6L9 17l-5-5" /></svg>
            </div>
          </div>
          <h1 className="font-display text-ink font-semibold text-2xl md:text-3xl motion-pop" data-stagger="2">
            Thank you — your review is in.
          </h1>
          <p className="text-stone mt-4 leading-relaxed motion-pop" data-stagger="3">
            A review has already been submitted for this stay. It goes to the
            Gomodi team for a quick check before it appears on the site.
            If you&apos;d like to add anything, message us on WhatsApp — a
            person reads every word.
          </p>
          <div className="mt-8 motion-pop" data-stagger="4">
            <Link href="/" className="inline-block btn-primary px-6 py-3 rounded-lg font-semibold btn-press ripple">
              Back to Home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return <ReviewForm token={ctx.token} guestName={ctx.guestName} category={ctx.category} />;
}

function InvalidLink() {
  return (
    <main className="page-transition">
      <section className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-walnut-tint flex items-center justify-center mb-5 mx-auto">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4a2e22" strokeWidth={1.5}><path d="M12 9v4M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></svg>
        </div>
        <h1 className="font-display text-ink font-semibold text-2xl md:text-3xl">
          This link isn&apos;t valid.
        </h1>
        <p className="text-stone mt-4 leading-relaxed">
          Review links are private and can only be used once. If you&apos;d
          like to share feedback about your stay, we&apos;d love to hear it —
          message us on WhatsApp or email{" "}
          <span className="text-ink font-medium">enquiries@gomodiguestlodge.co.za</span>.
        </p>
        <div className="mt-8">
          <Link href="/" className="inline-block btn-primary px-6 py-3 rounded-lg font-semibold btn-press ripple">
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
