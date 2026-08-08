import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { authOtps } from "@/lib/db/schema";
import { lt, and, eq } from "drizzle-orm";

/**
 * Simple in-memory rate limiter: max 3 requests per phone per 10 minutes.
 * In-memory is fine for a single-instance deployment; a Redis-backed limiter
 * would be the upgrade path for multi-instance hosting.
 *
 * Entries are pruned once their window has fully elapsed so the map can't grow
 * without bound; the map is capped at 10k phones and cleared if exceeded.
 */
const MAX_TRACKED_PHONES = 10000;
const phoneAttempts = new Map<string, number[]>();

function isRateLimited(phone: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const recent = (phoneAttempts.get(phone) || []).filter((t) => now - t < windowMs);

  // Prune phones whose window has fully elapsed.
  if (phoneAttempts.size > MAX_TRACKED_PHONES) {
    for (const [key, times] of phoneAttempts) {
      if (times.every((t) => now - t > windowMs)) phoneAttempts.delete(key);
    }
  }

  phoneAttempts.set(phone, recent);
  if (recent.length >= 3) return true;
  recent.push(now);
  phoneAttempts.set(phone, recent);
  return false;
}

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || typeof phone !== "string" || !/^\+?[0-9]{7,15}$/.test(phone.trim())) {
      return NextResponse.json({ error: "Valid phone number required" }, { status: 400 });
    }
    const cleanPhone = phone.trim();

    if (isRateLimited(cleanPhone)) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait about 10 minutes and try again." },
        { status: 429 }
      );
    }

    // Generate a 6-digit OTP, store only its SHA-256 hash (never the plaintext).
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Invalidate any previous unconsumed codes for this phone.
    await db.update(authOtps).set({ consumed: true }).where(eq(authOtps.phone, cleanPhone));

    await db.insert(authOtps).values({ phone: cleanPhone, codeHash, expiresAt });

    // WhatsApp Cloud API would send the code here. Until it's wired, log it
    // (server-side only) and, in dev, return it for the on-screen dev box.
    console.log(`\n========================================`);
    console.log(`OTP for ${cleanPhone}: ${otp}`);
    console.log(`========================================\n`);

    const devOtp = process.env.NODE_ENV !== "production" ? otp : undefined;
    return NextResponse.json({
      success: true,
      devOtp,
      message: devOtp
        ? `OTP: ${otp} (shown for testing - WhatsApp not yet connected)`
        : "If this number is registered, an OTP has been sent.",
    });
  } catch (error) {
    console.error("Request OTP error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}

// Cleanup expired/consumed codes opportunistically so the table doesn't grow forever.
export async function GET() {
  try {
    await db
      .delete(authOtps)
      .where(and(lt(authOtps.expiresAt, new Date()), eq(authOtps.consumed, true)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
