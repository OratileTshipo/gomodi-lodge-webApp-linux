"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface QuoteRow {
  id: number;
  quoteNumber: string;
  status: "draft" | "sent" | "accepted" | "declined";
  guestName: string;
  category: string;
  total: string;
  validUntil: string | null;
  sentAt: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gold-tint text-gold-dark",
  sent: "bg-green-100 text-green-800",
  accepted: "bg-green-600 text-white",
  declined: "bg-red-100 text-red-700",
};

export function QuotesList() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/quotes");
        if (res.status === 401) {
          router.push("/admin");
          return;
        }
        if (!res.ok) throw new Error("Failed to load");
        setQuotes(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quotes");
      } finally {
        setTimeout(() => setLoading(false), 400);
      }
    })();
  }, [router]);

  const visible = filter === "all" ? quotes : quotes.filter((q) => q.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-light p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl card-shadow border border-walnut/10 p-6 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-light p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Quotations &amp; Invoices</h1>
            <p className="text-sm text-stone">Review drafts, adjust pricing, and send to requesters.</p>
          </div>
          <button onClick={() => router.push("/admin/dashboard")} className="text-sm text-stone hover:text-ink">
            ← Back to dashboard
          </button>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["all", "draft", "sent", "accepted", "declined"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === s
                  ? "bg-walnut text-cream-light"
                  : "bg-white border border-walnut/15 text-stone hover:border-walnut/40"
              }`}
            >
              {s === "all" ? "All" : STATUS_LABELS[s]}
              {s === "draft" && quotes.filter((q) => q.status === "draft").length > 0 && (
                <span className="ml-1.5 text-xs opacity-80">
                  {quotes.filter((q) => q.status === "draft").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {error && <p className="text-terracotta-dark text-sm mb-4">{error}</p>}

        {visible.length === 0 ? (
          <div className="bg-white rounded-2xl card-shadow border border-walnut/10 p-12 text-center">
            <p className="text-stone text-lg">No quotations here yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((q) => (
              <button
                key={q.id}
                onClick={() => router.push(`/admin/quotes/${q.id}`)}
                className="w-full text-left bg-white p-5 rounded-2xl border border-walnut/10 card-shadow hover:border-terracotta/50 transition-colors flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[q.status]}`}>
                    {STATUS_LABELS[q.status]}
                  </span>
                  <div>
                    <div className="font-semibold text-ink">{q.quoteNumber}</div>
                    <div className="text-sm text-stone">
                      {q.guestName} · <span className="capitalize">{q.category}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-ink">
                    R {parseFloat(q.total || "0").toFixed(2)}
                  </div>
                  <div className="text-xs text-stone">
                    {new Date(q.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
