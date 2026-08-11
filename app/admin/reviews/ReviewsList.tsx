"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { categoryLabel } from "@/lib/review-options";

type AdminReview = {
  id: number;
  guestName: string;
  category: string | null;
  rating: number;
  headline: string;
  body: string;
  feelings: string[];
  photos: string[];
  status: "pending" | "approved" | "declined";
  consentToPublish: boolean;
  submittedAt: string;
  bookingId: number | null;
  stayDates: { checkIn: string; checkOut: string } | null;
  roomName: string | null;
};

export function ReviewsList() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const router = useRouter();

  const isManager = user?.role === "owner" || user?.role === "assistant";

  useEffect(() => {
    void (async () => {
      try {
        const me = await fetch("/api/auth/me");
        if (me.ok) setUser(await me.json());
        else router.push("/admin");
      } catch {
        router.push("/admin");
      }
    })();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/reviews");
        if (!res.ok) throw new Error("Failed to fetch");
        setReviews(await res.json());
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function handleAction(id: number, action: "approve" | "decline") {
    const confirmMsg =
      action === "approve"
        ? "Approve this review? It will appear publicly on the site."
        : "Decline this review? It will never be shown publicly.";
    if (!confirm(confirmMsg)) return;

    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || `Failed to ${action} review.`);
        return;
      }
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(`Failed to ${action} review: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setBusyId(null);
    }
  }

  const stars = (n: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={i < n ? "#d4a574" : "none"}
        stroke={i < n ? "#d4a574" : "#b8a894"}
        strokeWidth={1.5}
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ));

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-light">
        <div className="bg-white border-b border-walnut/10 px-6 py-4">
          <div className="max-w-4xl mx-auto space-y-2">
            <div className="h-5 w-40 bg-skeleton rounded animate-pulse" />
            <div className="h-3 w-56 bg-skeleton-light rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-walnut/10 p-6 h-44 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const pending = reviews.filter((r) => r.status === "pending");
  const reviewed = reviews.filter((r) => r.status !== "pending");

  return (
    <div className="min-h-screen bg-cream-light">
      <header className="bg-white border-b border-walnut/10 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-terracotta flex items-center justify-center text-cream-light font-bold text-sm shadow-sm shadow-terracotta/20">
              G
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-ink leading-tight">
                Guest Reviews
              </h1>
              <p className="text-xs text-stone">
                {pending.length} waiting · {reviewed.length} handled
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="px-3 py-2 text-stone hover:text-ink hover:bg-walnut/5 text-sm rounded-lg transition-colors"
            >
              ← Dashboard
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-3 py-2 text-stone hover:text-ink hover:bg-walnut/5 text-sm rounded-lg transition-colors"
            >
              Site
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-4">
        {reviews.length === 0 && (
          <div className="bg-white rounded-2xl border border-walnut/10 shadow-sm p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-stone">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <p className="text-stone font-medium">No reviews yet</p>
            <p className="text-stone/60 text-sm mt-1">
              Review invites go out automatically after guests&apos; stays end
              — approved reviews appear on the homepage.
            </p>
          </div>
        )}

        {pending.map((r) => (
          <ReviewCard key={r.id} review={r} busy={busyId === r.id} isManager={isManager} onAction={handleAction} stars={stars} />
        ))}

        {reviewed.length > 0 && (
          <div className="pt-6">
            <h2 className="text-stone text-[11px] uppercase tracking-wider font-semibold mb-3">
              Previously handled
            </h2>
            {reviewed.map((r) => (
              <ReviewCard key={r.id} review={r} busy={busyId === r.id} isManager={isManager} onAction={handleAction} stars={stars} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({
  review,
  busy,
  isManager,
  onAction,
  stars,
}: {
  review: AdminReview;
  busy: boolean;
  isManager: boolean;
  onAction: (id: number, action: "approve" | "decline") => void;
  stars: (n: number) => React.ReactNode;
}) {
  return (
    <div className="bg-white p-5 md:p-6 rounded-2xl border border-walnut/10 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            review.status === "pending"
              ? "bg-gold-tint text-gold-dark"
              : review.status === "approved"
                ? "bg-walnut-tint text-walnut"
                : "bg-cream text-stone border border-walnut/10"
          }`}
        >
          {review.status.toUpperCase()}
        </span>
        <span className="pill pill-neutral">{categoryLabel(review.category)}</span>
        {!review.consentToPublish && (
          <span className="text-[10px] uppercase tracking-wide text-stone font-medium">
            Anonymous (no consent)
          </span>
        )}
        {review.bookingId && (
          <span className="text-xs text-stone ml-auto">
            Booking #{review.bookingId}
            {review.stayDates && (
              <>
                {" "}· {review.stayDates.checkIn} → {review.stayDates.checkOut}
              </>
            )}
            {review.roomName && <> · {review.roomName}</>}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">{stars(review.rating)}</div>
        <h3 className="font-semibold text-ink text-base">{review.headline}</h3>
      </div>

      {review.feelings.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {review.feelings.map((f) => (
            <span key={f} className="text-[11px] px-2 py-0.5 rounded bg-terracotta-tint text-terracotta-dark">
              {f}
            </span>
          ))}
        </div>
      )}

      <p className="text-stone text-sm mt-3 leading-relaxed">&ldquo;{review.body}&rdquo;</p>

      {review.photos.length > 0 && (
        <div className="mt-3 flex gap-2">
          {review.photos.map((p) => (
            <Image
              key={p}
              src={p}
              alt="Guest stay photo"
              width={80}
              height={64}
              className="w-20 h-16 object-cover rounded-lg border border-walnut/10"
            />
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-walnut/10 flex items-center justify-between gap-3">
        <span className="text-sm text-stone">
          {review.guestName || "Guest"} · {new Date(review.submittedAt).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
        {review.status === "pending" && isManager && (
          <div className="flex gap-2">
            <button
              onClick={() => onAction(review.id, "approve")}
              disabled={busy}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-walnut text-cream-light hover:bg-walnut-dark transition-colors btn-press disabled:opacity-50"
            >
              {busy ? "Saving…" : "Approve"}
            </button>
            <button
              onClick={() => onAction(review.id, "decline")}
              disabled={busy}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-walnut/20 text-walnut hover:bg-walnut/5 transition-colors btn-press disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        )}
        {review.status === "pending" && !isManager && (
          <span className="text-xs text-stone bg-cream px-3 py-1.5 rounded-lg">Manager approval required</span>
        )}
      </div>
    </div>
  );
}
