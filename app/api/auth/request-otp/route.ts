import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { phone } = await request.json();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  console.log(`\n========================================`);
  console.log(`🔑 LOCAL DEV OTP for ${phone}: ${otp}`);
  console.log(`========================================\n`);

  return NextResponse.json({ success: true, devOtp: otp });
}
