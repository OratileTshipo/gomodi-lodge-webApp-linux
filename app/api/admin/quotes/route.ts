import { NextResponse } from "next/server";
import { requireManager } from "@/lib/auth";
import { listQuotes } from "@/lib/quotes";

export const dynamic = "force-dynamic";

export async function GET() {
  const manager = await requireManager();
  if (!manager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const quotes = await listQuotes();
    return NextResponse.json(quotes);
  } catch (error) {
    console.error("Failed to list quotes:", error);
    return NextResponse.json({ error: "Failed to load quotes" }, { status: 500 });
  }
}
