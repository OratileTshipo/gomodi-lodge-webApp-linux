"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { computeTotals, formatZAR } from "@/lib/quote-math";

interface Line {
  id?: number;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  sortOrder: number;
}

interface QuoteData {
  quote: {
    id: number;
    quoteNumber: string;
    status: "draft" | "sent" | "accepted" | "declined";
    vatRate: string;
    notes: string | null;
    validUntil: string | null;
    subtotal: string;
    vatAmount: string;
    total: string;
    publicToken: string;
    sentAt: string | null;
  };
  lines: Line[];
  request: {
    id: number;
    category: string;
    guestName: string;
    contactPhone: string;
    contactEmail: string | null;
    status: string;
    submittedAt: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
};

export function QuoteEditor() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/admin/quotes/${params.id}`);
        if (res.status === 401) {
          router.push("/admin");
          return;
        }
        if (!res.ok) throw new Error("Failed to load");
        setData(await res.json());
      } catch (err) {
        setNotice({ type: "err", text: err instanceof Error ? err.message : "Failed to load quote" });
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    })();
  }, [params.id, router]);

  const lines = data?.lines ?? [];
  const vatRate = data?.quote.vatRate ?? "15.00";

  // Only lines with a description count — matches what save() actually stores.
  const totals = useMemo(
    () => computeTotals(lines.filter((l) => l.description.trim()), vatRate),
    [lines, vatRate]
  );

  function updateLine(index: number, patch: Partial<Line>) {
    if (!data) return;
    const next = lines.map((l, i) => (i === index ? { ...l, ...patch } : l));
    setData({ ...data, lines: next });
  }

  function removeLine(index: number) {
    if (!data) return;
    setData({ ...data, lines: lines.filter((_, i) => i !== index) });
  }

  function addLine() {
    if (!data) return;
    setData({
      ...data,
      lines: [
        ...lines,
        { description: "", quantity: "1", unit: "night", unitPrice: "0.00", sortOrder: lines.length },
      ],
    });
  }

  async function save() {
    if (!data) return;
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/quotes/${params.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.filter((l) => l.description.trim()),
          vatRate,
          validUntil: data.quote.validUntil,
          notes: data.quote.notes,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save");
      setData(result.quote);
      setNotice({ type: "ok", text: "Saved. Totals recalculated from the line items." });
    } catch (err) {
      setNotice({ type: "err", text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  }

  async function send() {
    if (!data) return;
    if (!confirm("Send this quotation to the requester? It will be marked as sent and a shareable link + PDF become available.")) return;
    setSending(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/quotes/${params.id}/send`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to send");
      setData((d) => (d ? { ...d, quote: { ...d.quote, status: "sent", sentAt: new Date().toISOString() } } : d));
      const delivered = result.delivery?.sent;
      setNotice({
        type: "ok",
        text: delivered
          ? `${result.quoteNumber} sent — WhatsApp delivered to the requester.`
          : `${result.quoteNumber} marked sent. Share link ready below — copy it to the requester (WhatsApp delivery not configured yet).`,
      });
    } catch (err) {
      setNotice({ type: "err", text: err instanceof Error ? err.message : "Failed to send" });
    } finally {
      setSending(false);
    }
  }

  async function copyLink() {
    if (!data) return;
    const base = window.location.origin;
    const link = `${base}/quote/${data.quote.publicToken}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setNotice({ type: "err", text: `Could not copy — link: ${link}` });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-light p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl card-shadow border border-walnut/10 p-6 h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-cream-light p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl card-shadow p-12 text-center">
          <p className="text-stone text-lg">Quote not found.</p>
          <button onClick={() => router.push("/admin/quotes")} className="mt-4 text-terracotta-dark hover:underline">
            ← Back to quotations
          </button>
        </div>
      </div>
    );
  }

  const isSent = data.quote.status === "sent" || data.quote.status === "accepted";

  return (
    <div className="min-h-screen bg-cream-light p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-semibold text-ink">{data.quote.quoteNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                data.quote.status === "sent" ? "bg-green-100 text-green-800"
                : data.quote.status === "accepted" ? "bg-green-600 text-white"
                : data.quote.status === "declined" ? "bg-red-100 text-red-700"
                : "bg-gold-tint text-gold-dark"
              }`}>
                {STATUS_LABELS[data.quote.status]}
              </span>
            </div>
            <p className="text-sm text-stone mt-1">
              {data.request.guestName} · <span className="capitalize">{data.request.category}</span> request · #{data.request.id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/admin/quotes")} className="text-sm text-stone hover:text-ink">
              ← Quotations
            </button>
            <button onClick={() => router.push("/admin/dashboard")} className="text-sm text-stone hover:text-ink">
              Dashboard
            </button>
          </div>
        </div>

        {notice && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
            notice.type === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
          }`}>
            {notice.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Line items */}
            <div className="bg-white rounded-2xl card-shadow border border-walnut/10 p-6">
              <h2 className="font-display text-lg font-semibold text-ink mb-4">Line items</h2>
              <div className="space-y-3">
                {lines.map((line, i) => (
                  <div key={line.id ?? `new-${i}`} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-[11px] uppercase tracking-wider text-stone mb-1">Description</label>
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => updateLine(i, { description: e.target.value })}
                        placeholder="e.g. Standard Double Room"
                        className="w-full px-3 py-2 border border-walnut/20 rounded-lg text-sm focus:border-walnut focus:outline-none"
                      />
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <label className="block text-[11px] uppercase tracking-wider text-stone mb-1">Qty</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={line.quantity}
                        onChange={(e) => updateLine(i, { quantity: e.target.value })}
                        className="w-full px-3 py-2 border border-walnut/20 rounded-lg text-sm focus:border-walnut focus:outline-none"
                      />
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <label className="block text-[11px] uppercase tracking-wider text-stone mb-1">Unit</label>
                      <select
                        value={line.unit}
                        onChange={(e) => updateLine(i, { unit: e.target.value })}
                        className="w-full px-3 py-2 border border-walnut/20 rounded-lg text-sm bg-white focus:border-walnut focus:outline-none"
                      >
                        <option value="night">night</option>
                        <option value="person-night">person-night</option>
                        <option value="room">room</option>
                        <option value="person">person</option>
                        <option value="event">event</option>
                        <option value="package">package</option>
                        <option value="hour">hour</option>
                        <option value="day">day</option>
                        <option value="item">item</option>
                      </select>
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <label className="block text-[11px] uppercase tracking-wider text-stone mb-1">Rate (R)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(i, { unitPrice: e.target.value })}
                        className="w-full px-3 py-2 border border-walnut/20 rounded-lg text-sm focus:border-walnut focus:outline-none"
                      />
                    </div>
                    <div className="col-span-3 md:col-span-1 text-right">
                      <div className="text-[11px] uppercase tracking-wider text-stone mb-1 hidden md:block">&nbsp;</div>
                      <button
                        onClick={() => removeLine(i)}
                        aria-label={`Remove ${line.description || `line ${i + 1}`}`}
                        className="w-full px-2 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addLine}
                className="mt-4 px-4 py-2 rounded-lg border border-dashed border-walnut/30 text-walnut hover:border-walnut hover:bg-walnut-tint/40 text-sm font-medium transition-colors"
              >
                + Add line item
              </button>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-2xl card-shadow border border-walnut/10 p-6">
              <h2 className="font-display text-lg font-semibold text-ink mb-4">Quote settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">VAT rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={vatRate}
                    onChange={(e) => data && setData({ ...data, quote: { ...data.quote, vatRate: e.target.value } })}
                    className="w-full px-3 py-2 border border-walnut/20 rounded-lg text-sm focus:border-walnut focus:outline-none"
                  />
                  <p className="text-xs text-stone mt-1">Set to 0 to exclude VAT (e.g. international clients).</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Valid until</label>
                  <input
                    type="date"
                    value={data.quote.validUntil ?? ""}
                    onChange={(e) => data && setData({ ...data, quote: { ...data.quote, validUntil: e.target.value || null } })}
                    className="w-full px-3 py-2 border border-walnut/20 rounded-lg text-sm focus:border-walnut focus:outline-none"
                  />
                  <p className="text-xs text-stone mt-1">Optional — shows on the quote as the acceptance deadline.</p>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-ink mb-1">Notes for the requester</label>
                <textarea
                  value={data.quote.notes ?? ""}
                  onChange={(e) => data && setData({ ...data, quote: { ...data.quote, notes: e.target.value } })}
                  rows={4}
                  placeholder="Deposit terms, payment details, cancellation policy, special inclusions…"
                  className="w-full px-3 py-2 border border-walnut/20 rounded-lg text-sm focus:border-walnut focus:outline-none resize-y"
                />
              </div>
            </div>
          </div>

          {/* Summary column */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl card-shadow border border-walnut/10 p-6">
              <h2 className="font-display text-lg font-semibold text-ink mb-4">Totals</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-stone">
                  <span>Subtotal</span>
                  <span className="text-ink">{formatZAR(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone">
                  <span>VAT ({parseFloat(vatRate) || 0}%)</span>
                  <span className="text-ink">{formatZAR(totals.vatAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-ink border-t border-walnut/10 pt-3">
                  <span>Total</span>
                  <span className="text-terracotta-dark">{formatZAR(totals.total)}</span>
                </div>
                <p className="text-xs text-stone pt-1">
                  Recounted from the line items above when you save.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl card-shadow border border-walnut/10 p-6">
              <h2 className="font-display text-lg font-semibold text-ink mb-4">Send</h2>
              <div className="space-y-3">
                <button
                  onClick={save}
                  disabled={saving || sending}
                  className="w-full btn-outline px-4 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save draft"}
                </button>
                <button
                  onClick={send}
                  disabled={sending || saving}
                  className="w-full btn-primary px-4 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50"
                >
                  {sending ? "Sending…" : isSent ? "Re-send quotation" : "Send quotation"}
                </button>
                {isSent && (
                  <div className="pt-2 border-t border-walnut/10 space-y-2">
                    <p className="text-xs text-stone">Requester&apos;s share link + PDF:</p>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/quote/${data.quote.publicToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-xs text-terracotta-dark hover:underline truncate"
                      >
                        View public quote ↗
                      </a>
                      <button
                        onClick={copyLink}
                        className="px-3 py-1.5 rounded-lg border border-walnut/20 text-xs font-semibold text-walnut hover:bg-walnut-tint/40"
                      >
                        {copied ? "Copied!" : "Copy link"}
                      </button>
                    </div>
                    <a
                      href={`/quote/${data.quote.publicToken}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-terracotta-dark hover:underline"
                    >
                      Download PDF ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
