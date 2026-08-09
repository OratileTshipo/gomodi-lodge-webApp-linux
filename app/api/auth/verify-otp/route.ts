import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { users, authOtps } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { buildSessionCookie, SESSION_COOKIE } from "@/lib/auth";

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json();

    if (!otp || typeof otp !== "string" || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "Invalid OTP format" }, { status: 401 });
    }
    if (
      typeof phone !== "string" ||
      phone.length > 30 ||
      !/^\+?[0-9]{7,15}$/.test(phone.trim())
    ) {
      return NextResponse.json({ error: "Phone number not registered." }, { status: 401 });
    }
    const cleanPhone = phone.trim();

    // 1. User must exist in the DB.
    const [user] = await db.select().from(users).where(eq(users.phone, cleanPhone));
    if (!user) {
      return NextResponse.json({ error: "Phone number not registered." }, { status: 401 });
    }

    // 2. Find the most recent unconsumed, unexpired code for this phone.
    const [otpRecord] = await db
      .select()
      .from(authOtps)
      .where(and(eq(authOtps.phone, cleanPhone), eq(authOtps.consumed, false)))
      .orderBy(desc(authOtps.createdAt))
      .limit(1);
    if (!otpRecord || otpRecord.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "OTP expired. Request a new one." }, { status: 401 });
    }

    // 3. Brute-force guard: 5 wrong attempts locks the code.
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      await db.update(authOtps).set({ consumed: true }).where(eq(authOtps.id, otpRecord.id));
      return NextResponse.json({ error: "Too many attempts. Request a new OTP." }, { status: 401 });
    }

    // 4. Constant-time hash comparison.
    const suppliedHash = createHash("sha256").update(String(otp)).digest("hex");
    const storedBuf = Buffer.from(otpRecord.codeHash, "hex");
    const suppliedBuf = Buffer.from(suppliedHash, "hex");
    const matches = storedBuf.length === suppliedBuf.length && timingSafeEqual(storedBuf, suppliedBuf);

    if (!matches) {
      await db
        .update(authOtps)
        .set({ attempts: otpRecord.attempts + 1 })
        .where(eq(authOtps.id, otpRecord.id));
      return NextResponse.json({ error: "Incorrect OTP. Please try again." }, { status: 401 });
    }

    // 5. Consume the code and mint a signed session cookie.
    await db.update(authOtps).set({ consumed: true }).where(eq(authOtps.id, otpRecord.id));

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, buildSessionCookie({ userId: user.id, role: user.role, name: user.name }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return NextResponse.json({ success: true, role: user.role });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
