import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp || otp.length !== 6) {
      return NextResponse.json({ error: "Invalid OTP format" }, { status: 401 });
    }

    // 1. Check if user exists in DB (Real Auth)
    const [user] = await db.select().from(users).where(eq(users.phone, phone.trim()));

    if (!user) {
      return NextResponse.json({ error: "Phone number not registered." }, { status: 401 });
    }

    // 2. Verify OTP (Stubbed for Local Dev - accepts any 6 digits)
    // In production, this would check Redis/DB for the generated OTP
    
    // 3. Set Session Cookie
    const cookieStore = await cookies();
    // We store userId and role. In a real app, use a signed JWT.
    cookieStore.set("session", JSON.stringify({ userId: user.id, role: user.role, name: user.name }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours (shift length)
      path: "/",
    });

    return NextResponse.json({ success: true, role: user.role });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
