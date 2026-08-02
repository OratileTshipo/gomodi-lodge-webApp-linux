"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState<string | undefined>(undefined);
  const router = useRouter();

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDevOtp(undefined);

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

           // Always show OTP for now (WhatsApp is stubbed)
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      } else if (data.message) {
        // Fallback: extract OTP from message if devOtp not present
        const otpMatch = data.message.match(/OTP: (\d{6})/);
        if (otpMatch) {
          setDevOtp(otpMatch[1]);
        }
      }

      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
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

      if (!res.ok) throw new Error("Invalid OTP");

      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-stone-900 mb-2">Gomodi Admin</h1>
          <p className="text-stone-600">Staff approval and management screen</p>
        </div>

        {/* DEVELOPMENT MODE OTP DISPLAY */}
        {devOtp && (
          <div className="mb-6 bg-orange-100 border-2 border-orange-500 rounded-xl p-4 text-center">
            <div className="text-orange-900 font-semibold text-sm mb-2">
              🔧 Development Mode
            </div>
            <div className="text-orange-800 text-xs mb-2">
              Your OTP for testing:
            </div>
            <div className="text-4xl font-bold text-orange-700 tracking-wider bg-white rounded-lg py-3 px-4 inline-block">
              {devOtp}
            </div>
            <div className="text-orange-700 text-xs mt-2">
              This will only show in development. In production, OTP arrives via WhatsApp.
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
          {step === "phone" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+27..."
                  className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Sending..." : "Request OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setDevOtp(undefined);
                  setError("");
                }}
                className="w-full text-stone-600 hover:text-stone-900 text-sm"
              >
                Back to phone number
              </button>
            </form>
          )}
        </div>

        {/* Test Credentials Helper */}
        <div className="mt-6 text-center text-xs text-stone-500">
          <p>Test numbers:</p>
          <p>Owner: +27820000001</p>
          <p>Manager: +27820000002</p>
          <p>Staff: +27820000003-6</p>
        </div>
      </div>
    </div>
  );
}
