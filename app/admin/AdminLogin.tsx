"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) throw new Error("Failed");
      setStep("otp");
    } catch {
      setError("Failed to send OTP. Check terminal for local dev OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      if (!res.ok) throw new Error("Invalid");
      router.push("/admin/dashboard");
    } catch {
      setError("Invalid OTP. Please check the terminal and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
      {step === "phone" ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+27..."
              className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-stone-900 text-white py-2 px-4 rounded-md hover:bg-stone-800 disabled:opacity-50 transition-colors">
            {loading ? "Sending..." : "Request OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-stone-900 text-white py-2 px-4 rounded-md hover:bg-stone-800 disabled:opacity-50 transition-colors">
            {loading ? "Verifying..." : "Verify & Login"}
          </button>
          <button type="button" onClick={() => setStep("phone")} className="w-full text-stone-600 hover:text-stone-900 text-sm">
            Back to phone number
          </button>
        </form>
      )}
    </div>
  );
}
