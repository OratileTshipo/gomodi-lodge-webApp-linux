import Link from "next/link";
import { notFound } from "next/navigation";
import { loadQuoteByToken, formatZAR } from "@/lib/quotes";

export const dynamic = "force-dynamic";

export default async function QuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await loadQuoteByToken(token);
  if (!data) notFound();

  const { quote, lines, request } = data;
  const vatRate = parseFloat(quote.vatRate) || 0;

  const statusLabel =
    quote.status === "sent" ? "Sent" : quote.status === "accepted" ? "Accepted" : "Draft";

  return (
    <main className="page-transition min-h-screen bg-cream-light">
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-16">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <Link href="/" className="text-sm text-stone hover:text-ink transition-colors">
            ← Gomodi Guest Lodge
          </Link>
          <a
            href={`/quote/${quote.publicToken}/pdf`}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </a>
        </div>

        {/* Document */}
        <div className="bg-white rounded-2xl card-shadow border border-walnut/10 overflow-hidden">
          {/* Header */}
          <div className="bg-walnut px-6 md:px-10 py-6 text-cream-light flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-semibold">Gomodi Guest Lodge</h1>
              <p className="text-gold-light italic text-sm mt-1">Iphe Lerato</p>
              <p className="text-cream/70 text-xs mt-1">Mafikeng, North West, South Africa</p>
            </div>
            <div className="text-right">
              <div className="font-display text-lg font-semibold text-gold-light">{quote.quoteNumber}</div>
              <div className="text-cream/70 text-xs mt-1">
                Issued {new Date(quote.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
              </div>
              {quote.validUntil && (
                <div className="text-cream/70 text-xs mt-0.5">
                  Valid until {new Date(quote.validUntil).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              )}
              <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-gold text-walnut">
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 md:px-10 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div>
                <div className="text-xs uppercase tracking-widest text-stone mb-1.5">Prepared for</div>
                <div className="font-semibold text-ink text-lg">{request.guestName}</div>
                {request.contactPhone && <div className="text-sm text-stone">{request.contactPhone}</div>}
                {request.contactEmail && <div className="text-sm text-stone">{request.contactEmail}</div>}
              </div>
              <div className="sm:text-right">
                <div className="text-xs uppercase tracking-widest text-stone mb-1.5">Request details</div>
                <div className="text-sm text-ink capitalize">{request.category} request · #{request.id}</div>
              </div>
            </div>

            {/* Line items */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-walnut text-cream-light text-left text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 rounded-l-md font-semibold">Description</th>
                    <th className="px-4 py-3 font-semibold text-center">Qty</th>
                    <th className="px-4 py-3 font-semibold">Unit</th>
                    <th className="px-4 py-3 font-semibold text-right">Rate</th>
                    <th className="px-4 py-3 rounded-r-md font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 && (
                    <tr className="border-b border-walnut/10">
                      <td className="px-4 py-4 text-stone italic" colSpan={5}>Awaiting pricing</td>
                    </tr>
                  )}
                  {lines.map((l, i) => {
                    const amount = (parseFloat(l.quantity) || 0) * (parseFloat(l.unitPrice) || 0);
                    return (
                      <tr key={l.id ?? i} className="border-b border-walnut/10">
                        <td className="px-4 py-4 font-medium text-walnut">{l.description}</td>
                        <td className="px-4 py-4 text-center text-ink">{l.quantity}</td>
                        <td className="px-4 py-4 text-stone">{l.unit}</td>
                        <td className="px-4 py-4 text-right text-ink">{formatZAR(l.unitPrice)}</td>
                        <td className="px-4 py-4 text-right font-semibold text-ink">{formatZAR(amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mt-6">
              <div className="w-full max-w-xs space-y-2 text-sm">
                <div className="flex justify-between text-stone">
                  <span>Subtotal (excl. VAT)</span>
                  <span className="text-ink">{formatZAR(quote.subtotal)}</span>
                </div>
                {vatRate > 0 && (
                  <div className="flex justify-between text-stone">
                    <span>VAT ({vatRate}%)</span>
                    <span className="text-ink">{formatZAR(quote.vatAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg text-ink border-t border-gold-dark/40 pt-3">
                  <span>Total</span>
                  <span className="text-terracotta-dark">{formatZAR(quote.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {quote.notes && (
              <div className="mt-8 bg-cream rounded-lg p-5 border-l-2 border-gold-dark">
                <div className="text-xs uppercase tracking-widest text-terracotta-dark mb-2 font-semibold">Notes</div>
                <p className="text-sm text-walnut whitespace-pre-line">{quote.notes}</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-stone mt-8">
          Gomodi Guest Lodge · Iphe Lerato · Direct booking, no middleman
        </p>
      </div>
    </main>
  );
}
