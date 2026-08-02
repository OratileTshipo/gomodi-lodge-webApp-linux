import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone required" }, { status: 400 });
    }

    // Generate a simple 6-digit OTP for local dev
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // In production, this would send via WhatsApp Cloud API
    // For local dev, log to console AND return it for on-screen display
    console.log(`\n========================================`);
    console.log(`OTP for ${phone}: ${otp}`);
    console.log(`========================================\n`);

    // Store OTP temporarily (in production, use Redis or database with expiry)
    // For local dev, we'll just return it (INSECURE - dev only!)
    return NextResponse.json({ 
      success: true, 
      // RETURN OTP IN DEVELOPMENT MODE ONLY
      devOtp: process.env.NODE_ENV === "development" ? otp : undefined,
      message: process.env.NODE_ENV === "development" 
        ? `OTP: ${otp} (shown for development testing)` 
        : "OTP sent via WhatsApp"
    });
  } catch (error) {
    console.error("Request OTP error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
