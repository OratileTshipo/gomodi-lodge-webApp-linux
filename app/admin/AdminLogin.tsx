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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream-light flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold text-ink mb-2">Gomodi Admin</h1>
          <p className="text-stone">Staff approval and management screen</p>
        </div>

        {/* DEVELOPMENT MODE OTP DISPLAY */}
        {devOtp && (
          <div className="mb-6 bg-gold-tint border-2 border-gold-dark rounded-xl p-4 text-center">
            <div className="text-walnut font-semibold text-sm mb-2">
              🔧 Development Mode
            </div>
            <div className="text-walnut text-xs mb-2">
              Your OTP for testing:
            </div>
            <div className="text-4xl font-bold text-terracotta-dark tracking-wider bg-white rounded-lg py-3 px-4 inline-block">
              {devOtp}
            </div>
            <div className="text-terracotta-dark text-xs mt-2">
              This will only show in development. In production, OTP arrives via WhatsApp.
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl card-shadow border border-walnut/10 p-8">
          {step === "phone" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+27..."
                  className="w-full px-4 py-2.5 bg-white border border-walnut/20 rounded-lg focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta"
                  required
                />
              </div>
              {error && <p className="text-terracotta-dark text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-2.5 px-4 rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? "Sending..." : "Request OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-2.5 bg-white border border-walnut/20 rounded-lg focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta"
                  required
                />
              </div>
              {error && <p className="text-terracotta-dark text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-2.5 px-4 rounded-lg font-semibold disabled:opacity-50"
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
                className="w-full text-stone hover:text-ink text-sm"
              >
                Back to phone number
              </button>
            </form>
          )}
        </div>

        {/* Test Credentials Helper */}
        <div className="mt-6 text-center text-xs text-stone">
          <p>Test numbers:</p>
          <p>Owner: +27820000001</p>
          <p>Manager: +27820000002</p>
          <p>Staff: +27820000003-6</p>
        </div>
      </div>
    </div>
  );
}
