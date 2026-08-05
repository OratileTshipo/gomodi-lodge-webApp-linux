import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { staffTimeClocks } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { userId, action, notes } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
    }
    if (action !== "clock_in" && action !== "clock_out") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Log the exact server-side clock-in/out time explicitly (rather than only
    // relying on the DB default) and return the stored row so the UI can show it.
    const [record] = await db
      .insert(staffTimeClocks)
      .values({
        userId,
        action,
        notes: notes || null,
        timestamp: new Date(),
      })
      .returning();

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Time clock error:", error);
    return NextResponse.json({ error: "Failed to log time" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Most recent clock entry determines current status AND shows when it happened
    const lastEntry = await db
      .select()
      .from(staffTimeClocks)
      .where(eq(staffTimeClocks.userId, parseInt(userId)))
      .orderBy(desc(staffTimeClocks.timestamp))
      .limit(1);

    return NextResponse.json({
      lastAction: lastEntry[0]?.action || null,
      lastTimestamp: lastEntry[0]?.timestamp || null,
    });
  } catch (error) {
    console.error("Time clock fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
