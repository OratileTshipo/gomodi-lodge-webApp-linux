import { NextResponse } from "next/server";
import { requireManager } from "@/lib/auth";
import { loadQuoteWithLines, saveQuote } from "@/lib/quotes";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const manager = await requireManager();
  if (!manager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const quote = await loadQuoteWithLines(parseInt(id, 10));
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }
  return NextResponse.json(quote);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const manager = await requireManager();
  if (!manager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    if (!Array.isArray(body.lines)) {
      return NextResponse.json({ error: "Missing line items" }, { status: 400 });
    }

    const quote = await saveQuote(parseInt(id, 10), {
      lines: body.lines,
      vatRate: String(body.vatRate ?? 15),
      validUntil: body.validUntil || null,
      notes: body.notes || null,
    });

    return NextResponse.json({ success: true, quote });
  } catch (error) {
    console.error("Failed to save quote:", error);
    return NextResponse.json({ error: "Failed to save quote" }, { status: 500 });
  }
}
