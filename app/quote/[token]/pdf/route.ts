import { loadQuoteByToken } from "@/lib/quotes";
import { renderQuotePdf } from "@/lib/quote-pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const data = await loadQuoteByToken(token);
  if (!data) {
    return new Response("Quote not found", { status: 404 });
  }

  const buffer = await renderQuotePdf(data);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${data.quote.quoteNumber}.pdf"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
