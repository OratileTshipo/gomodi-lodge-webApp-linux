"use client";

import { useState } from "react";
import Link from "next/link";
import { submitGuestReview } from "./actions";
import { REVIEW_FEELINGS, categoryLabel } from "@/lib/review-options";

/**
 * The public review form — designed to capture how the stay FELT, not just a
 * score. Star rating + short headline + feeling chips + honest words, with a
 * POPIA consent checkbox and optional photo. Submission is token-gated server
 * side (app/review/actions.ts → lib/reviews.ts); a review is never public
 * until staff approve it.
 */
export function ReviewForm({
  token,
  guestName,
  category,
}: {
  token: string;
  guestName: string;
  category: "leisure" | "corporate" | "event";
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [feelings, setFeelings] = useState<string[]>([]);
  const [showName, setShowName] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [consent, setConsent] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function toggleFeeling(f: string) {
    setFeelings((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  async function handlePhoto(file: File | undefined) {
    if (!file) return;
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setPhotoError(json.error || "Upload failed — try again.");
        setPhotoUrl(null);
        setPhotoName(null);
        return;
      }
      setPhotoUrl(json.url);
      setPhotoName(file.name);
    } catch {
      setPhotoError("Upload failed — check your connection and try again.");
      setPhotoUrl(null);
      setPhotoName(null);
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setStatus("error");
      setErrorMessage("Please pick a star rating for your stay.");
      return;
    }
    if (showName && !firstName.trim()) {
      setStatus("error");
      setErrorMessage("Add your first name, or choose to stay anonymous.");
      return;
    }
    if (!consent) {
      setStatus("error");
      setErrorMessage("Please confirm you're happy for us to share this review.");
      return;
    }
    setStatus("submitting");
    setErrorMessage(null);

    const result = await submitGuestReview({
      token,
      rating,
      headline,
      body,
      feelings,
      guestName: showName ? firstName.trim() : "",
      consentToPublish: consent,
      photos: photoUrl ? [photoUrl] : [],
    });

    if (result.ok) setStatus("success");
    else {
      setStatus("error");
      setErrorMessage(result.error);
    }
  }

  if (status === "success") {
    return (
      <main className="page-transition">
        <section className="max-w-xl mx-auto px-6 py-20 text-center">
          <div className="motion-pop">
            <div className="w-16 h-16 rounded-full bg-gold-tint flex items-center justify-center mb-5 mx-auto shadow-lg shadow-gold/20">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8f6a3e" strokeWidth={2.5}><path d="M20 6L9 17l-5-5" /></svg>
            </div>
          </div>
          <h1 className="font-display text-ink font-semibold text-2xl md:text-3xl motion-pop" data-stagger="2">
            Thank you — it means the world.
          </h1>
          <p className="text-stone mt-4 leading-relaxed motion-pop" data-stagger="3">
            Your review goes to the Gomodi team for a quick check, then it
            appears on the site. Real words from real stays are how we grow —
            thank you for taking the time.
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

  return (
    <main className="page-transition">
      <section className="max-w-2xl mx-auto px-6 py-12 md:py-16">
        {/* Intro */}
        <div className="text-center motion-pop">
          <span className="pill pill-neutral">How was your stay?</span>
          <h1 className="font-display text-ink font-semibold text-3xl md:text-4xl mt-4">
            Tell us how it felt.
          </h1>
          <p className="text-stone mt-4 max-w-lg mx-auto leading-relaxed">
            {guestName.split(" ")[0] ? (
              <>
                Thank you for staying with us,{" "}
                <span className="font-medium text-ink">{guestName.split(" ")[0]}</span>.{" "}
                A few honest words help other guests know what to expect — and
                they help us get better.
              </>
            ) : (
              <>Thank you for staying with us. A few honest words help other guests know what to expect — and they help us get better.</>
            )}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 bg-white rounded-2xl border border-walnut/10 card-shadow p-6 md:p-10 motion-pop"
        >
          {status === "error" && errorMessage && (
            <div className="mb-6 rounded-xl border border-terracotta bg-terracotta-tint p-4 text-sm text-terracotta-dark">
              {errorMessage}
            </div>
          )}

          {/* 1. Rating */}
          <div className="pb-8 border-b border-walnut/10">
            <h2 className="font-semibold text-ink text-lg">How was your stay?</h2>
            <div className="mt-5 flex items-center gap-1.5" role="radiogroup" aria-label="Star rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1.5 -m-1.5 transition-transform hover:scale-110 active:scale-95"
                >
                  <svg
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    fill={(hoverRating || rating) >= star ? "#d4a574" : "none"}
                    stroke={(hoverRating || rating) >= star ? "#d4a574" : "#b8a894"}
                    strokeWidth={1.5}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
              <span className="ml-3 text-sm text-stone">
                {rating > 0 ? (rating >= 4 ? "Lovely to hear" : rating === 3 ? "Thanks — the honest middle" : "We appreciate the honesty") : "Tap the stars"}
              </span>
            </div>

            <div className="mt-6">
              <label htmlFor="headline" className="block text-sm font-medium text-ink mb-1.5">
                In one line, how would you describe it?
              </label>
              <input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={120}
                required
                placeholder="e.g. A peaceful night in a warm room"
                className="w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta outline-none"
              />
            </div>
          </div>

          {/* 2. Feelings chips */}
          <div className="py-8 border-b border-walnut/10">
            <h2 className="font-semibold text-ink text-lg">What did it feel like?</h2>
            <p className="text-stone text-sm mt-1">Tap everything that fits — no wrong answers.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {REVIEW_FEELINGS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFeeling(f)}
                  aria-pressed={feelings.includes(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all btn-press ${
                    feelings.includes(f)
                      ? "bg-terracotta-tint border-terracotta/50 text-terracotta-dark"
                      : "bg-cream-light border-walnut/15 text-stone hover:border-walnut/40"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* 3. The words */}
          <div className="py-8 border-b border-walnut/10">
            <h2 className="font-semibold text-ink text-lg">Your review</h2>
            <div className="mt-4">
              <label htmlFor="body" className="block text-sm font-medium text-ink mb-1.5">
                What should other guests know?
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
                required
                rows={5}
                placeholder="The room, the breakfast, the welcome — whatever stands out. Business or leisure, both count."
                className="w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta outline-none resize-none"
              />
            </div>

            {/* Optional photo */}
            <div className="mt-5">
              <label className="block text-sm font-medium text-ink mb-1.5">
                Add a photo of your stay <span className="text-stone font-normal">(optional)</span>
              </label>
              <label
                htmlFor="reviewPhotoInput"
                className="file-drop border-2 border-dashed border-walnut/20 rounded-xl p-4 text-center cursor-pointer bg-cream-light hover:bg-cream transition-colors block"
              >
                <input
                  id="reviewPhotoInput"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handlePhoto(e.target.files?.[0])}
                />
                <span className="text-sm text-ink font-medium">
                  {photoUploading ? "Uploading…" : photoName ? `✓ ${photoName}` : "Tap to upload a photo"}
                </span>
                <span className="text-xs text-stone mt-1 block">JPG or PNG · max 5MB</span>
                {photoError && <span className="block text-xs text-terracotta-dark mt-1">{photoError}</span>}
              </label>
            </div>
          </div>

          {/* 4. Name + consent */}
          <div className="py-8 border-b border-walnut/10">
            <h2 className="font-semibold text-ink text-lg">Byline &amp; consent</h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <input
                  id="showName"
                  type="checkbox"
                  checked={showName}
                  onChange={(e) => setShowName(e.target.checked)}
                  className="accent-terracotta w-4 h-4"
                />
                <label htmlFor="showName" className="text-sm text-ink">
                  Show my first name on the site
                </label>
              </div>
              {showName && (
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-ink mb-1.5">
                    First name
                  </label>
                  <input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    maxLength={150}
                    placeholder="e.g. Thabo"
                    className="w-full md:w-72 border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-cream-light focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta outline-none"
                  />
                </div>
              )}
              {!showName && (
                <p className="text-sm text-stone">Your review will appear signed as &ldquo;Guest&rdquo;.</p>
              )}
              <div className="flex items-start gap-3">
                <input
                  id="consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="mt-1 accent-terracotta w-4 h-4"
                />
                <label htmlFor="consent" className="text-sm text-stone">
                  I&apos;m happy for Gomodi Guest Lodge to publish this review
                  on the website, in line with POPIA. *
                </label>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full btn-primary px-6 py-3.5 rounded-lg font-semibold text-base disabled:opacity-60 shadow-sm shadow-terracotta-dark/20 hover:shadow-md hover:shadow-terracotta-dark/30 transition-all btn-press ripple"
            >
              {status === "submitting" ? "Sending…" : "Share my review"}
            </button>
            <p className="text-stone text-xs mt-3 text-center">
              {categoryLabel(category)} · Your review appears after a quick check by the team.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
