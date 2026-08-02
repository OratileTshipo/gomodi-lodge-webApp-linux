import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone required" }, { status: 400 });
    }

    // Generate a simple 6-digit OTP for local dev
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // In production, this would send via WhatsApp Cloud API
    // For now, log to console AND return it for on-screen display
    console.log(`\n========================================`);
    console.log(`OTP for ${phone}: ${otp}`);
    console.log(`========================================\n`);

    // Always return OTP for now (WhatsApp is stubbed)
    // Once real WhatsApp is integrated, remove devOtp from response
    return NextResponse.json({ 
      success: true, 
      devOtp: otp,
      message: `OTP: ${otp} (shown for testing - WhatsApp not yet connected)`
    });
  } catch (error) {
    console.error("Request OTP error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
