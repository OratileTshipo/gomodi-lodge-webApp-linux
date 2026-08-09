import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { staffTimeClocks } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    // Server-side auth: any logged-in staff member may clock in/out.
    const staff = await requireStaff();
    if (!staff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, notes } = await request.json();

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }
    if (action !== "clock_in" && action !== "clock_out") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    // Notes are free text: trim + cap so the column can never be abused.
    const cleanNotes = typeof notes === "string" ? notes.trim().slice(0, 500) : null;

    // The clock entry's user comes from the signed session, never from the
    // request body — otherwise any logged-in staff could clock in/out as
    // someone else (attribution + payroll integrity).
    const userId = staff.userId;

    // Log the exact server-side clock-in/out time explicitly (rather than only
    // relying on the DB default) and return the stored row so the UI can show it.
    const [record] = await db
      .insert(staffTimeClocks)
      .values({
        userId,
        action,
        notes: cleanNotes,
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
    // Server-side auth: any logged-in staff member may read clock status.
    const staff = await requireStaff();
    if (!staff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read-only status for the signed-in user; ignore any userId in the query
    // string so staff can only ever see their own clock state.
    const lastEntry = await db
      .select()
      .from(staffTimeClocks)
      .where(eq(staffTimeClocks.userId, staff.userId))
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
