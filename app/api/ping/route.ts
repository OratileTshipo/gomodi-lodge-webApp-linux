import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

// Force a real DB round-trip on every invocation — this endpoint exists to
// keep the pooled Postgres connection warm, so it must never be statically
// cached or optimized away.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ [API ERROR] /api/ping keep-alive check failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
