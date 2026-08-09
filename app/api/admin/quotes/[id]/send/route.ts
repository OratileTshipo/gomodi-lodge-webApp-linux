import { NextResponse } from "next/server";
import { requireManager } from "@/lib/auth";
import { markQuoteSent, loadQuoteWithLines } from "@/lib/quotes";
import { sendQuoteLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const manager = await requireManager();
  if (!manager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const quoteId = parseInt(id, 10);
    const quote = await loadQuoteWithLines(quoteId);
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    await markQuoteSent(quoteId);

    // The public link is the delivery mechanism (PDF download + share link).
    // The requester's browser-origin link is rebuilt in the editor from
    // window.location.origin; here we only need it for the (fail-open)
    // WhatsApp delivery attempt + response.
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const publicLink = `${base}/quote/${quote.quote.publicToken}`;

    // Attempt delivery to the requester's phone — fails open (logs + returns
    // sent:false) until WhatsApp credentials are set.
    let delivery: { sent: boolean; reason?: string } = { sent: false, reason: "no phone" };
    if (quote.request.contactPhone) {
      delivery = await sendQuoteLink({
        phone: quote.request.contactPhone,
        guestName: quote.request.guestName,
        quoteNumber: quote.quote.quoteNumber,
        link: publicLink,
      });
    }

    return NextResponse.json({
      success: true,
      publicLink,
      quoteNumber: quote.quote.quoteNumber,
      delivery,
    });
  } catch (error) {
    console.error("Failed to mark quote sent:", error);
    return NextResponse.json({ error: "Failed to send quote" }, { status: 500 });
  }
}
