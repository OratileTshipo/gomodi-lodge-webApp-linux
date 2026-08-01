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

    await db.insert(staffTimeClocks).values({
      userId,
      action,
      notes: notes || null,
    });

    return NextResponse.json({ success: true });
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

    // Get the most recent clock action to determine current status
    const lastEntry = await db
      .select()
      .from(staffTimeClocks)
      .where(eq(staffTimeClocks.userId, parseInt(userId)))
      .orderBy(desc(staffTimeClocks.timestamp))
      .limit(1);

    return NextResponse.json({ lastAction: lastEntry[0]?.action || null });
  } catch (error) {
    console.error("Time clock fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
